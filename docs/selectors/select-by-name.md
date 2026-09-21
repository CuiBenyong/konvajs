---
title: '名称选择器'
description: '用 Konva 的 find(".name") 按 name 属性查找节点，返回 Konva.Collection 数组，可用其 each() 方法快速遍历。'
sidebar_position: 2
---

`name` 是为批量操作设计的标记。一个节点可以有多个 name，这让它比 id 灵活得多。

## 用法

要使用Konva通过name属性选择形状，我们可以使用`find()`方法。
`find()`方法返回一个与`.`选择器字符串匹配的节点数组。
这个返回数组是一个`Konva.Collection`数组，也是一个典型的JavaScript数组，有一个特殊的`each()`方法。
这个`each()`方法使我们能够快速遍历数组中的每个节点。
<iframe src="/downloads/code/selectors/Select_by_Name.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Select Shape by Name Demo</title>
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

    var rect1 = new Konva.Rect({
      x: 250,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      stroke : 'black',
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      name: 'rectangle'
    });

    var rect2 = new Konva.Rect({
      x: 70,
      y: 90,
      width: 100,
      height: 50,
      fill: 'green',
      strokeWidth: 3,
      stroke : 'black',
      offset: {
        x: 50,
        y: 25
      },
      draggable: true,
      name: 'rectangle'
    });
    layer.add(rect1);
    layer.add(rect2);
    stage.add(layer);

    var tweens = [];

    document.getElementById('activate').addEventListener('click', function() {
      // select shapes by name
      var shapes = stage.find('.rectangle');

      // if there are currently any active tweens, destroy them
      // before creating new ones
      for (var n=0; n<tweens.length; n++) {
        tweens[n].destroy();
      }

      // apply transition to all nodes in the array
      shapes.each(function(shape) {          
        tweens.push(new Konva.Tween({
          node: shape, 
          duration: 1,
          scaleX: Math.random() * 2,
          scaleY: Math.random() * 2,
          easing: Konva.Easings.ElasticEaseOut
        }).play());
      });
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### 一个节点能有几个 name？

任意多个，空格分隔：

```js
node.name('draggable selected node');
```

这样 `find('.draggable')`、`find('.selected')` 都能找到它。
相当于 CSS 的 class，适合表达「这个节点属于哪几类」。

### 怎么判断节点有没有某个 name？

用 `hasName()`：

```js
if (node.hasName('selected')) { /* ... */ }
```

不要用 `node.name() === 'selected'` ——节点有多个 name 时这个判断会失败。
这是[事件委托](/docs/events/event-delegation)里最常见的写错之处。

### 增删 name 有现成方法吗？

有 `addName()` 和 `removeName()`，比自己拼字符串可靠：

```js
node.addName('selected');
node.removeName('selected');
```

自己用字符串拼接容易出问题——忘了加空格、删除时匹配到子串
（删 `select` 却影响了 `selected`）。用这两个方法不会有这些麻烦。

## 与其他方案的取舍

三种标记方式的定位不同：

**`id`** 表示「这是哪一个」，适合唯一定位。用 `findOne('#x')`。

**`name`** 表示「这属于哪几类」，适合批量操作和分类判断。
事件委托里用它区分目标类型，是最自然的用法。

**自己维护数组或 Map** 表示「我关心的这一组」。当集合是动态变化的
（比如当前选中项），维护一个数组比给节点打 name 再全树查找要快得多，
而且集合顺序也能保留。

判断依据：分类是**静态属性**就用 name（这是个可拖拽节点）；
集合是**动态状态**就自己维护（这些是当前选中的）。
把动态状态写进 name，意味着每次状态变化都要改节点属性并重新查找，绕远了。
