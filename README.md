# Konva.js 中文文档

[Konva](https://konvajs.org/) 官方文档的中文翻译。线上地址：https://konva-doc-cn.front-end-js.top

## 开发

```bash
npm install
npm start           # 开发服务器
npm run build       # 生产构建，输出到 build/
npm run serve       # 本地预览构建产物
npm run demo-health # 用真实 Chrome 跑一遍全部演示页
```

```bash
node test/lib/content-stats.mjs   # 按章节统计散文字数与广告位达标情况
node test/lib/text-shots.mjs      # 给含文本的演示截图，供人工复核排版
```

`demo-health` 用 `playwright-core` 驱动本机已安装的 Chrome，不下载 Chromium。

要求 Node ≥ 20。

## 验收

```bash
npm run check      # typecheck + build + verify，CI 用这条
npm run verify     # 只跑检查器（需先 build）
```

`test/checks/` 下每个文件是一个检查器，导出 `{ name, run(ctx) }`，
返回问题字符串数组，空数组即通过。新增检查后需在 `test/verify.js`
的 `checks` 数组中注册。

现有 11 项检查：

| 检查器 | 把关的问题 |
|---|---|
| `build-sanity` | 页面是否为空壳。迁移前 dumi 产出 630 字节无正文 HTML，这里断言 > 5000 字节且含中文 |
| `deps` | 版本下限、dumi 遗留依赖是否清除、依赖漏洞（0 高危 0 中危） |
| `metadata` | 每页 title 唯一、description 非空且不是站点级兜底 |
| `redirects` | 96 条 301 的条数、状态码、源地址唯一性、目标确实存在 |
| `robots` | 18 个 AI 爬虫 UA 是否显式放行，有无矛盾的 Disallow |
| `ads` | AD_CLIENT 未被改动、slot 齐全、无定时器、key 携带 pathname |
| `ad-placement` | 每页是否渲染出广告占位符 |
| `seo` | canonical 存在、唯一、绝对、无双斜杠、跨页不重复；sitemap 带 lastmod |
| `jsonld` | TechArticle 与 BreadcrumbList 各有且仅有一个，面包屑至少三级 |
| `llms` | llms.txt 收录完整、绝对地址、带摘要；llms-full.txt 正文非空 |
| `analytics` | 凭据已配置却未生效则报错；未配置只提示 |
| `demos` | iframe 指向的演示文件存在，且页面名与演示名一致 |
| `konva-version` | 全站无旧版本残留，统一为浮动大版本 `konva@10` |
| `demo-health` | 真实 Chrome 加载全部演示，无控制台错误且画布非空 |
| `originality` | 页面三段结构、原创小节字数、FAQ 问句格式。**全站生效**，新增页面自动纳入 |

## 需要配置的凭据

`src/config/analytics.ts` 中的三个常量默认是占位值。站点可正常构建上线，
填入真值后自动生效，不需要改动其他文件：

- `GA4_MEASUREMENT_ID` — Google Analytics 4
- `GSC_VERIFICATION_TOKEN` — Google Search Console
- `BAIDU_VERIFICATION_TOKEN` — 百度站长平台（可选）

## 不要改动的值

- **`src/config/ads.ts` 的 `AD_CLIENT`**：改动会断掉 `static/ads.txt` 的账号关联，广告将无法投放
- **`static/ads.txt`**：内容需与 AdSense 后台一致
- **`src/components/Ad/` 下不得引入 `setInterval` / `setTimeout`**：定时刷新广告违反 AdSense 版位政策，可能导致账号被限制投放。换页时的广告重建由用户点击导航触发，属用户主动行为，与政策禁止的自动刷新是两回事
- **`static/_redirects` 的 96 条 301**：对应迁移前线上已被收录的 URL，删除会直接丢失这些页面累积的搜索权重
- **CDN 版本一律写 `konva@10`**：不要改回精确版本。理由与代价见规格 §4.2.1——浮动版本与演示健康检查是一套，钉死版本会让健康检查失去存在意义，而文档会再次陈旧

## 目录结构

```
docs/              # 内容，110 页
src/
  components/Ad/   # 广告组件
  config/          # ads.ts、analytics.ts
  theme/           # Docusaurus 组件的 wrap 覆写
plugins/           # llms.txt 生成、结构化数据注入
static/            # 静态资源、_redirects、robots.txt、ads.txt
test/              # 验收框架与检查器
specs/ plans/      # 设计文档与实施计划（在内容目录之外，不会被发布）
```

## 设计与计划

- 设计：[`specs/2026-09-18-konvajs-site-overhaul-design.md`](specs/2026-09-18-konvajs-site-overhaul-design.md)
- 计划：[`plans/2026-09-21-p1-infrastructure.md`](plans/2026-09-21-p1-infrastructure.md)

## LICENSE

MIT。本站为 Konva 官方文档的中文翻译，内容版权归原作者所有。

## 域名迁移交接清单（2026-09-21）

站点已从主域 `front-end-js.top` 迁到子域 `konva-doc-cn.front-end-js.top`，
主域保留一段时间后改作导航站。**代码侧已全部改完**，下面是只能在各平台后台
完成的部分，以及主域将来切走时必须一并带走的东西。

### 一、现在要做的（否则收录不会转移）

1. **Netlify**：把 `konva-doc-cn.front-end-js.top` 设为本站的 **primary domain**，
   `front-end-js.top` 保留为 **domain alias**。
   顺序不能反——主域必须仍然指向本站，`_redirects` 里的主域兜底规则才会生效。
2. **Netlify**：确认发布目录是 `build`（不是 dumi 时代的 `dist`）。
3. **Search Console**：为 `konva-doc-cn.front-end-js.top` 新建资源并验证，
   token 填进 `src/config/analytics.ts`（**是子域的 token，不是主域的**）。
4. **Search Console**：在主域资源里用「地址变更」（Change of Address）工具
   指向子域资源。这一步会显著加快权重转移。
5. **提交子域 sitemap**：`https://konva-doc-cn.front-end-js.top/sitemap.xml`
6. **百度站长平台**：同样需要为子域单独验证并提交。百度没有等价的地址变更工具，
   只能靠 301 自然转移，会比 Google 慢。

### 二、主域将来切给导航站时，必须一并带走

这三件事漏掉任何一件都会造成实质损失。

**① `ads.txt` 必须留在主域。**
AdSense 按**根域**查 `ads.txt`。站点虽然在子域，爬虫仍会去
`front-end-js.top/ads.txt` 找授权记录。导航站的 `ads.txt` 里
**必须包含这一行**，否则本站广告会被判为未授权库存，收入直接受影响：

```
google.com, pub-9580076271637088, DIRECT, f08c47fec0942fa0
```

**② 96 条页面级 301 必须由导航站继续提供。**
这些是 dumi 时代就被收录的 URL（`/guides/...`、`/help`、`/start`），
目前由本仓库的 `static/_redirects` 承担。主域切走后本站不再收到主域请求，
这些规则要原样搬到导航站。目标已经写成子域的绝对地址，可以直接复制。

**③ 主域兜底规则要继续存在。**

```
https://front-end-js.top/*  https://konva-doc-cn.front-end-js.top/:splat  301!
```

导航站接管主域后，这条要改成「只兜底文档相关路径」，
不能把导航站自己的页面也跳走。建议改成按前缀兜底：

```
/docs/*      https://konva-doc-cn.front-end-js.top/docs/:splat  301!
/downloads/* https://konva-doc-cn.front-end-js.top/downloads/:splat  301!
/llms.txt    https://konva-doc-cn.front-end-js.top/llms.txt  301!
```

**Google 官方建议 301 至少保留一年**，实际上只要旧 URL 还有外链和收录，
就不应该撤。
