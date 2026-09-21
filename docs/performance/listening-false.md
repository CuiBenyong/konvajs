---
title: '禁用事件监听'
description: '用 listening(false) 把图形移出命中检测区域以提升性能。例如按钮组里只让矩形响应点击，文本不参与命中图绘制。'
sidebar_position: 8
---

关掉监听的节点不进命中图。省下的不只是命中检测，还有绘制命中图本身的开销。

## 用法

您可以通过给形状设置`listening(false)`来将其从命中检测区域中移除, 这样可以提高性能. 在某些情况下, 这个方法会非常有用, 并且不会破坏整个应用的逻辑.

例如，我们有一个包含矩形和文本的按钮（组）。 我们需要监听按钮点击。
在这种情况下，我们可以从命中捡测区域中移除文本，只监听在矩形上面的点击操作。
<iframe src="/downloads/code/performance/Listening_False.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/konva@10/konva.min.js"></script>
    <meta charset="utf-8">
    <title>Konva Listening False Demo</title>
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

    var button = new Konva.Group({
        x : stage.width() / 2,
        y : stage.height() / 2
    });

    var offset = 10;
    var text = new Konva.Text({
        x : offset,
        y : offset,
        text : 'press me!',
        // as we don't really need text on hit graph we can set:
        listening : false
    });
    var rect = new Konva.Rect({
        width : text.width() + offset * 2,
        height : text.height() + offset * 2,
        fill : 'grey',
        shadowColor : 'black'
    });
    button.add(rect, text);

    button.on('click tap', function() {
        alert('button clicked');
    });

    layer.add(button);
    stage.add(layer);
</script>

</body>
</html>
```

## 常见问题

### 关掉之后节点还画得出来吗？

照常绘制。`listening(false)` 只影响命中检测，不影响视觉。

这是它与 `visible(false)` 的根本区别：后者连画都不画。
需要「看得见但点不到」时用前者，需要「彻底不存在」时用后者。

### 在容器上设置会影响子节点吗？

会，而且是强制的。在图层或分组上设 `listening(false)`，
整棵子树都不响应，子节点自己设 `listening(true)` 也无效。

这个特性用来批量关闭很方便——整个装饰图层一行搞定。
但也意味着不能在关掉的容器里「开一个口子」，需要例外的节点得放到别的容器里。

### 改了之后没生效？

命中图在图层绘制时生成，改动要等下一次图层重绘才反映出来。

Konva 10 默认自动重绘，通常下一帧就好了。如果你关掉了 `Konva.autoDrawEnabled`，
需要手动 `layer.draw()`——注意不能只调 `shape.draw()`，
那不会重建图层的命中画布。

## 性能提示

这是收益与风险比最好的一项优化：改一个属性，不影响任何视觉效果。

收益有两层。**命中检测时跳过**——这部分随图形数量线性增长。
**不必画进命中图**——每个参与监听的图形，每次重绘实际上要画两遍
（场景图一遍、命中图一遍），关掉监听等于省掉后者。

典型可以关掉的内容：背景图、网格线、坐标轴、水印、说明文字、装饰性图标。
一个界面里这类元素往往占了大半。

Konva 10.3.2 补充了一项：整层都设 `listening: false` 时，该图层会释放
与舞台同尺寸的命中画布，重新开启时再创建。静态背景层因此能省下实打实的内存。
