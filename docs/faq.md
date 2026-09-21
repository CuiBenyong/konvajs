---
title: '常见问题汇总'
description: 'Konva 高频问题集中解答：图形不显示、点不中、导出图片被污染、中文字体不生效、拖拽卡顿、序列化丢事件等，每条给出排查顺序与对应文档。'
sidebar_position: 3
---

这一页按**现象**组织，不按 API 分类——出问题的时候你知道的是「画面不对」，
而不是「`getClientRect` 有问题」。

## 按现象排查

| 现象 | 最常见的原因 | 详见 |
|---|---|---|
| 图形画了但看不见 | 节点没加进 Layer，或 Layer 没加进 Stage | 本页下方 |
| 点不中图形 | 没有 `fill` 的图形内部不响应命中 | [自定义命中区域](/docs/events/custom-hit-region) |
| 点一下执行了两次 | 同时监听了 `click` 和 `tap` | 本页下方 |
| 中文不显示 / 字体不对 | 字体未加载完就绘制了 | [Text 文字](/docs/shapes/text) |
| 导出图片报错 | 跨域图片污染了画布 | 本页下方 |
| 导出的图很糊 | 导出的 `pixelRatio` 默认是 1 | 本页下方 |
| 缩放后描边变粗 | `scale` 会连描边一起放大 | [忽略描边](/docs/select-and-transform/ignore-stroke) |
| 反序列化后事件没了 | `toJSON` 不保存函数 | [序列化舞台](/docs/data-and-serialization/serialize-a-stage) |
| 拖拽 / 动画卡顿 | 节点太多且都在监听事件 | [性能优化](/docs/performance/all-performance-tips) |

## 常见问题

### 图形画了但看不见？

按这个顺序查，九成问题在前三条：

1. **节点没加进 Layer，或 Layer 没加进 Stage。** `new Konva.Rect(...)`
   只是创建对象，`layer.add(rect)` 和 `stage.add(layer)` 两步都不能少。
2. **Stage 的容器没有尺寸。** `container` 指向的 `<div>` 如果高度是 0，
   画布也是 0。Stage 的 `width` / `height` 是画布尺寸，不会撑开容器。
3. **坐标在可视范围外。** 特别是设了 `offsetX` / `offsetY` 之后，
   图形的实际位置会偏移一个 offset。
4. **`visible(false)` 或 `opacity(0)`。**
5. **被上面的图层盖住了。** 后加进 Stage 的 Layer 在上面。
6. **父 Group 设了 `clipFunc` 或 `clip`，图形落在裁剪区外。**
7. **手动改过 context 但没触发重绘。** 绝大多数属性改动会自动重绘，
   但你自己调 `layer.getContext()` 画的东西不会——那需要 `layer.draw()`。

还有一个隐蔽的：**图片还没加载完就绘制了**。`Konva.Image` 的 `image`
属性如果传了一个尚未 `onload` 的 `Image` 对象，画出来是空的，
且之后不会自动补画。

### 点不中图形？

Konva 靠一张离屏的**命中图**判断点中了谁，所以「看得见」和「点得中」是两件事。

- **没有 `fill` 的图形，内部是空的**，只有描边能命中。一个只设了 `stroke`
  的矩形，点中间点不到。想让内部可点，给一个 `fill`（哪怕是
  `fill: 'rgba(0,0,0,0.001)'`），或者用 `hitFunc` 自定义命中区域。
- **细线很难点中。** 命中宽度默认等于 `strokeWidth`，1px 的线基本点不到。
  用 `hitStrokeWidth: 10` 把命中区加宽，视觉上仍然是 1px。
- **`listening(false)` 的节点完全不参与命中**，包括它的所有子节点。
- **上面压了一个透明但在监听的节点。** 透明不等于不挡事件——
  `opacity(0)` 的节点仍然会拦截点击，要真正让它不挡，用 `listening(false)`。

详见[自定义命中区域](/docs/events/custom-hit-region)。

### 点一下却执行了两次？

最常见的是**同时监听了 `click` 和 `tap`**。移动端的一次触摸会触发 `tap`，
浏览器合成的鼠标事件又会让 `click` 也触发，于是回调跑两遍。
桌面端只有 `click`，所以这个 bug **只在手机上出现**，特别难查。

正确写法是一次注册两个事件名，Konva 支持空格分隔：

```js
shape.on('click tap', handler);   // 桌面走 click，移动端走 tap，只会命中一个
```

同理，同时监听 `pointerdown` 和 `mousedown` 也会收到两次——
Konva 内部会按输入设备把指针事件映射成鼠标或触摸事件并一并派发。
**选一套，不要混用。**

### 导出图片报 SecurityError / Tainted canvas？

把一张**跨域且没有 CORS 头**的图片画进画布，整块画布就被标记为"受污染"，
此后 `toDataURL()` / `getImageData()` 全部抛 `SecurityError`。

解决要两边都做到：

1. 图片服务端返回 `Access-Control-Allow-Origin`。
2. 前端加载时声明 `crossOrigin`：`Konva.Image.fromURL` 之前设
   `imageObj.crossOrigin = 'anonymous'`。

