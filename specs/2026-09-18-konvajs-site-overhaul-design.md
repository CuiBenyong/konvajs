# Konva.js 中文文档站改造设计

- 日期：2026-09-18
- 站点：https://front-end-js.top
- 现状技术栈：dumi 2.2.17（`.dumirc.ts` + `.dumi/theme` 覆写），97 篇 Markdown
- 目标技术栈：Docusaurus 3.10.2 + React 19 + TypeScript
- 托管：Netlify
- 本文范围：五项需求的完整设计（技术栈迁移、内容对齐、广告体系、SEO/GEO、依赖升级）

## 1. 背景与问题

站点每日有稳定自然流量，但内容停留在 Konva 9.3.6 时代，且存在多项实质缺陷。以下问题均为 2026-09-18 实测确认，非推测。

| # | 问题 | 证据 |
|---|---|---|
| 1 | **构建产物是空壳 HTML** | `dist/guides/shapes/rect/index.html` 仅 630 字节，无 `<title>`、无 `description`、无 canonical、无正文。97 页全部如此 |
| 2 | Helmet 的 SEO 标签只在客户端生效 | `.dumirc.ts` 第 31 行 `ssr: {}` 被注释，`exportStatic` 单独使用只产出路由外壳 |
| 3 | URL slug 畸形 | `/guides/shapes/line_-_-simple_-line`、`/guides/data_and_serialization/serialize_a_-stage`，dumi slugify 对 `Snake_Case` 文件名产生游离连字符 |
| 4 | canonical 双斜杠 | `DocLayout/index.tsx:76` 拼接 `"https://front-end-js.top/" + pathname`，而 `pathname` 自带前导斜杠 |
| 5 | 重定向域名拼写错误 | `static/_redirects` 目标写作 `front-end-js.tops`（多一个 s） |
| 6 | SPA 换页广告不重载 | `Adsense/index.tsx` 的 `useEffect` 依赖数组为空，路由切换后旧广告留在原地 |
| 7 | 广告仅 1 个版位 | 只有 `Sidebar` 内一处，正文无广告位 |
| 8 | 无任何流量分析 | `.dumirc.ts` 的 `analytics` 段被注释，无 GA、无 GSC |
| 9 | 无效依赖 | `@umijs/preset-dumi@^1`（dumi 1 的 preset）、`gatsby-plugin-netlify`（本项目不是 Gatsby） |
| 10 | 生产代码残留调试语句 | `DocLayout/index.tsx:57` 的 `console.log("pathname", pathname)` |
| 11 | sitemap 缺 `lastmod` | `dist/sitemap.xml` 仅有 `<loc>` |
| 12 | 内容落后一个大版本 | 全站引用 konva 9.3.6，最新为 10.5.0 |
| 13 | 无任何 GEO 基建 | 无 `llms.txt`，`robots.txt` 未对 AI 爬虫表态 |

### 1.1 竞争态势（决定性背景）

Konva 官方站 `konvajs.org/zh-Hans/` 已上线**完整官方简体中文文档**。官方仓库 `konvajs/site` 的 `MAINTAINING-I18N.md` 声明（核验于 2026-08-20）：

| | 数量 |
|---|---|
| `content/` 下英文页面（不含 API） | 276 |
| 已翻译为 zh-Hans | 276 |
| 有意不译（`content/api/`） | 34 |
| 中文 sitemap 条目 | 280 |

官方另有 `scripts/check-i18n-drift.js`，以 SHA-256 记录译文对应的英文源，英文变更时构建失败。这是有长期维护机制的官方翻译，不是一次性产物。

**本站与官方的页面差距：**

| 章节 | 官方 | 本站 | 缺口 |
|---|---:|---:|---:|
| sandbox | 69 | 0 | +69 |
| shapes | 22 | 20 | +2 |
| filters | 20 | 7 | **+13** |
| react | 19 | 0 | +19 |
| events | 17 | 15 | +2 |
| svelte | 16 | 0 | +16 |
| vue | 13 | 0 | +13 |
| select_and_transform | 13 | 0 | **+13** |
| angular | 12 | 0 | +12 |
| styling | 9 | 8 | +1 |
| posts | 9 | 0 | +9 |
| performance | 9 | 10 | −1（本站多 1 页，需与官方对账归并） |
| drag_and_drop | 9 | 9 | 0 |
| 根级页面 | 8 | 4 | +4 |
| tweens | 7 | 7 | 0 |
| data_and_serialization | 6 | 4 | +2 |
| animations | 6 | 5 | +1 |
| groups_and_layers | 4 | 3 | +1 |
| selectors | 3 | 3 | 0 |
| guides | 2 | 0 | +2 |
| clipping | 2 | 2 | 0 |
| nodejs | 1 | 0 | +1 |
| **合计** | **276** | **97** | **+179** |

