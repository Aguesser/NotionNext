/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

// wanko 模型在 280x250 画布下的布局：狗在上半部、碗从 y≈125 开始
// CUT_Y 是狗/碗的分界线：拖动时主画布只显示这条线以下的碗，这条线以上的狗被复制到幻影画布跟随鼠标
const CANVAS_W = 280
const CANVAS_H = 250
const CUT_Y = 120

/**
 * 网页动画宠物挂件
 * 悬浮于右下角：单击冒气泡+模型内置动作；按住可把狗从碗里拖出来玩，
 * 松手后狗在掉落点消散、再从碗中冒出来（碗始终留在原地）
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')
  const petTips = siteConfig('WIDGET_PET_TIPS') || []

  const canvasRef = useRef(null)
  const ghostRef = useRef(null)
  // phase 同时放 state（驱动渲染）和 ref（供渲染循环热路径读取）
  const [phase, setPhase] = useState('idle')
  const phaseRef = useRef('idle')
  const pressRef = useRef(null)
  const bubbleTimerRef = useRef(null)
  const vanishTimerRef = useRef(null)
  const [bubble, setBubble] = useState(null)

  function setPhaseBoth(p) {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => {
    if (showPet && !isMobile()) {
      Promise.all([
        loadExternalResource(
          'https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js',
          'js'
        )
      ]).then(e => {
        if (typeof window?.loadlive2d !== 'undefined') {
          try {
            hookContextForGhostCopy()
            // https://github.com/xiazeyu/live2d-widget-models
            loadlive2d('live2d', petLink)
          } catch (error) {
            console.error('读取PET模型', error)
          }
        }
      })
    }
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (vanishTimerRef.current) clearTimeout(vanishTimerRef.current)
    }
  }, [theme, showPet, petLink])

  /**
   * 把 WebGl 画布每一帧同步到幻影画布的关键：
   * live2d 的 WebGL 上下文没有 preserveDrawingBuffer，帧渲染结束后缓冲即被清空，
   * 因此包装 drawArrays/drawElements，在渲染发生的同一个任务内（微任务时机）拷贝狗的区域
   */
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
        const scheduleCopy = () => {
          if (queued) return
          queued = true
          queueMicrotask(() => {
            queued = false
            if (phaseRef.current === 'dragging') copyDogRegion()
          })
        }
        for (const fn of ['drawArrays', 'drawElements']) {
          const origFn = ctx[fn].bind(ctx)
          ctx[fn] = function (...args) {
            origFn(...args)
            scheduleCopy()
          }
        }
      }
      return ctx
    }
  }

  /** 把主画布上狗的区域（分界线以上）拷贝到幻影画布 */
  function copyDogRegion() {
    const src = canvasRef.current
    const dst = ghostRef.current
    if (!src || !dst) return
    const ctx = dst.getContext('2d')
    ctx.clearRect(0, 0, dst.width, dst.height)
    ctx.drawImage(src, 0, 0, CANVAS_W, CUT_Y, 0, 0, CANVAS_W, CUT_Y)
  }

  /** 让幻影狗跟随光标：水平居中于光标，肚皮位置在光标下方一点 */
  function moveGhost(x, y) {
    const ghost = ghostRef.current
    if (!ghost) return
    ghost.style.left = Math.round(x - CANVAS_W / 2) + 'px'
    ghost.style.top = Math.round(y - CUT_Y + 30) + 'px'
  }

  function startDrag(x, y) {
    setPhaseBoth('dragging')
    moveGhost(x, y)
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
    // 狗在掉落点消散，随后从碗里重新冒出来
    setPhaseBoth('returning')
    const ghost = ghostRef.current
    if (ghost) ghost.classList.add('pet-ghost-vanish')
    if (vanishTimerRef.current) clearTimeout(vanishTimerRef.current)
    vanishTimerRef.current = setTimeout(() => {
      if (ghost) ghost.classList.remove('pet-ghost-vanish')
      setPhaseBoth('idle')
    }, 650)
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

  // 拖动：主画布只露碗；松手：狗从碗沿后冒出来
  const canvasStyle =
    phase === 'dragging'
      ? {
          clipPath: `inset(${CUT_Y}px 0 0 0)`,
          transition: 'clip-path 0.12s ease-out'
        }
      : phase === 'returning'
        ? {
            clipPath: 'inset(0px 0 0 0)',
            transition: 'clip-path 0.28s ease-out 0.3s'
          }
        : {}

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
        className='cursor-grab touch-none active:cursor-grabbing'
        style={canvasStyle}
        onMouseDown={handlePressStart}
        onMouseMove={handleCanvasMove}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchMove={handleCanvasMove}
        onTouchEnd={handlePressEnd}
      />
      {/* 被拎起来的狗（逐帧同步主画布的狗区域） */}
      <canvas
        ref={ghostRef}
        width={CANVAS_W}
        height={CUT_Y}
        className='pet-ghost pointer-events-none fixed z-50'
        style={{ display: phase === 'idle' ? 'none' : 'block' }}
      />
    </div>
  )
}
