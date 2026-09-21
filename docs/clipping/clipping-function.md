---
title: '裁剪函数'
description: '用 Konva 容器的 clipFunc 属性以自定义函数定义任意形状的裁剪区域，在回调中拿到 canvas 上下文自行绘制路径，不受矩形限制。'
sidebar_position: 2
---

`clipFunc` 用一个函数定义任意形状的裁剪区域，不受矩形限制。

## 用法

当矩形裁剪区域不够用时，可以设置容器的 `clipFunc` 属性。它接收一个函数，
参数是 canvas 的绘图上下文，你在其中绘制的任意路径都会成为裁剪区域，
因此可以裁出圆形、多边形或任何自定义形状。

在本教程中，我们将用 `clipFunc` 在组上定义一个非矩形的裁剪区域。

只需要矩形区域的话，用更简单的
<a href="/docs/clipping/clipping-regions">裁剪区域</a>即可。
<iframe src="/downloads/code/clipping/Clipping_Function.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Clipping Function Demo</title>
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
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();

    var group = new Konva.Group({
        clipFunc: function(ctx) {
          ctx.arc(250, 120, 50, 0, Math.PI * 2, false);
          ctx.arc(150, 120, 60, 0, Math.PI * 2, false);
        },
        draggable: true
    });

    var blueBlob = new Konva.Line({
        points: [73, 140, 340, 23, 500, 109, 300, 170],
        stroke: 'blue',
        strokeWidth: 10,
        fill: '#aaf',
        tension: 0.8,
        closed : true
    });

    var redBlob = new Konva.Line({
        points: [73, 140, 340, 23, 500, 109],
        stroke: 'red',
        strokeWidth: 10,
        fill: '#faa',
        tension: 1.2,
        scale: {x : 0.5, y : 0.5},
        x: 100,
        y: 50,
        closed : true
    });

    group.add(blueBlob);
    group.add(redBlob);
    layer.add(group);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```

## 常见问题

### 回调里要调用 fill 吗？

不要。`clipFunc` 里只需要**画出路径**，Konva 会把它作为裁剪区域使用：

```js
clipFunc: (ctx) => {
  ctx.arc(100, 100, 50, 0, Math.PI * 2);
}
```

调用 `fill()` 或 `stroke()` 既没有意义也可能干扰结果——
这和 [`sceneFunc`](/docs/shapes/custom) 必须调 `fillStrokeShape()` 正好相反，
两者容易混淆。

### 路径不闭合会怎样？

行为未定义，不同浏览器的处理可能不同。稳妥起见显式调用 `ctx.closePath()`，
或者确保路径的终点与起点重合。

用 `arc()` 画完整圆时路径会自动闭合，不需要额外处理；
手工画多边形则务必闭合。

### clip 和 clipFunc 能一起用吗？

不能，同时设置只有一个生效。它们是同一个功能的两种表达方式，
`clip` 是矩形的快捷写法。

需要「矩形与任意形状的交集」这类复合裁剪，只能在 `clipFunc` 里
自己把两个形状的交集画出来，或者用嵌套分组做两层裁剪。

## 与其他方案的取舍

实现「只显示某个形状内的内容」，有三条路。

**`clipFunc`** 作用范围明确——只影响该容器的子节点，不波及外部。
形状由代码定义，可以随时改变。适合动态遮罩、聚光灯效果。

**[混合模式](/docs/styling/blend-mode)**（`destination-in` 一类）写起来更短，
但它作用于**同一图层上已绘制的全部内容**，很容易误伤别的图形。
除非你能确保图层里只有相关内容，否则不如用裁剪可控。

**预先做好带透明通道的图片**零运行时开销，但形状固定不能变。
如果遮罩形状在整个应用生命周期内都不变，这是最快的方案。

复杂但静态的裁剪，还可以 `clipFunc` 加 [`cache()`](/docs/performance/shape-caching)——
裁剪只在建缓存时算一次，之后都是贴图。