本站根级 4 页为 `docs/index.md`（首页）、`start/index.md`、`help/index.md`、`guides/index.md`。

完全缺失的重点：`select_and_transform`（Transformer，Konva 最常用特性之一，13 页）、四套框架集成（react 19 + svelte 16 + vue 13 + angular 12 = 60 页）、`sandbox` 演示 69 页、`posts` 9 页。

### 1.2 已知悉并接受的权衡

本设计按站点所有者的决定执行「全量对齐官方 276 页」。该决定的已知风险已明确告知：官方域名权重更高、canonical 归属明确、有 hreflang 标注，镜像翻译在搜索与 AI 引用上大概率处于劣势。第 4.4 节的原创增量段是本设计对该风险的对冲措施，非可选项。

### 1.3 法律约束

`konvajs/site` 仓库 `license: null`，无 LICENSE 文件，默认保留所有权利。Konva **库**为 MIT，但**站点仓库不是**。

**因此：官方 zh-Hans 译文不得复制、改写或作为翻译底稿。全部 276 页必须从 `content/` 下的英文原文独立翻译。**

## 2. 目标与非目标

### 目标

1. 构建产物包含完整正文 HTML，使搜索引擎与不执行 JS 的 AI 爬虫可直接抓取。
2. 内容对齐 Konva 10.x（CDN 引用采用浮动大版本 `konva@10`，见 §4.2.1）与官方 276 页结构。
3. SPA 路由切换时每个页面重新加载一次广告，且不违反 AdSense 版位政策。
4. 正文内接入广告位，复用既有 AdSense 广告单元。
5. 建立 GEO 基建（`llms.txt`、AI 爬虫放行、结构化数据）。
6. 依赖树无已知漏洞。
7. 97 条既有 URL 全量 301，保住现有收录。

### 非目标

- 不翻译官方 `content/api/`（34 页 JSDoc 生成的 API 参考，官方自身亦不译）。
- 不做多语言（本站仅中文）。
- 不自建评论系统。
- 不改动 AdSense 发布商 ID `ca-pub-9580076271637088`（改动会断掉 `ads.txt` 关联）。

## 3. 技术栈迁移

### 3.1 选型

Docusaurus **3.10.2** + React 19 + TypeScript，与 `cornerstone3d-zh` 完全一致（官方站为 3.9.1 + React 18，本站取更新版本）。

选择理由：

1. **Docusaurus 默认 SSG**，问题 1、2 在迁移完成的瞬间即消失，无需自行调试 dumi 的 SSR。
2. `cornerstone3d-zh` 的 `src/components/Ad/` 可原样移植，问题 6、7 的解法已在生产验证。
3. 与官方同栈，内容结构 1:1 对应，`Tabs`/`TabItem`/live 代码块无需自造。
4. 全新依赖树，问题 9 自然解决。

实时代码演示采用 `@codesandbox/sandpack-react`，与官方同方案。

### 3.2 废弃与保留

**废弃**：`.dumirc.ts`、`.dumi/`（全目录）、`tsconfig.json`（由 `@docusaurus/tsconfig` 替代）、依赖 `dumi`、`@umijs/preset-dumi`、`core-js`、`gatsby-plugin-netlify`、`patch-package`。

**保留并迁移**：
- `public/assets/**` → `static/assets/**`（图片资源，被正文引用）
- `public/downloads/code/**` → `static/downloads/code/**`（既有演示 HTML，`<iframe>` 引用路径不变）
- `public/ads.txt` → `static/ads.txt`（**内容一字不改**，改动会断掉 AdSense 账号关联）
- `public/robots.txt` → `static/robots.txt`（重写，见 6.2）
- `netlify.toml`（补充安全响应头）
- `LICENSE`、`.editorconfig`、`.prettierrc.js`

### 3.3 目录结构

