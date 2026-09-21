---
title: '自定义事件监听范围'
description: '用 Konva 的 hitFunc 自定义命中区域：可以把可点击范围做得比图形本身更大以便于操作，也可简化命中图绘制来提升渲染性能。'
sidebar_position: 10
---

命中检测走的是一张看不见的画布。自定义它，可以让点击范围与视觉形状解耦。

## 用法

要为使用Konva的形状创建自定义命中空间函数，我们可以设置
`drawHitFunc`属性。 命中空间函数是`Konva`的内置函数
将使用在用于命中检测的区域。   
使用自定义命中
函数可以有几个好处，如使命中区域更大
使得用户更容易与形状进行交互，从而形成一些部分
的图形可检测区域和其大小不一致，且简化命中绘制功能
以提高渲染性能。  

说明：鼠标经过，离开，按下和弹起在星图和
观察到击中区域,是包围该形状的更大尺寸的圆。

<iframe src="/downloads/code/events/Custom_Hit_Region.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Custom Hit Function Demo</title>
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
    function writeMessage(message) {
      text.setText(message);
      layer.draw();
    }

    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var text = new Konva.Text({
      x: 10,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 24,
      text: '',
      fill: 'black'
    });

    var star = new Konva.Star({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      numPoints: 7,
      innerRadius: 50,
      outerRadius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
      hitFunc: function(context) {
        context.beginPath();
        context.arc(0, 0, this.getOuterRadius() + 10, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStrokeShape(this);
      }
    });

    star.on('mouseover', function() {
      writeMessage('Mouseover star');
    });
    star.on('mouseout', function() {
      writeMessage('Mouseout star');
    });
    star.on('mousedown', function() {
      writeMessage('Mousedown star');
    });
    star.on('mouseup', function() {
      writeMessage('Mouseup star');
    });

    layer.add(star);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### hitFunc 里也要调用 fillStrokeShape 吗？

要。和 `sceneFunc` 一样，画完路径后必须调用：

```js
hitFunc: (context, shape) => {
  context.beginPath();
  // ...画路径...
  context.closePath();
  context.fillStrokeShape(shape);
},
```

漏掉这一行，命中图上什么都没画，结果是该图形完全点不中——而视觉上一切正常，很难联想到是命中函数的问题。

### 命中图里用什么颜色有影响吗？

没有。命中图是一张独立的隐藏画布，Konva 会给每个图形分配一个内部标识色来做识别，
你在 `hitFunc` 里设的颜色会被忽略。

所以不用纠结填充色，专注把形状画对就行。想调试命中区域长什么样，
用 `layer.toggleHitCanvas()` 把这张画布显示出来。

### 命中区域可以和视觉形状完全不同吗？

可以，而且这正是它的价值。两个典型用法：

一是**放大可点区域**。一条 1 像素的细线几乎点不中，给它一个宽 10 像素的矩形命中区，
手感立刻变好。线条类图形还有个更简单的办法：设 `hitStrokeWidth`。

二是**简化复杂图形**。一个有几百个顶点的路径，命中检测要逐点判断；
用一个矩形近似，精度损失可以接受，开销却小得多。

## 性能提示

命中图和场景图是两张画布，每次重绘都要各画一遍。这意味着**图形的绘制成本实际上是双份的**。

优化命中图有两个方向。一是简化形状——复杂路径用包围盒或凸多边形近似，
视觉上没有任何变化，命中绘制却快得多。二是干脆不画——纯装饰的图形设
[`listening(false)`](/docs/events/listen-for-events)，它就完全不进命中图。

一个容易忽略的点：`hitFunc` 里的计算和 `sceneFunc` 一样每帧都会跑。
把顶点计算提到外面，不要在回调里现算。
