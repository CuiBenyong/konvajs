# 其余 77 页原创增量 实施计划（P5）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 shapes 与 select-and-transform 之外的 77 页全部改造为三段结构并补上原创增量，使全站 110 页都具备独立搜索价值与正文内广告位库存。

**Architecture:** 沿用 P3 确立、P4 验证过的页面结构：`## 用法` / `## 常见问题`（下含 `### 问句？`）/ 「国内环境注意事项 · 与其他方案的取舍 · 性能提示」三选一。改造完一个章节就把它加进 `test/checks/originality.js` 的 `ENFORCED_PREFIXES`，让 CI 守住已完成的部分，同时不被未开工的页面淹没。FAQPage 结构化数据由既有插件自动产出，无需额外工作。

**Tech Stack:** Docusaurus 3.10.2、Konva 10.x、Node ≥ 20

**Spec:** `specs/2026-09-18-konvajs-site-overhaul-design.md`（§4.4）

**前置：** P1–P4 已完成并合入 main。

## Global Constraints

- **禁止参考 `konvajs/site` 仓库的 `i18n/zh-Hans/**`**（`license: null`，保留所有权利）。
- **原创段落必须是官方英文站没有的内容。** 翻译官方正文不算原创——那正是判重风险的来源。可写的是中文开发者实际会踩的坑、国内环境注记、与其他方案的横向取舍。
- **每页至少三个 `## ` 小节**，其中必有 `## 常见问题`。这不只是 SEO：三个 h2 是 `IN_ARTICLE_RULES.minHeadings` 的门槛，少于此该页拿不到正文内广告位。
- **每个原创小节的散文不少于 150 字**（`MIN_SECTION_CHARS`）。字数不够时补内容，**不得放宽校验器**。
- **`### ` 问句必须以问号结尾**，FAQPage 提取依赖这一点。
- **不改动演示 HTML 与代码块。** 本计划只动散文，`## 用法` 之前的正文、iframe、代码块原样保留。改演示属 P2 范畴。
- **`src/config/ads.ts` 的 `AD_CLIENT` 与 `static/ads.txt` 不得改动。**
- 每个 Task 结束时把对应目录加入 `ENFORCED_PREFIXES` 并确认 `npm run check` 全绿。

---

## 改造手法

P3 用过的脚本化改造仍然适用：把原有正文（开头到 `<iframe>` 之前）包进 `## 用法`，
再追加两个小节。已有 h2 的页面（如 `keyboard-events`、`avoid-memory-leaks`、
`css-filters`、`complex-tweening`）保留原有小节，只补缺的部分。

每页写作前先读一遍该页现有内容，确认要点与实际讲的东西对得上——
P3 就发现过「圆角」这类特性说明被误当成原创增量的情况。

---

## Task 1: events 章节 15 页

事件是本章节技术含量最高的部分，也最容易写出官方没有的内容。

**Files:** `docs/events/*.md`（15 个）、`test/checks/originality.js`

**Interfaces:** Consumes P3 的结构标准；Produces 15 页合规内容

- [ ] **Step 1: 逐页改造**

