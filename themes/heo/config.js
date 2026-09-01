// 英雄区滚动图标：用 emoji 生成的 SVG 图标，无需外部图片资源
const emojiIcon = emoji =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="88">${emoji}</text></svg>`
  )}`

const CONFIG = {
  HEO_HOME_POST_TWO_COLS: true, // 首页博客两列显示，若为false则只显示一列
  HEO_LOADING_COVER: true, // 页面加载的遮罩动画

  HEO_HOME_BANNER_ENABLE: true,

  HEO_INFO_CARD_AVATAR_BLUR: true, // 文章详情页个人资料卡头像样式。true：显示为模糊装饰头像；false：与首页头像保持一致
  HEO_COLOR_PRIMARY: '#4f65f0',
  HEO_COLOR_PRIMARY_HOVER: '#4f46e5',
  HEO_COLOR_PRIMARY_TEXT: '#ffffff',
  HEO_COLOR_ACCENT: '#dca846',
  HEO_COLOR_BG: '#f7f9fe',
  HEO_COLOR_BG_DARK: '#18171d',
  HEO_COLOR_CARD: '#ffffff',
  HEO_COLOR_CARD_DARK: '#1e1e1e',
  HEO_COLOR_CARD_MUTED: '#f1f3f8',
  HEO_COLOR_BORDER: '#4f46e5',
  HEO_COLOR_BORDER_DARK: '#dca846',
  HEO_COLOR_TEXT: '#111827',
  HEO_COLOR_TEXT_SECONDARY: '#4b5563',

  HEO_SITE_CREATE_TIME: '2024-12-18', // 建站日期，用于计算网站运行的第几天

  // 首页顶部通知条滚动内容，如不需要可以留空 []
  HEO_NOTICE_BAR: [
    { title: '欢迎来到 Aguesser 的学习小站', url: '/about' },
    { title: '读书笔记与游戏设计思考，持续更新中', url: '/archive' }
  ],

  // 英雄区左右侧组件颠倒位置
  HEO_HERO_REVERSE: false,
  // 博客主体区左右侧组件颠倒位置
  HEO_HERO_BODY_REVERSE: false,

  // 英雄区(首页顶部大卡)
  HEO_HERO_TITLE_1: '游戏设计、',
  HEO_HERO_TITLE_2: '教育与心理',
  HEO_HERO_TITLE_3: '欢迎常来',
  HEO_HERO_TITLE_4: '读书笔记上新',
  HEO_HERO_TITLE_5: '持续更新中',
  HEO_HERO_TITLE_LINK: 'https://notion-next-aguessers-projects.vercel.app',
  // 英雄区遮罩文字
  HEO_HERO_COVER_TITLE: '随便逛逛',

  // 英雄区显示三个置顶分类
  HEO_HERO_CATEGORY_1: { title: '游戏设计', url: '/category/游戏设计' },
  HEO_HERO_CATEGORY_2: { title: '读书笔记', url: '/category/读书笔记' },
  HEO_HERO_CATEGORY_3: { title: '全部文章', url: '/archive' },

  // 英雄区右侧推荐文章标签, 例如 [推荐] , 最多六篇文章; 若留空白''，则推荐最近更新文章
  HEO_HERO_RECOMMEND_POST_TAG: '',
  HEO_HERO_RECOMMEND_POST_SORT_BY_UPDATE_TIME: false, // 推荐文章排序，为`true`时将强制按最后修改时间倒序
  //   HERO_RECOMMEND_COVER: 'https://cdn.pixabay.com/photo/2015/10/30/20/13/sunrise-1014712_1280.jpg', // 英雄区右侧图片

  // 英雄区右侧推荐文章遮罩控制
  HEO_HERO_RECOMMEND_COVER_ENABLE: false, // 是否显示推荐文章遮罩图片，true显示遮罩需点击查看，false直接显示推荐文章

  // 右侧个人资料卡牌欢迎语，点击可自动切换
  HEO_INFOCARD_GREETINGS: [
    '你好！我是',
    '📚 读书笔记整理中',
    '🎮 游戏设计思考',
    '🧠 心理学爱好者',
    '✍️ 持续学习与记录'
  ],

  // 个人资料底部按钮
  HEO_INFO_CARD_URL1: '/about',
  HEO_INFO_CARD_ICON1: 'fas fa-user',
  HEO_INFO_CARD_URL2: 'https://github.com/Aguesser',
  HEO_INFO_CARD_ICON2: 'fab fa-github',
  HEO_INFO_CARD_ICON_ORCID: 'fab fa-orcid',
  HEO_INFO_CARD_URL3: '/archive',
  HEO_INFO_CARD_TEXT3: '往期整理',

  // 用户技能图标（英雄区 banner 斜向滚动展示）
  HEO_GROUP_ICONS: [
    {
      title_1: '游戏设计',
      img_1: emojiIcon('🎮'),
      color_1: '#4f65f0',
      title_2: '读书笔记',
      img_2: emojiIcon('📚'),
      color_2: '#dca846'
    },
    {
      title_1: '心理学',
      img_1: emojiIcon('🧠'),
      color_1: '#e05e7a',
      title_2: '游戏为什么好玩',
      img_2: emojiIcon('🕹️'),
      color_2: '#2f9e8f'
    },
    {
      title_1: '原子习惯',
      img_1: emojiIcon('🌱'),
      color_1: '#5a9e5f',
      title_2: '存在主义',
      img_2: emojiIcon('🌌'),
      color_2: '#46579e'
    },
    {
      title_1: '心流',
      img_1: emojiIcon('🌊'),
      color_1: '#3f8fce',
      title_2: '教育',
      img_2: emojiIcon('🎓'),
      color_2: '#8f55ba'
    },
    {
      title_1: '独立游戏',
      img_1: emojiIcon('👾'),
      color_1: '#7a5cd6',
      title_2: '桌游与机制',
      img_2: emojiIcon('🎲'),
      color_2: '#d67a3f'
    },
    {
      title_1: '叙事设计',
      img_1: emojiIcon('📖'),
      color_1: '#c25e5e',
      title_2: '写作',
      img_2: emojiIcon('✍️'),
      color_2: '#4a7fb5'
    },
    {
      title_1: '思考',
      img_1: emojiIcon('💭'),
      color_1: '#b58fd6',
      title_2: '记录',
      img_2: emojiIcon('🗂️'),
      color_2: '#5f8f8a'
    }
  ],

  HEO_SOCIAL_CARD: true, // 是否显示右侧，点击加入社群按钮
  HEO_SOCIAL_CARD_TITLE_1: '一起交流',
  HEO_SOCIAL_CARD_TITLE_2: '关于游戏、书籍与心理学的思考',
  HEO_SOCIAL_CARD_TITLE_3: '了解本站',
  HEO_SOCIAL_CARD_URL: '/about',

  // 底部统计面板文案
  HEO_POST_COUNT_TITLE: '文章数:',
  HEO_SITE_TIME_TITLE: '建站天数:',
  HEO_SITE_VISIT_TITLE: '访问量:',
  HEO_SITE_VISITOR_TITLE: '访客数:',

  // *****  以下配置无效，只是预留开发 ****
  // 菜单配置
  HEO_MENU_INDEX: true, // 显示首页
  HEO_MENU_CATEGORY: true, // 显示分类
  HEO_MENU_TAG: true, // 显示标签
  HEO_MENU_ARCHIVE: true, // 显示归档
  HEO_MENU_SEARCH: true, // 显示搜索

  HEO_POST_LIST_COVER: true, // 列表显示文章封面
  HEO_POST_LIST_COVER_HOVER_ENLARGE: true, // 列表鼠标悬停放大

  HEO_POST_LIST_COVER_DEFAULT: true, // 封面为空时用站点背景做默认封面
  HEO_POST_LIST_SUMMARY: true, // 文章摘要
  HEO_POST_LIST_PREVIEW: false, // 读取文章预览
  HEO_POST_LIST_IMG_CROSSOVER: true, // 博客列表图片左右交错

  HEO_ARTICLE_ADJACENT: true, // 显示上一篇下一篇文章推荐
  HEO_ARTICLE_COPYRIGHT: true, // 文章版权声明：true 全部显示；false 全部关闭；custom 仅填写 copyright 时显示
  HEO_ARTICLE_NOT_BY_AI: false, // 显示非AI写作
  HEO_ARTICLE_RECOMMEND: true, // 文章关联推荐

  HEO_WIDGET_LATEST_POSTS: true, // 显示最新文章卡
  HEO_WIDGET_ANALYTICS: false, // 显示统计卡
  HEO_WIDGET_TO_TOP: true,
  HEO_WIDGET_TO_COMMENT: true, // 跳到评论区
  HEO_WIDGET_DARK_MODE: true, // 夜间模式
  HEO_WIDGET_TOC: true // 移动端悬浮目录
}
export default CONFIG
