---
title: 'Sprite 精灵图'
description: '用 Konva.Sprite 播放精灵图动画：animations 定义每个动画的帧矩形序列，frameRate 控制播放速度，start() 启动播放。'
sidebar_position: 9
---

精灵图把多帧画面放在一张图上，靠切换显示区域实现逐帧动画。

## 用法

要使用`Konva`创建一个精灵图动画, 我们可以实例化一个`Konva.Sprite()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Sprite.html" target="_blank">Konva.Sprite</a>文档

<iframe src="/downloads/code/shapes/Sprite.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
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

## 常见问题

### animations 的数值怎么组织？

每一帧四个数：`[x, y, width, height]`，描述该帧在图片上的矩形区域。
一组动画就是若干帧的数值首尾相接拼成的扁平数组。

```js
animations: {
  idle: [0,0,50,50, 50,0,50,50, 100,0,50,50],
}
```

数组长度不是 4 的倍数时行为未定义——最后那组残缺的数值会被当成一帧，
画出错位的内容。

### 设置好了但动画不动？

必须显式调用 `sprite.start()`。仅仅创建节点并 `add` 到图层不会自动播放。

另外，改了 `frameRate` 之后需要重新 `start()` 才会按新速度播放，
正在播放时改这个值不生效。

### 销毁精灵之后 CPU 占用还是下不来？

Konva 10.4.0 之前，`Sprite` 在 `destroy()` 后仍会保留内部定时器，
持续按帧率触发，造成看不见的持续开销。

10.4.0 起这个问题已修复。如果项目还停留在旧版本，习惯上应当先 `stop()` 再 `destroy()`。

## 性能提示

精灵图本身就是为性能设计的——一张图、一次上传 GPU，切帧只是改变绘制的源矩形，
比每帧换一张图便宜得多。

但**不要对 `Sprite` 调用 `cache()`**。缓存会把当前这一帧固定成位图，
之后的帧切换全部失效，看起来就是动画卡住了。这是缓存机制的正常表现：
它缓存的是「此刻的样子」，而精灵图的本质就是这个样子一直在变。

同理，任何持续变化的节点都不该缓存。缓存适用的是静态或低频变化的内容，
详见[图形缓存](/docs/performance/shape-caching)。
