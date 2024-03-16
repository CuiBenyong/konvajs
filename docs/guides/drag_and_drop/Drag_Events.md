---
order: 6
group:
  title: 拖拽/释放
  order: 4
title: 拖拽事件
description: ''
keywords: []
---

要使用`Konva`检测拖放事件，可以使用`on（）`方法
将`dragstart`，`dragmove或``dragend`事件绑定到节点。
`on（）`方法需要事件类型和回调函数。 

<iframe src="/downloads/code/drag_and_drop/Drag_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag Events Demo</title>
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
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
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

    var box = new Konva.Rect({
        x: 20,
        y: 100,
        offset: [50, 25],
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    // write out drag and drop events
    box.on('dragstart', function() {
        writeMessage('dragstart');
    });
    box.on('dragend', function() {
        writeMessage('dragend');
    });

    layer.add(text);
    layer.add(box);

    // add the layer to the stage
    stage.add(layer);
</script>

</body>
</html>
```