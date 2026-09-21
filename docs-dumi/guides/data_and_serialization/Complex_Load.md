---
order: 3
group:
  title: 数据序列化
  order: 7
title: 复杂导出
description: ''
keywords: []
---

要使用Konva加载一个包含图片和事件绑定的复杂舞台，我们需要先使用`Konva.Node.create()`创建一个舞台节点，然后通过`get()`方法, 结合选择器, 手动的添加图片和事件操作. 图片和事件操作必须手动地进行设置, 因为它们是无法被序列化的.

<iframe src="/downloads/code/data_and_serialization/Complex_Load.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Load Complex Stage Demo</title>
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
    var json = '{"attrs":{"width":578,"height":200},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"width":"auto","height":"auto","text":"Text Shadow!","fontFamily":"Calibri","fontSize":95,"x":20,"y":20,"stroke":"red","strokeWidth":2,"shadowColor":"black","shadowBlur":2,"shadowOffsetX":10,"shadowOffsetY":10,"shadowOpacity":0.5},"className":"Text"},{"attrs":{"stroke":"green","strokeWidth":10,"lineJoin":"round","lineCap":"round","points":[{"x":50,"y":140},{"x":450,"y":160}],"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5},"className":"Line"},{"attrs":{"x":280,"y":100,"width":100,"height":50,"fill":"#00D2FF","stroke":"black","strokeWidth":4,"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5,"rotation":0.3490658503988659,"id":"blueRectangle"},"className":"Rect"},{"attrs":{"x":100,"y":41,"width":106,"height":118,"id":"yodaImage"},"className":"Image"}]}]}';

    var stage = Konva.Node.create(json, 'container');

    /*
    * set functions
    */
    stage.get('#blueRectangle').on('mouseover mouseout', function() {
        var stroke = this.stroke();
        this.stroke(stroke === 'black' ? 'red' : 'black');
        stage.draw();
    });
    /*
    * set images
    */
    var imageObj = new Image();
    imageObj.onload = function() {
        stage.get('#yodaImage')[0].image(imageObj);
        stage.draw();
    };
    imageObj.src = '/assets/yoda.jpg';
</script>

</body>
</html>
```
