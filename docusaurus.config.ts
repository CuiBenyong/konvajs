import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import { SITE_URL, SITE_DESCRIPTION } from './siteMeta'
import structuredDataPlugin from './plugins/structuredData'
import llmsTxtPlugin from './plugins/llmsTxt'

// 这段代码运行在 Node.js 环境，不要在这里使用浏览器 API

/**
 * 站点级结构化数据。
 *
 * 通过 headTags 注入，因此每个页面都会带上一份——这是站点级实体的常规做法，
 * 它描述的是「这个站点是什么」，与页面无关，重复出现不构成矛盾声明。
 *
 * 页面级的 TechArticle 与 BreadcrumbList 是另一回事，由
 * plugins/structuredData.ts 在 postBuild 阶段逐页写入，且每页各只有一份，
 * 原因见该文件顶部注释。
 */
const siteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Konva.js 中文文档',
  alternateName: 'konvajs-zh',
  url: SITE_URL,
  inLanguage: 'zh-Hans',
  description: SITE_DESCRIPTION,
  about: {
    '@type': 'SoftwareSourceCode',
    name: 'Konva',
    codeRepository: 'https://github.com/konvajs/konva',
    programmingLanguage: 'JavaScript',
  },
}

const config: Config = {
  title: 'Konva.js 中文文档',
  tagline: 'HTML5 Canvas 2D 框架 · 图形、事件、动画与变换',
  favicon: 'img/favicon.png',

  url: SITE_URL,
  baseUrl: '/',

  // 迁移期间正文里可能残留指向 dumi 旧路径的链接，
  // 设为 throw 可以在构建阶段就暴露出来，而不是等上线后 404。
  onBrokenLinks: 'throw',
  markdown: {
    /**
     * .md 按 CommonMark 解析，.mdx 才按 MDX 解析。
     *
     * Docusaurus 3 默认把 .md 也当 MDX，于是正文里的 `{` 会被当成 JSX 表达式
     * 送去 acorn 解析并报错。自 dumi 迁移过来的 96 页是纯 Markdown，
     * 里面有大量 Konva 配置对象字面量，逐个转义既无意义又会污染正文。
     * 后续引入多框架 Tab 的页面用 .mdx 扩展名即可获得完整 MDX 能力。
     */
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // 只声明中文一个 locale。多声明一个 en 会额外产出一份内容相同但
  // lang 标注错误的 /en/ 目录，并带自己的 sitemap 提交给搜索引擎。
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/CuiBenyong/konvajs/tree/main/',
          // 从 git 提交记录取最后更新时间，供 sitemap 的 lastmod
          // 与 TechArticle 的 dateModified 使用。lastmod 是少数
          // Google 确实会参考的 sitemap 字段。
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          // changefreq 与 priority 自 2024 年起被 Google 忽略，
          // plugin-sitemap 源码注释亦如此说明，故不输出。
          changefreq: null,
          priority: null,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [structuredDataPlugin, llmsTxtPlugin],

  headTags: [
    /**
     * 提前建立到广告服务器的连接。
     *
     * 广告脚本是异步加载的，先把 DNS 解析和 TLS 握手做掉可以让广告更早出现，
     * 而广告出现得越早，进入可见区域的概率越高。
     */
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://pagead2.googlesyndication.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: { rel: 'dns-prefetch', href: 'https://googleads.g.doubleclick.net' },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify(siteStructuredData),
    },
  ],

  scripts: [
    {
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9580076271637088',
      /**
       * async 必须显式声明。
       *
       * Docusaurus 会把这里的属性原样透传到 script 标签上，不会自动补 async
       * （见 @docusaurus/core 的 createBootstrapPlugin）。漏掉它，这就是 head 里的
       * 同步阻塞脚本，既拖慢 LCP，也因为内容出现得晚而降低广告可见性评分。
       */
      async: true,
      crossorigin: 'anonymous',
    },
  ],

  themeConfig: {
    metadata: [
      { name: 'description', content: SITE_DESCRIPTION },
      {
        name: 'keywords',
        content:
          'Konva,Konva.js,Konva 中文文档,HTML5 Canvas,Canvas 2D,JavaScript 图形库,Canvas 教程,Transformer',
      },
      { property: 'og:locale', content: 'zh_CN' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    navbar: {
      title: 'Konva.js 中文文档',
      logo: {
        alt: 'Konva.js',
        src: 'img/konva.png',
      },
      items: [
        { to: '/docs/intro', position: 'left', label: '开始' },
        { to: '/docs/overview', position: 'left', label: '教程' },
        { to: '/docs/shapes/rect', position: 'left', label: '图形' },
        { to: '/docs/performance/all-performance-tips', position: 'left', label: '性能' },
        { to: '/docs/support', position: 'right', label: '帮助' },
        { href: 'https://github.com/CuiBenyong/konvajs', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            { label: '开始', to: '/docs/intro' },
            { label: '教程目录', to: '/docs/overview' },
            { label: '图形', to: '/docs/shapes/rect' },
            { label: '性能优化', to: '/docs/performance/all-performance-tips' },
            { label: '帮助', to: '/docs/support' },
          ],
        },
        {
          title: 'Konva',
          items: [
            { label: '官方站点', href: 'https://konvajs.org/' },
            { label: '官方仓库', href: 'https://github.com/konvajs/konva' },
            { label: 'API 参考', href: 'https://konvajs.org/api/Konva.html' },
          ],
        },
        {
          title: '本站',
          items: [{ label: '翻译仓库', href: 'https://github.com/CuiBenyong/konvajs' }],
        },
      ],
      copyright: `版权所有 © ${new Date().getFullYear()} Konva.js 中文文档。本站为 Konva 官方文档的中文翻译，内容版权归原作者所有。`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
