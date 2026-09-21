---
title: 'Image 图片'
description: '用 Konva.Image 在 Canvas 上渲染图片：传入已加载完成的 HTMLImageElement，并通过 width、height 控制显示尺寸。'
sidebar_position: 10
---

图片是唯一需要等待异步加载的图形，这决定了它的用法和其他图形都不一样。

## 用法

要使用`Konva`渲染一个图片, 我们可以实例化一个`Konva.Image()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.Image.html" target="_blank">Konva.Image</a>文档

<iframe src="/downloads/code/shapes/Image.html" style="width: 50vw;height:300px;"></iframe>


{% include_code Konva Image Demo shapes/Image.html %}

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Image Demo</title>
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
    var imageObj = new Image();
    imageObj.onload = function() {

      var yoda = new Konva.Image({
        x: 50,
        y: 50,
        image: imageObj,
        width: 106,
        height: 118
      });

      // add the shape to the layer
      layer.add(yoda);

      // add the layer to the stage
      stage.add(layer);
    };
    imageObj.src = '/assets/yoda.jpg';
  </script>

</body>
</html>
```

## 常见问题

### 创建了 Konva.Image 但画布上一片空白？

几乎都是因为图片还没加载完。必须在 `onload` 回调里创建 `Konva.Image`，
或者至少在 `onload` 之后调用一次 `layer.draw()`。

```js
const img = new Image();
img.onload = () => {
  layer.add(new Konva.Image({ image: img, x: 0, y: 0, width: 200, height: 150 }));
};
img.src = "/assets/photo.jpg";
```

Konva 10.6.0 修复了一个相关问题：先 `new Image()` 再赋 `src` 的写法此前
不会触发重绘，现在会了。但显式等待 `onload` 仍然是更清楚的写法。

### 图片在高分屏上显得特别大？

不设 `width`、`height` 时按图片的像素尺寸绘制。一张 2x 图会占据两倍的逻辑像素，
看起来就过大了。

始终显式给出 `width` 与 `height`，按你想要的显示尺寸设置，
而不是依赖图片本身的尺寸。

### toDataURL 报 SecurityError 或导出的图片是空白？

画布被跨域图片污染了。只要往 Canvas 上画过一张没有正确 CORS 头的跨域图片，
整个画布就无法再导出。

需要两个条件同时满足：图片服务端返回 `Access-Control-Allow-Origin`，
**并且**客户端在赋 `src` 之前设置 `img.crossOrigin = "anonymous"`。
只做其中一件都不够。

## 国内环境注意事项

跨域导出这件事在国内特别容易踩坑：主流图床与对象存储的默认配置**不返回**
`Access-Control-Allow-Origin`，需要到控制台里单独开启跨域规则。很多团队是在
「导出功能上线后才发现全部失败」时才意识到这一点。

更麻烦的是，`img.crossOrigin = "anonymous"` 在服务端不支持 CORS 时会让图片
**加载失败**——本来还能显示，加了这行反而白屏。所以不能「先加上再说」，
必须先确认服务端配置。

最省心的做法是把需要参与导出的图片与站点同域托管，或者通过自己的服务端代理一层。
如果图片只用于展示、不需要导出，那么不设 `crossOrigin` 即可，跨域不影响绘制。
