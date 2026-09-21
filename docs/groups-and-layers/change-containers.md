---
title: '更换容器'
description: '用 Konva 的 moveTo() 把节点从一个容器移到另一个容器。容器可以是舞台、图层或分组，分组之间也能相互移动。'
sidebar_position: 3
---

`moveTo()` 把节点转移到另一个容器。它保持节点的相对坐标不变，因此视觉位置会跳。

## 用法

要使用`Konva`将图形从一个容器移动到另一个容器，我们可以使用
`moveTo（）`方法，它需要一个容器作为参数。   


容器可以是其他舞台，层或组。 您还可以移动组
进入其他组和层，或者把组的形状直接移入其他层里。 



说明：拖放组并观察红色矩形是结合到黄色组还是蓝色组。
 使用左侧的按钮将红色矩形从一个组移动到另一个组。
<iframe src="/downloads/code/groups_and_layers/Change_Containers.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Move Shape to Another Container Demo</title>
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
        top: 0;
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
      <button id="toBlue">
          Move red box to blue group
      </button>
      <button id="toYellow">
          Move red box to yellow group
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
    var yellowGroup = new Konva.Group({
        x: 100,
        y: 100,
        draggable: true
    });
    var blueGroup = new Konva.Group({
        x: 300,
        y: 80,
        draggable: true
    });

    var box = new Konva.Rect({
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        fill: 'red',
        stroke: 'black'
    });

    var yellowCircle = new Konva.Circle({
        x: 0,
        y: 0,
        radius: 50,
        fill: 'yellow',
        stroke: 'black'
    });

    var blueCircle = new Konva.Circle({
        x: 0,
        y: 0,
        radius: 50,
        fill: 'blue',
        stroke: 'black'
    });

    // build node tree
    yellowGroup.add(yellowCircle);
    yellowGroup.add(box);
    blueGroup.add(blueCircle);
    layer.add(yellowGroup);
    layer.add(blueGroup);
    stage.add(layer);

    // add button event bindings
    document.getElementById('toBlue').addEventListener('click', function() {
        box.moveTo(blueGroup);
        layer.draw();
    }, false);

    document.getElementById('toYellow').addEventListener('click', function() {
        box.moveTo(yellowGroup);
        layer.draw();
    }, false);
  </script>

</body>
</html>
```

## 常见问题

### 为什么 moveTo 之后节点跳到别处去了？

因为 `moveTo()` 保留的是节点的 `x`/`y`，而这两个值是**相对父容器**的。
换了父容器，同样的相对坐标对应的绝对位置就变了。

如果新旧容器的位置或变换不同，节点看起来就会「跳」一下。
这不是 bug，是坐标系的必然结果。

### 怎么让视觉位置保持不变？

先记下绝对位置，移动后再设回去：

```js
const abs = node.getAbsolutePosition();
node.moveTo(newParent);
node.setAbsolutePosition(abs);
```

`setAbsolutePosition()` 会根据新父容器的变换反算出合适的相对坐标。

注意如果新旧容器的**缩放或旋转**不同，位置能对上但大小和角度会变——
那需要连同 `scale`、`rotation` 一起换算，通常更简单的做法是重新设计结构。

### 跨图层移动要注意什么？

两个图层都需要重绘——源图层少了一个节点，目标图层多了一个。

Konva 10 默认自动处理。如果你关掉了自动重绘，记得两边都要 `draw()`，
只画一边会留下残影。

## 与其他方案的取舍

**`moveTo()`** 保留节点对象本身，事件监听、缓存、自定义属性都还在。
这是在容器间转移节点的正确方式。

**销毁后重建**会丢失一切运行时状态，还要重新绑定事件。
除非节点本来就该重建（比如数据变了要重新渲染），否则没有理由这么做。

**临时移动再移回**是拖拽场景的常见模式：`dragstart` 时移到专用图层，
`dragend` 时移回原位。要注意移回时的**层级**——`moveTo()` 会把节点放到目标容器的最后（最上层），
原来的前后关系没了。需要还原就先用 `zIndex()` 记下来，移回后设回去。
