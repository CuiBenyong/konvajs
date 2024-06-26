---
order: 9
group:
  title: 图形
  order: 1
title: Sprite 精灵图
description: ''
keywords: []
---
要使用`Konva`创建一个精灵图动画, 我们可以实例化一个`Konva.Sprite()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.github.io/api/Konva.Sprite.html" target="__blank">Konva.Sprite</a>文档

<iframe src="/downloads/code/shapes/Sprite.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Sprite Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #punch {
      position: absolute;
      top: 0;
      left: 0;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <button id="punch">Punch</button>
  <script>
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height
    });

    var layer = new Konva.Layer();
    var animations = {
      idle: [
        2, 2, 70, 119,
        71, 2, 74, 119,
        146, 2, 81, 119,
        226, 2, 76, 119
      ],
      punch: [
        2, 138, 74, 122,
        76, 138, 84, 122,
        346, 138, 120, 122
      ]
    };

    var imageObj = new Image();
    imageObj.onload = function() {

      var blob = new Konva.Sprite({
        x: 50,
        y: 50,
        image: imageObj,
        animation: 'idle',
        animations: animations,
        frameRate: 7,
        frameIndex: 0
      });

      // add the shape to the layer
      layer.add(blob);

      // add the layer to the stage
      stage.add(layer);


      // start sprite animation
      blob.start();

      // resume transition
      document.getElementById('punch').addEventListener('click', function() {
        blob.setAnimation('punch');
        blob.on('frameIndexChange.button', function() {
          if (this.frameIndex() === 2) {
            setTimeout(function() {
              blob.setAnimation('idle');
              blob.off('.button');
            }, 1000 / blob.frameRate());

          }
        });
      }, false);
    };
    imageObj.src = '/assets/blob-sprite.png';
  </script>

</body>
</html>
```
