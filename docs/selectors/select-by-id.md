---
title: 'id 选择器'
description: '用 Konva 的 find("#id") 按 id 查找节点，返回数组；只需要一个结果时用 findOne()。适用于舞台、图层、分组与图形。'
sidebar_position: 1
---

按 id 查找返回单个节点。Konva 不强制 id 唯一，这一点与 DOM 不同。

## 用法

要使用Konva通过id属性来选择形状，我们可以使用`find()`方法来搜索带有特定id属性的元素。
`find()`方法总是返回一个元素数组，即使我们期望它只返回一个元素。
如果你只需要一个元素，你可以使用`findOne()`方法。
`find()`方法适用于任何节点，包括舞台，图层，组和形状。

说明：按下“激活矩形”按钮，通过id选择矩形并执行过渡动画。 您也可以拖拽矩形。
<iframe src="/downloads/code/selectors/Select_by_id.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Select Shape by id Demo</title>
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
    <input type="button" id="activate" value="Activate rectangle">
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
    for(var n = 0; n < 10; n++) {
      var circle = new Konva.Circle({
        x: Math.random() * stage.getWidth(),
        y: Math.random() * stage.getHeight(),
        radius: Math.random() * 50 + 25,
        fill: 'red',
        strokeWidth: 3,
        stroke : 'black'
      });

      layer.add(circle);
    }

    var rect = new Konva.Rect({
      x: 300,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      id: 'myRect'
    });

    layer.add(rect);
    stage.add(layer);

    var tween;

    document.getElementById('activate').addEventListener('click', function() {
        // or var shape = stage.findOne('#myRect');
      var shape = stage.find('#myRect')[0];

      if (tween) {
        tween.destroy();  
      }

      tween = new Konva.Tween({
        node: shape, 
        duration: 1,
        scaleX: Math.random() * 2,
        scaleY: Math.random() * 2,
        easing: Konva.Easings.ElasticEaseOut
      }).play();
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### Konva 会检查 id 重复吗？

不会。两个节点用同一个 id 完全不会报错，但 `findOne('#x')` 只返回
遍历中遇到的第一个，另一个就像不存在一样。

这类 bug 很难查——代码看起来完全正确，只是操作的不是你以为的那个节点。
批量创建节点时尤其要小心，id 应该带上唯一的序号或数据主键。

### find('#x')[0] 和 findOne('#x') 有区别吗？

结果一样，但 `findOne()` 一旦找到就停止遍历，`find()` 会走完整棵树
再返回数组。节点多时后者明显更慢。

只要一个结果就用 `findOne()`。另外 `find()` 在没找到时返回空数组，
`[0]` 是 `undefined`，与 `findOne()` 的返回值一致，这一点倒是没有差别。

### 选择器是怎么实现的？

是**遍历**，不是哈希查找。每次调用都会从起点节点开始走一遍子树，
逐个比对。

这意味着它的成本与节点总数成正比，而不是像 DOM 的 `getElementById`
那样接近常数时间。在动画回调或高频事件里反复调用选择器，
是很容易被忽略的性能问题。

## 性能提示

选择器的开销随节点数量线性增长，而它经常被放在不该放的地方。

**把引用缓存下来**。创建节点时就存好变量或存进 Map，之后直接用，
不要每次都查。尤其是在 `dragmove`、`transform`、动画回调这类每帧执行的地方，
一次选择器调用乘以 60 就很可观了。

**缩小查找范围**。`group.findOne('#x')` 只遍历这个分组，
比 `stage.findOne('#x')` 遍历全树快得多。知道节点在哪个子树里就从那里找。

**大量节点考虑自建索引**。上千个节点时，维护一个 `Map<id, node>`
把查找降到常数时间，比依赖选择器可靠。代价是增删节点时要同步维护这个表。