**顺序很重要**：只做第 2 步而服务端不返回 CORS 头，图片会**彻底加载失败**，
连显示都没有，比不设更糟。所以先确认服务端配置生效，再加 `crossOrigin`。

### 导出的图在高分屏上很糊？

这是**默认行为**，不是 bug。`toDataURL()` / `toImage()` / `toCanvas()` /
`toBlob()` 的 `pixelRatio` 默认是 **1**，而你的屏幕可能是 2x 或 3x——
所以导出的图天然就比你在屏幕上看到的少一半分辨率。

```js
stage.toDataURL({ pixelRatio: window.devicePixelRatio });  // 与屏幕一致
stage.toDataURL({ pixelRatio: 3 });                        // 用于打印
```

容易混淆的是 `cache()`：它的 `pixelRatio` 默认是设备像素比，
和导出**默认值相反**。同名参数、不同默认值，这是两处最容易搞错的地方。
完整说明见[导出高清图片](/docs/data-and-serialization/high-quality-export)。

### 中文字体不生效 / 字体切换后布局乱了？

Canvas 没有 CSS 的 `font-display` 机制。浏览器会先用回退字体把文字画上去，
自定义字体加载完成后**已经画上去的内容不会自动重绘**。

```js
await document.fonts.ready;   // 等字体就绪再画
layer.draw();
```

更麻烦的是布局：回退字体和目标字体的字宽不同，
依赖 `text.width()` 做的居中、换行计算在字体切换前后是两组不同的结果。
所以字体就绪后要**重新跑一遍布局计算**，而不只是 `draw()`。
详见 [Text 文字](/docs/shapes/text)。

### 反序列化之后事件全没了？

`toJSON()` 只保存属性，**所有函数一律不保存**——事件回调、`sceneFunc`、
`dragBoundFunc`、`clipFunc`、`filters` 数组里的函数引用，全都丢失。
`Konva.Image` 的图片对象也不会被保存，恢复出来是个空壳。

正确做法是反序列化之后统一重新绑定，用 `name` 或 `id` 作为锚点：

```js
const stage = Konva.Node.create(json, 'container');
stage.find('.draggable-item').forEach((node) => {
  node.on('click', handleClick);
});
```

见[序列化舞台](/docs/data-and-serialization/serialize-a-stage)与
[按名称选择](/docs/selectors/select-by-name)。

### 拖拽和动画卡顿怎么办？

按收益从高到低试：

1. **给不需要交互的节点设 `listening(false)`。** 它们不再进入命中图，
   这是单项收益最大的一条，见 [关闭事件监听](/docs/performance/listening-false)。
2. **拆图层。** 静态背景单独一层，只有变动的内容在另一层，
   背景就不必每帧重画。但图层不是越多越好，每层都是一个真实的 canvas。
3. **缓存静态分组。** `group.cache()` 把一整组烤成位图，
   见 [图形缓存](/docs/performance/shape-caching)。
4. **别在每帧里调 `moveToTop()` 或改 `zIndex`。** 它们是数组 splice，
   在大列表上是 O(n)。拖拽时只在 `dragstart` 置顶一次。

完整清单见 [性能优化总览](/docs/performance/all-performance-tips)。

### 缩放之后描边变粗了？

`scale` 会把描边宽度一起放大——放大 3 倍，1px 的线就变成 3px。
多数编辑器场景里这不是想要的。

```js
shape.strokeScaleEnabled(false);   // 描边宽度不随缩放变化
```

用 `Transformer` 缩放时还要注意它默认把缩放写进 `scaleX` / `scaleY`，
见[忽略描边](/docs/select-and-transform/ignore-stroke)。

### 该用 Konva 还是别的方案？

如果你还在选型阶段，见[为什么选择 Konva](/docs/guides/why-konva)与
[Canvas 库怎么选](/docs/guides/best-canvas-library)。
简短版：需要交互就用 Konva，不需要交互直接用原生 Canvas，
需要可访问性用 SVG，同屏上万且都在动用 PixiJS。

## 国内环境注意事项

几个只在国内环境出现、但相当常见的坑：

**图床默认不返回 CORS 头。** 七牛、又拍、阿里 OSS、腾讯 COS
的存储桶默认都不开跨域，导致导出功能在开发机上（图片放本地）正常、
一上线就报 `SecurityError`。要在存储桶的跨域设置里显式加
`Access-Control-Allow-Origin`，并且确认 CDN 回源时没有把这个头剥掉——
**CDN 缓存了不带 CORS 头的响应**是个很难查的变种，
表现为部分用户正常、部分用户报错，取决于命中了哪个边缘节点。

**CDN 可达性。** unpkg 和 jsdelivr 在国内的稳定性时好时坏。
生产环境不要直接引它们，把 Konva 打进自己的包，
或者用 `registry.npmmirror.com` 的镜像。

**微信内置浏览器。** X5 内核在触摸事件、字体回退上与 Chrome 有差异，
`console.log` 也看不到。真机里用 vConsole 打点是唯一可靠的排查方式，
桌面模拟器复现不出来。
