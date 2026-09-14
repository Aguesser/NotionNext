/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

// wanko 模型是分部件渲染的（moc 里狗和碗是不同的 Parts），
// 因此直接控制部件可见性，让渲染管线自己输出「完整空碗」和「完整狗」：
//   - 隐藏狗部件 → 主画布只渲染完整空碗
//   - 隐藏碗/装饰部件 → 主画布只渲染完整狗（包括平时被碗挡住的身体）
const CANVAS_W = 280
const CANVAS_H = 250

// 狗部件（隐藏它们 → 空碗）
const DOG_PART_IDS = [
  'PARTS_01_HOHO',
  'PARTS_01_FACE_001',
  'PARTS_01_EYE_001',
  'PARTS_01_EYE_BALL_001',
  'PARTS_01_BROW_001',
  'PARTS_01_MOUTH_001',
  'PARTS_01_NOSE_001',
  'PARTS_01_EAR_001',
  'PARTS_01_BODY'
]

// 碗及碗内装饰部件（隐藏它们 → 只有狗）
const BOWL_PART_IDS = [
  'PARTS_01_BOWL',
  'PARTS_01_CORE',
  'PARTS_01_CORE_ITEM',
  ...Array.from({ length: 16 }, (_, i) => `PARTS_01_ITEM_${String(i + 1).padStart(2, '0')}`),
  'PARTS_01_EFFECT',
  'PARTS_01_SKETCH',
  'PARTS_01_BACKGROUND'
]

