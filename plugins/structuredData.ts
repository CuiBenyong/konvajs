import fs from 'fs/promises'
import path from 'path'
import type { Plugin } from '@docusaurus/types'
import { SITE_URL } from '../siteMeta'

/**
 * 构建结束后为每个文档页写入 TechArticle 与 BreadcrumbList 结构化数据。
 *
 * ## 为什么在 postBuild 改 HTML，而不是用 <Head> 在渲染期注入
 *
 * 用 <Head> 注入需要在组件里拿到面包屑层级与最终 URL，而这两样都得自己从路由
 * 推导——推导规则必须复刻 Docusaurus 的 slug 处理（目录数字前缀剥离、id 覆盖
 * 文件名、与目录同名的文件变成目录索引），一旦上游改动就会悄悄失效。
 * 构建产物里的目录结构就是真实 URL，title 与 description 也已是最终值。
 *
 * ## 为什么是「替换」而不是「追加」面包屑
 *
 * Docusaurus 自己会输出一份 BreadcrumbList，但它只收录带链接的面包屑项，
 * 而分类项（「图形」「事件」等）在本站没有独立页面因而没有链接，
 * 结果每页的面包屑结构化数据只剩孤零零一级，等于没有层级信息。
 *
 * 直接追加一份自己的会让同一页出现两个 BreadcrumbList，搜索引擎面对互相矛盾
 * 的两份层级声明，通常的处理是两份都不采信。所以这里先移除已有的那份，
 * 再写入带完整层级的版本。test/checks/jsonld.js 会断言每页有且仅有一个。
 */

/** 目录名 → 面包屑显示名。与 docs/<section>/_category_.json 的 label 保持一致。 */
const SECTION_LABELS: Record<string, string> = {
  shapes: '图形',
  styling: '样式',
  events: '事件',
  'drag-and-drop': '拖拽/释放',
  clipping: '剪辑',
  'groups-and-layers': '分组、图层',
  filters: '滤镜',
  tweens: '补间动画',
  animations: '动画',
  selectors: '选择器',
  'data-and-serialization': '数据序列化',
  performance: '性能优化',
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
  // Docusaurus 的 title 形如「页面标题 | 站点标题」，这里只要页面标题部分。
  return decodeEntities(m[1]).split('|')[0].trim()
}

function extractDescription(html: string): string {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html)
  return m ? decodeEntities(m[1]).trim() : ''
}

/**
 * 从渲染后的 HTML 中提取「常见问题」小节下的问答对。
 *
 * 从构建产物读而非从 .md 读，理由与本文件顶部一致：产物里的结构是最终结果，
 * 不需要复刻 Markdown 到 HTML 的转换规则。
 *
 * 结构约定见 test/checks/originality.js：`## 常见问题` 下用 `### 问句？` 提问，
 * 随后的段落是答案。渲染后即 h2「常见问题」之后、下一个 h2 之前的若干 h3 与其后的 p。
 */
function extractFaq(html: string): { question: string; answer: string }[] {
  const start = /<h2[^>]*>(?:(?!<\/h2>)[\s\S])*?常见问题[\s\S]*?<\/h2>/i.exec(html)
  if (!start) return []
  const rest = html.slice(start.index + start[0].length)
  const end = /<h2[^>]*>/i.exec(rest)
  const section = end ? rest.slice(0, end.index) : rest

  const out: { question: string; answer: string }[] = []
  for (const chunk of section.split(/<h3[^>]*>/i).slice(1)) {
    const close = chunk.indexOf('</h3>')
    if (close === -1) continue
    // h3 里含 Docusaurus 自动插入的锚点链接 <a class="hash-link">​</a>，
    // 剥掉标签后它的零宽空格（U+200B）会留在文本里，必须一并清除——
    // 否则每个问句末尾都跟着一个不可见字符进入结构化数据。
    const question = decodeEntities(chunk.slice(0, close).replace(/<[^>]+>/g, ''))
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
    const body = chunk.slice(close + '</h3>'.length)
    const answer = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) =>
        decodeEntities(m[1].replace(/<[^>]+>/g, ''))
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join(' ')
    if (question && answer) out.push({ question, answer })
  }
  return out
}

/**
 * 把 JSON 序列化成可安全嵌入 <script> 的字符串。
 *
 * 必须转义 `<`：只要正文里出现 `</script>`（例如 FAQ 里贴了一段 HTML 示例代码），
 * 它就会提前闭合 script 标签，后面的 JSON 变成页面文本，整段结构化数据作废。
 * 用 \u003c 转义后语义不变，而浏览器不会把它识别为标签起始。
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** 移除已有的 BreadcrumbList JSON-LD，避免同页出现两份互相矛盾的层级声明。 */
function removeExistingBreadcrumb(html: string): string {
  return html.replace(
    /<script[^>]*type="application\/ld\+json"[^>]*>(?:(?!<\/script>)[\s\S])*?"BreadcrumbList"[\s\S]*?<\/script>/gi,
    ''
  )
}

async function collectDocPages(dir: string, out: string[] = []): Promise<string[]> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'img') continue
      await collectDocPages(full, out)
    } else if (entry.name === 'index.html') {
      out.push(full)
    }
  }
  return out
}

export default function structuredDataPlugin(): Plugin {
  return {
    name: 'konva-structured-data',
    async postBuild({ outDir }) {
      const docsDir = path.join(outDir, 'docs')
      let pages: string[] = []
      try {
        pages = await collectDocPages(docsDir)
      } catch {
        // docs 目录不存在时跳过，不让构建失败。
        return
      }

      for (const file of pages) {
        const original = await fs.readFile(file, 'utf8')
        const relDir = path.relative(outDir, path.dirname(file)).split(path.sep).join('/')
        const url = `${SITE_URL}/${relDir}`
        const segments = relDir.split('/') // ['docs', '<page>'] 或 ['docs', '<section>', '<page>']
        const title = extractTitle(original)
        const description = extractDescription(original)

        const crumbs: { name: string; item: string }[] = [
          { name: '首页', item: SITE_URL },
          { name: '文档', item: `${SITE_URL}/docs/intro` },
        ]
        if (segments.length === 3) {
          const section = segments[1]
          crumbs.push({
            name: SECTION_LABELS[section] ?? section,
            // 分类本身没有独立页面，指向该分类下第一个可达页面不准确，
            // 因此统一指向教程目录——它列出了全部分类。
            item: `${SITE_URL}/docs/overview`,
          })
        }
        crumbs.push({ name: title, item: url })

        const techArticle = {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: title,
          description,
          url,
          inLanguage: 'zh-Hans',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Konva.js 中文文档',
            url: SITE_URL,
          },
          about: {
            '@type': 'SoftwareSourceCode',
            name: 'Konva',
            codeRepository: 'https://github.com/konvajs/konva',
            programmingLanguage: 'JavaScript',
          },
        }

        const breadcrumb = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: c.item,
          })),
        }

        const faq = extractFaq(original)
        const faqLd =
          faq.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              }
            : null

        const injected =
          `<script type="application/ld+json">${jsonForScript(techArticle)}</script>` +
          `<script type="application/ld+json">${jsonForScript(breadcrumb)}</script>` +
          (faqLd ? `<script type="application/ld+json">${jsonForScript(faqLd)}</script>` : '')

        const html = removeExistingBreadcrumb(original).replace('</head>', `${injected}</head>`)
        await fs.writeFile(file, html)
      }

      console.log(`结构化数据：已为 ${pages.length} 个文档页写入 TechArticle 与 BreadcrumbList`)
    },
  }
}
