---
title: '移动端画布内存上限'
description: 'iOS 与微信内置浏览器对 canvas 面积和总内存都有上限，超出后画布白屏、导出为空。按 Konva 的图层结构估算占用，并降低 pixelRatio 与图层数。'
sidebar_position: 3
---

同一个页面，电脑上一切正常，到了 iPhone 或微信里就**整块画布白屏**，
或者导出的图片是空的，控制台里可能有一句
`Total canvas memory use exceeds the maximum limit`。

这不是 Konva 的 bug，是移动端浏览器对 canvas 的两道硬限制：
**单块画布的面积上限**，以及**整个页面所有画布加起来的内存上限**。
Konva 的每个图层都是真实的 canvas 元素，图层一多、屏幕像素比一高，很容易撞上。

## 用法

先估算。Konva 的每个 `Layer` 带两块和舞台一样大的画布：

- **场景画布**：像素比取 `Konva.pixelRatio`，默认等于 `window.devicePixelRatio`，
  占用 = 宽 × 高 × 像素比² × 4 字节；
- **命中画布**：用于点击检测，像素比固定为 1，占用 = 宽 × 高 × 4 字节。
  `listening: false` 的图层（Konva 10.3.2 起）会释放这一块。

一台 390 × 844、3 倍屏的手机，一个图层的场景画布就是 1170 × 2532 × 4 ≈ 11.3 MB，
加上命中画布约 12.6 MB。五个图层就是 60 MB 以上，这还没算缓存（`cache()`）和导出用的临时画布。

演示里可以切换几种常见设备，看图层数和导出倍率对占用的影响：

<iframe src="/downloads/code/china/Webview_Canvas_Limits.html" style="width: 50vw;height:420px;"></iframe>

```html
/**
 * china/Webview_Canvas_Limits.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Canvas Memory Estimate Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    var FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';
    // iOS 上普遍观察到的单块 canvas 面积上限（4096 × 4096），以实机为准
    var MAX_AREA = 16777216;
    var MB = 1024 * 1024;

    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var presets = [
      { name: '当前窗口', w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 },
      { name: '手机 390×844 @3x', w: 390, h: 844, dpr: 3 },
      { name: '手机 390×844 @2x', w: 390, h: 844, dpr: 2 },
      { name: '平板 1024×1366 @2x', w: 1024, h: 1366, dpr: 2 }
    ];
    var current = 1;

    // 每个 Konva.Layer：场景画布按 Konva.pixelRatio（默认 devicePixelRatio），
    // 命中画布固定 pixelRatio 1。每像素 4 字节（RGBA）。
    function layerBytes(p, listening) {
      var scene = p.w * p.h * p.dpr * p.dpr * 4;
      var hit = listening ? p.w * p.h * 4 : 0;
      return { scene: scene, hit: hit };
    }

    // 导出面积不超过上限时，pixelRatio 最多能取多少
    function maxExportRatio(p) {
      return Math.floor(Math.sqrt(MAX_AREA / (p.w * p.h)) * 100) / 100;
    }

    function label(x, y, text, size, color, width) {
      var t = new Konva.Text({
        x: x, y: y, text: text, fontSize: size || 13,
        fill: color || '#333', fontFamily: FONT
      });
      if (width) t.width(width);
      layer.add(t);
      return t;
    }

    function render() {
      layer.destroyChildren();
      var p = presets[current];

      // 预设切换按钮
      var btnX = 16;
      presets.forEach(function (item, i) {
        var btn = new Konva.Label({ x: btnX, y: 12 });
        btn.add(new Konva.Tag({
          fill: i === current ? '#2563eb' : '#fff',
          stroke: '#2563eb', cornerRadius: 4
        }));
        btn.add(new Konva.Text({
          text: item.name, padding: 6, fontSize: 12, fontFamily: FONT,
          fill: i === current ? '#fff' : '#2563eb'
        }));
        btn.on('click tap', function () { current = i; render(); });
        layer.add(btn);
        btnX += btn.width() + 8;
      });

      var textW = stage.width() - 32;
      var intro = label(16, 48, '舞台 ' + p.w + ' × ' + p.h + '，devicePixelRatio = ' + p.dpr +
        '。每个图层的画布占用（场景 + 命中）：', 13, null, textW);
      var barsTop = 48 + intro.height() + 10;

      var maxBytes = 0;
      for (var n = 1; n <= 6; n++) {
        var b = layerBytes(p, true);
        maxBytes = Math.max(maxBytes, (b.scene + b.hit) * n);
      }
      var barMax = Math.max(120, stage.width() - 190);

      for (var n = 1; n <= 6; n++) {
        var b = layerBytes(p, true);
        var y = barsTop + (n - 1) * 26;
        var sceneW = barMax * (b.scene * n) / maxBytes;
        var hitW = barMax * (b.hit * n) / maxBytes;
        label(16, y + 3, n + ' 个图层');
        layer.add(new Konva.Rect({ x: 80, y: y, width: sceneW, height: 18, fill: '#60a5fa' }));
        layer.add(new Konva.Rect({ x: 80 + sceneW, y: y, width: hitW, height: 18, fill: '#fbbf24' }));
        label(88 + sceneW + hitW, y + 3, ((b.scene + b.hit) * n / MB).toFixed(1) + ' MB');
      }
      label(80, barsTop + 6 * 26, '■ 场景画布', 12, '#2563eb');
      label(160, barsTop + 6 * 26, '■ 命中画布（listening: false 的图层没有这一块）', 12, '#b45309', textW - 144);

      var exportIntro = label(16, barsTop + 6 * 26 + 30, '', 13, null, textW);
      var ratio = maxExportRatio(p);
      exportIntro.text('toDataURL({ pixelRatio }) 的画布面积 = 舞台面积 × pixelRatio²；' +
        '这个尺寸下 pixelRatio 最多约 ' + ratio + '，再大就可能超出 16,777,216 像素的面积上限：');
      var top = exportIntro.y() + exportIntro.height() - 16;

      // 右侧留出数字标注的位置
      var scaleW = Math.max(80, stage.width() - 290) / (p.w * p.h * 16);
      [1, 2, 3, 4].forEach(function (r, i) {
        var area = p.w * p.h * r * r;
        var y = top + 26 + i * 26;
        label(16, y + 3, 'pixelRatio ' + r);
        layer.add(new Konva.Rect({
          x: 110, y: y, width: Math.max(2, area * scaleW), height: 18,
          fill: area > MAX_AREA ? '#ef4444' : '#34d399'
        }));
        label(118 + area * scaleW, y + 3, (area / 1e6).toFixed(1) + ' 百万像素' + (area > MAX_AREA ? '（超限）' : ''));
      });
      var limitX = 110 + MAX_AREA * scaleW;
      layer.add(new Konva.Line({
        points: [limitX, top + 20, limitX, top + 26 + 4 * 26],
        stroke: '#ef4444', dash: [4, 4]
      }));
    }

    render();
  </script>

</body>
</html>
```

