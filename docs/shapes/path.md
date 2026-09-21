---
title: 'SVG Path 路径'
description: '用 Konva.Path 渲染 SVG 路径：data 属性直接接受 SVG 的 d 字符串，适合把矢量图导入 Canvas 或以数据字符串描述复杂图形。'
sidebar_position: 17
---

Path 直接接受 SVG 的路径字符串，是把矢量设计稿搬进 Canvas 最直接的方式。

## 用法

要使用`Konva`添加SVG路径, 我们可以实例化一个`Konva.Path()`对象.

当我们要将SVG路径导出到HTML5 Canvas,或者想将复杂的绘图显示为数据字符串而不是自定义形状时,路径是最常用的.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Path.html" target="_blank">Konva.Path</a>文档

<iframe src="/downloads/code/shapes/Path.html" style="width: 50vw; height: 200px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Path Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var path = new Konva.Path({
      x: 50,
      y: 40,
      data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',
      fill: 'green',
      scale: {
        x : 2,
        y : 2
      }
    });

    // add the shape to the layer
    layer.add(path);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 能直接用设计稿导出的 SVG 吗？

可以。把 SVG 里 `<path>` 元素的 `d` 属性整段复制给 `data` 即可，
Konva 支持标准的 SVG 路径命令。

注意一个 SVG 文件里往往有多个 `<path>`，每个要建一个 `Konva.Path`；
另外 SVG 的 `fill`、`stroke` 是元素属性，不在 `d` 里，需要另行设置到 Konva 节点上。

### 路径粘贴进来之后跑到画布外面去了？

SVG 的坐标是相对它自己的 `viewBox` 的，粘过来之后仍然按那套坐标绘制，
很容易整体偏移甚至完全在可视区之外。

用 `getClientRect()` 量出实际包围盒，再把 `offsetX`、`offsetY` 设为它的 `x`、`y`，
就能把路径的左上角对齐到节点的 `x`、`y`。

### 升级到 Konva 10.6.0 后路径长度变了？

是的，这是一处有意的行为修正。闭合命令 `z` 之后的相对命令现在从**子路径起点**
开始计算（此前从 `z` 之前的最后一个点算起），`getLength()` 也开始包含闭合边，
两者都与 SVG 规范一致。

如果你基于旧行为做过路径长度计算——比如用 `getPointAtLength()` 沿路径布点、
或者用描边虚线做绘制动画——升级后需要复核这些数值。

## 与其他方案的取舍

能用内置图形表达的就别用 `Path`。矩形、圆、多边形各有专门的图形，属性语义清楚、
改参数不用重写路径字符串。

`Path` 的适用场景是：形状来自设计稿、或者需要多种曲线命令拼接的复杂轮廓。

它有一个重要限制：整条路径只能有一套样式。想让某一段是红色、另一段是蓝色，
或者只给一段加阴影，都必须拆成多个 `Konva.Path` 节点。设计分段效果时要提前
把路径拆好，而不是画完再想办法。
