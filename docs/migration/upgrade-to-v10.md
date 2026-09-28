---
title: '升级到 Konva 10'
description: '从 Konva 8、9 升级到 10 的逐项清单：ESM 与 require 写法、Node 端画布后端、文本定位变化、Brighten 改名，以及 10.x 小版本里容易踩到的行为变化。'
sidebar_position: 1
---

先确认项目现在用的是哪个版本：浏览器控制台里执行 `Konva.version`，
或者看 `package-lock.json` 里 `konva` 的实际版本。

9 → 10 的改动集中在**模块格式**和 **Node 端**，浏览器里的绘图 API 基本没变；
8 → 10 也一样，因为 9.0.0 唯一的变化就是把 npm 包从 ES 模块改回了 CommonJS。
还停在 7.x 或更早的项目，要多过一遍文末的 8.0 清单。

本页内容取自 Konva 官方 CHANGELOG，截至 10.7.0。

## 用法

按「必须改」「可能受影响」「可以顺手用上」三档逐项检查。

### 必须改

**1. CommonJS 里的 `require`。** Konva 10 的 npm 包是纯 ES 模块，默认导出挂在 `default` 上：

```js
// ❌ Konva 9 的写法，在 10 里拿到的是模块对象而不是 Konva
const Konva = require('konva');

// Konva 10
const Konva = require('konva').default;
```

用 `import Konva from 'konva'` 的项目不受影响。旧版本的 `konva/cmj` 入口在 10 里已不存在，
引用它会报 `Package subpath './cmj' is not defined`。

**2. Node.js 端要显式选择画布后端。** Konva 10 不再在 Node 环境里自动加载 `canvas` 原生模块，
要自己安装并导入：

```js
// npm install canvas
import Konva from 'konva';
import 'konva/canvas-backend';

// 或者用 Skia：npm install skia-canvas
import 'konva/skia-backend';
```

不导入的话，创建舞台时会抛出 `Konva.js unsupported environment`。
完整写法见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。
这一改动的直接好处是 Next.js 等 SSR 框架不再需要处理 `canvas` 模块，见[在 Next.js 中使用](/docs/integration/nextjs)。

### 可能受影响

**3. 文本定位改为与 DOM/CSS 一致。** 文字的垂直位置计算方式变了，多数应用看不出区别，
但做过像素级对齐的界面（文字压在图形正中、和 HTML 元素叠放）可能偏移一两个像素。
临时恢复旧行为：

```js
Konva.legacyTextRendering = true;
```

这是过渡用的开关，长期应该按新的定位调整坐标。

**4. `Brighten` 滤镜弃用，由 `Brightness` 取代。** 两者共用 `brightness()` 属性，
但一个是加法、一个是乘法，**替换滤镜时必须同时改数值**，换算见
[Brightness](/docs/filters/brightness)。`Brighten` 目前仍然可用。

### 可以顺手用上

- **CSS 滤镜字符串**：`node.filters(['blur(10px)', 'grayscale(1)'])`，浏览器支持时走原生实现，
  比函数滤镜快得多，见 [CSS 原生滤镜](/docs/filters/css-filters)；
- **`charRenderFunc`**：逐字控制文字渲染，做逐字动画；
- `Konva.RegularPolygon` 支持 `cornerRadius`，所有图形支持 `miterLimit`；
- 10.7.0 新增 `Group.isolated()`：组内内容先画到透明画布，再整体应用透明度与混合模式，
  效果和 SVG 的 `<g opacity>` 一样，而且不像 `cache()` 那样把内容冻结成位图。

## 10.x 小版本里的行为变化

本站所有演示通过 CDN 引用浮动大版本 `konva@10`，npm 上 `"konva": "^10.0.0"` 也会自动升到最新的小版本。
下面这些小版本里的变化，都会在你没改任何代码的情况下作用到项目上：

