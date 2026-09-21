---
title: 'Spline 样条曲线'
description: '用 Konva.Line 配合 tension 属性绘制平滑样条曲线，tension 为 0 时退化为折线，数值越大弯曲越明显。'
sidebar_position: 7
---

样条曲线是开放的平滑曲线，与 [Blob](/docs/shapes/line-blob) 的唯一区别是不闭合。

## 用法

要使用`Konva`创建一个曲线(样条), 我们可以实例化一个`Konva.Line()`对象和`tension`属性.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Line.html" target="_blank" >Konva.Line</a>文档

<iframe src="/downloads/code/shapes/Line_-_Spline.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Line Spline Demo</title>
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

    var redLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'red',
      strokeWidth: 15,
      lineCap: 'round',
      lineJoin: 'round',
      tension : 1
    });

    // dashed line
    var greenLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'green',
      strokeWidth: 2,
      lineJoin: 'round',
      /*
       * line segments with a length of 33px
       * with a gap of 10px
       */
      dash: [33, 10],
      lineCap: 'round',
      tension : 0.5
    });

    // complex dashed and dotted line
    var blueLine = new Konva.Line({
      points: [5, 70, 140, 23, 250, 60, 300, 20],
      stroke: 'blue',
      strokeWidth: 10,
      lineCap: 'round',
      lineJoin: 'round',
      /*
      * line segments with a length of 29px with a gap
      * of 20px followed by a line segment of 0.001px (a dot)
      * followed by a gap of 20px
      */
      dash: [29, 20, 0.001, 20],
      tension : 0.7
    });

    /*
    * since each line has the same point array, we can
    * adjust the position of each one using the
    * move() method
    */
    redLine.move({
      x : 20,
      y : 5
    });
    greenLine.move({
      x : 20,
      y : 55
    });
    blueLine.move({
      x : 20,
      y : 105
    });

    layer.add(redLine);
    layer.add(greenLine);
    layer.add(blueLine);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 为什么画出来还是折线？

`tension` 的默认值是 0，此时样条退化为直线段连接。必须显式设置一个正值，
常用范围是 0.3 到 0.6。

这是最常见的「功能没生效」原因——代码里用了 `Konva.Line` 想画曲线，
却没设 `tension`。

### getClientRect 返回的范围比 points 的包围盒还大？

是正常的。样条为了平滑会在顶点之间「冲出」一点，曲线的极值点可能落在
所有顶点构成的包围盒之外，`tension` 越大冲出越多。

做自动布局或碰撞检测时要用 `getClientRect()` 的实际值，不要拿 `points` 自己算——
后者会小于真实占据的范围。

### 逐帧修改 points 做动画时曲线为什么会跳变？

如果每帧传入的数组长度不同，Konva 要重新推导全部控制点，曲线形状会整体重算，
视觉上就是跳变。

做曲线动画时保持点数不变、只改坐标值，曲线就会平滑过渡。确实需要增删点时，
考虑先在目标位置插入一个与相邻点重合的点，再把它移动到位。

## 性能提示

样条比同样点数的折线贵——每段都要计算控制点并绘制三次贝塞尔曲线，而折线只是
`lineTo`。点数很多的曲线（例如手绘轨迹）要留意这个成本。

高频更新的曲线上，关掉 `perfectDrawEnabled` 并避免使用 `shadow`。阴影会让每一帧
都多一遍模糊计算，是手绘、轨迹回放这类场景掉帧的常见原因。

如果曲线画完后不再变化，`cache()` 成位图；但正在被拖动编辑的曲线不要缓存，
那样每帧都要重建缓存，反而更慢。
