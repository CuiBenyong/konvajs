/**
 * AdSense 配置的唯一来源。
 *
 * 想调整广告行为时只改这个文件，不要去改组件。
 */

/**
 * AdSense 发布商 ID，与 docusaurus.config.ts 里 loader 脚本的 client 参数一致。
 *
 * 不要改动——改了会断掉 static/ads.txt 的账号关联，广告将无法投放。
 * test/checks/ads.js 会校验这个值。
 */
export const AD_CLIENT = 'ca-pub-9580076271637088'

/** 正文广告单元。 */
const SLOT_ARTICLE = '5362046383'

/** 侧栏广告单元，自 dumi 时代的 Sidebar 沿用。 */
const SLOT_SIDEBAR = '5334514048'

export type AdPlacementName = 'inArticle' | 'articleBottom' | 'tocSidebar'

export type AdPlacementConfig = {
  /** 关掉某个版位时把它设为 false，组件会整个不渲染。 */
  enabled: boolean
  slot: string
  /** AdSense 的 data-ad-format。'fluid' 配合 in-article 布局，'auto' 用于自适应展示广告。 */
  format: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  /** 仅 format 为 'fluid' 时有意义。 */
  layout?: 'in-article'
  fullWidthResponsive?: boolean
  /**
   * 预留高度（px）。这不是装饰——广告是异步填充的，不预留高度会在广告插入时
   * 把下方内容顶开，产生 CLS（Cumulative Layout Shift）。CLS 是 Core Web Vitals
   * 的三项指标之一，既影响搜索排名，也影响广告可见性评分。
   */
  minHeight: number
}

export const AD_PLACEMENTS: Record<AdPlacementName, AdPlacementConfig> = {
  /** 正文中部。处在阅读动线上，单次点击价格通常明显高于其他位置。 */
  inArticle: {
    enabled: true,
    slot: SLOT_ARTICLE,
    format: 'fluid',
    layout: 'in-article',
    minHeight: 280,
  },
  /** 正文末尾、翻页器之前。读者读完一页时的自然停顿点。 */
  articleBottom: {
    enabled: true,
    slot: SLOT_ARTICLE,
    format: 'auto',
    fullWidthResponsive: true,
    minHeight: 280,
  },
  /**
   * 右侧目录下方。只在桌面端出现——它挂在 DocItem/TOC/Desktop 上，
   * 而该组件本身只在 windowSize 为 desktop 时才渲染。
   */
  tocSidebar: {
    enabled: true,
    slot: SLOT_SIDEBAR,
    format: 'auto',
    minHeight: 600,
  },
}

/**
 * 正文内广告的准入门槛。
 *
 * 短页面不投正文内广告，有两个原因：
 * 1. 合规。AdSense 不希望在内容过少的页面上投放广告，广告占比过高的页面
 *    可能被判定为低价值内容。本站的 overview、support 正是这类页面。
 * 2. 体验。三行正文夹一块广告，读者会直接关掉页面。
 */
export const IN_ARTICLE_RULES = {
  /**
   * 页面至少要有这么多个 h2 小节。要求 3 个的原因是：广告插在第 2 节之后，
   * 后面还得至少剩 1 节，否则它实质上等于底部广告，和 articleBottom 重复。
   */
  minHeadings: 3,
  /** 读完这么多个完整 h2 小节后才插入广告。 */
  afterHeadingCount: 2,
  /** 正文纯文本长度下限（字符数）。 */
  minChars: 800,
}

/**
 * 这些路径前缀下完全不投广告。
 *
 * 本站暂无贡献者文档一类流量小、不宜打扰的页面，保留机制备用。
 */
export const AD_EXCLUDED_PATH_PREFIXES: string[] = []

export function isAdAllowedOnPath(pathname: string): boolean {
  return !AD_EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
