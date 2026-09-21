---
title: '简单导出'
description: '用 Konva.Node.create() 反序列化 JSON 字符串还原节点。还原舞台时可传入可选的 container 参数指定挂载容器。'
sidebar_position: 2
---

`Konva.Node.create()` 从 JSON 还原节点树。还原舞台时必须指定容器。

## 用法

要使用Konva反序列化一个JSON字符串，我们可以使用`Konva.Node.create()`方法，它可以解析JSON字符串并创建节点。 如果我们想反序列化一个舞台节点，我们还可以传入一个可选的`container`参数。
<iframe src="/downloads/code/data_and_serialization/Simple_Load.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Simple Load Demo</title>
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
    var json = '{"attrs":{"width":578,"height":200},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"x":100,"y":100,"sides":6,"radius":70,"fill":"red","stroke":"black","strokeWidth":4},"className":"RegularPolygon"}]}]}';

    // create node using json string
    var stage = Konva.Node.create(json, 'container');
</script>

</body>
</html>
```

## 常见问题

### 为什么还原舞台要传 container？

因为舞台需要一个真实的 DOM 元素来挂载 canvas，而这个元素的 id
不可能在 JSON 里可靠地保存——同一份数据可能被还原到不同页面的不同容器里。

```js
const stage = Konva.Node.create(json, 'container');
```

还原分组或图形则不需要这个参数，它们不直接持有 DOM。

### 还原之后为什么点不动、也没有反应？

事件监听器没有被序列化，还原出来的是「哑」节点。

要恢复交互，还原后重新绑定。用 `name` 属性做标记是个实用做法——
name 会被序列化，还原后可以 `find('.draggable')` 批量找出需要绑定的节点。

### JSON 是从哪个版本导出的重要吗？

重要。Konva 的序列化格式随版本演进，10.6.0 就改变了 `width`、`height`
等属性的输出行为。

用新版本还原旧数据通常没问题（缺失的属性会用默认值），
但反过来——用旧版本还原新版本导出的数据——可能遇到无法识别的字段。

如果数据要长期保存，建议在存储时记下 Konva 版本号，便于日后排查。

## 与其他方案的取舍

**整体还原**（一次 `create()` 建出整棵树）最简单，适合「打开一个保存的文件」。
代价是大场景下这是一次同步操作，节点多时会阻塞主线程。

**增量还原**是自己遍历数据、分批创建节点，配合 `requestAnimationFrame`
把工作摊到多帧。用户能先看到部分内容，感知上快得多。
代价是要自己写遍历逻辑。

一个折中做法：先还原可视区域内的节点，其余的延迟创建。
这需要数据里带有位置信息以便判断，也就意味着要用自己设计的数据结构，
而不是 Konva 的 JSON。
