---
title: '序列化'
description: '用 Konva 的 toJSON() 把舞台序列化为 JSON 字符串，便于存入网络存储或离线数据库。图层、组与图形同样支持序列化。'
sidebar_position: 1
---

`toJSON()` 把节点树转成字符串。它只保存属性，图片和事件这类运行时的东西不在其中。

## 用法

要使用Konva将舞台保存为JSON字符串，我们可以使用`toJSON()`方法, 将Konva节点树序列化为可以在网络存储中或在离线数据库中保存的文本。 我们还可以序列化其他的节点，包括图层，组和形状。
<iframe src="/downloads/code/data_and_serialization/Serialize_a_Stage.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Save Stage Demo</title>
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

    var hexagon = new Konva.RegularPolygon({
        x: width / 2,
        y: height / 2,
        sides: 6,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(hexagon);

    // add the layer to the stage
    stage.add(layer);

    // save stage as a json string
    var json = stage.toJSON();

    console.log(json);
</script>

</body>
</html>
```

## 常见问题

### 哪些东西不会被序列化？

两类：**图片**和**事件监听器**。

图片是 DOM 的 `Image` 对象，没法变成 JSON；事件处理器是函数，同理。
所以还原之后要手动补上这两样，见[复杂导出](/docs/data-and-serialization/complex-load)。

自定义属性默认也不会被包含，需要用 `Konva.Factory.addGetterSetter` 正式注册
到节点上才会进入序列化结果。

### Konva 10.6.0 之后输出内容变多了？

是的，这是一处有意的修正。此前如果你显式设置的 `width`、`height`、`dragDistance`
恰好等于 Konva 计算出的默认值，序列化时会被当作「没设过」而丢掉。

后果是还原出来的 `Konva.Text` 会重新按内容排版，宽度与原来不同。
10.6.0 起这些属性会如实出现在输出里。

如果你有基于旧版输出格式的快照测试或存量数据，升级后要留意这个差异。

### 能只序列化一部分吗？

可以，`toJSON()` 在任何节点上都能调用，不限于舞台。
对一个分组调用就只导出那棵子树。

想排除某些节点，Konva 没有内置的过滤机制，需要先把它们 `remove()`、
导出后再 `add()` 回去；或者干脆自己遍历节点树生成数据结构。

## 与其他方案的取舍

`toJSON()` 的优点是零成本——不用设计数据结构，不用写转换代码。
适合「保存画布当前状态、下次原样恢复」这种需求。

它的问题在于**输出格式由 Konva 决定**。Konva 版本升级可能改变输出内容
（10.6.0 就是一例），而你的存量数据是按旧格式存的。
另外这份 JSON 里全是渲染细节，业务语义混在其中，别的系统很难消费。

如果这些数据要长期保存、要跨版本兼容、或者要被后端理解，
更好的做法是自己设计一套业务数据结构，渲染时再转成 Konva 节点。
多写一层转换代码，换来的是对格式的完全掌控。
