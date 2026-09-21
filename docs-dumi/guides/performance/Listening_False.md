---
order: 8
group:
  title: 性能优化
  order: 9
title: 禁用事件监听
description: ''
keywords: []
---

您可以通过给形状设置`listening(false)`来将其从命中检测区域中移除, 这样可以提高性能. 在某些情况下, 这个方法会非常有用, 并且不会破坏整个应用的逻辑.

例如，我们有一个包含矩形和文本的按钮（组）。 我们需要监听按钮点击。
在这种情况下，我们可以从命中捡测区域中移除文本，只监听在矩形上面的点击操作。

<iframe src="/downloads/code/performance/Listening_False.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Listening False Demo</title>
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

    var button = new Konva.Group({
        x : stage.width() / 2,
        y : stage.height() / 2
    });

    var offset = 10;
    var text = new Konva.Text({
        x : offset,
        y : offset,
        text : 'press me!',
        // as we don't really need text on hit graph we can set:
        listening : false
    });
    var rect = new Konva.Rect({
        width : text.width() + offset * 2,
        height : text.height() + offset * 2,
        fill : 'grey',
        shadowColor : 'black'
    });
    button.add(rect, text);

    button.on('click tap', function() {
        alert('button clicked');
    });

    layer.add(button);
    stage.add(layer);
</script>

</body>
</html>
```
