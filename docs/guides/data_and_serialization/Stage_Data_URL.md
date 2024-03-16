---
order: 5
group:
  title: 数据序列化
  order: 7
title: 舞台 Data URL
description: ''
keywords: []
---
要获取Konva舞台的Data URL，我们可以使用`toDataURL()`方法和一个`Stage`的回调函数（对于其他节点不需要回调函数）。此外，我们还可以传递MIME类型的数据，例如image / jpeg, 和一个范围在0和1之间的图片质量值。我们还可以获取特定节点的Data URL，包括层，组和形状。

*注意：`toDataURL()`方法要求需要绘制的图形必须托管在和执行绘制的代码文件相同域名的服务器上。
如果不满足此条件，就会抛出SECURITY_ERR异常。*

说明：拖拽矩形，然后单击保存按钮以获取画布的data url，并在新窗口中打开生成的图片

<iframe src="/downloads/code/data_and_serialization/Stage_Data_URL.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.rawgit.com/konvajs/konva/1.4.0/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Stage Data URL Demo</title>
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
        #buttons > input {
            padding: 10px;
            display: block;
            margin-top: 5px;
        }
    </style>
</head>
<body>
<div id="container"></div>
<div id="buttons">
    <button id="save">
        Save as image
    </button>
</div>
<script>
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
    });

    var layer = new Konva.Layer();

    var rectX = stage.getWidth() / 2 - 50;
    var rectY = stage.getHeight() / 2 - 25;

    var box = new Konva.Rect({
        x: rectX,
        y: rectY,
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    box.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });

    box.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    layer.add(box);
    stage.add(layer);

    document.getElementById('save').addEventListener('click', function() {
        var dataURL = stage.toDataURL();
        window.open(dataURL);
    }, false);
</script>

</body>
</html>
```
