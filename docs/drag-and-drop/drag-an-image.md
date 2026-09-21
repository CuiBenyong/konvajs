---
title: '拖拽图片'
description: '拖拽 Konva 图片：实例化 Konva.Image 时设置 draggable 为 true，或调用 draggable() 方法，自动兼容桌面与移动端。'
sidebar_position: 2
---

图片的拖拽与其他图形一样，唯一的特殊之处来自它的异步加载。

## 用法

使用`Konva`拖放图片，当我们实例化一个图片时可以设置`draggable`属性为`true`，  
或者我们可以使用`draggable（）`方法。`draggable（）`方法自动支持桌面应用和移动应用。
<iframe src="/downloads/code/drag_and_drop/Drag_an_Image.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Drag and Drop an Image Demo</title>
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

    function drawImage(imageObj) {
        var stage = new Konva.Stage({
            container: 'container',
            width: width,
            height: height
        });

        var layer = new Konva.Layer();
        // darth vader
        var darthVaderImg = new Konva.Image({
            image: imageObj,
            x: stage.getWidth() / 2 - 200 / 2,
            y: stage.getHeight() / 2 - 137 / 2,
            width: 200,
            height: 137,
            draggable: true
        });

        // add cursor styling
        darthVaderImg.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        darthVaderImg.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        layer.add(darthVaderImg);
        stage.add(layer);
    }
    var imageObj = new Image();
    imageObj.onload = function() {
        drawImage(this);
    };
    imageObj.src = '/assets/darth-vader.jpg';
</script>

</body>
</html>
```

## 常见问题

### 图片刚创建时拖不动？

图片还没加载完时包围盒是零尺寸，命中区域也就不存在，自然点不中。

所以要在 `onload` 之后再创建 `Konva.Image`，或者至少在加载完成后
设置尺寸并重绘：

```js
const img = new Image();
img.onload = () => {
  layer.add(new Konva.Image({ image: img, width: 200, height: 150, draggable: true }));
};
img.src = url;
```

### 大图拖拽卡顿怎么办？

大尺寸图片每帧重绘的开销不小。两个办法：

一是**缓存**。`image.cache()` 把它渲染成位图，之后拖拽只是贴图。
不过图片本身已经是位图，收益主要来自跳过缩放采样，效果不如对复杂矢量图形明显。

二是**拖拽时提到独立图层**。`dragstart` 时 `moveTo(dragLayer)`，`dragend` 时移回，
这样拖拽过程中主内容层完全不重绘，通常收益更大。

### 拖拽多张图片时怎么保持层级？

拖拽不会自动改变层级，被拖的图片可能一直在其他图片下面，
视觉上很怪。

常见做法是在 `dragstart` 时 `node.moveToTop()`。如果需要拖完恢复原层级，
先用 `node.zIndex()` 记下来，`dragend` 时设回去。

## 国内环境注意事项

图片从国内 CDN 加载的耗时波动很大，这会造成一段「界面已经渲染但图片还没出现」的空窗。
用户在这段时间点击拖拽是没有反应的——包围盒还是零。

体验上的处理办法是**先放占位图形**：在图片位置画一个灰色矩形并设为可拖拽，
图片加载完成后替换。这样用户从一开始就能操作，不会以为界面卡住了。

另外，如果图片后续需要参与[导出](/docs/data-and-serialization/stage-data-url)
或[精确命中](/docs/events/image-events)，必须提前确认图床返回了 CORS 头。
国内主流对象存储默认不返回，需要在控制台单独配置跨域规则；
而客户端的 `crossOrigin = 'anonymous'` 在服务端不支持时反而会让图片彻底加载失败，
不能盲目加。
