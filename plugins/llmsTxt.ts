import fs from 'fs/promises'
import path from 'path'
import type { Plugin } from '@docusaurus/types'
import { SITE_URL } from '../siteMeta'

/**
 * 构建结束后生成 /llms.txt 与 /llms-full.txt。
 *
 * ## 这两个文件是做什么的
 *
 * llms.txt 是面向大模型的站点地图约定（llmstxt.org）。sitemap.xml 只有 URL，
 * AI 系统要判断某页讲什么必须逐个抓取；llms.txt 用 Markdown 把「有哪些页面、
 * 每页讲什么」一次讲清楚，让 AI 在检索阶段就能定位到正确的页面。
 * llms-full.txt 进一步把核心页面的正文摊平，供不便逐页抓取的场景使用。
 *
 * ## 为什么从构建产物读，而不是从 docs 目录读
 *
 * 直接读 docs/*.md 的 frontmatter 看起来更直接，但那样就得自己复刻 Docusaurus
 * 的 slug 规则——目录数字前缀剥离、id 字段覆盖文件名、与目录同名的文件变成
 * 目录索引（本站 drag-and-drop 正是这种情况）。这套规则重写一遍必然与上游
 * 产生偏差，且 Docusaurus 升级时会悄悄失效。
 *
 * 构建产物里的 HTML 路径就是真实 URL，title 与 description 也已是最终结果。
 * 代价是本插件只在 postBuild 阶段运行，开发服务器上访问不到这两个文件。
 */

/** 分区顺序与标题。前缀长的必须排在前面，否则会被短前缀先匹配走。 */
const SECTIONS: { prefix: string; title: string }[] = [
  { prefix: '/docs/intro', title: '开始' },
  { prefix: '/docs/overview', title: '教程目录' },
  { prefix: '/docs/shapes', title: '图形' },
  { prefix: '/docs/styling', title: '样式' },
  { prefix: '/docs/events', title: '事件' },
  { prefix: '/docs/drag-and-drop', title: '拖拽与释放' },
  { prefix: '/docs/clipping', title: '剪辑' },
  { prefix: '/docs/groups-and-layers', title: '分组与图层' },
  { prefix: '/docs/filters', title: '滤镜' },
  { prefix: '/docs/tweens', title: '补间动画' },
  { prefix: '/docs/animations', title: '动画' },
  { prefix: '/docs/selectors', title: '选择器' },
  { prefix: '/docs/data-and-serialization', title: '数据与序列化' },
  { prefix: '/docs/performance', title: '性能优化' },
  { prefix: '/docs/support', title: '帮助' },
]

/**
 * llms-full.txt 只收录这些分区的正文。
 *
 * 不全量收录是因为文件会大到没人愿意抓：这三个分区覆盖了本站最具检索价值的
 * 内容（图形 API、性能优化、事件系统），也正是 AI 问答里最常被问到的部分。
 */
const FULL_TEXT_PREFIXES = ['/docs/shapes', '/docs/performance', '/docs/events']

type PageEntry = {
  url: string
  pathname: string
  title: string
  description: string
  body: string
}

function decodeEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // & 必须最后处理，否则会把上面几个实体的 & 提前解掉
    .replace(/&amp;/g, '&')
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html)
  if (!m) return ''
  return decodeEntities(m[1]).split('|')[0].trim()
}

function extractDescription(html: string): string {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html)
  return m ? decodeEntities(m[1]).trim() : ''
}

/**
 * 从 HTML 取正文纯文本。只用于 llms-full.txt，不要求保真回 Markdown。
 *
 * 优先定位 .theme-doc-markdown 而不是 <article>：<article> 里还包着面包屑
 * 导航，取出来会在每页正文开头留下「事件 / 事件绑定 / 事件绑定」这样的
 * 重复噪音（面包屑 + 标题 + h1），对 AI 理解内容只有干扰。
 */
