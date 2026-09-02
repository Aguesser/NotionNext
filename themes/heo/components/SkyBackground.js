/**
 * 全站动态天空背景（纯 CSS 动画，无图片资源）
 * 浅色模式：淡蓝天空 + 左右缓慢漂浮的云朵
 * 深色模式：夜晚星空 + 缓慢闪烁的星光
 * 浅/深色两套元素同时渲染，由 style.js 中的 display 规则切换，避免水合闪烁
 */

// 云朵参数：top 位置、缩放、单程漂移时长(秒)、入场延迟(秒，负值表示已在中途)、透明度
// 时长差异拉大（80–210 秒）制造视差感，最短 80 秒仍足够缓慢
const CLOUDS = [
  { top: '10%', scale: 1.25, duration: 80, delay: -15, opacity: 0.85 },
  { top: '20%', scale: 0.7, duration: 190, delay: -120, opacity: 0.55 },
  { top: '26%', scale: 0.75, duration: 115, delay: -60, opacity: 0.6 },
  { top: '46%', scale: 1.05, duration: 90, delay: -40, opacity: 0.8 },
  { top: '58%', scale: 0.6, duration: 210, delay: -150, opacity: 0.45 },
  { top: '68%', scale: 0.9, duration: 135, delay: -25, opacity: 0.65 },
  { top: '84%', scale: 0.65, duration: 165, delay: -8, opacity: 0.5 }
]

// 星星用固定种子的伪随机数生成，保证服务端与客户端渲染一致，避免水合报错
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildStars() {
  const rand = seededRandom(20260903)
  const stars = []
  for (let i = 0; i < 70; i++) {
    const r = rand()
    stars.push({
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 100).toFixed(2)}%`,
      // 少量大星（4–5px）让星空更有层次
      size: r > 0.93 ? 5 : r > 0.82 ? 4 : r > 0.5 ? 2 : 1,
      duration: 2.5 + rand() * 4.5,
      delay: -rand() * 6,
      opacity: 0.35 + rand() * 0.6
    })
  }
  return stars
}

const STARS = buildStars()

const SkyBackground = () => {
  return (
    <>
      {/* 浅色：淡蓝天空与漂浮云朵 */}
      <div className='heo-sky heo-sky-light' aria-hidden='true'>
        {CLOUDS.map((c, i) => (
          <div
            key={i}
            className='heo-cloud'
            style={{
              top: c.top,
              opacity: c.opacity,
              '--s': c.scale,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`
            }}
          />
        ))}
      </div>

      {/* 深色：星空与闪烁星光 */}
      <div className='heo-sky heo-sky-dark' aria-hidden='true'>
        {STARS.map((s, i) => (
          <div
            key={i}
            className='heo-star'
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDuration: `${s.duration.toFixed(2)}s`,
              animationDelay: `${s.delay.toFixed(2)}s`
            }}
          />
        ))}
        {/* 几颗带光晕的亮星 */}
        <div className='heo-star heo-star-bright' style={{ left: '12%', top: '18%' }} />
        <div className='heo-star heo-star-bright' style={{ left: '68%', top: '9%' }} />
        <div className='heo-star heo-star-bright' style={{ left: '84%', top: '42%' }} />
        <div className='heo-star heo-star-bright' style={{ left: '30%', top: '64%' }} />
        <div className='heo-star heo-star-bright' style={{ left: '55%', top: '76%' }} />
      </div>
    </>
  )
}

export default SkyBackground
