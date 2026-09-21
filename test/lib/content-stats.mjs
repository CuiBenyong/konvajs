/**
 * 内容度量：按章节统计散文字数与 h2 数量，并算出有多少页够得上正文内广告位门槛。
 *
 * 不纳入 verify：这是度量而非判定，数值高低本身没有对错。
 * 判定由 test/checks/originality.js 负责。这个脚本的用途是量化改造效果、
 * 为后续章节的排序提供依据。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DOCS = path.join(ROOT, 'docs')

// 与 src/config/ads.ts 的 IN_ARTICLE_RULES 保持一致，三处需一起改
const MIN_HEADINGS = 3
const MIN_CHARS = 800

/** 散文长度：扣掉代码块、iframe 与 HTML 标签，忽略空白。 */
function proseLength(text) {
  let t = text.replace(/```[\s\S]*?```/g, '')
  t = t.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  t = t.replace(/<[^>]+>/g, '')
  return t.replace(/\s+/g, '').length
}

/** 含代码在内的正文长度，对应 IN_ARTICLE_RULES.minChars 的口径。 */
function totalLength(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
}

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await walk(p, out)
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

const files = (await walk(DOCS)).sort()
const bySection = new Map()
let adEligible = 0

for (const f of files) {
  const rel = path.relative(DOCS, f).split(path.sep).join('/')
  const section = rel.includes('/') ? rel.split('/')[0] : '(根级)'
  const text = await fs.readFile(f, 'utf8')
  const body = text.startsWith('---') ? text.split('---').slice(2).join('---') : text
  const prose = proseLength(body)
  const h2 = (body.match(/^## /gm) || []).length
  if (h2 >= MIN_HEADINGS && totalLength(body) >= MIN_CHARS) adEligible++

  if (!bySection.has(section)) bySection.set(section, [])
  bySection.get(section).push({ rel, prose, h2 })
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  return s.length % 2
    ? s[(s.length - 1) / 2]
    : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)
}

console.log('章节                      页数  散文中位数  h2 中位数')
for (const [section, pages] of [...bySection].sort()) {
  console.log(
    `${section.padEnd(26)}${String(pages.length).padStart(3)}  ` +
      `${String(median(pages.map((p) => p.prose))).padStart(8)}  ` +
      `${String(median(pages.map((p) => p.h2))).padStart(8)}`
  )
}

const all = [...bySection.values()].flat()
console.log(`\n全站 ${all.length} 页，散文中位数 ${median(all.map((p) => p.prose))} 字`)
console.log(
  `够正文内广告位门槛（h2 ≥ ${MIN_HEADINGS} 且正文 ≥ ${MIN_CHARS} 字）：${adEligible} / ${all.length} 页`
)
