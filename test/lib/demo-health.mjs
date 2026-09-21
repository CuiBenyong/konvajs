/**
 * 演示页健康检查：用真实 Chrome 逐个加载 static/downloads/code 下的演示页，
 * 记录控制台错误与画布是否真的画出了东西。
 *
 * ## 为什么必须用真实浏览器
 *
 * 演示页是一段直接操作 Canvas 的脚本，它的正确性无法从源码静态判断——
 * API 改名、参数语义变化、绘制顺序问题都只在运行时暴露。而本项目的 CDN
 * 引用采用浮动大版本 konva@10（规格 §4.2.1），上游任何一次 10.x 发布都会
 * 立刻作用到这些页面上。没有这道检查，回归会静默存在。
 *
 * ## 「画布非空」怎么判断
 *
 * 读 canvas 的像素数据，统计非透明像素个数。脚本抛错导致什么都没画时该值为 0。
 * 阈值取 0 而非某个百分比——只要画了任何东西就算通过，不对演示内容做假设。
 *
 * 用 channel: 'chrome' 驱动本机已安装的 Chrome，不下载 Chromium。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DEMO_DIR = path.join(ROOT, 'static', 'downloads', 'code')
const STATIC_DIR = path.join(ROOT, 'static')
const OUT = path.join(ROOT, 'test', 'lib', 'demo-health.json')
const PORT = 3399
const PAGE_TIMEOUT_MS = 20000

/** 演示页会加载 /assets 下的图片，所以服务整个 static 目录而不只是演示目录。 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function serveStatic() {
  return http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    const filePath = path.join(STATIC_DIR, urlPath)
    // 防目录穿越
    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403).end()
      return
    }
    try {
      const data = await fs.readFile(filePath)
      res.writeHead(200, {
        'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
      })
      res.end(data)
    } catch {
      res.writeHead(404).end()
    }
  })
}

async function collectDemos(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await collectDemos(p, out)
    else if (e.name.endsWith('.html')) out.push(p)
  }
  return out
}

const server = serveStatic()
await new Promise((resolve) => server.listen(PORT, resolve))

const demos = (await collectDemos(DEMO_DIR)).sort()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []

for (const demo of demos) {
  const rel = path.relative(STATIC_DIR, demo).split(path.sep).join('/')
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  let canvasCount = 0
  let painted = false
  try {
    await page.goto(`http://localhost:${PORT}/${rel}`, {
      waitUntil: 'networkidle',
      timeout: PAGE_TIMEOUT_MS,
    })
    // 给动画类演示留出几帧时间
    await page.waitForTimeout(700)
    const probe = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll('canvas')]
      let nonTransparent = 0
      for (const c of canvases) {
        const ctx = c.getContext('2d')
        if (!ctx || !c.width || !c.height) continue
        const { data } = ctx.getImageData(0, 0, c.width, c.height)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) nonTransparent++
        }
      }
      return { canvasCount: canvases.length, nonTransparent }
    })
    canvasCount = probe.canvasCount
    painted = probe.nonTransparent > 0
  } catch (e) {
    errors.push(`导航失败：${e.message}`)
  }
  await page.close()

  results.push({
    file: rel,
    ok: errors.length === 0 && canvasCount > 0 && painted,
    errors,
    canvasCount,
    painted,
  })
}

await browser.close()
server.close()

const report = { generatedAt: new Date().toISOString(), total: results.length, results }
await fs.writeFile(OUT, JSON.stringify(report, null, 2) + '\n')

const failed = results.filter((r) => !r.ok)
console.log(`演示健康检查：${results.length} 个，失败 ${failed.length} 个`)
for (const f of failed) {
  console.log(`  ${f.file}  canvas=${f.canvasCount} painted=${f.painted}`)
  for (const e of f.errors.slice(0, 2)) console.log(`     ${e.slice(0, 140)}`)
}