/**
 * 网页动画宠物挂件
 * 悬浮于右下角：单击冒气泡+模型内置动作；按住可把狗从碗里完整拎出来玩，
 * 松手后狗在掉落点消散、再从碗中冒出来（碗始终完整留在原地）
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')
  const petTips = siteConfig('WIDGET_PET_TIPS') || []

  const canvasRef = useRef(null) // live2d 主画布（WebGL）
  const bowlCanvasRef = useRef(null) // 空碗定格画布（2D）
  const ghostRef = useRef(null) // 被拎起来的狗画布（2D）
  const phaseRef = useRef('idle')
  const [phase, setPhase] = useState('idle')
  const pressRef = useRef(null)
  const pendingPosRef = useRef(null)
  const prepareGuardRef = useRef(null)
  const struggleTimerRef = useRef(null)
  const bubbleTimerRef = useRef(null)
  const vanishTimerRef = useRef(null)
  const [bubble, setBubble] = useState(null)

  function setPhaseBoth(p) {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => {
    if (showPet && !isMobile()) {
      Promise.all([loadExternalResource('/live2d/live2d.min.js', 'js')]).then(e => {
        if (typeof window?.loadlive2d !== 'undefined') {
          try {
            hookContextForGhostCopy()
            // https://github.com/xiazeyu/live2d-widget-models
            loadlive2d('live2d', petLink)
            // 预热挣扎动作，避免第一次拖拽时才有加载延迟
            setTimeout(() => {
              const wrapper = getWrapper()
              if (wrapper) {
                try {
                  wrapper.preloadMotionGroup('shake')
                } catch (e) {}
              }
            }, 1500)
          } catch (error) {
            console.error('读取PET模型', error)
          }
        }
      })
    }
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (vanishTimerRef.current) clearTimeout(vanishTimerRef.current)
      if (prepareGuardRef.current) clearTimeout(prepareGuardRef.current)
      if (struggleTimerRef.current) clearInterval(struggleTimerRef.current)
    }
  }, [theme, showPet, petLink])

  function getModel() {
    const proxy = window.__live2dProxy
    if (proxy && typeof proxy.getModel === 'function') {
      const wrapper = proxy.getModel(0)
      // 部件透明度 API 在底层 Live2D 模型上（包装层只提供动作/表情）
      if (wrapper && typeof wrapper.getLive2DModel === 'function') {
        return wrapper.getLive2DModel()
      }
    }
    return null
  }

  /** 动作/表情 API 在包装层（LAppModel）上 */
  function getWrapper() {
    const proxy = window.__live2dProxy
    if (proxy && typeof proxy.getModel === 'function') {
      const wrapper = proxy.getModel(0)
      if (wrapper && typeof wrapper.startRandomMotion === 'function') {
        return wrapper
      }
    }
    return null
  }

  /** 被拎着时不断挣扎：前一次 shake 播完立刻接下一次，握住期间持续不停 */
  function startStruggle() {
    const wrapper = getWrapper()
    if (!wrapper) return
    const tick = () => {
      try {
        const mm = wrapper.mainMotionManager
        // idle 动作是循环播放的，isFinished() 几乎永远为 false，
        // 因此改用优先级判断：当前动作优先级低于挣扎动作(3)时才重新触发
        if (!mm || mm.currentPriority < 3) {
          wrapper.startRandomMotion('shake', 3)
        }
      } catch (e) {}
    }
    tick()
    if (struggleTimerRef.current) clearInterval(struggleTimerRef.current)
    struggleTimerRef.current = setInterval(tick, 250)
  }

  function stopStruggle() {
    if (struggleTimerRef.current) {
      clearInterval(struggleTimerRef.current)
      struggleTimerRef.current = null
    }
  }

  /** 设置一组部件的可见性 */
  function setPartsOpacity(ids, opacity) {
    const model = getModel()
    if (!model) return false
    ids.forEach(id => {
      try {
        model.setPartsOpacity(id, opacity)
      } catch (e) {}
    })
    return true
  }

  /**
   * 读回当前主画布像素，写入目标 2D 画布
   * 必须在 drawArrays/drawElements 同一任务内调用（微任务时机），否则缓冲已清空
   */
  function readCanvasTo(target) {
    const src = canvasRef.current
    if (!src || !target) return false
    const gl = src.getContext('webgl')
    if (!gl) return false
    const w = src.width
    const h = src.height
    const px = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
    const ctx = target.getContext('2d')
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      const srcRow = (h - 1 - y) * w * 4 // WebGL 自下而上
      const dstRow = y * w * 4
      for (let x = 0; x < w * 4; x++) img.data[dstRow + x] = px[srcRow + x]
    }
    ctx.putImageData(img, 0, 0)
    return true
  }

  /** 包装 drawArrays/drawElements，在同一任务内做空碗定格 / 狗逐帧拷贝 */
  function hookContextForGhostCopy() {
    const canvas = canvasRef.current
    if (!canvas || canvas.__ghostHooked) return
    canvas.__ghostHooked = true
    const origGetContext = canvas.getContext.bind(canvas)
    canvas.getContext = function (type, opts) {
      const ctx = origGetContext(type, opts)
      if (ctx && String(type).indexOf('webgl') !== -1 && !ctx.__ghostHooked) {
        ctx.__ghostHooked = true
        let queued = false
        const onFrame = () => {
          if (queued) return
          queued = true
          queueMicrotask(() => {
            queued = false
            handleFrame()
          })
        }
        for (const fn of ['drawArrays', 'drawElements']) {
          const origFn = ctx[fn].bind(ctx)
          ctx[fn] = function (...args) {
            origFn(...args)
            onFrame()
          }
        }
      }
      return ctx
    }
  }

  function handleFrame() {
    const phase = phaseRef.current

    if (phase === 'preparing') {
      // 拖动开始：先定格空碗（此刻狗部件已隐藏），再切到「只有狗」模式
      if (readCanvasTo(bowlCanvasRef.current)) {
        if (prepareGuardRef.current) {
          clearTimeout(prepareGuardRef.current)
          prepareGuardRef.current = null
        }
        setPartsOpacity(DOG_PART_IDS, 1) // 恢复狗
        setPartsOpacity(BOWL_PART_IDS, 0) // 隐藏碗，只渲染狗
        setPhaseBoth('dragging')
        const pos = pendingPosRef.current
        if (pos) moveGhost(pos.x, pos.y)
        attachDragListeners()
        startStruggle() // 被拎起来后开始挣扎
      }
      return
    }

    if (phase === 'dragging') {
      // 主画布此时只渲染狗，直接整帧拷贝
      readCanvasTo(ghostRef.current)
    }
  }

  /** 让幻影狗跟随光标：狗身中心大致在 (145, 95)，水平居中于光标 */
  function moveGhost(x, y) {
    const ghost = ghostRef.current
    if (!ghost) return
    ghost.style.left = Math.round(x - 145) + 'px'
    ghost.style.top = Math.round(y - 95) + 'px'
  }

  function attachDragListeners() {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend', onDragEnd)
  }

  function onDragMove(e) {
    if (phaseRef.current !== 'dragging') return
    const point = e.touches?.[0] || e
    if (e.cancelable) e.preventDefault()
    moveGhost(point.clientX, point.clientY)
  }

  function onDragEnd() {
    if (phaseRef.current !== 'dragging') return
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    window.removeEventListener('touchmove', onDragMove)
    window.removeEventListener('touchend', onDragEnd)
    // 恢复全部部件，狗从碗里弹回来
    stopStruggle()
    setPartsOpacity(DOG_PART_IDS, 1)
    setPartsOpacity(BOWL_PART_IDS, 1)
    setPhaseBoth('returning')
    const ghost = ghostRef.current
    if (ghost) ghost.classList.add('pet-ghost-vanish')
    if (vanishTimerRef.current) clearTimeout(vanishTimerRef.current)
    vanishTimerRef.current = setTimeout(() => {
      if (ghost) ghost.classList.remove('pet-ghost-vanish')
      setPhaseBoth('idle')
    }, 650)
  }

  function startDrag(x, y) {
    pendingPosRef.current = { x, y }
    setPhaseBoth('preparing')
    // 隐藏狗部件 → 下一帧定格空碗（在 handleFrame 里继续切换）
    const ok = setPartsOpacity(DOG_PART_IDS, 0)
    if (!ok) {
      // 模型尚未就绪：退回空闲，不影响正常点击
      setPhaseBoth('idle')
      return
    }
    // 安全阀：抓帧链条若因页面不可见/渲染停摆而未完成，恢复部件避免狗一直消失
    if (prepareGuardRef.current) clearTimeout(prepareGuardRef.current)
    prepareGuardRef.current = setTimeout(() => {
      prepareGuardRef.current = null
      if (phaseRef.current === 'preparing') {
        setPartsOpacity(DOG_PART_IDS, 1)
        setPartsOpacity(BOWL_PART_IDS, 1)
        setPhaseBoth('idle')
      }
    }, 1200)
  }

  /** 随机冒出一条气泡文案 */
  function showBubble(text) {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setBubble({ text, id: Date.now() })
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 2400)
  }

  function handlePressStart(e) {
    const point = e.touches?.[0] || e
    pressRef.current = {
      x: point.clientX,
      y: point.clientY,
      time: Date.now()
    }
  }

  function handleCanvasMove(e) {
    const press = pressRef.current
    if (!press || phaseRef.current !== 'idle') return
    const point = e.touches?.[0] || e
    const moved =
      Math.abs(point.clientX - press.x) + Math.abs(point.clientY - press.y)
    // 位移超过阈值才算把狗拎起来，避免误触
    if (moved > 6) {
      pressRef.current = null
      startDrag(point.clientX, point.clientY)
    }
  }

  function handlePressEnd(e) {
    const press = pressRef.current
    pressRef.current = null
    if (!press || phaseRef.current !== 'idle') return
    // 几乎没有位移且按住时间短，视为一次点击
    if (Date.now() - press.time > 400) return

    if (petSwitchTheme) {
      switchTheme()
      return
    }
    if (petTips.length > 0) {
      showBubble(petTips[Math.floor(Math.random() * petTips.length)])
    }
  }

  if (!showPet) {
    return <></>
  }

  // preparing：主画布自身已是空碗（狗部件已隐藏），无需贴图
  // dragging：主画布隐藏（只渲染狗），显示空碗定格图
  // returning：主画布恢复显示并播放「从碗里弹回」动画，幻影在掉落点消散
  const hideLiveCanvas = phase === 'preparing' || phase === 'dragging'
  const showBowlSnapshot = phase === 'dragging'
  const showGhost = phase === 'dragging' || phase === 'returning'

  return (
    <div className='fixed bottom-10 right-6 z-40 hidden select-none lg:block'>
      {/* 气泡提示 */}
      {bubble && (
        <div
          key={bubble.id}
          className='pet-bubble pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 whitespace-nowrap'>
          {bubble.text}
        </div>
      )}
      <canvas
        id='live2d'
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={
          phase === 'returning'
            ? 'pet-appear cursor-grab touch-none'
            : 'cursor-grab touch-none active:cursor-grabbing'
        }
        style={{ visibility: hideLiveCanvas ? 'hidden' : 'visible' }}
        onMouseDown={handlePressStart}
        onMouseMove={handleCanvasMove}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchMove={handleCanvasMove}
        onTouchEnd={handlePressEnd}
      />
      {/* 空碗定格画布：拖动期间替换主画布显示 */}
      <canvas
        ref={bowlCanvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className='pointer-events-none absolute left-0 top-0'
        style={{ display: showBowlSnapshot ? 'block' : 'none' }}
      />
      {/* 被拎起来的狗（逐帧同步主画布的狗渲染） */}
      <canvas
        ref={ghostRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={
          phase === 'dragging'
            ? 'pet-ghost pet-struggle pointer-events-none fixed z-50'
            : 'pet-ghost pointer-events-none fixed z-50'
        }
        style={{ display: showGhost ? 'block' : 'none' }}
      />
    </div>
  )
}
