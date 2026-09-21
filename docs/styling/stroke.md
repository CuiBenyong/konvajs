---
title: 'Stroke 笔画'
description: '用 Konva 的 stroke 与 strokeWidth 设置图形描边颜色和宽度，也可用 stroke()、strokeWidth() 方法在运行时修改。'
sidebar_position: 2
---

描边以路径为中线向两侧各画一半。这个细节解释了好几类常见问题。

## 用法

要使用`Konva`设置绘制形状和笔画宽度,我们可以在实例化形状时设置`stroke`和`strokeWidth`属性,也可以使用`stroke()`和`strokeWidth()`方法



说明：鼠标经过五边形以更改其笔画颜色和宽度。
<iframe src="/downloads/code/styling/Stroke.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Stroke Demo</title>
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

        var pentagon = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4
        });

        pentagon.on('mouseover', function() {
            this.stroke('blue');
            this.strokeWidth(20);
            layer.draw();
        });

        pentagon.on('mouseout', function() {
            this.stroke('black');
            this.strokeWidth(4);
            layer.draw();
        });
        // add the shape to the layer
        layer.add(pentagon);

        // add the layer to the stage
        stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 描边为什么看起来发虚？

因为它跨在两个物理像素上。`strokeWidth: 1` 的竖线落在整数坐标时，
左右各画半个像素，浏览器用抗锯齿把它渲染成两条半透明的灰线。

把坐标偏移半像素可以让它落在单个像素内：`x: 50.5`。

画网格、表格边框、坐标轴刻度时这个差别非常明显。偶数宽度的描边不受影响，
因为它本来就对称地占满整数个像素。

### strokeWidth 设 0 和不设 stroke 一样吗？

视觉上一样，开销不一样。设了 `stroke` 但宽度为 0，Konva 仍然会走描边的代码路径，
只是画不出东西。

不需要描边就完全不要设 `stroke` 属性。另外，有描边的图形还会触发
[完美绘制](/docs/performance/disable-perfect-draw)的额外处理，
以及在命中图上多画一遍描边。

### 描边让图形的包围盒变大了？

是的，`getClientRect()` 返回的是视觉包围盒，包含描边和阴影。
`strokeWidth: 4` 的图形，包围盒比几何尺寸大 4（两侧各 2）。

做自动布局、碰撞检测时要留意用的是哪一个。只要几何尺寸用 `getSelfRect()`。

这也是 [Transformer 的缩放限制](/docs/select-and-transform/resize-limits)里
「包围盒 200 而几何宽 196」的成因。

## 性能提示

描边的成本容易被低估，它在三个地方产生开销：

**场景图绘制**。复杂路径的描边比填充贵——填充只要判断内外，
描边要沿路径生成一条带状区域。

**命中图绘制**。有描边的图形在命中图上也要画一遍描边。
大多数情况下这一份可以省掉，见[描边绘制优化](/docs/performance/optimize-strokes)。

**完美绘制**。同时有填充、描边和透明度时，Konva 会用离屏画布做合成。
不需要时关掉 `perfectDrawEnabled`。

另外，`hitStrokeWidth` 可以在不改变视觉的前提下放大描边的命中范围，
这对细线条的可操作性至关重要。