各页要点（**必须覆盖的事实**，行文自行组织）：

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `binding-events` | ① `on()` 可一次绑多个事件类型，空格分隔；② 事件对象的 `e.target` 是实际被点的图形、`e.currentTarget` 是绑定者；③ Konva 的 `mouseenter`/`mouseleave` 不冒泡，`mouseover`/`mouseout` 会 | 与其他方案的取舍：绑在图形上 vs 绑在图层上做委托 |
| `cancel-propagation` | ① `e.cancelBubble = true` 是赋值不是调用；② 它只阻止 Konva 内部冒泡，不影响原生 DOM 事件，要拦原生用 `e.evt.stopPropagation()`；③ 舞台上的 `content*` 事件不参与图形冒泡链 | 与其他方案的取舍：cancelBubble vs 在处理器里判断 `e.target` |
| `custom-hit-region` | ① `hitFunc` 里也必须调 `context.fillStrokeShape(shape)`；② 命中图是独立画布，颜色不影响视觉；③ 命中区域可以比视觉图形简单得多，这正是性能优化点 | 性能提示：简化命中区域、对复杂图形用矩形近似 |
| `desktop-and-mobile` | ① 事件对可写在同一个字符串里；② `tap` 与 `click` 在触屏上都会触发，绑两个会执行两次；③ 移动端有 300ms 点击延迟的历史问题，现代浏览器已靠 viewport 设置消除 | 国内环境注意事项：微信内置浏览器的手势拦截与双击缩放 |
| `event-delegation` | ① 委托靠 `e.target` 区分来源；② 用 `name` 而非 `id` 做分类标记，`find('.name')` 可批量；③ 图层上的委托收不到空白处点击 | 性能提示：委托显著减少监听器数量 |
| `fire-events` | ① `fire()` 默认不冒泡，第三参数传 `true` 才冒泡；② 可触发自定义事件名，用于组件间通信；③ `fire()` 不会产生真实的 `e.evt`，依赖 `e.evt` 的处理器会拿到 `undefined` | 与其他方案的取舍：`fire()` vs 直接调用函数 |
| `image-events` | ① 默认整个图片矩形都可点，含透明像素；② `drawHitFromCache()` 让透明区域不响应；③ 它依赖读取像素，跨域图片会让这一步失败 | 国内环境注意事项：图床 CORS 缺失导致 `drawHitFromCache` 失败 |
| `keyboard-events`（已有 1 个 h2） | ① Canvas 本身不接收键盘焦点，要给容器设 `tabIndex`；② 事件绑在容器或 `window` 上，不是 Konva 节点上；③ 要做「选中图形后按 Delete 删除」需自己维护选中态 | 与其他方案的取舍：绑容器 vs 绑 window 的作用域差别 |
| `listen-for-events` | ① `listening(false)` 后该节点及其子节点都不响应；② 改动后需要重绘命中图才生效；③ 与 `visible(false)` 的区别——后者连画都不画 | 性能提示：大量装饰性图形关掉监听的收益 |
| `mobile-events` | ① 触摸事件对象里是 `e.evt.touches`，多指时长度大于 1；② `tap` 有轻微延迟，追求即时反馈用 `touchstart`；③ 触摸点坐标要用 `stage.getPointerPosition()` 而非直接读 touch 坐标 | 国内环境注意事项：国产浏览器的触摸事件差异与手势冲突 |
| `mobile-scrolling` | ① Konva 默认阻止指针默认行为以防误滚动；② `preventDefault: false` 可放行，但拖拽图形时页面也会跟着滚；③ 常见折中是只对不可拖拽的图形放行 | 国内环境注意事项：微信与 UC 的下拉刷新会抢走垂直手势 |
| `multi-event` | ① 空格分隔的多事件共用一个处理器；② 可与命名空间组合，如 `'click.menu dblclick.menu'`；③ 解绑时按命名空间一次性移除 | 与其他方案的取舍：多事件绑一个处理器 vs 分别绑定 |
| `remove-by-name` | ① 命名空间写法是 `事件名.命名空间`；② `off('.ns')` 移除该命名空间下所有事件；③ 组件卸载时用命名空间批量清理，避免内存泄漏 | 性能提示：未解绑的监听器导致节点无法被回收 |
| `remove-event` | ① `off('click')` 移除该类型全部处理器，无法只移除其中一个匿名函数；② 要精确移除必须用命名空间；③ `destroy()` 会自动清理该节点的监听器 | 与其他方案的取舍：`off` vs 命名空间 vs `destroy` |
| `stage-events` | ① 空白处点击不触发图形事件；② 两种方案——铺透明矩形或监听 `content*` 事件；③ `content*` 事件不参与冒泡，拿不到 `e.target` | 与其他方案的取舍：透明矩形 vs content 事件的适用场景 |

- [ ] **Step 2: 启用校验**

`test/checks/originality.js` 的 `ENFORCED_PREFIXES` 追加 `'docs/events/'`。

- [ ] **Step 3: 验证**

Run: `npm run build && node test/verify.js`
Expected: 全部 PASS。若某页字数不足，补内容而非放宽阈值。

- [ ] **Step 4: 提交**

```bash
git add docs/events test/checks/originality.js
git commit -m "docs: events 章节 15 页补原创增量段"
```

---

## Task 2: performance 章节 10 页

**Files:** `docs/performance/*.md`（10 个）、`test/checks/originality.js`

