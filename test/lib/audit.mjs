/**
 * 依赖漏洞审计。输出一行 JSON 到 stdout。
 *
 * ## 为什么不用 `npm audit`
 *
 * 本项目的 npm registry 指向 npmmirror 镜像，该镜像未实现 audit 接口，
 * 直接跑 `npm audit` 会拿到 "[NOT_IMPLEMENTED] /-/npm/v1/security/*"。
 * 而加 `--registry=https://registry.npmjs.org` 会让 npm 用官方源重新解析
 * 全部一千多个包的元数据，实测长时间不返回。
 *
 * 这里直接调用 npm audit 内部使用的那个批量接口：把 package-lock.json 里
 * 每个包的版本一次性 POST 过去，拿回命中的通告。一次请求，秒级返回，
 * 且不受本地 registry 配置影响。
 *
 * 输出契约：
 *   成功 { ok: true,  counts: {critical,high,moderate,low}, findings: [...] }
 *   失败 { ok: false, error: "原因" }
 * 失败与「零漏洞」必须区分——审计跑不起来不等于没有漏洞。
 */
import fs from 'node:fs'
import path from 'node:path'

const ENDPOINT = 'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk'
const TIMEOUT_MS = 30000

function fail(error) {
  process.stdout.write(JSON.stringify({ ok: false, error }))
  process.exit(0)
}

const lockPath = path.join(process.cwd(), 'package-lock.json')
if (!fs.existsSync(lockPath)) fail('package-lock.json 不存在，无法审计')

let lock
try {
  lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
} catch (e) {
  fail(`package-lock.json 解析失败：${e.message}`)
}

const versions = new Map()
for (const [pkgPath, info] of Object.entries(lock.packages ?? {})) {
  if (!pkgPath.startsWith('node_modules/') || !info.version) continue
  // 嵌套路径形如 node_modules/a/node_modules/b，取最后一段包名
  const marker = 'node_modules/'
  const name = pkgPath.slice(pkgPath.lastIndexOf(marker) + marker.length)
  if (!versions.has(name)) versions.set(name, new Set())
  versions.get(name).add(info.version)
}
if (versions.size === 0) fail('package-lock.json 中没有找到任何依赖')

const body = Object.fromEntries([...versions].map(([k, v]) => [k, [...v]]))

const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
  clearTimeout(timer)
  if (!res.ok) fail(`审计接口返回 HTTP ${res.status}`)

  const data = await res.json()
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 }
  const findings = []
  for (const [name, advisories] of Object.entries(data)) {
    for (const a of advisories) {
      counts[a.severity] = (counts[a.severity] ?? 0) + 1
      findings.push({
        name,
        severity: a.severity,
        range: a.vulnerable_versions,
        title: a.title,
        url: a.url,
      })
    }
  }
  process.stdout.write(JSON.stringify({ ok: true, counts, findings }))
} catch (e) {
  clearTimeout(timer)
  fail(e.name === 'AbortError' ? `审计接口 ${TIMEOUT_MS}ms 未响应` : `审计请求失败：${e.message}`)
}
