---
title: 'Opacity 透明度'
description: '用 Konva 的 opacity 属性设置图形透明度，取值 0 到 1，0 为完全透明、1 为完全不透明，默认值为 1。'
sidebar_position: 3
---

透明度会沿着节点树逐层相乘。理解这一点，才能解释很多「颜色不对」的情况。

## 用法

要使用`Konva`设置图形的不透明度,我们可以在实例化形状时设置`opacity`属性,也可以使用`opacity()`方法  

图形可以具有0和1之间的不透明度值，其中0是完全透明的，1是完全不透明的。 除非另有说明，否则所有形状都默认使用不透明度值1。


说明：鼠标经过五边形以更改其透明度。
<iframe src="/downloads/code/styling/Opacity.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Opacity Demo</title>
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
            strokeWidth: 4,
            opacity: 0.5
        });

        pentagon.on('mouseover', function() {
            this.opacity(1);
            layer.draw();
        });

        pentagon.on('mouseout', function() {
            this.opacity(0.5);
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

### 分组的透明度和子节点的透明度会叠加吗？

是**相乘**。分组 `opacity: 0.5`、子节点 `opacity: 0.5`，最终是 0.25。

这常常带来意外：给一个分组加半透明效果，里面本来就半透明的元素会变得几乎看不见。
排查「为什么这个元素这么淡」时，要沿着父链一路检查上去。

### 两个半透明图形重叠，为什么交叠处特别深？

因为它们是分别绘制、依次叠加的，交叠区域被画了两遍。

想让一组图形整体呈现统一的半透明，正确做法是把它们放进一个分组，
把 `opacity` 设在**分组**上。这样 Konva 会先把子节点合成到一起，
再整体按透明度贴回去，交叠处不会加深。

这和[关闭 Perfect Drawing](/docs/performance/disable-perfect-draw)
处理填充与描边交叠的原理是一样的。

### opacity 设为 0 的节点还能点中吗？

能。透明度不影响命中检测——命中图上它照样被画出来。

要让节点不响应事件，用 [`listening(false)`](/docs/events/listen-for-events)；
要让它彻底不存在，用 `visible(false)`。

用 `opacity: 0` 来「隐藏」元素是个常见误用，结果就是用户点到看不见的东西。

## 与其他方案的取舍

三个属性经常被混用，但它们的语义完全不同：

**`opacity(0)`**：画，但完全透明。仍然参与命中检测、仍然消耗绘制开销。
适合做淡入淡出动画的起止状态。

**`visible(false)`**：不画，不响应。开销最低。适合真正的「隐藏」。

**`listening(false)`**：照常画，不响应。适合「看得见但不该被点到」——背景、水印、装饰。

做淡出动画时一个实用组合是：动画把 `opacity` 降到 0，`onFinish` 里再设
`visible(false)`。这样动画过程中可见，结束后彻底不占开销。