- [ ] **Step 1: 逐页改造**

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `all-performance-tips` | ① 优化前先测量，不要凭感觉；② 节点数量通常是首要瓶颈，其次才是单个节点的绘制成本；③ 缓存不是万能的——频繁变化的节点缓存反而更慢 | 与其他方案的取舍：分层 vs 缓存 vs 减少节点，各自的适用信号 |
| `avoid-memory-leaks`（已有 1 个 h2） | ① `remove()` 与 `destroy()` 的区别；② 未解绑的事件监听器会让节点无法回收；③ 缓存的位图占内存，`clearCache()` 要配套调用 | 性能提示：长时间运行的应用如何定期清理 |
| `batch-draw` | ① `batchDraw()` 把多次调用合并到下一帧；② Konva 10 默认开启自动重绘，多数情况下手动调用已无必要；③ 关掉 `Konva.autoDrawEnabled` 后才需要自己管重绘 | 与其他方案的取舍：自动重绘 vs 手动 batchDraw |
| `disable-perfect-draw` | ① 它解决的是描边与填充交叠处的色差；② 纯填充或纯描边的图形关掉是净收益；③ 关掉后半透明描边会露出底下的填充边缘 | 性能提示：什么图形适合关、关掉能省多少 |
| `layer-management` | ① 每个 Layer 是一个独立 canvas，图层多了内存也涨；② 常见做法是静态背景一层、交互内容一层；③ 图层数量建议控制在个位数 | 性能提示：图层拆分的收益与代价平衡点 |
| `listening-false` | ① 关掉监听的节点不进命中图，绘制命中图的开销随之消失；② 容器上设置会影响全部子节点；③ 改动后要重绘命中图 | 与其他方案的取舍：`listening(false)` vs 简化 `hitFunc` |
| `optimize-animation` | ① 动画函数里 `return false` 可跳过该帧的图层更新；② 动画应只挂在真正变化的图层上；③ 不变的帧仍然在调用回调，逻辑本身也要轻 | 性能提示：帧内计算搬到帧外、避免每帧创建对象 |
| `optimize-strokes` | ① `strokeHitEnabled(false)` 把描边移出命中检测；② 细描边对命中判定影响很小，粗描边则不能关；③ 与 `perfectDrawEnabled` 是两件事 | 与其他方案的取舍：关描边命中 vs 自定义 hitFunc |
| `shape-caching` | ① `cache()` 把节点渲染成位图，之后只贴图；② 缓存有分辨率，缩放后会糊，要用 `pixelRatio` 或重新缓存；③ 变化频繁的节点不该缓存 | 性能提示：缓存的内存代价与失效时机 |
| `shape-redraw` | ① `shape.draw()` 只画自己，画在当前画布之上；② 节点被遮挡或有透明度时结果不对；③ 多数场景应该用 `layer.draw()` | 与其他方案的取舍：单节点重绘的适用边界 |

- [ ] **Step 2–4**: 同 Task 1（追加 `'docs/performance/'`、验证、提交）

---

## Task 3: drag-and-drop 章节 9 页

**Files:** `docs/drag-and-drop/*.md`（9 个）、`test/checks/originality.js`