```
konvajs/
├── docs/                    # Docusaurus 内容目录（276 页）
├── src/
│   ├── components/Ad/       # 自 cornerstone3d-zh 移植
│   ├── config/ads.ts        # 广告配置唯一来源
│   ├── theme/               # swizzle 产物
│   ├── css/custom.css
│   └── pages/index.tsx      # 首页
├── static/                  # assets / downloads / ads.txt / robots.txt / _redirects
├── plugins/                 # llms.txt 生成器、结构化数据注入
├── scripts/check-*.js       # 验收脚本
├── specs/                   # 本设计文档（不在内容目录内，不会被发布）
└── docusaurus.config.ts
```

**规格文档位置说明**：惯例位置为 `docs/superpowers/specs/`，但迁移后 `docs/` 是 Docusaurus 内容目录，置于其下会被当作站点页面构建发布。故改置仓库根 `specs/`。

## 4. 内容对齐

### 4.1 翻译来源

唯一允许的底稿是 `konvajs/site` 仓库 `content/docs/**` 下的**英文** `.md`/`.mdx`。禁止参考 `i18n/zh-Hans/**`（见 1.3）。

### 4.2 Konva 9 → 10 破坏性变更（逐页排查项）

| 变更 | 影响 | 处理 |
|---|---|---|
| CommonJS → ES Modules（10.0.0） | 所有 `require('konva')` 示例失效 | 改为 `import Konva from 'konva'`；CJS 场景注明 `require('konva').default` |
| Node.js 端需显式引入画布后端 | `nodejs` 章节示例失效 | 注明须自行安装并引入 `canvas` 或 `skia-canvas` |
| 文本定位默认值改为对齐 DOM/CSS 标准 | 像素级定位的示例可能偏移 | 逐个复核文本类示例的截图与坐标 |
| CDN 版本号 | 全站引用 `konva@9.3.6`（202 处）与 `konva@4.0.18`（6 处） | 统一改为 `konva@10`，见 §4.2.1 |

#### 4.2.1 CDN 版本采用浮动大版本而非精确版本

站内共 208 处硬编码 Konva 版本。Konva 的发布节奏很密——2026 年 8 月下旬至
9 月中旬一个月内连发 10.3.2、10.3.3、10.4.0、10.5.0、10.6.0 五个版本。
钉死精确版本意味着每隔几周就要批量替换两百多处并重验全部演示，否则文档很快
又显得陈旧；本次改造的起因之一，正是上一轮钉死的 9.3.6 长期无人跟进。

因此统一写成 `https://unpkg.com/konva@10/konva.min.js`，由 unpkg 解析到 10.x
的最新版本。Konva 遵循语义化版本，10.x 内不会有破坏性变更。

**代价与对冲**：若某次 10.x 发布引入回归，演示会跟着坏，而我们不会立刻知道。
对冲手段是演示健康检查（见 §9）——用真实浏览器加载全部演示页，捕获控制台错误
与空画布，纳入 `npm run check`。**没有这道检查就不应采用浮动版本，两者是一套。**

**需补充的新特性**：CSS 滤镜字符串 `node.filters(['blur(10px)'])`（**仍需 `cache()`**，实测确认；全为字符串时走浏览器原生实现）、逐字渲染 `charRenderFunc`、`RegularPolygon` 的 `cornerRadius`、`destroy` 事件（10.4.0）、字素感知文本排版（emoji/连字，10.4.0）。

### 4.3 分批计划

每批为一个可独立上线、可独立验收的 commit。

| 批次 | 内容 | 页数 | 验收 |
|---|---|---|---|
| C1 | 现有 93 页章节内容迁移至 Docusaurus + 对齐 Konva 10.x + 译文校对 | 93 | 全站可构建，97 条 301 命中，HTML 含正文 |
| C2 | `select_and_transform` 13 + 根级 8 + `guides` 2 + `nodejs` 1 | 24 | Transformer 章节可用；本站 4 个根级页归并入官方 8 页 |
| C3 | 既有 12 个章节补齐至官方页数（filters +13、shapes +2、events +2、data_and_serialization +2、styling +1、animations +1、groups_and_layers +1，performance 多出 1 页与官方对账归并） | 21 | 12 个章节页数与官方一致，合计 114 |
| C4 | `react` 19 + `vue` 13 | 32 | Sandpack 演示可运行 |
| C5 | `svelte` 16 + `angular` 12 | 28 | 同上 |
| C6 | `sandbox` 69 + `posts` 9 | 78 | 演示画廊可用 |

