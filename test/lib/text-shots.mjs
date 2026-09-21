/**
 * 给含文本的演示页逐个截图，供人工复核 Konva 10 的文本定位变更。
 *
 * Konva 10.0.0 把文本定位默认值改为对齐 DOM/CSS 标准。演示健康检查能发现
 * 「报错」与「没画东西」，发现不了「画错了位置」——文字溢出容器、盖住图形、
 * 或与图形错位，这些在像素统计上都是「画了东西」。
 *
 * 不做自动比对：没有 Konva 9 的基线图，而与「预期外观」的比对本身就需要
 * 人来判断。这个脚本的价值是把 22 张图一次性生成好，而不是让人逐个手动开页面。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(import.meta.dirname, '../..')
const STATIC_DIR = path.join(ROOT, 'static')
const OUT_DIR = path.join(ROOT, 'test', 'lib', 'shots')
const PORT = 3398

/** 含 Konva.Text / TextPath / Label 的演示，来自对 docs/ 的实测统计。 */
const TEXT_DEMOS = [
  'downloads/code/shapes/Text.html',
  'downloads/code/shapes/TextPath.html',
  'downloads/code/shapes/Label.html',
  'downloads/code/styling/Shadow.html',
  'downloads/code/styling/Blend_Mode.html',
  'downloads/code/events/Binding_Events.html',
  'downloads/code/events/Custom_Hit_Region.html',
  'downloads/code/events/Desktop_and_Mobile.html',
  'downloads/code/events/Fire_Events.html',
  'downloads/code/events/Image_Events.html',
  'downloads/code/events/Listen_for_Events.html',
  'downloads/code/events/Mobile_Events.html',
  'downloads/code/events/Multi_Event.html',
  'downloads/code/drag_and_drop/Complex_Drag_and_Drop.html',
  'downloads/code/drag_and_drop/Drag_Events.html',
  'downloads/code/drag_and_drop/Drop_Events.html',
  'downloads/code/drag_and_drop/Simple_Drag_Bounds.html',
  'downloads/code/performance/Disable_Perfect_Draw.html',
  'downloads/code/performance/Layer_Management.html',
  'downloads/code/performance/Listening_False.html',
  'downloads/code/tweens/All_Easings.html',
  'downloads/code/tweens/Finish_Event.html',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (urlPath === '/favicon.ico') return res.writeHead(204).end()
  const filePath = path.join(STATIC_DIR, urlPath)
  if (!filePath.startsWith(STATIC_DIR)) return res.writeHead(403).end()
  let data
  try {
    data = await fs.readFile(filePath)
  } catch {
    return res.writeHead(404).end()
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream' })
  res.end(data)
})
await new Promise((r) => server.listen(PORT, r))

await fs.rm(OUT_DIR, { recursive: true, force: true })
await fs.mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })

/**
 * 顺带做一项可机械判定的检查：文本是否越出舞台边界。
 * 这不能替代人眼复核，但能把最明显的一类问题先挑出来。
 */
const overflow = []

for (const demo of TEXT_DEMOS) {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
  try {
    await page.goto(`http://localhost:${PORT}/${demo}`, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(800)

    const outOfBounds = await page.evaluate(() => {
      if (!window.Konva || !Konva.stages.length) return []
      const stage = Konva.stages[0]
      const w = stage.width()
      const h = stage.height()
      return stage
        .find((n) => ['Text', 'TextPath', 'Label'].includes(n.className))
        .map((n) => {
          const r = n.getClientRect()
          const out = r.x < -1 || r.y < -1 || r.x + r.width > w + 1 || r.y + r.height > h + 1
          return out
            ? `${n.className} "${(n.text?.() ?? '').slice(0, 14)}" x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)}（舞台 ${w}x${h}）`
            : null
        })
        .filter(Boolean)
    })
    if (outOfBounds.length) overflow.push({ demo, items: outOfBounds })

    const name = demo.replace(/[/]/g, '__').replace('.html', '.png')
    await page.screenshot({ path: path.join(OUT_DIR, name) })
  } catch (e) {
    console.log(`跳过 ${demo}：${e.message}`)
  }
  await page.close()
}

await browser.close()
server.close()

console.log(`已生成 ${TEXT_DEMOS.length} 张截图到 ${path.relative(ROOT, OUT_DIR)}`)
if (overflow.length) {
  console.log(`\n文本越出舞台边界的演示 ${overflow.length} 个：`)
  for (const o of overflow) {
    console.log(`  ${o.demo}`)
    o.items.forEach((i) => console.log(`     ${i}`))
  }
} else {
  console.log('\n未发现文本越出舞台边界的情况。仍需人眼复核截图中的相对位置与重叠。')
}
