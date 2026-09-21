---
title: '移动端的滚动和原生事件'
description: 'Konva 默认阻止指针交互的浏览器默认行为以避免误滚动。若需保留页面滚动，把图形的 preventDefault 属性设为 false。'
sidebar_position: 4
---

Konva 默认阻止指针的浏览器默认行为，代价是页面在画布上滑不动。这个取舍可以调整。

## 用法

默认情况下，`Konva`将阻止所有指针与舞台交互的默认行为。
当您尝试在移动设备上拖放形状时，这将防止意外滚动页面。  

但在某些情况下，您可能希望保留浏览器事件的默认行为。 在这种情况下，您可以将形状的`preventDefault`属性设置为`false`。   


说明：如果您使用移动设备，请尝试按每个矩形滚动页面。  
绿色 - 应防止默认行为（无页面滚动）。  
红色 - 将保持默认行为（滚动工作）。

<iframe src="/downloads/code/events/Mobile_Scrolling.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Mobile Scrolling and Native Events Demo</title>
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

    var defaultBehaviourRect = new Konva.Rect({
      width: 100,
      height: 100,
      fill: 'green'
    });
    layer.add(defaultBehaviourRect);

    var noPreventDefaultRect = new Konva.Rect({
      x: 200,
      y: 50,
      width: 100,
      height: 100,
      fill: 'red',
      preventDefault: false
    });

    layer.add(noPreventDefaultRect);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```

## 常见问题

### 为什么在画布上滑动，页面不跟着滚？

这是 Konva 的有意设计。移动端如果不阻止默认行为，用户想拖动图形时页面会跟着滚，
两种意图混在一起，拖拽几乎没法用。

所以 Konva 默认对指针交互调用 `preventDefault`。代价就是画布区域「吞掉」了页面滚动。

### 怎么让页面能正常滚动？

把图形的 `preventDefault` 设为 `false`：

```js
shape.preventDefault(false);
```

这样触摸该图形时浏览器的默认行为（滚动）照常发生。

注意这是**按节点**设置的，不是全局开关。舞台上没有图形的空白区域行为由容器的
CSS `touch-action` 决定，与这个属性无关。

### 放行之后拖拽图形时页面也在滚，怎么办？

这正是两者的根本矛盾：同一个手势，系统无法判断用户想拖图形还是想滚页面。

常见折中是**按图形区分**——可拖拽的图形保持 `preventDefault: true`，
纯展示的图形设为 `false`。用户在展示区滑动能滚页面，在可操作区拖拽不会误滚。

另一种做法是限制方向：容器设 `touch-action: pan-y`，允许垂直滚动，
水平手势留给画布。适合横向拖拽的场景。

## 国内环境注意事项

国内的 App 内置浏览器大多加了自己的下拉刷新与边缘返回手势，它们的优先级高于页面逻辑。

**下拉刷新**最容易出问题：画布位于页面顶部时，向下拖拽图形会先触发刷新。
`preventDefault` 在部分内核下拦不住它，因为手势识别发生在更底层。
实践中的办法是让画布不要紧贴页面顶部，上方留一块内容区。

**边缘返回**同理，从屏幕左右边缘开始的横向拖拽会被判为返回手势。
把可拖拽内容与屏幕边缘保持一定距离，或者在容器上设 `touch-action: none` 争夺控制权。

这些行为在不同版本、不同机型上表现不一致，只能靠实机验证。
如果产品主要跑在微信里，至少要在 iOS 与 Android 各测一台。