**页数对账**：C1 与 C3 共同覆盖 12 个既有章节的官方目标页数 22+17+9+9+9+7+20+6+6+3+4+2 = **114**（其中 93 页为迁移，21 页为新增）。加 C2 的 24、C4 的 32、C5 的 28、C6 的 78，合计 114 + 24 + 32 + 28 + 78 = **276**，与官方页数精确一致。

### 4.4 重复内容对冲（非可选）

因选择全量对齐，每页必须包含官方所无的原创增量，否则该页在搜索引擎眼中即为 `konvajs.org/zh-Hans` 的镜像。每页至少满足以下一项，并作为 C1–C6 各批次的验收条件：

1. **中文开发者踩坑**：该特性在实际使用中的常见错误与排查方法。
2. **国内环境注记**：CDN 可用性、字体加载、移动端浏览器差异。
3. **横向取舍**：与 Fabric.js / PixiJS / 原生 Canvas 在该特性上的对比。

增量段以固定小节标题承载（如 `## 常见问题` / `## 国内环境注意事项`），便于 `scripts/check-originality.js` 机械校验其存在性。

**P3 落地形态**：原创增量以固定三段结构承载——`## 用法`、`## 常见问题`，
以及「国内环境注意事项 / 与其他方案的取舍 / 性能提示」三选一。`## 常见问题` 下用
`### 问句？` 提问，由 `plugins/structuredData.ts` 提取为 FAQPage 结构化数据。
校验见 `test/checks/originality.js`，其生效范围由 `ENFORCED_PREFIXES` 控制，
每完成一个章节就加进来——一次性对全部页面开启会让 CI 立刻全红，真实回归反而被淹没。

注意「特性说明」不算原创增量。P3 实施中发现 `regular-polygon` 页的 `## 圆角`
是对应官方内容的特性说明，不能充当第三类小节，已另补「与其他方案的取舍」。

**这一节同时决定广告收益，不只是 SEO。** P1 实测：迁移后的 97 页中只有 2 页
（`/docs/intro`、`/docs/overview`）满足 `inArticle` 版位的准入门槛，其余 95 页
因为结构是「一段引言 + 一个演示 iframe + 一大段代码」，几乎没有 h2 小节，
既不满足 `minHeadings: 3` 也常常不满足 `minChars: 800`。而正文中部是三个版位里
单次点击价格最高的位置。原创增量段补上后，这些页面才会同时获得搜索价值与该版位的库存。

## 5. 广告体系（需求 2 与需求 4）

### 5.1 移植

自 `cornerstone3d-zh` 移植三个文件，逻辑不作改动：

- `src/components/Ad/AdUnit.tsx`
- `src/components/Ad/InArticleAd.tsx`
- `src/components/Ad/styles.module.css`

### 5.2 配置

`src/config/ads.ts` 为广告配置唯一来源：

```ts
export const AD_CLIENT = 'ca-pub-9580076271637088'   // 不得改动

inArticle     → slot 5362046383   // 站点所有者指定
articleBottom → slot 5362046383
tocSidebar    → slot 5334514048   // 本站既有（原 Sidebar/index.tsx）
```

### 5.3 SPA 换页重载机制（需求 2）

`AdUnit` 以 `key={`${placement}:${pathname}`}` 渲染内层 `AdSlot`。路由变化时 key 变化，React 卸载旧 `<ins>` 并挂载全新节点，AdSense 将其视为从未填充的版位正常处理。

**为何不能重新 push**：AdSense 填充后会给 `<ins>` 打上 `data-adsbygoogle-status="done"` 并永久拒绝复用，对其再次 push 会抛 `All ins elements in the DOM with class=adsbygoogle already have ads in them`。必须更换节点。

**政策边界**：AdSense 版位政策禁止在用户未主动请求的情况下刷新页面或页面元素。此处重建由读者点击链接的导航触发，属用户主动行为。**因此 `src/components/Ad/` 下不得出现任何基于 `setInterval` / `setTimeout` 的刷新逻辑**，由 `scripts/check-ads.js` 机械禁止。

