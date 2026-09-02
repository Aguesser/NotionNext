/* eslint-disable react/no-unknown-property */
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'
/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * @returns
 */
const Style = () => {
  return (
    <style jsx global>{`
      #theme-heo {
        --heo-color-primary: #4f65f0;
        --heo-color-primary-hover: #4f46e5;
        --heo-color-primary-text: #ffffff;
        --heo-color-accent: #ca8a04;
        --heo-color-bg: #f7f9fe;
        --heo-color-bg-dark: #18171d;
        --heo-color-card: rgba(255, 255, 255, 0.62);
        --heo-color-card-dark: rgba(30, 30, 34, 0.6);
        --heo-color-card-muted: rgba(241, 243, 248, 0.7);
        --heo-color-border: #4f46e5;
        --heo-color-border-dark: #ca8a04;
        --heo-color-text-light: #000000;
        --heo-color-text-secondary-light: #4b5563;
        --heo-color-text-dark: #f3f4f6;
        --heo-color-text-secondary-dark: #d1d5db;
        --heo-color-text: var(--heo-color-text-light);
        --heo-color-text-secondary: var(--heo-color-text-secondary-light);
        background-color: var(--heo-color-bg);
        /* 浅色：淡蓝天空渐变 + 细噪点，云朵由 SkyBackground 组件渲染 */
        background-image:
          linear-gradient(
            180deg,
            #a9d3f5 0%,
            #c8e4fa 20%,
            #e8f2fc 48%,
            #f7f9fe 78%,
            #f7f9fe 100%
          ),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        background-attachment: fixed;
        color: var(--heo-color-text);
      }

      .dark #theme-heo {
        --heo-color-text: var(--heo-color-text-dark);
        --heo-color-text-secondary: var(--heo-color-text-secondary-dark);
        background-color: var(--heo-color-bg-dark);
        /* 深色：夜晚星空渐变 + 细噪点，星星由 SkyBackground 组件渲染 */
        background-image:
          linear-gradient(
            180deg,
            #090d20 0%,
            #0e1322 38%,
            #161822 68%,
            #18171d 100%
          ),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        background-attachment: fixed;
      }

      /* iOS Safari 不支持 background-attachment: fixed，小屏直接跟随滚动避免渲染异常 */
      @media (max-width: 767px) {
        #theme-heo,
        .dark #theme-heo {
          background-attachment: scroll;
        }
      }

      /* ===== 全站动态天空背景（SkyBackground 组件） ===== */
      .heo-sky {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
        display: none;
      }
      html:not(.dark) .heo-sky-light {
        display: block;
      }
      html.dark .heo-sky-dark {
        display: block;
      }

      /* 云朵：CSS 绘制的软边形状，横向匀速漂移 */
      .heo-cloud {
        position: absolute;
        left: -280px;
        width: 190px;
        height: 60px;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 999px;
        filter: blur(2px);
        box-shadow: 0 8px 24px rgba(120, 150, 200, 0.12);
        animation-name: heo-cloud-drift;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        will-change: transform;
      }
      .heo-cloud::before,
      .heo-cloud::after {
        content: '';
        position: absolute;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 50%;
      }
      .heo-cloud::before {
        top: -30px;
        left: 34px;
        width: 74px;
        height: 74px;
      }
      .heo-cloud::after {
        top: -18px;
        right: 30px;
        width: 52px;
        height: 52px;
      }
      @keyframes heo-cloud-drift {
        from {
          transform: translateX(0) scale(var(--s, 1));
        }
        to {
          transform: translateX(calc(100vw + 640px)) scale(var(--s, 1));
        }
      }

      /* 星光：小圆点缓慢闪烁 */
      .heo-star {
        position: absolute;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.85);
        animation-name: heo-star-twinkle;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        will-change: opacity, transform;
      }
      .heo-star-bright {
        width: 4px;
        height: 4px;
        box-shadow:
          0 0 10px 2px rgba(255, 255, 255, 0.55),
          0 0 22px 4px rgba(160, 190, 255, 0.3);
      }
      @keyframes heo-star-twinkle {
        0%,
        100% {
          opacity: 0.15;
          transform: scale(0.75);
        }
        50% {
          opacity: 1;
          transform: scale(1.25);
        }
      }

      /* 尊重系统减弱动效设置 */
      @media (prefers-reduced-motion: reduce) {
        .heo-cloud,
        .heo-star {
          animation: none;
        }
      }

      /* 注意：带 Tailwind 任意值/冒号的转义类名选择器（如 .bg-white、.dark\:bg-\[\#1e1e1e\]）
         在 styled-jsx 中不生效，卡片半透明磨砂规则已移至 styles/globals.css */

      #theme-heo .bg-indigo-600,
      #theme-heo .hover\:bg-indigo-600:hover {
        background-color: var(--heo-color-primary-hover);
      }

      .dark #theme-heo .dark\:bg-yellow-600,
      .dark #theme-heo .dark\:hover\:bg-yellow-600:hover {
        background-color: var(--heo-color-accent);
      }

      #theme-heo .text-white {
        color: var(--heo-color-primary-text);
      }

      html:not(.dark) #theme-heo .text-black {
        color: var(--heo-color-text);
      }

      html:not(.dark) #theme-heo .text-gray-600 {
        color: var(--heo-color-text-secondary);
      }

      #theme-heo .hover\:text-indigo-600:hover,
      #theme-heo .group:hover .group-hover\:text-indigo-600 {
        color: var(--heo-color-primary-hover);
      }

      #theme-heo .hover\:border-indigo-600:hover {
        border-color: var(--heo-color-border);
      }

      .dark #theme-heo .dark\:hover\:border-yellow-600:hover {
        border-color: var(--heo-color-border-dark);
      }

      .dark #theme-heo #notion-article .notion-external-block,
      #theme-heo.dark #notion-article .notion-external-block {
        background: var(--heo-color-card-dark) !important;
        border-color: var(--heo-color-border-dark) !important;
      }

      .dark #theme-heo #notion-article .notion-external-title,
      #theme-heo.dark #notion-article .notion-external-title {
        color: var(--heo-color-text-dark) !important;
      }

      .dark #theme-heo #notion-article .notion-external-subtitle,
      .dark #theme-heo #notion-article .notion-external-block-desc,
      #theme-heo.dark #notion-article .notion-external-subtitle,
      #theme-heo.dark #notion-article .notion-external-block-desc {
        color: var(--heo-color-text-secondary-dark) !important;
      }

      body {
        background-color: #f7f9fe;
      }

      // 公告栏中的字体固定白色
      #theme-heo #announcement-content .notion {
        color: white;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(60, 60, 67, 0.4);
        border-radius: 8px;
        cursor: pointer;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      #more {
        white-space: nowrap;
      }

      .today-card-cover {
        -webkit-mask-image: linear-gradient(to top, transparent 5%, black 70%);
        mask-image: linear-gradient(to top, transparent 5%, black 70%);
      }

      .recent-top-post-group::-webkit-scrollbar {
        display: none;
      }

      .scroll-hidden::-webkit-scrollbar {
        display: none;
      }

      * {
        box-sizing: border-box;
      }

      // 标签滚动动画
      .tags-group-wrapper {
        animation: rowup 60s linear infinite;
      }

      @keyframes rowup {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      ${themeConsoleStyle('heo', CONFIG)}
  `}</style>
  )
}

export { Style }

