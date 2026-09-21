---
title: '复杂导出'
description: '加载包含图片与事件绑定的复杂 Konva 舞台：先用 Konva.Node.create() 还原节点树，再用选择器手动补回图片与事件——二者无法被序列化。'
sidebar_position: 3
---

还原带图片和交互的场景，需要在节点树建好之后手动补上这两样。

## 用法

要使用Konva加载一个包含图片和事件绑定的复杂舞台，我们需要先使用`Konva.Node.create()`创建一个舞台节点，然后通过`get()`方法, 结合选择器, 手动的添加图片和事件操作. 图片和事件操作必须手动地进行设置, 因为它们是无法被序列化的.
<iframe src="/downloads/code/data_and_serialization/Complex_Load.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Load Complex Stage Demo</title>
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
    var json = '{"attrs":{"width":578,"height":200},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"width":"auto","height":"auto","text":"Text Shadow!","fontFamily":"Calibri","fontSize":95,"x":20,"y":20,"stroke":"red","strokeWidth":2,"shadowColor":"black","shadowBlur":2,"shadowOffsetX":10,"shadowOffsetY":10,"shadowOpacity":0.5},"className":"Text"},{"attrs":{"stroke":"green","strokeWidth":10,"lineJoin":"round","lineCap":"round","points":[{"x":50,"y":140},{"x":450,"y":160}],"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5},"className":"Line"},{"attrs":{"x":280,"y":100,"width":100,"height":50,"fill":"#00D2FF","stroke":"black","strokeWidth":4,"shadowColor":"black","shadowBlur":10,"shadowOffsetX":5,"shadowOffsetY":5,"shadowOpacity":0.5,"rotation":0.3490658503988659,"id":"blueRectangle"},"className":"Rect"},{"attrs":{"x":100,"y":41,"width":106,"height":118,"id":"yodaImage"},"className":"Image"}]}]}';

    var stage = Konva.Node.create(json, 'container');

    /*
    * set functions
    */
    stage.findOne('#blueRectangle').on('mouseover mouseout', function() {
        var stroke = this.stroke();
        this.stroke(stroke === 'black' ? 'red' : 'black');
        stage.draw();
    });
    /*
    * set images
    */
    var imageObj = new Image();
    imageObj.onload = function() {
        stage.findOne('#yodaImage').image(imageObj);
        stage.draw();
    };
    imageObj.src = '/assets/yoda.jpg';
</script>

</body>
</html>
```

## 常见问题

### 图片该在什么时候补？

节点树还原之后，图片加载完成时。顺序是：先 `create()` 建出结构，
再为每个图片节点加载图源并 `image()` 赋值。

```js
const stage = Konva.Node.create(json, 'container');
const img = new Image();
img.onload = () => {
  stage.findOne('#yodaImage').image(img);
};
img.src = '/assets/yoda.jpg';
```

注意图片加载是异步的，这段时间里节点的包围盒是零，
任何依赖尺寸的计算都要等到加载完成之后。

### 用 id 还是 name 来定位节点？

批量操作用 `name`，单个定位用 `id`。

`find('.imageNode')` 能一次拿到所有图片节点，遍历补图源；
而 `findOne('#header')` 适合定位唯一的某个节点。

两者都会被序列化，所以可以在导出前就规划好标记。
一个节点可以有多个 name（空格分隔），分类更灵活。

### find 返回的是什么？

`find()` 永远返回数组，即使只匹配到一个；`findOne()` 返回单个节点或 `undefined`。

常见错误是对 `find()` 的结果直接调节点方法——它是数组，没有 `image()`。
要么取 `[0]`，要么改用 `findOne()`。

## 性能提示

大型场景的还原是一次性的重活，值得分摊。

**分批创建节点**。上千个节点一次性 `create()` 会让主线程卡住几百毫秒，
用户看到白屏。把创建过程拆成若干批，每批之间让出一帧。

**图片并发加载但按需渲染**。所有图片同时发起请求，但只有进入视口的
才赋值给节点——未赋值的节点不参与绘制，开销为零。

**还原后统一重绘一次**。创建过程中如果开着自动重绘，
每加一个节点都可能触发一次重绘请求。批量操作前可以考虑
暂时把图层 `visible(false)`，全部建好后再显示。