### 5.4 随移植继承的既有行为

- CLS 预留高度（`minHeight`，Core Web Vitals 直接影响排名与广告可见性评分）
- `data-ad-status="unfilled"` 时收起整个区块，避免留下空白框
- 「广告」标识与上边框分隔线（AdSense 要求广告与正文明确区分，防误点击被判无效流量）
- 正文内广告准入门槛：正文 < 800 字符或 h2 < 3 个则不投（合规 + 体验）
- 窄屏（≤996px）不显示侧栏广告
- SSR 阶段渲染等高占位符，避免 hydration 不匹配

### 5.5 挂载点

| 版位 | 挂载 |
|---|---|
| `inArticle` | swizzle `DocItem/Content`，经 `InArticleAd` 以 portal 插入第 3 个 h2 之前 |
| `articleBottom` | swizzle `DocItem/Content`，正文末尾、翻页器之前 |
| `tocSidebar` | swizzle `DocItem/TOC/Desktop`，目录下方 |
| 首页 | `src/pages/index.tsx` 底部，复用 `articleBottom` |

`AD_EXCLUDED_PATH_PREFIXES` 初始为空（本站无贡献者文档）。

## 6. SEO / GEO

### 6.1 渲染（最大收益项）

Docusaurus 默认 SSG。验收标准为机械可判定：

```
grep -q '矩形' build/docs/shapes/rect/index.html
```

并断言页面字节数 > 5000（当前为 630）。

### 6.2 robots.txt

除保留通配规则外，为下列 UA 显式 `Allow: /`，并声明 `llms.txt` 位置：

| UA | 归属 |
|---|---|
| `GPTBot`、`OAI-SearchBot`、`ChatGPT-User` | OpenAI 训练 / 搜索 / 即时抓取 |
| `ClaudeBot`、`Claude-Web`、`Claude-SearchBot`、`anthropic-ai` | Anthropic |
| `PerplexityBot`、`Perplexity-User` | Perplexity |
| `Google-Extended` | Gemini 与 AI Overviews 引用池 |
| `Applebot-Extended` | Apple Intelligence |
| `Bytespider` | 字节（豆包 / 头条搜索） |
| `Amazonbot`、`Meta-ExternalAgent`、`cohere-ai`、`YouBot`、`Diffbot` | 其他 |

`Google-Extended` 未放行则不进入 AI Overviews 引用池。这是零风险的纯配置动作。

### 6.3 llms.txt

新增 `plugins/llms-txt/`，构建后产出：

- `/llms.txt`：站点定位段 + 按章节分组的页面清单（`- [标题](绝对 URL)：description`）
- `/llms-full.txt`：核心页面完整 Markdown 正文（由 front matter `llms_full: true` 标记，C1 覆盖 shapes + select_and_transform + performance 约 45 页）

生成器读取 Docusaurus 的 `allContent`，无外部依赖。

### 6.4 结构化数据

| 类型 | 应用范围 |
|---|---|
| `TechArticle` | 全部文档页 |
| `BreadcrumbList` | 全部文档页 |
| `WebSite` + `Organization` | 首页 |
| `SoftwareSourceCode` | 含代码示例的页面 |
| `FAQPage` | `faq` 页与含 `## 常见问题` 的页面 |

以 Docusaurus 插件在 SSG 阶段注入 `<script type="application/ld+json">`，确保出现在静态 HTML 中。

### 6.5 其他

