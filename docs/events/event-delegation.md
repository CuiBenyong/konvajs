---
title: '事件委托'
description: 'Konva 事件委托：把事件处理器绑定到父节点（图层或分组），通过事件对象的 target 属性识别实际被点击的子图形。'
sidebar_position: 12
---

把一个处理器绑在容器上，靠 `e.target` 区分实际目标——这就是事件委托。

## 用法

使用`Konva`获取事件目标，我们可以访问target属性
的Event对象。 这在使用事件委托时特别有用，
其中我们可以将事件处理程序绑定到父节点，并监听
发生在它的孩子上的事件。   

说明：点击星形并观察层的事件绑定能正确标识所点击的形状。

<iframe src="/downloads/code/events/Event_Delegation.html" style="width: 50vw;height:300px;"></iframe>

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Event Delegation Demo</title>
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
    var stage = new Konva.Stage({
      container: 'container',
      width: 300,
      height: 300
    });

    var layer = new Konva.Layer();

    var star = new Konva.Star({
      x: stage.getWidth() / 2,
      y: stage.getHeight() / 2,
      numPoints: 15,
      innerRadius: 40,
      outerRadius: 70,
      fill: 'blue',
      scale: {
        x: 2,
        y: 0.5
      },
      name: 'my star'
    });

    layer.on('click', function(evt) {
      // get the shape that was clicked on
      var shape = evt.target;
      alert('you clicked on \"' + shape.getName() + '\"');
    });

    layer.add(star);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>
```

## 常见问题

### 委托和直接绑定该怎么选？

看图形数量和行为是否同质。

十个按钮各有各的逻辑，直接绑在每个上面最清楚。一百个同类节点共用一套行为，
委托能把监听器从一百个降到一个，节点增删时也不用管绑定和解绑。

委托还有一个隐性好处：动态新增的图形自动就能响应，不需要为新节点补绑定。

### 怎么区分点到的是哪一类图形？

用 `name` 做分类标记，不要用 `id`——`id` 语义上应当唯一，而分类天然是多对一的：

```js
layer.on('click', (e) => {
  if (e.target.hasName('node')) { /* ... */ }
  else if (e.target.hasName('edge')) { /* ... */ }
});
```

一个节点可以有多个 name（空格分隔），所以还能做「既是 node 又是 selected」这类组合判断。

### 点击空白处时委托收不到事件？

收不到。空白处没有图形，事件的 `target` 是舞台本身，不会冒泡到图层。

要处理空白点击，得在舞台上单独监听并判断 `e.target === stage`，
或者铺一个透明矩形当背景。两种做法的差别见 [Stage 事件](/docs/events/stage-events)。

## 性能提示

委托的收益主要在两处。

一是**监听器数量**。每个监听器都是一个闭包，持有对节点和外部变量的引用。
上千个节点各绑一个处理器，这些闭包会实打实占内存，节点销毁时若忘记解绑还会泄漏。

二是**增删成本**。动态场景下每新增一个图形就要绑一次、删除时解绑一次，
委托把这部分工作完全省掉。

注意委托不会减少命中检测的开销——那取决于有多少图形在监听，与处理器绑在哪无关。
要省命中检测，用 [`listening(false)`](/docs/events/listen-for-events)。
