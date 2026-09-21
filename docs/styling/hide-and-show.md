---
title: '隐藏/显示图形'
description: '用 Konva 的 visible 属性或 hide()、show() 方法控制图形显隐。隐藏的节点不参与绘制，也不响应事件。'
sidebar_position: 6
---

`visible(false)` 让节点既不绘制也不响应事件，是开销最低的隐藏方式。

## 用法

要使用`Konva`隐藏和显示形状，我们可以在实例化形状时设置`visible`属性，也可以使用`hide（）`和`show（）`方法。


说明：单击按钮显示和隐藏形状。
<iframe src="/downloads/code/styling/Hide_and_Show.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Hide and Show Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
    #buttons {
        position: absolute;
        left: 10px;
        top: 0px;
    }
    button {
        margin-top: 10px;
        display: block;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="buttons">
      <button id="show">
          show
      </button>
      <button id="hide">
          hide
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

        var pentagon = new Konva.RegularPolygon({
            x: stage.getWidth() / 2,
            y: stage.getHeight() / 2,
            sides: 5,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4,
            visible: false
        });

        // add the shape to the layer
        layer.add(pentagon);

        // add the layer to the stage
        stage.add(layer);

        // add button event bindings
        document.getElementById('show').addEventListener('click', function() {
            pentagon.show();
            layer.draw();
        }, false);

        document.getElementById('hide').addEventListener('click', function() {
            pentagon.hide();
            layer.draw();
        }, false);
  </script>

</body>
</html>
```

## 常见问题

### 隐藏和从场景树移除，哪个更省？

取决于隐藏多久。

`visible(false)` 的节点仍然在场景树里，每次遍历（`find()`、`getClientRect()`、
重绘时的树遍历）都会经过它，只是跳过绘制。开销很小但不为零。

`remove()` 把它从树里摘出去，遍历时完全不会碰到。但重新插入要调 `add()`，
而且位置（zIndex）需要自己维护。

频繁切换用 `visible`，长期不用就 `remove()`。

### 隐藏容器会影响子节点吗？

会，整棵子树都不绘制不响应。子节点自己设 `visible(true)` 无效。

这与 [`listening`](/docs/events/listen-for-events) 的行为一致——容器的设置对子树是强制的。

所以批量隐藏一组元素，最简单的办法是把它们放进一个分组，操作分组即可。

### 隐藏的节点还占内存吗？

占。节点对象、它的属性、它的事件监听器都还在。

如果它之前被 [`cache()`](/docs/performance/shape-caching) 过，
那张缓存位图也还占着内存——隐藏不会自动清理缓存。

长期隐藏且体积可观的节点，值得 `clearCache()` 一下，甚至直接销毁。

## 性能提示

隐藏是零成本的优化手段，但它省的只是**绘制**，不省遍历和内存。

如果一个界面里有大量默认隐藏的元素（比如所有节点的悬停提示都预先创建好），
场景树会很臃肿，每次 `find()` 都要走一遍。这种情况下**按需创建**比预先创建再隐藏更好。

另一个实用做法是**整层隐藏**。把一组相关元素放在独立图层，
`layer.visible(false)` 之后这一层连合成都不参与，比逐个隐藏节点更彻底。

配合 `listening: false`，Konva 10.3.2 起还会释放该图层的命中画布，
内存收益可观。