| 项 | 措施 |
|---|---|
| canonical | 由 Docusaurus `url` + `baseUrl` 统一生成，问题 4 的双斜杠自然消失 |
| sitemap | `@docusaurus/plugin-sitemap`，启用 `lastmod`，`changefreq: weekly` |
| 每页 meta | title / description 逐页撰写，禁止使用站点默认值兜底 |
| 安全响应头 | `netlify.toml` 补 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`、`Permissions-Policy` |
| 分析 | GA4 + Google Search Console + 百度站长验证 |

### 6.6 待站点所有者提供的凭据

以下三项以 `docusaurus.config.ts` 中的具名常量占位，代码完整可构建，拿到真值后仅改常量，不阻塞任何批次：

- `GA4_MEASUREMENT_ID`（`G-XXXXXXXXXX`）
- `GSC_VERIFICATION_TOKEN`
- `BAIDU_VERIFICATION_TOKEN`（可选）

占位期间 `scripts/check-seo.js` 输出警告但不失败；三项齐备后转为硬失败。

## 7. URL 与 301

### 7.1 新结构

`/docs/<章节>/<页面>`，全小写短横线，章节名镜像官方目录名。

### 7.2 映射表

下表 97 条由脚本自当前线上 `dist/sitemap.xml` 与 `docs/**/*.md` 生成，并**经逐条比对验证：97/97 全部命中线上 sitemap，新 URL 无重复**。写入 `static/_redirects`，格式 `<旧> <新> 301!`。

| 旧 URL | 新 URL |
|---|---|
| `/` | `/` |
| `/guides` | `/docs/overview` |
| `/guides/animations/create_an_-animation` | `/docs/animations/create-an-animation` |
| `/guides/animations/moving` | `/docs/animations/moving` |
| `/guides/animations/rotation` | `/docs/animations/rotation` |
| `/guides/animations/scaling` | `/docs/animations/scaling` |
| `/guides/animations/stop_-animation` | `/docs/animations/stop-animation` |
| `/guides/clipping/clipping_-function` | `/docs/clipping/clipping-function` |
| `/guides/clipping/clipping_-regions` | `/docs/clipping/clipping-regions` |
| `/guides/data_and_serialization/complex_-load` | `/docs/data-and-serialization/complex-load` |
| `/guides/data_and_serialization/serialize_a_-stage` | `/docs/data-and-serialization/serialize-a-stage` |
| `/guides/data_and_serialization/simple_-load` | `/docs/data-and-serialization/simple-load` |
| `/guides/data_and_serialization/stage_-data_-url` | `/docs/data-and-serialization/stage-data-url` |
| `/guides/drag_and_drop/complex_-drag_and_-drop` | `/docs/drag-and-drop/complex-drag-and-drop` |
| `/guides/drag_and_drop/drag_-events` | `/docs/drag-and-drop/drag-events` |
| `/guides/drag_and_drop/drag_a_-group` | `/docs/drag-and-drop/drag-a-group` |
| `/guides/drag_and_drop/drag_a_-line` | `/docs/drag-and-drop/drag-a-line` |
| `/guides/drag_and_drop/drag_a_-stage` | `/docs/drag-and-drop/drag-a-stage` |
| `/guides/drag_and_drop/drag_an_-image` | `/docs/drag-and-drop/drag-an-image` |
| `/guides/drag_and_drop/drag_and_-drop` | `/docs/drag-and-drop` |
| `/guides/drag_and_drop/drop_-events` | `/docs/drag-and-drop/drop-events` |
| `/guides/drag_and_drop/simple_-drag_-bounds` | `/docs/drag-and-drop/simple-drag-bounds` |
| `/guides/events/binding_-events` | `/docs/events/binding-events` |
| `/guides/events/cancel_-propagation` | `/docs/events/cancel-propagation` |
| `/guides/events/custom_-hit_-region` | `/docs/events/custom-hit-region` |
| `/guides/events/desktop_and_-mobile` | `/docs/events/desktop-and-mobile` |
| `/guides/events/event_-delegation` | `/docs/events/event-delegation` |
| `/guides/events/fire_-events` | `/docs/events/fire-events` |
| `/guides/events/image_-events` | `/docs/events/image-events` |
| `/guides/events/keyboard_-events` | `/docs/events/keyboard-events` |
| `/guides/events/listen_for_-events` | `/docs/events/listen-for-events` |
| `/guides/events/mobile_-events` | `/docs/events/mobile-events` |
| `/guides/events/mobile_-scrolling` | `/docs/events/mobile-scrolling` |
| `/guides/events/multi_-event` | `/docs/events/multi-event` |
| `/guides/events/remove_-event` | `/docs/events/remove-event` |
| `/guides/events/remove_by_-name` | `/docs/events/remove-by-name` |
| `/guides/events/stage_-events` | `/docs/events/stage-events` |
| `/guides/filters/blur` | `/docs/filters/blur` |
| `/guides/filters/brighten` | `/docs/filters/brighten` |
| `/guides/filters/grayscale` | `/docs/filters/grayscale` |
| `/guides/filters/invert` | `/docs/filters/invert` |
| `/guides/filters/kaleidoscope` | `/docs/filters/kaleidoscope` |
| `/guides/filters/multiple_-filters` | `/docs/filters/multiple-filters` |
| `/guides/filters/rgba` | `/docs/filters/rgba` |
| `/guides/groups_and_layers/change_-containers` | `/docs/groups-and-layers/change-containers` |
| `/guides/groups_and_layers/groups` | `/docs/groups-and-layers/groups` |
| `/guides/groups_and_layers/layering` | `/docs/groups-and-layers/layering` |
| `/guides/performance/all_-performance_-tips` | `/docs/performance/all-performance-tips` |
| `/guides/performance/avoid_-memory_-leaks` | `/docs/performance/avoid-memory-leaks` |
| `/guides/performance/batch_-draw` | `/docs/performance/batch-draw` |
| `/guides/performance/disable_-perfect_-draw` | `/docs/performance/disable-perfect-draw` |
| `/guides/performance/layer_-management` | `/docs/performance/layer-management` |
| `/guides/performance/listening_-false` | `/docs/performance/listening-false` |
| `/guides/performance/optimize_-animation` | `/docs/performance/optimize-animation` |
| `/guides/performance/optimize_-strokes` | `/docs/performance/optimize-strokes` |
| `/guides/performance/shape_-caching` | `/docs/performance/shape-caching` |
| `/guides/performance/shape_-redraw` | `/docs/performance/shape-redraw` |
| `/guides/selectors/select_by_-name` | `/docs/selectors/select-by-name` |
| `/guides/selectors/select_by_-type` | `/docs/selectors/select-by-type` |
| `/guides/selectors/select_by_id` | `/docs/selectors/select-by-id` |
| `/guides/shapes/arc` | `/docs/shapes/arc` |
| `/guides/shapes/arrow` | `/docs/shapes/arrow` |
| `/guides/shapes/circle` | `/docs/shapes/circle` |
| `/guides/shapes/custom` | `/docs/shapes/custom` |
| `/guides/shapes/ellipse` | `/docs/shapes/ellipse` |
| `/guides/shapes/image` | `/docs/shapes/image` |
| `/guides/shapes/label` | `/docs/shapes/label` |
| `/guides/shapes/line_-_-blob` | `/docs/shapes/line-blob` |
| `/guides/shapes/line_-_-polygon` | `/docs/shapes/line-polygon` |
| `/guides/shapes/line_-_-simple_-line` | `/docs/shapes/line-simple-line` |
| `/guides/shapes/line_-_-spline` | `/docs/shapes/line-spline` |
| `/guides/shapes/path` | `/docs/shapes/path` |
| `/guides/shapes/rect` | `/docs/shapes/rect` |
| `/guides/shapes/regular-polygon` | `/docs/shapes/regular-polygon` |
| `/guides/shapes/ring` | `/docs/shapes/ring` |
| `/guides/shapes/sprite` | `/docs/shapes/sprite` |
| `/guides/shapes/star` | `/docs/shapes/star` |
| `/guides/shapes/text` | `/docs/shapes/text` |
| `/guides/shapes/text-path` | `/docs/shapes/text-path` |
| `/guides/shapes/wedge` | `/docs/shapes/wedge` |
| `/guides/styling/blend_-mode` | `/docs/styling/blend-mode` |
| `/guides/styling/fill` | `/docs/styling/fill` |
| `/guides/styling/hide_and_-show` | `/docs/styling/hide-and-show` |
| `/guides/styling/line_-join` | `/docs/styling/line-join` |
| `/guides/styling/mouse_-cursor` | `/docs/styling/mouse-cursor` |
| `/guides/styling/opacity` | `/docs/styling/opacity` |
| `/guides/styling/shadow` | `/docs/styling/shadow` |
| `/guides/styling/stroke` | `/docs/styling/stroke` |
| `/guides/tweens/all_-controls` | `/docs/tweens/all-controls` |
| `/guides/tweens/all_-easings` | `/docs/tweens/all-easings` |
| `/guides/tweens/common_-easings` | `/docs/tweens/common-easings` |
| `/guides/tweens/complex_-tweening` | `/docs/tweens/complex-tweening` |
| `/guides/tweens/finish_-event` | `/docs/tweens/finish-event` |
| `/guides/tweens/linear_-easing` | `/docs/tweens/linear-easing` |
| `/guides/tweens/tween_-filter` | `/docs/tweens/tween-filter` |
| `/help` | `/docs/support` |
| `/start` | `/docs/intro` |

### 7.2.1 实施期发现的一处目标调整

`drag_and_drop/Drag_and_Drop.md` 的文件名与其所在目录同名，Docusaurus 将其
视为该目录的索引页，路由为 `/docs/drag-and-drop` 而非 `/docs/drag-and-drop/drag-and-drop`。

保留这一行为而非用 `slug` 强制改回：该页本就是拖放章节的入门页，
`/docs/drag-and-drop` 是更准确也更简短的地址。上表该行已按实际路由更新。

### 7.2.2 P2 新增页面

`/docs/filters/css-filters` 为 P2 新增，没有对应的旧 URL，不进 301 映射表。
§7.2 的 96 条对应的是迁移前线上已被收录的页面，该集合不会再增长；
后续新增页面只进 sitemap 与 llms.txt，不进重定向表。

### 7.3 同时修正

`static/_redirects` 既有的 `https://konvajs.netlify.app/*` 规则目标域名拼写错误（`front-end-js.tops` → `front-end-js.top`）。

