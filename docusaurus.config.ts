import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import { SITE_URL, SITE_DESCRIPTION } from './siteMeta'

// 这段代码运行在 Node.js 环境，不要在这里使用浏览器 API

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
      // 此处只引用此刻已存在的 /docs/intro。onBrokenLinks 为 throw，
      // 引用尚未迁入的页面会让构建失败。其余入口在内容迁移后补上。
      items: [
        { to: '/docs/intro', position: 'left', label: '文档' },
        { href: 'https://github.com/CuiBenyong/konvajs', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [{ label: '开始', to: '/docs/intro' }],
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
