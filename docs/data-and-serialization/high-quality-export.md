---
title: '导出高清图片'
description: 'toDataURL / toImage / toCanvas / toBlob 的 pixelRatio 默认是 1 而不是设备像素比，导出图在高分屏上天生糊一半；cache() 的默认值却相反。'
sidebar_position: 6
---

"为什么导出的图比屏幕上看到的糊？"——这是 Konva 最高频的问题之一，
而答案是：**这是默认行为，不是 bug。**

<iframe src="/downloads/code/data_and_serialization/High_Quality_Export.html" style="width: 50vw;height:300px;"></iframe>

## 导出默认 pixelRatio 是 1

`toDataURL()`、`toImage()`、`toCanvas()`、`toBlob()` 四个导出方法的
`pixelRatio` **默认值都是 `1`**。

而屏幕上的画布不是——Konva 建图层画布时用的是 `Konva.pixelRatio`，
它跟随设备像素比。在 2x 屏上，一个 100×100 的舞台，
屏幕画布是 200×200 的真实像素，导出的却是 100×100。

在 `deviceScaleFactor: 2` 的浏览器里实测：

| | 实际像素 |
|---|---|
| `window.devicePixelRatio` | `2` |
| `Konva.pixelRatio` | `2` |
| 图层画布（屏幕上的） | **200×200** |
| `stage.toCanvas()` 默认 | **100×100** |
| `stage.toCanvas({ pixelRatio: 2 })` | 200×200 |

所以导出图的分辨率只有屏幕显示的一半——放大看当然糊。

修法就是显式传值：

```js
// 与屏幕一致
stage.toDataURL({ pixelRatio: window.devicePixelRatio });

// 用于打印或需要放大查看
stage.toDataURL({ pixelRatio: 3 });
```

## cache() 的默认值恰好相反

这是最容易搞混的地方：**同一个参数名，两个 API 的默认值相反。**

| API | `pixelRatio` 默认值 |
|---|---|
| `toDataURL` / `toImage` / `toCanvas` / `toBlob` | **`1`** |
| `cache()` | **`Konva.pixelRatio`（设备像素比）** |

同样在 2x 屏上实测：`node.cache()` 建出的缓存画布是 **200×200**，
`node.cache({ pixelRatio: 1 })` 才是 100×100。

这个不对称是有道理的——缓存是给屏幕显示用的，当然要跟随屏幕；
导出是给文件用的，Konva 不替你假设用途。但**不知道这件事的人
会以为两处行为一致**，然后在其中一处踩坑。

顺带一提，[滤镜](/docs/filters/custom-filter)的性能直接取决于缓存的
`pixelRatio`——面积是平方关系，2x 意味着四倍工作量。
不需要高清的地方主动设 `cache({ pixelRatio: 1 })` 是常见优化。

## 常见问题

### pixelRatio 该设多少？

按用途定：

- **在网页上显示导出的图** → `window.devicePixelRatio`，和屏幕一致就够了。
- **用户下载后可能放大看** → `2` 或 `3`。
- **用于打印** → 按目标 DPI 换算。屏幕按 96 DPI 计，
  要 300 DPI 的话就是 `300 / 96 ≈ 3.125`。
- **再往上没有意义**，只是让文件变大。

注意**体积是平方增长**：`pixelRatio: 3` 的 PNG 大约是 `1` 的九倍。
移动端用户下载一张 20MB 的图不是好体验。

### 导出报 SecurityError 怎么办？

画布被跨域图片"污染"了。只要往画布里画过一张没有 CORS 头的跨域图片，
之后 `toDataURL()` / `getImageData()` 全部抛 `SecurityError`。

解决要两步都做到：

```js
const img = new Image();
img.crossOrigin = 'anonymous';   // 第二步
img.src = 'https://cdn.example.com/a.png';
```

**第一步是服务端必须返回 `Access-Control-Allow-Origin`。**
顺序不能反——只设 `crossOrigin` 而服务端没有 CORS 头，
图片会**彻底加载失败**（连显示都没有），比不设更糟。

### 导出的图背景是透明的？

Stage 本身没有背景色，没画东西的地方就是透明。导出 PNG 会保留透明通道。

要白底，两个办法：

```js
// 办法一：在最底层放一个铺满的矩形
layer.add(new Konva.Rect({
  x: 0, y: 0, width: stage.width(), height: stage.height(), fill: 'white',
}));

// 办法二：导出成 JPEG，它不支持透明，会自动填黑（注意是黑不是白）
stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.9 });
```

JPEG 把透明区域填成**黑色**而不是白色，这经常出乎意料。
要白底还是老老实实加矩形。

### 只想导出画布的一部分？

传裁剪区域：

```js
stage.toDataURL({
  x: 100, y: 50, width: 400, height: 300,
  pixelRatio: 2,
});
```

坐标是舞台坐标系里的。要按某个节点的范围导出，
先 `node.getClientRect()` 拿包围盒再传进去。

注意 Konva 10.4.0 起，裁剪导出**不再包含完全落在裁剪区外的图形的阴影**——
如果你依赖旧行为让阴影"探进来"，升级后会发现阴影没了。

### 导出很大的图会卡死页面吗？

会。`toDataURL()` 是同步的，而且要把整张画布编码成 base64 字符串。
一张 4000×4000 的 PNG，编码耗时可以到几百毫秒甚至更久，期间页面完全无响应。

用 `toBlob()`（异步）代替：

```js
const blob = await stage.toBlob({ pixelRatio: 3 });
const url = URL.createObjectURL(blob);
```

它还省内存——不用生成那个比二进制大三分之一的 base64 字符串。
Konva 10.5.0 修正了 `toBlob()` 的类型声明，
现在它明确 resolve 一个 `Blob`，编码失败时 reject 而不是 resolve `null`。

## 国内环境注意事项

导出功能在国内项目里最常见的失败原因是**图床不返回 CORS 头**。

七牛、又拍、阿里 OSS、腾讯 COS 的存储桶**默认都不开跨域**。
开发时图片放在本地 `public/` 下，一切正常；一上线换成 CDN 地址，
导出立刻 `SecurityError`。

要做的事有三件，缺一不可：

1. **在存储桶的跨域设置里加 `Access-Control-Allow-Origin`**，
   允许你的站点域名（或 `*`）。
2. **确认 CDN 回源时没有剥掉这个头。** 有些 CDN 默认不透传自定义响应头，
   需要在缓存配置里显式保留。
3. **前端设 `crossOrigin = 'anonymous'`。**

第 2 条有一个特别难查的变种：**CDN 缓存了不带 CORS 头的响应**。
表现是部分用户正常、部分用户报错，取决于请求命中了哪个边缘节点。
排查时要带 `Origin` 请求头去 `curl` 不同节点，看响应头里有没有
`Access-Control-Allow-Origin`——在浏览器里刷新是看不出来的，
因为浏览器会缓存失败的结果。

改完配置后记得**刷新 CDN 缓存**，否则旧的无头响应还会继续服务很久。
