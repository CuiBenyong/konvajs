---
title: 'Custom 自定义图形'
description: '用 Konva.Shape 创建自定义图形：在 sceneFunc 中拿到 Canvas 上下文自行绘制，并调用 context.fillStrokeShape(shape) 让 Konva 接管填充、描边与阴影。'
sidebar_position: 20
---

当内置图形都表达不了时，自定义图形让你直接拿到 Canvas 上下文作画。

## 用法

T要使用`Konva`创建自定义形状, 我们可以实例化一个`Konva.Shapew()`对象.  
当创建自定义形状时,我们需要定义一个通过Konva.Canvas渲染器传递的绘图函数.
我们可以使用渲染器来访问HTML5 Canvas上下文,并使用像`context.fillStrokeShape(this)`这样的特殊方法,它会自动处理填充,描边和阴影.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Shape.html" target="_blank">Konva.Shape</a>文档

<iframe src="/downloads/code/shapes/Custom.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Custom Shape Demo</title>
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

    /*
    * create a triangle shape by defining a
    * drawing function which draws a triangle
    */
    var triangle = new Konva.Shape({
      sceneFunc: function(context) {
        context.beginPath();
        context.moveTo(20, 50);
        context.lineTo(220, 80);
        context.quadraticCurveTo(150, 100, 260, 170);
        context.closePath();

        // Konva specific method
        context.fillStrokeShape(this);
      },
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4
    });

    // add the triangle shape to the layer
    layer.add(triangle);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### fill、stroke、shadow 属性为什么全都不生效？

`sceneFunc` 里必须调用 `context.fillStrokeShape(shape)`。Konva 的样式属性不会
自动应用——它把上下文交给你之后，需要你主动告诉它「现在按节点的样式把这条路径
填充并描边」。

```js
sceneFunc: (context, shape) => {
  context.beginPath();
  // ...绘制路径...
  context.closePath();
  context.fillStrokeShape(shape);
},
```

漏掉这一行，路径画了但没有任何填充和描边，画面上什么都看不到。

### 自定义图形的点击区域为什么是个矩形？

没有 `hitFunc` 时，Konva 用节点的包围盒作为命中区域。对于凹形、镂空、
细长斜线这类图形，包围盒和实际形状差别很大，点空白处也会触发事件。

需要精确命中时另写一个 `hitFunc`，画法和 `sceneFunc` 一样，
只是最后调用 `context.fillStrokeShape(shape)` 时 Konva 会把它画到命中图上。
命中图可以比视觉图形简化，这也是性能优化的常用手段。

### sceneFunc 里抛异常会怎样？

该帧的绘制会中断，这个图形之后的内容不会被画出来。

Konva 10.4.0 修复了一个更严重的问题：此前 `sceneFunc` 抛异常会让节点停留在
损坏状态，之后即使修好也无法恢复正常绘制。现在节点状态能正确恢复，
但异常本身仍会中断当前帧，所以 `sceneFunc` 里的边界情况要自己兜住。

## 性能提示

`sceneFunc` 每一帧都会执行。把不随帧变化的东西提到外面去——路径顶点的计算、
渐变对象的创建、正弦余弦这类三角运算，都不该放在回调里反复做。

渐变尤其值得注意：`context.createLinearGradient()` 每次调用都会新建一个对象，
放在 `sceneFunc` 里意味着每帧都在制造垃圾。把它建好存在闭包或节点属性上复用。

如果自定义图形本身复杂且不常变化，直接 `cache()` 成位图，
这样 `sceneFunc` 只在缓存时执行一次。
