---
title: '桌面/移动端事件支持'
description: '用事件对同时兼容桌面与移动端：on() 中传入 "mousedown touchstart"、"mouseup touchend" 这样的组合，一次绑定覆盖两种设备。'
sidebar_position: 6
---

同一份交互逻辑要同时服务鼠标和手指，Konva 的做法是把两套事件名写在一起。

## 用法

要向使用`Konva`为PC端和移动端工作的形状添加事件处理程序，我们可以使用`on（）`方法并传递配对的事件。    

例如，为了在桌面和移动应用程序上触发`mousedown`事件，我们可以使用“mousedown touchstart”事件对来覆盖这两种媒体。  
  
为了在桌面和移动应用程序上触发mouseup事件，我们可以使用“mouseup touchend”事件对。  

我们还可以使用“dblclick dbltap”事件对来绑定适用于桌面设备和移动设备的双击事件。   



说明：在桌面设备或移动设备上进行鼠标移动，鼠标向上，触摸启动或触摸圈子，以观察相同的功能。

<iframe src="/downloads/code/events/Desktop_and_Mobile.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Desktop and Mobile Events Support Demo</title>
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
      fontSize: 20,
      text: '',
      fill: 'black'
    });


    var circle = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2 + 10,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4
    });

    /*
    * mousedown and touchstart are desktop and
    * mobile equivalents so they are often times
    * used together
    */
    circle.on('mousedown touchstart', function() {
      writeMessage('Mousedown or touchstart');
    });
    /*
    * mouseup and touchend are desktop and
    * mobile equivalents so they are often times
    * used together
    */
    circle.on('mouseup touchend', function() {
      writeMessage('Mouseup or touchend');
    });

    layer.add(circle);
    layer.add(text);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### click 和 tap 都绑了，触屏上会执行两次吗？

会。触屏浏览器在手指抬起后既派发触摸事件，也会补发一次兼容性的鼠标事件，
于是 `tap` 和 `click` 先后各触发一次，处理器执行两遍。

正确写法是把它们绑在**同一个** `on()` 调用里：`shape.on('click tap', handler)`。
Konva 会做去重，同一次交互只执行一次。分两次 `on()` 绑定则不会去重。

### 为什么有时候触屏上要等一下才响应？

历史原因是移动浏览器的 300 毫秒点击延迟——浏览器要等一下，确认用户不是在双击缩放。

现代浏览器在页面声明了 `<meta name="viewport" content="width=device-width">` 之后
会取消这个延迟。如果你的页面没有这行 meta，或者允许用户缩放，延迟就还在。

追求极致响应可以改用 `touchstart`，但要接受「手指按下即触发」的语义——
用户滑动取消的机会就没有了。

### 事件对都有哪些？

常用的四组：`mousedown touchstart`、`mouseup touchend`、`mousemove touchmove`、
`click tap`。双击是 `dblclick dbltap`。

注意没有触摸版的 `mouseover` / `mouseout`——手指没有「悬停」这个状态。
依赖悬停的交互在触屏上必须有替代方案，这一点见[鼠标指针样式](/docs/styling/mouse-cursor)。

## 国内环境注意事项

微信内置浏览器是国内最主要的移动端运行环境，它对手势的处理比标准浏览器更激进。

两个具体影响：**左右边缘的横向滑动**会被识别为返回上一页，画布上靠近屏幕边缘的
水平拖拽因此经常失效；**双指操作**可能被判定为页面缩放而不传给画布。

应对办法是给画布留出边距，不要让可拖拽内容贴着屏幕边缘；
需要双指手势时在容器上设置 `touch-action: none` 把手势控制权拿回来。

另外，部分国产浏览器的「无痕」或「极速」模式会改变事件派发顺序，
如果收到用户反馈说某些机型点不动，值得让他们试试切换浏览器内核。
