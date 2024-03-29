---
order: 7
group:
  title: 滤镜
  order: 7
title: RGB滤镜
description: ''
keywords: []
---

要使用滤镜在`Konva.Image`我们必须首先使用`cache（）`函数
然后使用滤镜在`filter（）`函数。  

要使用`Konva`更改图像的rgba组合，我们可以使用`Konva.Filters.RGBA`。  
查看所有可用的滤镜，请查看[滤镜](https://konvajs.github.io/api/Konva.Filters.html)文档。  

说明：滑动控件以更改rgba值。 

For all available filters go to [Filters Documentation](https://konvajs.github.io/api/Konva.Filters.html).

<iframe src="/downloads/code/filters/RGBA.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://rawgit.com/konvajs/konva/master/konva.js"></script>
  <meta charset="utf-8">
  <title>Konva RGBA Image Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #controls {
      position: absolute;
      top: 20px;
      left: 20px; 
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="controls">
    Red: <input id="red" type="range" min="0" max="256" step="1" value="150">
    Green: <input id="green" type="range" min="0" max="256" step="1" value="150">
    Blue: <input id="blue" type="range" min="0" max="256" step="1" value="150">
    Alpha: <input id="alpha" type="range" min="0" max="1" step="0.05" value="0.5">
  </div>
  <script>
    Konva.Image.fromURL('../../../assets/lion.png', function(lion) {
      var stage = new Konva.Stage({
        container: 'container',
        width: 300,
        height: 200
      });

      var layer = new Konva.Layer();

      lion.position({
        x: 50,
        y: 50
      });
      lion.cache();
      lion.filters([Konva.Filters.RGBA]);
      layer.add(lion);
      stage.add(layer);

      var sliders = ['red', 'green', 'blue', 'alpha'];
      sliders.forEach(function(attr) {
          var slider = document.getElementById(attr); 
          function update() {
            lion[attr](parseFloat(slider.value));
            layer.batchDraw();    
          }
          slider.oninput = update;
          update();
      });
    });
  </script>

</body>
</html>
```