- [ ] **Step 1: 逐页改造**

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `drag-and-drop` | ① `draggable` 可在实例化时设也可用方法设；② 拖拽改的是 `x`/`y`，不影响 `offset`；③ 父容器可拖时子节点拖拽会同时生效，需用 `e.cancelBubble` 区分 | 与其他方案的取舍：节点拖拽 vs 舞台拖拽的场景差别 |
| `drag-events` | ① 三个事件同样绑在被拖节点上；② `dragmove` 高频触发，重活放 `dragend`；③ `dragstart` 里可以调 `stopDrag()` 取消本次拖拽 | 性能提示：`dragmove` 里避免触发框架状态更新 |
| `drag-a-group` | ① 拖分组时子节点的相对位置不变；② 分组与子节点都可拖时会冲突；③ 分组的包围盒随子节点变化，拖拽边界要动态算 | 与其他方案的取舍：拖分组 vs 批量拖多个节点 |
| `drag-a-line` | ① 线条整体拖拽改的是 `x`/`y`，`points` 不变；② 想拖单个顶点要给每个点加锚点图形；③ 线的命中区域只有描边附近，细线很难点中 | 与其他方案的取舍：整体拖 vs 顶点编辑，以及 `hitStrokeWidth` 的作用 |
| `drag-a-stage` | ① 拖舞台等于平移整个视图；② 舞台可拖时图形自身的拖拽仍然生效；③ 常见做法是按住空格或中键才允许拖舞台 | 性能提示：舞台拖拽会重绘所有图层 |
| `drag-an-image` | ① 与其他图形无差别，`draggable` 即可；② 图片未加载完时包围盒为 0，拖不动；③ 大图拖拽时考虑先 `cache()` | 国内环境注意事项：大图从国内 CDN 加载慢导致的交互空窗 |
| `simple-drag-bounds` | ① `dragBoundFunc` 收到并返回**绝对坐标**；② 它不能改变拖拽是否发生，只能改落点；③ 有父容器变换时绝对坐标与节点坐标不同 | 性能提示：回调每帧触发，边界值提前算好 |
| `complex-drag-and-drop` | ① 圆形边界用极坐标换算；② 多个约束叠加时注意顺序；③ 约束到其他图形边缘要先收集候选坐标 | 性能提示：复杂边界计算的缓存策略 |
| `drop-events` | ① Konva 没有内置 drop，要自己实现；② 被拖对象必须移到单独图层，否则它会挡住自己下方的命中检测；③ 用 `getIntersection()` 找放置目标 | 与其他方案的取舍：命中检测 vs 包围盒相交，精度与性能的取舍 |

- [ ] **Step 2–4**: 同 Task 1（追加 `'docs/drag-and-drop/'`、验证、提交）

---

## Task 4: styling 8 页与 filters 8 页

**Files:** `docs/styling/*.md`、`docs/filters/*.md`、`test/checks/originality.js`

- [ ] **Step 1: styling 逐页改造**

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `fill` | ① 渐变的坐标是相对图形自身的；② `fillPriority` 决定同时设了多种填充时用哪个；③ 图案填充需要图片加载完成 | 与其他方案的取舍：渐变 vs 图案 vs 纯色的性能差别 |
| `stroke` | ① 描边向两侧各画一半；② `strokeWidth: 0` 与不设 `stroke` 效果相同但前者仍有开销；③ `hitStrokeWidth` 可单独放大描边的命中范围 | 性能提示：描边对命中图与 perfectDraw 的影响 |
| `shadow` | ① 阴影是 Canvas 上最贵的操作之一；② `shadowForStrokeEnabled` 可关掉描边阴影；③ 阴影会扩大 `getClientRect()` | 性能提示：静态阴影应缓存，动态阴影考虑用图片替代 |
| `opacity` | ① 节点透明度与容器透明度相乘；② 半透明重叠区域会叠加变深；③ `opacity: 0` 仍然参与命中检测 | 与其他方案的取舍：`opacity` vs `visible` vs `listening` |
| `hide-and-show` | ① `visible(false)` 不绘制也不响应事件；② 与 `opacity(0)` 的区别；③ 隐藏容器会隐藏全部子节点 | 性能提示：隐藏 vs 移除，哪种更省 |
| `line-join` | ① 三种取值的视觉差别；② `miter` 在锐角处会伸出很长，`miterLimit` 可限制；③ 只对折线的拐角生效，单段直线看不出区别 | 与其他方案的取舍：`lineJoin` 与 `lineCap` 的分工 |
| `blend-mode` | ① 混合模式作用于图形与其下方已绘制内容；② 图层是独立画布，跨图层的混合不生效；③ 部分模式在不同浏览器上有细微差异 | 与其他方案的取舍：混合模式 vs 半透明叠加 |
| `mouse-cursor` | ① 改的是舞台容器的 CSS cursor，不是 Konva 属性；② 离开图形时要恢复，否则光标会卡住；③ 拖拽过程中光标由浏览器接管 | 国内环境注意事项：触屏设备没有悬停态，需提供替代反馈 |

- [ ] **Step 2: filters 逐页改造**

