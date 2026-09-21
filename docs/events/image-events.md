---
title: '图片事件'
description: '用 Konva 的 drawHitFromCache() 生成精确的图片命中区域，使透明像素不再响应事件——默认情况下图片的透明部分同样可点击。'
sidebar_position: 2
---

图片默认按整个矩形响应事件，透明像素也算在内。想让抠图后的形状精确响应，需要额外一步。

## 用法

##使用`Konva`的HTML5 Canvas 图片事件  

为了仅使用`Konva`检测图像中非透明像素的事件，我们可以使用`drawHitFromCache（）`方法生成更精确的图像命中区域。  
默认情况下，即使图片内部的像素透明，也可以触发事件。 `drawHitFromCache（）`方法还接受一个可选的回调函数，以便在创建图像匹配区域时执行。  
注意：`drawHitFromCache（）`方法要求图像托管在与执行它的代码相同域的Web服务器上。  

说明：将鼠标放在猴子和狮子上，观察mouseover事件绑定。 请注意，如果您将鼠标悬停在图片的任何部分（包括透明像素）上，则会为猴子触发事件。 因为我们为狮子创建了图像命中区域，所以忽略透明像素，这使得能够进行更精确的事件检测。

<iframe src="/downloads/code/events/Image_Events.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Image Events Demo</title>
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
    function loadImages(sources, callback) {
      var images = {};
      var loadedImages = 0;
      var numImages = 0;
      for(var src in sources) {
        numImages++;
      }
      for(var src in sources) {
        images[src] = new Image();
        images[src].onload = function() {
          if(++loadedImages >= numImages) {
            callback(images);
          }
        };
        images[src].src = sources[src];
      }
    }
    function buildStage(images) {
      var monkey = new Konva.Image({
        image: images.monkey,
        x: 120,
        y: 50
      });

      var lion = new Konva.Image({
        image: images.lion,
        x: 280,
        y: 30
      });

      monkey.on('mouseover', function() {
        writeMessage('mouseover monkey');
      });

      monkey.on('mouseout', function() {
        writeMessage('');
      });

      lion.on('mouseover', function() {
        writeMessage('mouseover lion');
      });

      lion.on('mouseout', function() {
        writeMessage('');
      });

      lion.cache();
      lion.drawHitFromCache();

      layer.add(monkey);
      layer.add(lion);
      layer.add(text);
      stage.add(layer);
    }
    var stage = new Konva.Stage({
      container: 'container',
      width: 578,
      height: 200
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

    var sources = {
      lion: '/assets/lion.png',
      monkey: '/assets/monkey.png'
    };

    loadImages(sources, buildStage);
  </script>

</body>
</html>
```

## 常见问题

### 为什么点图片的透明区域也会触发事件？

因为命中图上画的是图片的**矩形边界**，Konva 并不知道哪些像素是透明的。

对一张抠好的 PNG 来说，这意味着角落的空白处同样可点。多张图片叠放时问题更明显——
上层图片的透明区域会挡住下层图片的点击。

### drawHitFromCache 怎么用？

它读取图片的像素数据，按 Alpha 通道重建命中图：

```js
image.cache();
image.drawHitFromCache();
```

必须先 `cache()`——它要从缓存的位图上读像素。可以传一个 0 到 255 的阈值参数，
决定多透明才算「不可点」，默认是 0（只有完全透明才排除）。

图片换了之后要重新执行这两步，否则命中图还是旧形状。

### 调用之后报 SecurityError？

画布被跨域图片污染了。`drawHitFromCache` 需要读取像素，
而被污染的画布禁止 `getImageData`。

解决办法和[导出图片](/docs/data-and-serialization/stage-data-url)一样：
图片服务端要返回 `Access-Control-Allow-Origin`，客户端要在赋 `src` 前设
`crossOrigin = 'anonymous'`，两个条件缺一不可。

## 国内环境注意事项

这一页的功能对跨域特别敏感，而国内的图片托管普遍不满足条件。

主流对象存储与图床默认**不返回** CORS 响应头，需要到控制台单独配置跨域规则。
没配的话，`drawHitFromCache` 会在调用时抛 `SecurityError`，
而普通的图片显示却一切正常——问题只在你用到像素读取时才暴露。

更麻烦的是 `crossOrigin = 'anonymous'` 的副作用：服务端不支持 CORS 时，
加上这行会让图片**彻底加载失败**，从「能显示但点击不精确」退化成「什么都看不见」。
所以不能盲目加，必须先确认服务端配置。

最稳妥的做法是把需要精确命中的图片与站点同域托管，或者经自己的服务端代理一层。