| 版本 | 变化 | 如果你的代码这样写 |
|---|---|---|
| 10.4.0 | `container.getChildren()`、`stage.getLayers()` 返回副本 | 直接修改返回的数组来增删子节点，不再生效 |
| 10.4.0 | `Konva.Animation.animations` 变为 `Set` | 按数组读取它（`.length`、下标）会得到 `undefined` |
| 10.4.0 | Text 的重排监听挪到了原型上 | `text.off('textChange.konva')` 不再能关掉自动重排 |
| 10.4.0 | 导出与缓存更省内存 | 裁剪导出不再包含完全落在裁剪区外的图形的阴影 |
| 10.6.0 | 自定义滤镜函数的签名变为 `(imageData, pixelRatio)` | 写死像素半径的自定义滤镜，高倍缓存下效果变弱，应乘上 `pixelRatio`，见[自定义滤镜](/docs/filters/custom-filter) |
| 10.6.0 | 在没有拖拽的节点上调用 `stopDrag()` 变为空操作 | 依赖它顺带结束其他节点拖拽的代码失效 |
| 10.6.0 | `absolutePosition()` 等的类型不再接受 `null` | `node.absolutePosition(stage.getPointerPosition())` 编译报错，要先判空 |
| 10.6.0 | 从未设置过的数组属性，每次读取返回一个新数组 | 对没设过 `points` 的线读出 `line.points()` 再原地 `push`，不再影响节点（以前会污染所有共用默认值的节点），应调用 setter |
| 10.6.0 | 序列化保留与计算值相等的显式 `width` 等属性 | `toJSON()` 的输出比之前多出几个字段 |
| 10.7.0 | 移除 `Stage.bufferCanvas` 与 `drawScene()` 的第三个参数 | 访问它们的代码报错或得到 `undefined` |

多数条目是修正而不是破坏：旧行为本身就是 bug，只是有代码恰好依赖了它。
升级后出现「代码没改，行为变了」的情况，先对照这张表和官方 CHANGELOG 找对应的版本。

### 还在 7.x 或更早

Konva 8.0 是一次较大的清理，从 7.x 升级要额外处理：

- `Konva.Collection` 被移除，`find()` 返回普通数组，`group.find('Shape').visible(false)` 这种
  对集合直接调用方法的写法要改成 `.forEach()`；
- `Konva.Util.extend` 被移除；
- Stage 的 `contentMousemove` 等 `content*` 事件被移除，直接监听 `mousemove`；
- 引入自动重绘（`Konva.autoDrawEnabled`，默认开启），修改属性后通常不再需要手动 `layer.draw()`。

AI 编程助手最常生成的正是这些旧写法，识别与纠正方法见[AI 工具与 Konva](/docs/ai-tools)。

## 国内环境注意事项

**npm 镜像的同步延迟**。国内常用的 npmmirror 等镜像与官方源之间有同步延迟，
Konva 刚发布的小版本可能要过一段时间才能从镜像装到。遇到「CHANGELOG 里写了修复，
装下来却还是旧行为」，先用 `npm view konva version` 对比一下镜像上的最新版本。

**浮动版本的代价**。CDN 写 `konva@10`、package.json 写 `^10.x`，都会自动吃到上表里的行为变化。
Konva 在 2026 年 8、9 月间一个月内连发了多个小版本，其中不少带有行为调整。
生产环境建议锁定具体版本（写死 `10.7.0` 并提交 lock 文件），升级前读 CHANGELOG，在测试环境验证后再上线。

**CDN 可达性**。unpkg、jsDelivr 在国内的访问速度和稳定性都不可控，
本站演示为了跟随最新版本使用了 unpkg，生产环境应该把 `konva.min.js` 自托管，或者走国内的镜像 CDN。

**老旧的打包工具**。国内不少存量项目仍在用 webpack 4，它对 `package.json` 的 `exports` 字段和纯 ES 模块包支持不完整，
升级到 Konva 10 后可能出现找不到入口、默认导出为 `undefined` 等问题。先确认打包工具的版本，
必要时一并升级到 webpack 5 或 Vite。

## 常见问题

### 升级后文字整体偏了一两像素？

这是 10.0 的文本定位变化，Konva 改为与 DOM/CSS 的排版方式一致。
临时可以设 `Konva.legacyTextRendering = true` 恢复旧行为；长期应该按新的定位调整坐标，
因为这个开关只是过渡手段。

### 服务端报 unsupported environment？

Konva 10 不再自动加载 Node 端的画布模块。安装 `canvas` 或 `skia-canvas`，
并在导入 `konva` 之后导入 `konva/canvas-backend` 或 `konva/skia-backend`，
见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。
如果报错发生在 Next.js 这类框架的服务端渲染阶段，多半是在服务端创建了舞台，见下一问。

### 用了 Next.js 还要 ssr: false 吗？

Konva 10 配合 react-konva 19，不需要。react-konva 在浏览器里才创建舞台，
服务端只渲染一个空 `div`；`dynamic(..., { ssr: false })` 只在想延后加载画布时才有意义，而且必须写在 Client Component 里。
实测与写法见[在 Next.js 中使用](/docs/integration/nextjs)。

### AI 生成的代码是 Konva 8 以前的写法怎么办？

在提示词里写明 Konva 版本号，或者把本站的 llms.txt 相关片段贴给它。
常见的过时写法与识别方法见[AI 工具与 Konva](/docs/ai-tools)。
