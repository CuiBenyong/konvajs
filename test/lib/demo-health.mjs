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

/**
 * 等待画布出现内容的轮询上限。
 *
 * 不能只等固定一小段时间：不少演示在脚本里异步加载图片，绘制发生在
 * networkidle 判定之后。实测 Planets_Image_Map 与 Interactive_Building_Map
 * 都因此被误判为「什么都没画」。
 */
const PAINT_POLL_MS = 6000
const PAINT_POLL_INTERVAL_MS = 250

/**
 * 单个演示的重试次数。
 *
 * 演示页从 unpkg 加载 konva，网络抖动会让 networkidle 等待超时，
 * 表现为「导航失败」这类与代码无关的假失败。实测同一个演示在一次运行中
 * 超时、紧接着重跑就通过。
 *
 * 一次抖动不应该让 CI 假失败——那会让人逐渐忽略这项检查。
 * 但重试全部失败时仍如实报错，绝不退化成「视为通过」。
 */
const MAX_ATTEMPTS = 3

/**
 * 初始状态本就是空白画布的演示。
 *
 * Hide_and_Show 的图形以 visible: false 创建，要点按钮才显示——
 * 空白正是它要演示的效果。检查器无从得知这种意图，只能显式登记。
 * 这类页面仍然校验「无控制台错误」与「存在 canvas」。
 */
const INTENTIONALLY_BLANK = new Set([
  // 图形以 visible: false 创建，点按钮才显示——空白正是它要演示的效果。
  'downloads/code/styling/Hide_and_Show.html',
  // 图像映射：建筑图是容器的 CSS 背景，画布上只有 opacity: 0 的热区，
  // 鼠标悬停时才显形。画布本来就应该是空的。
  'downloads/code/sandbox/Interactive_Building_Map.html',
])

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
    // 浏览器会自动请求 favicon。演示页都没有 favicon，404 会被记成控制台错误，
    // 把无关的演示判成失败——实测 Moving.html 就因此间歇性失败。
    // 这里直接回 204，从源头消除这条噪音。
    if (urlPath === '/favicon.ico') {
      res.writeHead(204).end()
      return
    }
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

/** 跑一次某个演示，返回 { errors, canvasCount, painted }。 */
async function probeDemo(rel) {
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
    // 轮询等待画布出现内容，而不是固定等一小段时间
    const probeFn = () => {
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
    }

    const deadline = Date.now() + PAINT_POLL_MS
    let probe = { canvasCount: 0, nonTransparent: 0 }
    for (;;) {
      probe = await page.evaluate(probeFn)
      if (probe.nonTransparent > 0 || Date.now() > deadline) break
      await page.waitForTimeout(PAINT_POLL_INTERVAL_MS)
    }
    canvasCount = probe.canvasCount
    painted = probe.nonTransparent > 0
  } catch (e) {
    errors.push(`导航失败：${e.message}`)
  }
  await page.close()
  return { errors, canvasCount, painted }
}

for (const demo of demos) {
  const rel = path.relative(STATIC_DIR, demo).split(path.sep).join('/')
  const blankIsFine = INTENTIONALLY_BLANK.has(rel)

  let attempt
  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    var probe = await probeDemo(rel)
    const passed =
      probe.errors.length === 0 && probe.canvasCount > 0 && (probe.painted || blankIsFine)
    if (passed) break
    // 只对疑似网络问题重试。脚本报错是确定性的，重跑没有意义，
    // 徒增三倍耗时。
    const transient = probe.errors.some((e) => /导航失败|Timeout|net::|Failed to load/i.test(e))
    if (!transient) break
  }

  results.push({
    file: rel,
    ok: probe.errors.length === 0 && probe.canvasCount > 0 && (probe.painted || blankIsFine),
    errors: probe.errors,
    canvasCount: probe.canvasCount,
    painted: probe.painted,
    intentionallyBlank: blankIsFine || undefined,
    ...(attempt > 1 ? { attempts: attempt } : {}),
  })
}

await browser.close()
server.close()

// 不记录生成时间：它没有任何消费方，却会让每次 npm run check 都弄脏工作区，
// 在 PR 里产生一行无意义的 diff。文件何时更新由 git 提交记录回答。
const report = { total: results.length, results }
await fs.writeFile(OUT, JSON.stringify(report, null, 2) + '\n')

const failed = results.filter((r) => !r.ok)
console.log(`演示健康检查：${results.length} 个，失败 ${failed.length} 个`)
for (const f of failed) {
  console.log(`  ${f.file}  canvas=${f.canvasCount} painted=${f.painted}`)
  for (const e of f.errors.slice(0, 2)) console.log(`     ${e.slice(0, 140)}`)
}