function extractBody(html: string): string {
  const markdown = /<div[^>]*class="[^"]*theme-doc-markdown[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<footer/i.exec(html)
  const article = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html)
  const source = markdown ? markdown[1] : article ? article[1] : html
  return decodeEntities(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // 块级结束标签换成换行，避免所有文字挤成一行
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|pre|tr|blockquote)>/gi, '\n')
      // 其余标签直接删除而不是换成空格。Prism 会把代码块切成一串 <span>，
      // 换成空格会得到「<! DOCTYPE html >」这种被空格打散的代码；
      // 正文里的词间空格本来就存在于文本节点中，不依赖标签分隔。
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function collectHtmlFiles(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // 这些目录下是打包产物与静态资源，没有页面
      if (['assets', 'img', 'downloads'].includes(entry.name)) continue
      await collectHtmlFiles(full, out)
    } else if (entry.name === 'index.html') {
      out.push(full)
    }
  }
  return out
}

export default function llmsTxtPlugin(): Plugin {
  return {
    name: 'konva-llms-txt',
    async postBuild({ outDir }) {
      const files = await collectHtmlFiles(outDir)
      const pages: PageEntry[] = []

      for (const file of files) {
        const relDir = path.relative(outDir, path.dirname(file)).split(path.sep).join('/')
        const pathname = relDir === '' ? '/' : `/${relDir}`
        if (pathname === '/404' || pathname.startsWith('/search')) continue

        const html = await fs.readFile(file, 'utf8')
        const title = extractTitle(html)
        if (!title) continue

        pages.push({
          url: `${SITE_URL}${pathname === '/' ? '' : pathname}`,
          pathname,
          title,
          description: extractDescription(html),
          body: extractBody(html),
        })
      }

      // --- llms.txt ---
      const lines: string[] = [
        '# Konva.js 中文文档',
        '',
        '> Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架，支持图形绘制、事件、拖拽、',
        '> 变换、动画、滤镜与高性能缓存。本站是 Konva 官方文档的中文翻译。',
        '',
        `- 站点：${SITE_URL}`,
        '- 官方英文文档：https://konvajs.org/',
        '- 官方仓库：https://github.com/konvajs/konva',
        '- 全文版本：' + `${SITE_URL}/llms-full.txt`,
        '',
      ]

      const used = new Set<string>()
      // 先按最长前缀归类，避免 /docs/intro 被更短的前缀先匹配走
      const ordered = [...SECTIONS].sort((a, b) => b.prefix.length - a.prefix.length)
      const bucket = new Map<string, PageEntry[]>()
      for (const page of pages) {
        const hit = ordered.find((s) => page.pathname.startsWith(s.prefix))
        const key = hit ? hit.prefix : '__rest__'
        if (!bucket.has(key)) bucket.set(key, [])
        bucket.get(key)!.push(page)
        used.add(page.pathname)
      }

      for (const section of SECTIONS) {
        const matched = (bucket.get(section.prefix) ?? []).sort((a, b) =>
          a.pathname.localeCompare(b.pathname)
        )
        if (matched.length === 0) continue
        lines.push(`## ${section.title}`, '')
        for (const p of matched) {
          lines.push(p.description ? `- [${p.title}](${p.url})：${p.description}` : `- [${p.title}](${p.url})`)
        }
        lines.push('')
      }

      const rest = (bucket.get('__rest__') ?? []).sort((a, b) =>
        a.pathname.localeCompare(b.pathname)
      )
      if (rest.length > 0) {
        lines.push('## 其他', '')
        for (const p of rest) {
          lines.push(p.description ? `- [${p.title}](${p.url})：${p.description}` : `- [${p.title}](${p.url})`)
        }
        lines.push('')
      }

      await fs.writeFile(path.join(outDir, 'llms.txt'), lines.join('\n'))

      // --- llms-full.txt ---
      const fullPages = pages
        .filter((p) => FULL_TEXT_PREFIXES.some((prefix) => p.pathname.startsWith(prefix)))
        .sort((a, b) => a.pathname.localeCompare(b.pathname))

      const fullLines: string[] = [
        '# Konva.js 中文文档 · 全文',
        '',
        `本文件收录 ${fullPages.length} 个核心页面的完整正文。页面清单与其余页面见 ${SITE_URL}/llms.txt。`,
        '',
        '---',
        '',
      ]
      for (const p of fullPages) {
        fullLines.push(`## ${p.title}`, '', `来源：${p.url}`, '', p.body, '', '---', '')
      }
      await fs.writeFile(path.join(outDir, 'llms-full.txt'), fullLines.join('\n'))

      console.log(
        `llms.txt：收录 ${pages.length} 页；llms-full.txt：${fullPages.length} 页全文`
      )
    },
  }
}
