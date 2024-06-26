---
order: 2
group:
  title: 分组、图层
  order: 8
title: 分层
description: ''
keywords: []
---

要使用`Konva`的层，我们可以使用以下分层方法之一：
`moveToTop（）`，`moveToBottom（）`，`moveUp（）`，`moveDown（）`或`zIndex（）`。  
您还可以区分层组和层。  

说明：拖放移动它们，然后使用 按钮重新排序。 


<iframe src="/downloads/code/groups_and_layers/Layering.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@9.3.6/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Shape Layering Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        left: 10px;
        top: 0px;
    }
    button {
        margin-top: 10px;
        display: block;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <button id="toTop">
          Move yellow box to top
      </button>
      <button id="toBottom">
          Move yellow box to bottom
      </button>
      <button id="up">
          Move yellow box up
      </button>
      <button id="down">
          Move yellow box down
      </button>
      <button id="zIndex">
          Set yellow box zIndex to 3
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
    var offsetX = 0;
    var offsetY = 0;
    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    var yellowBox = null;

    for(var n = 0; n < 6; n++) {
        // anonymous function to induce scope
        (function() {
            var i = n;
            var box = new Konva.Rect({
                x: i * 30 + 210,
                y: i * 18 + 40,
                width: 100,
                height: 50,
                fill: colors[i],
                stroke: 'black',
                strokeWidth: 4,
                draggable: true,
                name: colors[i]
            });

            box.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
            });
            box.on('mouseout', function() {
                document.body.style.cursor = 'default';
            });
            if(colors[i] === 'yellow') {
                yellowBox = box;
            }
            layer.add(box);
        })();
    }

    stage.add(layer);

    // add button event bindings
    document.getElementById('toTop').addEventListener('click', function() {
        yellowBox.moveToTop();
        layer.draw();
    }, false);

    document.getElementById('toBottom').addEventListener('click', function() {
        yellowBox.moveToBottom();
        layer.draw();
    }, false);

    document.getElementById('up').addEventListener('click', function() {
        yellowBox.moveUp();
        layer.draw();
    }, false);

    document.getElementById('down').addEventListener('click', function() {
        yellowBox.moveDown();
        layer.draw();
    }, false);

    document.getElementById('zIndex').addEventListener('click', function() {
        yellowBox.setZIndex(3);
        layer.draw();
    }, false);
  </script>

</body>
</html>
```