`css-filters` 已有 4 个 h2，只需补 `## 常见问题`。其余 7 页按下表：

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `blur` | ① 必须先 `cache()`；② `blurRadius` 超过 180 会被截断（Konva 10.4.0 修复了大半径产生空图的问题）；③ 模糊会让边缘超出原包围盒 | 性能提示：大半径模糊的开销与 CSS 滤镜的替代 |
| `brighten` | ① `brightness` 取值范围与方向；② 过亮会丢失高光细节且不可逆；③ 与 `Contrast` 滤镜配合使用 | 与其他方案的取舍：`Brighten` vs CSS `brightness()` |
| `grayscale` | ① 无参数滤镜；② 灰度公式采用人眼亮度加权，不是简单平均；③ 与 `Sepia` 的区别 | 与其他方案的取舍：滤镜灰度 vs 直接用灰度图片资源 |
| `invert` | ① 无参数；② 只反转 RGB 不动 Alpha；③ 连续两次反转回到原图 | 与其他方案的取舍：反相 vs 混合模式 `difference` |
| `kaleidoscope` | ① 两个参数的含义；② 它是 CSS 滤镜没有的效果，只能用 Konva.Filters；③ 计算量大，静态场景应缓存后复用 | 性能提示：万花筒的逐像素开销 |
| `multiple-filters` | ① `filters` 数组按顺序作用；② 顺序不同结果不同；③ 混入一个函数式滤镜会让整组退回逐像素路径 | 性能提示：滤镜链的顺序对性能的影响 |
| `rgba` | ① 四个分量的取值范围；② 它是在原像素上做加权而非替换；③ Alpha 分量与节点 `opacity` 的区别 | 与其他方案的取舍：RGBA 滤镜 vs 直接改 `fill` |
| `css-filters`（补 FAQ） | ① 已在正文讲清需要 cache()，FAQ 补：如何判断走没走原生路径；② 混用字符串与函数的后果；③ 不支持的 CSS 滤镜在兜底模式下的行为 | （已有第三小节） |

- [ ] **Step 3–5**: 追加 `'docs/styling/'` 与 `'docs/filters/'`、验证、提交

---

## Task 5: tweens 7 页与 animations 5 页

**Files:** `docs/tweens/*.md`、`docs/animations/*.md`、`test/checks/originality.js`

- [ ] **Step 1: tweens 逐页改造**

`complex-tweening` 已有 2 个 h2，补 `## 常见问题` 即可。

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `linear-easing` | ① 只能补间数值型属性；② 同一节点同时有两个 Tween 改同一属性会打架；③ `node.to()` 是创建一次性 Tween 的快捷写法，Konva 10.4.0 起它会返回 tween 对象 | 与其他方案的取舍：`Tween` vs `Animation` 的选择依据 |
| `common-easings` | ① 缓动函数只影响进度曲线不影响时长；② `EaseInOut` 两头慢中间快，适合位移；③ 缓动选择对感知流畅度的影响 | 与其他方案的取舍：内置缓动 vs 自定义函数 |
| `all-easings` | ① 弹性与回弹类缓动会超出目标值；② 超出意味着中间帧的属性值可能为负；③ 对尺寸、透明度这类有取值范围的属性要当心 | 与其他方案的取舍：哪些属性不适合用弹性缓动 |
| `all-controls` | ① `pause()` 后 `play()` 从暂停处继续；② `reverse()` 与重新创建反向 Tween 的区别；③ Konva 10.4.0 修复了在 `onUpdate` 里调用 `pause()`/`destroy()` 导致动画重启的问题 | 性能提示：大量 Tween 同时运行的开销 |
| `finish-event` | ① `onFinish` 在动画自然结束时触发，`finish()` 手动结束也会触发；② 串联多段动画时记得 `destroy()` 前一段；③ 回调里创建新 Tween 要注意递归 | 与其他方案的取舍：`onFinish` 串联 vs 时间轴库 |
| `tween-filter` | ① 补间滤镜参数前节点必须已 `cache()`；② 每帧重新应用滤镜开销很大；③ CSS 滤镜字符串无法补间，只能补间数值参数 | 性能提示：滤镜补间的成本与降级方案 |
| `complex-tweening`（补 FAQ） | ① 为什么渐变色标要用 Animation 而非 Tween；② 多段动画的清理时机；③ 重复触发时如何避免动画叠加 | （已有第三小节） |

