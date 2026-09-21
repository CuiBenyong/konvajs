---
order: 6
group:
  title: 补间动画
  order: 10
title:  滤镜效果
description: ''
keywords: []
---

要使用Konva创建一个改变滤镜效果的tween动画, 我们可以通过给滤镜上绑定的属性添加过渡效果来实现. 

在本教程中，我们将为滤镜的`blurRadius`属性添加过渡效果，使图像的模糊度在动画中发生改变。

说明：将鼠标悬停在图像上以获得焦点。

<iframe src="/downloads/code/tweens/Tween_Filter.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Tween Filter Demo</title>
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

    var lion = new Konva.Image({
        x: 80,
        y: 30,
        draggable: true
    });
    layer.add(lion);
    stage.add(layer);

    var image = new Image();
    image.onload = function() {
        lion.image(image);
        lion.cache();
        lion.filters([Konva.Filters.Blur]);
        lion.blurRadius(10);
        layer.draw();

        // the tween has to be created after the node has been added to the layer
        var tween = new Konva.Tween({
            node: lion,
            duration: 0.6,
            blurRadius: 0,
            easing: Konva.Easings.EaseInOut
        });

        lion.on('mouseover', function() {
            tween.play();
        });

        lion.on('mouseout', function() {
            tween.reverse();
        });
    };
    image.src = '/assets/lion.png';
  </script>

</body>
</html>
```
