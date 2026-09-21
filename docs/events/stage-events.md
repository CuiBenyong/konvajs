---
title: 'Stage 事件'
description: 'Konva 的事件从图形开始冒泡，点击空白处不会触发任何事件。本文给出两种方案：铺一层透明矩形，或监听 contentClick 等 content 系列事件。'
sidebar_position: 14
---

点击画布空白处不会触发任何图形事件。要响应它，有两种思路。

## 用法

所有事件都从图形开始。 因此，如果您点击画布上的空白空间，点击事件将不会触发图层，甚至没有触发阶段对象。 但是如果你真的需要监控在`Konva.Stage`上空的空间点击（或任何其他类似的事件），你可以： 

1. 创建与`Stage`相同大小的透明矩形，并添加到形状的底部  
2. 或特意监听`content`事件。
  支持的`content`事件：  
`contentMouseover`，`contentMousemove`，`contentMouseout`，   `contentMousedown`，`contentMouseup`，      
`contentClick`，`contentDblclick`，  `contentTouchstart`，`contentTouchmove`，`contentTouchend`，  
`contentTap`，`contentDblTap`.  
说明:点击任何地方,然后查看控制台.

<iframe src="/downloads/code/events/Stage_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Stage Events Demo</title>
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
    // add the layer to the stage
    stage.add(layer);

    var circle = new Konva.Circle({
      x: stage.width() / 2,
      y: stage.height() / 2,
      fill: 'blue',
      radius: 30
    });

    layer.add(circle).draw();

    // don't trigger on empty space
    stage.on('click', function() {
      console.log('usual click on ' + JSON.stringify(stage.getPointerPosition()));
    });

    // trigger every where
    stage.on('contentClick', function() {
      console.log('content click on ' + JSON.stringify(stage.getPointerPosition()));
    });
  </script>

</body>
</html>
```

## 常见问题

### 为什么点空白处什么都没发生？

Konva 的事件从图形开始冒泡。空白处没有图形，命中检测返回空，
自然不会有事件沿着链条往上传。

这不是 bug，而是命中检测机制的直接结果——舞台不是一个「图形」，
它没有自己的可命中区域。

### 铺一个透明矩形是不是最简单的办法？

通常是。做一个和舞台等大的 `Konva.Rect`，放在最底层，
给它绑事件即可：

```js
const bg = new Konva.Rect({ width: stage.width(), height: stage.height() });
layer.add(bg);
bg.moveToBottom();
```

注意**不要设 `fill`**——不填充的图形不参与命中检测，那样又点不中了。
要透明又可点，设 `fill: 'rgba(0,0,0,0)'` 或者给它一个 `hitFunc`。

另外舞台尺寸变化时要同步更新这个矩形的大小。

### content 事件和图形事件有什么区别？

`contentClick`、`contentMousemove` 这类事件由舞台直接派发，
**不参与图形的冒泡链**，因此也拿不到有意义的 `e.target`。

它们在整个舞台范围内都会触发——点在图形上也会触发 `contentClick`，
和图形自己的 `click` 并行发生。如果两边都绑了处理器，一次点击会走两套逻辑。

所以它适合「不关心点到了什么，只要知道舞台被点了」的场景，
比如记录坐标、关闭浮层。

## 与其他方案的取舍

**透明矩形**的优点是它就是个普通图形——参与冒泡、有 `e.target`、
可以用[事件委托](/docs/events/event-delegation)统一处理。缺点是要自己维护尺寸，
而且它会出现在 `find()` 的结果里，遍历时得记得排除。

**content 事件**不需要额外节点，也不用管尺寸。但它与图形事件是两套并行的机制，
混用时容易出现「一次点击触发两处逻辑」，需要自己协调。

判断依据：需要区分点到了空白还是图形，用透明矩形加 `e.target` 判断最直接；
只是想在舞台任意位置捕获坐标，用 content 事件更轻。
