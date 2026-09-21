---
title: '类型选择器'
description: '用 Konva 的 find("Circle") 按节点类型查找，返回匹配的 Konva.Collection 数组，适合批量操作同一类图形。'
sidebar_position: 3
---

按类型查找所有同类图形。类型名就是构造函数名，区分大小写。

## 用法

要使用Konva通过类型选择形状，我们可以使用`find()`方法。
`find()`方法返回一个与选择器字符串匹配的节点数组。
这个返回数组是一个`Konva.Collection`数组，也是一个典型的JavaScript数组，有一个特殊的`each()`方法。
这个`each()`方法使我们能够快速遍历数组中的每个节点。
<iframe src="/downloads/code/selectors/Select_by_Type.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Select Shape by Type Demo</title>
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
      draggable: true
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
      draggable: true
    });
    layer.add(rect1);
    layer.add(rect2);
    stage.add(layer);

    var tweens = [];

    document.getElementById('activate').addEventListener('click', function() {
      // select shapes by name
      var shapes = stage.find('Rect');

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

### 类型名怎么写？

就是构造函数的名字，不带 `Konva.` 前缀，**区分大小写**：

```js
layer.find('Circle');   // 对
layer.find('circle');   // 错，找不到
```

容器类型也能查：`find('Group')`、`find('Layer')`。
`find('Shape')` 会匹配所有图形类节点，因为它们都继承自 `Konva.Shape`。

### 自定义图形的类型名是什么？

是 `Shape`。用 `new Konva.Shape({ sceneFunc })` 创建的自定义图形，
类型上就是 `Konva.Shape`，没有独立的类型名。

所以 `find('Shape')` 会把它们和其他所有图形一起返回，无法区分。
要单独定位自定义图形，给它们加 `name` 标记。

### 能组合多个选择器吗？

可以用逗号分隔表示「或」：

```js
layer.find('Circle, Rect');
```

但不支持「与」的组合，`find('Circle.selected')` 这种 CSS 式的写法无效。
需要「圆形且被选中」，先按类型查再用 `hasName()` 过滤。

## 性能提示

按类型查找必须遍历整棵子树，无法提前剪枝——它不像 id 查找那样找到就能停。

**从最小的容器开始查**。`group.find('Circle')` 只走这个分组，
`stage.find('Circle')` 要走全部图层。缩小起点是最直接的优化。

**不要在高频回调里调用**。每帧一次全树遍历，节点上千时会明显掉帧。
结果如果不常变，查一次存起来。

**考虑用 name 代替**。如果你要找的是「某一批特定的圆」而不是「所有圆」，
给它们打上 name 用 `find('.myCircles')`，语义更准确，
也避免了后来新增的圆意外混进结果里。