## 8. 依赖与安全（需求 3）

全新依赖树，锁定版本与 `cornerstone3d-zh` 对齐：

```
@docusaurus/core 3.10.2   @docusaurus/preset-classic 3.10.2
react 19.3.x              react-dom 19.3.x
@codesandbox/sandpack-react ^2.20.0
typescript ~5.9.3         Node >= 20
```

**验收**：`npm audit --audit-level=moderate` 退出码为 0（0 高危 0 中危），并入 `npm run check`。

## 9. 验收脚本

全部并入 `npm run check`，CI 阻断。

| 脚本 | 断言 |
|---|---|
| `check-ssg.js` | 每个 HTML > 5000 字节且含中文正文；无 630 字节空壳 |
| `check-seo.js` | canonical 唯一、绝对、无双斜杠；每页 title/description 非空且非默认值 |
| `check-redirects.js` | 97 条旧 URL 在 `_redirects` 中均有 301；目标 URL 在构建产物中存在 |
| `check-ads.js` | `AD_CLIENT` 未被改动；`src/components/Ad/` 无 `setInterval`/`setTimeout`；每个 placement 有 `minHeight` |
| `check-originality.js` | 每页含 4.4 规定的原创增量小节之一 |
| `check-sitemap.js` | 条目数与文档页数一致；全部含 `lastmod` |
| `check-llms.js` | `llms.txt` 非空且条目数与页面数一致 |
| `check-demos.js` | 每个 iframe 指向的演示文件存在，且页面名与演示名一致 |
| `check-konva-version.js` | 全站无 `konva@9` / `konva@4` 残留，统一为 `konva@10` |
| `check-demo-health.js` | 真实浏览器加载全部演示页，无控制台错误、画布非空。这是采用浮动大版本的前提，见 §4.2.1 |
| `npm audit` | 0 高危 0 中危 |