三个最有效的降耗手段：

```js
// 1. 移动端把像素比封顶在 2。必须在创建舞台和图层之前设置——
//    画布在创建时读取这个值，之后再改不影响已经存在的图层
Konva.pixelRatio = Math.min(window.devicePixelRatio, 2);

// 2. 纯展示的图层关掉事件监听，释放它的命中画布
const background = new Konva.Layer({ listening: false });

// 3. 合并图层。三五个图层通常就够了，不要按「一类图形一个图层」拆分
```

图层怎么拆才合理，见[图层管理](/docs/performance/layer-management)与
[关闭事件监听](/docs/performance/listening-false)。

## 导出高清图时的面积上限

`toDataURL({ pixelRatio })` 会创建一块临时画布，面积是**舞台面积 × pixelRatio²**。
超过单画布面积上限时，得到的是空白图片。iOS 上普遍观察到的上限是
4096 × 4096 = 16,777,216 像素。

按上限反推当前舞台能用的最大导出倍率：

```js
const MAX_AREA = 16777216;

function safeExportRatio(stage, wanted) {
  const limit = Math.sqrt(MAX_AREA / (stage.width() * stage.height()));
  return Math.min(wanted, Math.floor(limit * 100) / 100);
}

const url = stage.toDataURL({ pixelRatio: safeExportRatio(stage, 3) });
```

一张 1024 × 1366 的画布，按 3 倍导出是 1260 万像素，没问题；按 4 倍就是 2240 万像素，超限。
确实需要更大的图时，只能分块导出后在服务端拼接，或者直接在服务端渲染。
导出倍率的其他取舍见[高清导出](/docs/data-and-serialization/high-quality-export)。

## 国内环境注意事项

微信、支付宝、钉钉等 App 的内置浏览器里，这个问题比 Safari 更常见。原因是用户很少关掉这些页面，
单页应用在里面**反复切换路由**：旧页面的舞台如果没有 `stage.destroy()`，
它的画布内存就不会归还，几次切换后累积到上限，新页面的画布直接白屏。
在组件卸载或路由离开时销毁舞台，是这类场景里最重要的一行代码。

Konva 为此默认开启了 `Konva.releaseCanvasOnDestroy`：销毁时把画布宽高设为 0，
源码注释写明是为了规避 macOS/iOS 上 Safari 的内存泄漏。不要把它关掉。
更完整的泄漏排查见[避免内存泄漏](/docs/performance/avoid-memory-leaks)。

上面的 16,777,216 像素是 iOS 上普遍观察到的单画布面积上限，总内存上限则随设备内存不同而不同，
两者都没有稳定的公开规格。本页的数字只用于估算，是否超限以目标机型的实机测试为准。
测试时优先覆盖老款 iPhone 和内存较小的安卓机型，它们最先出问题。

## 常见问题

### 为什么电脑上正常，iPhone 上白屏？

电脑浏览器的 canvas 上限要大得多，而 iPhone 是 3 倍屏，同样尺寸的舞台，
场景画布的像素数是 1 倍屏的 9 倍。先用上面的公式估一下总占用，
再依次尝试封顶 `Konva.pixelRatio`、减少图层、销毁不用的舞台。

### 降低 pixelRatio 会变模糊吗？

会，但在手机上肉眼差别很小。3 倍屏上用 2 倍像素比，边缘略软，一般用户察觉不到；
内存却是 3² / 2² = 2.25 倍的差距。对文字清晰度要求高的场景（比如阅读类页面），
可以只给文字所在的图层单独调高：`textLayer.getCanvas().setPixelRatio(3)`。
实测这个设置在舞台改变尺寸后依然保留，其余图层仍按全局的 `Konva.pixelRatio`。

### 怎么知道当前占了多少画布内存？

Safari 的 Web 检查器（连接 iPhone 调试）在「图形」标签页里列出页面上所有 canvas 及其尺寸；
Chrome 可以在开发者工具的 Memory 面板里看，或者按上面的公式自己累加每个图层。
微信内置浏览器可以借助 vConsole 之类的调试面板把估算结果打印出来。
