/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { Draggable } from '@/components/Draggable'
import { useEffect, useRef, useState } from 'react'

/**
 * 网页动画宠物挂件
 * 悬浮于右下角，支持：按住拖动（松手自动收进屏幕）、单击弹跳+随机气泡、双击回到初始位置
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')
  const petTips = siteConfig('WIDGET_PET_TIPS') || []

  // 拖拽容器（Draggable 实际位移的第一个子元素），双击复位时清空它的位移
  const floatRef = useRef(null)
  // 记录按下位置与时间，用于区分「拖拽」和「点击」
  const pressRef = useRef(null)
  const bounceRef = useRef(null)
  const bubbleTimerRef = useRef(null)
  const [bubble, setBubble] = useState(null)

  useEffect(() => {
    if (showPet && !isMobile()) {
      Promise.all([
        loadExternalResource(
          'https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js',
          'js'
        )
      ]).then(e => {
        if (typeof window?.loadlive2d !== 'undefined') {
          // https://github.com/xiazeyu/live2d-widget-models
          try {
            loadlive2d('live2d', petLink)
          } catch (error) {
            console.error('读取PET模型', error)
          }
        }
      })
    }
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [theme, showPet, petLink])

  /** 随机冒出一条气泡文案 */
  function showBubble(text) {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    setBubble({ text, id: Date.now() })
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 2400)
  }

  /** 弹跳动画：先移除再强制重排，保证连续点击也能重新触发 */
  function playBounce() {
    const el = bounceRef.current
    if (!el) return
    el.classList.remove('pet-bounce')
    void el.offsetWidth
    el.classList.add('pet-bounce')
  }

  function handlePressStart(e) {
    const point = e.touches?.[0] || e
    pressRef.current = {
      x: point.clientX,
      y: point.clientY,
      time: Date.now()
    }
  }

  function handlePressEnd(e) {
    const press = pressRef.current
    pressRef.current = null
    if (!press) return
    const point = e.changedTouches?.[0] || e
    const moved =
      Math.abs(point.clientX - press.x) + Math.abs(point.clientY - press.y)
    // 位移很小且按住时间短，视为一次点击（而非拖拽）
    if (moved > 6 || Date.now() - press.time > 400) return

    if (petSwitchTheme) {
      switchTheme()
      return
    }
    playBounce()
    if (petTips.length > 0) {
      showBubble(petTips[Math.floor(Math.random() * petTips.length)])
    }
  }

  /** 双击回到右下角初始位置 */
  function handleDoubleClick() {
    const el = floatRef.current
    if (!el) return
    el.style.left = ''
    el.style.top = ''
    showBubble('回到角落休息啦~')
  }

  if (!showPet) {
    return <></>
  }

  return (
    // Draggable 会把位移作用在它的第一个子元素上，因此内层是 fixed 定位的悬浮容器
    <Draggable>
      <div
        ref={floatRef}
        className='fixed bottom-10 right-6 z-40 hidden select-none lg:block'>
        {/* 气泡提示 */}
        {bubble && (
          <div
            key={bubble.id}
            className='pet-bubble pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 whitespace-nowrap'>
            {bubble.text}
          </div>
        )}
        <div ref={bounceRef} className='origin-bottom'>
          <canvas
            id='live2d'
            width='280'
            height='250'
            className='cursor-grab touch-none active:cursor-grabbing'
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>
    </Draggable>
  )
}