- [ ] **Step 2: animations 逐页改造**

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `create-an-animation` | ① 必须 `start()` 才会运行；② `frame.timeDiff` 是与上一帧的间隔，用它做与帧率无关的动画；③ 不传图层时 Konva 不知道该重绘哪层 | 性能提示：动画只挂在变化的图层上 |
| `moving` | ① 用 `timeDiff` 而非固定增量，否则不同帧率下速度不同；② 累加误差问题，长时间运行后位置会漂移；③ 边界反弹的判断时机 | 与其他方案的取舍：`Animation` vs `Tween` 做位移 |
| `rotation` | ① 旋转中心由 `offset` 决定；② 角度累加到很大时浮点精度下降，应取模；③ 绕外部点旋转要配合分组 | 与其他方案的取舍：改 `rotation` vs 用分组做公转 |
| `scaling` | ① 缩放同时作用于描边与阴影；② 从 0 开始缩放时某些图形会消失且无法恢复；③ 缩放锚点由 `offset` 决定 | 与其他方案的取舍：`scale` vs 直接改尺寸 |
| `stop-animation` | ① `stop()` 后 `start()` 从当前状态继续，不会复位；② 页面不可见时应主动停止以省电；③ 忘记 `stop()` 会让动画在节点销毁后继续跑 | 性能提示：`visibilitychange` 时暂停动画 |

- [ ] **Step 3–5**: 追加两个前缀、验证、提交

---

## Task 6: 剩余四个小章节 12 页

**Files:** `docs/data-and-serialization/*.md`、`docs/selectors/*.md`、`docs/groups-and-layers/*.md`、`docs/clipping/*.md`、`test/checks/originality.js`

- [ ] **Step 1: 逐页改造**

| 页面 | 常见问题要点 | 第三小节 |
|---|---|---|
| `serialize-a-stage` | ① 图片与事件不会被序列化；② 自定义属性需要注册才会被包含；③ Konva 10.6.0 起显式设置的 `width`/`height` 会出现在输出里，旧版不会 | 与其他方案的取舍：`toJSON` vs 自己设计数据结构 |
| `simple-load` | ① `Konva.Node.create()` 是静态方法；② 还原舞台必须传 `container`；③ 还原后事件要重新绑定 | 与其他方案的取舍：整体还原 vs 增量还原 |
| `complex-load` | ① 图片要在还原后手动补；② 用 `name` 而非 `id` 定位节点，便于批量；③ `find()` 返回数组、`findOne()` 返回单个 | 性能提示：大型场景还原时的分批策略 |
| `stage-data-url` | ① 跨域图片会污染画布导致导出失败；② `pixelRatio` 决定导出分辨率；③ `toDataURL` 是同步的，大画布会卡住主线程 | 国内环境注意事项：图床 CORS 与导出失败，以及大图导出的替代方案 |
| `select-by-id` | ① id 在整个舞台内应唯一，Konva 不强制；② `findOne('#id')` 比 `find()[0]` 更直接；③ 选择器是遍历实现的，不是哈希查找 | 性能提示：高频查找应自己缓存引用 |
| `select-by-name` | ① 一个节点可有多个 name，空格分隔；② `hasName()` 判断单个；③ name 适合做分类批量操作 | 与其他方案的取舍：name vs id vs 自己维护数组 |
| `select-by-type` | ① 类型名区分大小写；② 自定义图形的类型名是 `Shape`；③ 按类型查找会遍历全树 | 性能提示：类型查找的开销与替代 |
| `groups` | ① 分组的 `x`/`y` 是子节点坐标的原点；② 分组可嵌套，变换会逐层累积；③ 空分组不占空间但仍参与遍历 | 性能提示：分组层级过深的代价 |
| `layering` | ① `zIndex` 是在同一父容器内的序号；② `moveToTop()` 只在兄弟节点间生效；③ 跨图层的层级由图层顺序决定 | 与其他方案的取舍：调整 zIndex vs 拆图层 |
| `change-containers` | ① `moveTo()` 会保持节点的相对坐标不变，视觉位置因此会跳；② 想保持视觉位置要先算绝对坐标；③ 跨图层移动需要两个图层都重绘 | 与其他方案的取舍：`moveTo` vs 销毁重建 |
| `clipping-regions` | ① 裁剪作用于容器的全部子节点；② 裁剪区域坐标相对容器自身；③ 裁剪不影响命中检测，被裁掉的部分仍可点击 | 性能提示：裁剪对绘制的影响 |
| `clipping-function` | ① `clipFunc` 里只需画路径，不要填充；② 路径不闭合时行为未定义；③ 与 `clip` 属性互斥，同时设只有一个生效 | 与其他方案的取舍：`clipFunc` vs 混合模式做遮罩 |