## 10. 风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 周期 | 276 页独立翻译 + 整站迁移，工作量远超单次会话 | C1–C6 分批，每批可独立上线 |
| 排名波动 | 全量 301 后 2–4 周排名震荡，属 301 正常表现 | 映射表已 97/97 验证，杜绝映射错误导致的永久损失 |
| 与官方竞争 | 站点所有者已知悉并决定接受 | 4.4 原创增量段，机械校验 |
| Sandpack 体积 | 实时代码显著增加页面 JS，可能拖累 LCP | 懒加载；C1 完成后实测 Core Web Vitals，超标则降级为静态代码块 |
| 无流量基线 | 当前无 GA/GSC，不知哪些页面在带量 | C1 优先接入 GA4 + GSC，为后续决策建立基线 |

## 11. 实施顺序

1. **P0 基建**：Docusaurus 骨架、依赖、`_redirects`、robots.txt、GA4/GSC、验收脚本
2. **P1 广告**：`src/config/ads.ts` + `src/components/Ad/` + swizzle 挂载（需求 2、4 完成）
3. **P2 内容 C1**：97 页迁移 + 10.5.0 对齐（需求 1 第一批，此时可上线）
4. **P3 GEO**：llms.txt、结构化数据（需求 5 完成）
5. **P4 内容 C2–C6**：179 页增量
