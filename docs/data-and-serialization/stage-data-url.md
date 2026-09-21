---
title: '舞台 Data URL'
description: '用 Konva 的 toDataURL() 把舞台导出为 Data URL，可指定 MIME 类型与图片质量。注意画布被跨域图片污染后该方法会失败。'
sidebar_position: 5
---

`toDataURL()` 把画布导出为图片。它最常见的失败原因是跨域，其次是性能。

## 用法

要获取Konva舞台的Data URL，我们可以使用`toDataURL()`方法和一个`Stage`的回调函数（对于其他节点不需要回调函数）。此外，我们还可以传递MIME类型的数据，例如image / jpeg, 和一个范围在0和1之间的图片质量值。我们还可以获取特定节点的Data URL，包括层，组和形状。

*注意：`toDataURL()`方法要求需要绘制的图形必须托管在和执行绘制的代码文件相同域名的服务器上。
如果不满足此条件，就会抛出SECURITY_ERR异常。*

说明：拖拽矩形，然后单击保存按钮以获取画布的data url，并在新窗口中打开生成的图片
<iframe src="/downloads/code/data_and_serialization/Stage_Data_URL.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Stage Data URL Demo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #F0F0F0;
        }
        #buttons {
            position: absolute;
            top: 5px;
            left: 10px;
        }
        #buttons > input {
            padding: 10px;
            display: block;
            margin-top: 5px;
        }
    </style>
</head>
<body>
<div id="container"></div>
<div id="buttons">
    <button id="save">
        Save as image
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

    var rectX = stage.getWidth() / 2 - 50;
    var rectY = stage.getHeight() / 2 - 25;

    var box = new Konva.Rect({
        x: rectX,
        y: rectY,
        width: 100,
        height: 50,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });

    box.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });

    box.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    layer.add(box);
    stage.add(layer);

    document.getElementById('save').addEventListener('click', function() {
        var dataURL = stage.toDataURL();
        window.open(dataURL);
    }, false);
</script>

</body>
</html>
```

## 常见问题

### 为什么导出报 SecurityError 或得到空白图？

画布被跨域图片「污染」了。只要往画布上画过一张没有正确 CORS 头的跨域图片，
整张画布就再也无法导出。

需要**两个条件同时满足**：图片服务端返回 `Access-Control-Allow-Origin`，
并且客户端在赋 `src` **之前**设置 `img.crossOrigin = 'anonymous'`。
只做其中一件都不够。

### 导出的图片为什么很模糊？

默认按 `Konva.pixelRatio` 导出，在普通屏幕上就是 1 倍。

需要高清图传 `pixelRatio`：

```js
stage.toDataURL({ pixelRatio: 2 });
```

注意导出尺寸是平方关系增长——`pixelRatio: 3` 的图片数据量是 1 倍的九倍，
大画布上很容易超出浏览器对 Data URL 长度的限制。

### 导出大画布时页面卡住了？

`toDataURL()` 是**同步**的，整个编码过程阻塞主线程。
一张 4000×3000 的 PNG 编码可能要几百毫秒到几秒。

改用 `toBlob()`，它是异步的，不会卡住界面：

```js
stage.toBlob({ pixelRatio: 2 }).then(blob => { /* ... */ });
```

Konva 10.5.0 修正了它的类型声明——此前标注为 `Promise<unknown>`，
现在明确解析为 `Blob`，编码失败时是 reject 而不是解析成 `null`。

## 国内环境注意事项

跨域导出在国内几乎是必踩的坑，因为主流图床与对象存储**默认不返回 CORS 头**，
需要到控制台单独配置跨域规则。

更麻烦的是失败方式很隐蔽：图片显示一切正常，只有在用户点「保存图片」时
才报错。很多团队是在导出功能上线后才发现全部失败的。

而 `crossOrigin = 'anonymous'` 不能作为「先加上再说」的保险——服务端不支持 CORS 时，加了这行图片会**彻底加载失败**，
从「能看但不能导出」退化成「什么都看不见」。

可靠的做法有三种：把参与导出的图片与站点同域托管；通过自己的服务端代理一层；
或者在服务端完成图片合成，前端只负责发起请求。
第三种在需要生成高清大图时反而更合适——既绕开了跨域，也避免了前端长时间阻塞。
