---
title: '移动端事件'
description: '用 Konva 的 on() 绑定移动端事件：支持 touchstart、touchmove、touchend、tap、dbltap 以及拖拽相关事件。'
sidebar_position: 3
---

Konva 原生支持触摸事件，但触摸与鼠标在语义上有几处不对等，需要区别对待。

## 用法

要使用`Konva`将事件处理程序绑定到移动设备上的形状，我们可以使用`on（）`方法.      
  
使用`on（）`方法需要事件类型和回调函数 .   
`Konva` 支持  `touchstart`，`touchmove`，`touchend`，`tap`，`dbltap`，`dragstart`，`dragmove`和`dragend`移动事件。 



注意：此示例仅适用于iOS和Android移动设备，因为它使用触摸事件而不是鼠标事件。  

说明：将手指移动到三角形上以查看触摸坐标，然后开始触摸、结束触摸圆形。

<iframe src="/downloads/code/events/Mobile_Events.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Mobile Touch Events Demo</title>
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

    var triangle = new Konva.RegularPolygon({
      x: 80,
      y: 120,
      sides: 3,
      radius: 80,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4
    });

    var text = new Konva.Text({
      x: 10,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 24,
      text: '',
      fill: 'black'
    });


    var circle = new Konva.Circle({
      x: 230,
      y: 100,
      radius: 60,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    triangle.on('touchmove', function() {
      var touchPos = stage.getPointerPosition();
      var x = touchPos.x - 190;
      var y = touchPos.y - 40;
      writeMessage('x: ' + x + ', y: ' + y);
    });

    circle.on('touchstart', function() {
      writeMessage('Touchstart circle');
    });
    circle.on('touchend', function() {
      writeMessage('Touchend circle');
    });

    layer.add(triangle);
    layer.add(circle);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 怎么拿到多个触摸点？

通过原生事件对象：`e.evt.touches` 是当前屏幕上的所有触点，
`e.evt.changedTouches` 是本次事件涉及的触点。

做双指缩放这类手势时，判断 `e.evt.touches.length === 2`，
再从两个触点算出距离变化。Konva 本身不提供手势识别，这部分要自己写。

### 触摸点的坐标该怎么取？

用 `stage.getPointerPosition()`，不要直接读 `touch.clientX`。

前者已经把舞台的位置、缩放、容器滚动都换算进去了，返回的是舞台坐标系里的点；
后者是视口坐标，在舞台有缩放或页面有滚动时完全对不上。

多点触控时用 `stage.getPointersPositions()` 取全部触点的舞台坐标。

### tap 和 touchstart 该用哪个？

`tap` 是完整的一次点按——手指按下再抬起，且中间没有明显移动。语义上对应 `click`。

`touchstart` 在手指刚接触时就触发，响应更快，但用户滑走取消的机会没有了。

按钮类交互用 `tap`，误触代价低。需要即时反馈的（例如画笔起笔）用 `touchstart`。

## 国内环境注意事项

国产浏览器与各类 App 内置 WebView 对触摸事件的处理差异不小，几个常见问题：

**手势冲突**。微信、UC、QQ 浏览器都有自己的边缘返回、下拉刷新手势，
它们会优先拦截，画布收不到完整的触摸序列。表现为靠近屏幕边缘的拖拽做到一半就断了。
应对办法是在容器上设 `touch-action: none`，并给画布留出安全边距。

**事件顺序**。少数内核会在 `touchend` 之后补发鼠标事件，导致同一次操作触发两遍。
把 `tap` 和 `click` 写在同一个 `on()` 里可以让 Konva 帮你去重。

**长按菜单**。长按图片会弹出系统的保存菜单，打断交互。
在容器上设 `-webkit-touch-callout: none` 并对 `contextmenu` 事件 `preventDefault` 可以抑制。