- [ ] **Step 2–4**: 追加四个前缀、验证、提交

---

## Task 7: 根级 3 页与全站启用

**Files:** `docs/intro.md`、`docs/overview.md`、`docs/support.md`、`test/checks/originality.js`、`README.md`、`specs/...`

- [ ] **Step 1: 改造三页**

三页情况各不相同，不能套用同一手法：

- **`intro`**（已有 11 个 h2）：小节很多但没有「常见问题」。补一节，要点：
  ① npm 装完之后怎么在原生 HTML 里用（很多人卡在模块化与 script 标签的差别）；
  ② Stage 必须有一个真实存在的容器元素，`container` 传 id 字符串或 DOM 元素都行；
  ③ 为什么第一次画什么都看不到——多数是忘了 `stage.add(layer)`。
  第三小节用**国内环境注意事项**：unpkg 在国内的可达性、jsDelivr 与 npmmirror 的替代地址、
  以及为什么本站演示统一用 `konva@10` 浮动版本。

- **`overview`**（已有 4 个 h2，是目录页）：目录页加「常见问题」略显生硬，
  改为补一节**与其他方案的取舍**，写「什么时候该用 Konva、什么时候不该」——
  与原生 Canvas、Fabric.js、PixiJS、SVG 的定位差别。再补「常见问题」：
  ① 该从哪一章开始读；② 只想做某个具体效果该查哪里；③ 本站与官方英文文档的关系。

- **`support`**（只有 2 个 h2）：补「常见问题」与**国内环境注意事项**。
  常见问题要点：① 提问前应准备的最小复现；② StackOverflow 与 GitHub Issues 的分工；
  ③ 中文社区可以去哪儿。国内环境注记：GitHub 访问、Discord 不可达时的替代渠道。

- [ ] **Step 2: 全站启用校验**

`ENFORCED_PREFIXES` 改为覆盖全部内容目录：

```js
const ENFORCED_PREFIXES = ['docs/'];
```

改成单个 `'docs/'` 之后，以后新增任何页面都自动纳入校验，不需要再维护这个列表。

- [ ] **Step 3: 验证并补齐**

Run: `npm run check`
Expected: 全部 PASS。有遗漏的页面会在此暴露，逐个补齐。

- [ ] **Step 4: 度量**

Run: `node test/lib/content-stats.mjs`

记录全站散文中位数与「够正文内广告位门槛」的页数。P4 结束时为 209 字、36/110。

- [ ] **Step 5: 文档收尾**

README 的 `originality` 一行改为「全站生效」；规格 §4.4 补记 P5 已完成全站覆盖。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "docs: 根级 3 页补原创增量，原创校验全站生效"
```

---

## 计划自审

**规格覆盖核对：**

| 规格章节 | 对应 Task |
|---|---|
| §4.4 原创增量段（全站） | Task 1–7 覆盖 shapes 与 select-and-transform 之外的全部 77 页 |
| §4.4 机械校验 | Task 7 把 `ENFORCED_PREFIXES` 收敛为 `['docs/']`，此后新页面自动纳入 |
| §6.4 FAQPage | 自动产出，插件对所有含「常见问题」小节的页面生效，无需额外工作 |

**未在本计划覆盖、明确留给后续计划的规格条目：**

- §4.3 的 C2 剩余部分（`guides` 2 页、`nodejs` 1 页、根级 8 页）与 C3–C6（约 166 页）
- 演示代码本身的改动（属 P2 范畴，本计划只动散文）

**类型一致性核对：**`MIN_H2`（3）、`MIN_SECTION_CHARS`（150）、`REQUIRED_SECTION`（`常见问题`）、
`THIRD_SECTIONS`（`国内环境注意事项` / `与其他方案的取舍` / `性能提示`）均沿用
`test/checks/originality.js` 中的既有定义，本计划不修改这些常量，只扩大 `ENFORCED_PREFIXES`。
第三小节的标题必须与 `THIRD_SECTIONS` **逐字一致**，写成近义词会被判为缺失。
