---
order: 3
group:
  title: 拖拽/释放
  order: 4
title: 拖拽组
description: ''
keywords: []
---
要使用`Konva`拖放组，我们在实例化组时可以设置`draggable`属性
，设置对象的值为`true`，或者我们可以使用`draggable（）`方法。 

<iframe src="/downloads/code/drag_and_drop/Drag_a_Group.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag and Drop a Group Demo</title>
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

    var shapesLayer = new Konva.Layer();
    var group = new Konva.Group({
        draggable: true
    });
    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

    for(var i = 0; i < 6; i++) {
        var box = new Konva.Rect({
            x: i * 30 + 10,
            y: i * 18 + 40,
            width: 100,
            height: 50,
            name: colors[i],
            fill: colors[i],
            stroke: 'black',
            strokeWidth: 4
        });
        group.add(box);
    }

    group.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    shapesLayer.add(group);
    stage.add(shapesLayer);
</script>

</body>
</html>
```