---
title: '控制对象是否被监听事件'
description: '用 Konva 的 listening() 控制节点是否参与事件监听。改变该属性后需要重绘受影响图层的命中图，事件才会真正生效。'
sidebar_position: 9
---

`listening` 控制一个节点是否参与命中检测。关掉它，节点仍然可见，但对指针完全透明。

## 用法

使用`Konva`设置监听事件,我们可以设置是否监听
当对象被实例化时，配置对象的属性为`true`或`false`，
或者我们可以使用`setListening（）`方法设置`listen`属性。
一旦我们为一个或多个节点设置了侦听属性，我们也需要
使用`drawHit（）`方法重绘每个受影响图层的命中图。  

说明：鼠标经过椭圆形以观察事件监听未执行。
单击“Listen”开始监听事件，并观察事件处理程序现在是否被执行。

<iframe src="/downloads/code/events/Listen_for_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Listen or Don’t Listen to Events Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        top: 5px;
        left: 10px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
    <button id="listen">
      Listen
    </button> 
    <button id="dontListen">
      Dont' Listen
    </button>
  </div>
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
      x: 70,
      y: 10,
      fontFamily: 'Calibri',
      fontSize: 24,
      text: '',
      fill: 'black'
    });

    var oval = new Konva.Circle({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      radius: 50,
      scaleX: 2,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
      strokeScaleEnabled: false,
      listening: false
    });

    oval.on('mouseover', function() {
      writeMessage('Mouseover oval');
    });
    oval.on('mouseout', function() {
      writeMessage('');
    });

    layer.add(oval);
    layer.add(text);
    stage.add(layer);

    document.getElementById('listen').addEventListener('click', function() {
      oval.setListening(true);
      layer.drawHit();
    }, false);

    document.getElementById('dontListen').addEventListener('click', function() {
      oval.setListening(false);
      layer.drawHit();
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### 关掉之后子节点还能响应吗？

不能。在容器（图层或分组）上设 `listening(false)`，整棵子树都不再响应，
子节点自己设了 `listening(true)` 也没用。

这个特性很实用——把整个装饰图层一次性关掉，比逐个设置省事得多。

### 改了之后没有立刻生效？

命中图是在图层绘制时生成的，改动 `listening` 之后需要重绘该图层才会反映出来。

Konva 10 默认开启自动重绘，通常会在下一帧自动处理。如果你关掉了
`Konva.autoDrawEnabled`，需要手动调 `layer.draw()`——注意不是 `shape.draw()`，
单个图形的重绘不会重建图层的命中画布。

### 和 visible(false) 有什么区别？

`visible(false)` 是**既不画也不响应**，节点完全不参与渲染。

`listening(false)` 是**照常画，但不响应**。用于那些需要看见、但不该被点到的内容：
背景图、网格线、水印、提示文字。

两者都不会把节点从场景树里移除，遍历时仍然会遇到它们。

## 性能提示

命中检测是逐图形进行的，图形越多开销越大。而一个典型场景里，
真正需要交互的图形往往只占少数——背景、网格、标注文字都不需要响应点击。

把这些装饰性内容关掉监听，收益有两层：命中检测时跳过它们，
以及**它们完全不必被画进命中图**，绘制成本直接减半。

Konva 10.3.2 还做了一项相关优化：设了 `listening: false` 的图层会释放掉
与舞台同样大小的命中画布，重新开启时再创建。对整层都是静态内容的场景，
这能省下可观的内存。

注意从 `false` 改回 `true` 后，命中图要到下一次图层绘制才会重建。
