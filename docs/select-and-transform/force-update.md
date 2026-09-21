---
title: '强制更新控制柄'
description: 'Konva Transformer 通过节点的变化事件自动更新控制柄，但感知不到分组内部的深层改动，这时需要手动调用 forceUpdate()。'
sidebar_position: 11
---

Transformer 平时会自动跟随节点变化。但有些改动它感知不到，需要手动通知。

## 用法

```js
group.add(newChild);
tr.forceUpdate(); // 不调用的话控制柄不会包住新子图形
```

上面的演示分两步：第一次往分组里加子图形时**不**调用 `forceUpdate`，
第二次调用。观察控制柄什么时候才跟上。

<iframe src="/downloads/code/select_and_transform/Force_Update.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Force_Update.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Force Update Demo</title>
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
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var group = new Konva.Group({ x: 60, y: 80, draggable: true });
    group.add(new Konva.Rect({ x: 0, y: 0, width: 80, height: 60, fill: '#4078c0' }));
    layer.add(group);

    var tr = new Konva.Transformer({ nodes: [group] });
    layer.add(tr);

    var hint = new Konva.Text({ x: 20, y: 20, fontSize: 14, fill: '#333', lineHeight: 1.5, text: '' });
    layer.add(hint);

    var added = 0;
    function addChild(useForceUpdate) {
      added++;
      group.add(new Konva.Rect({
        x: added * 50, y: added * 30, width: 60, height: 40,
        fill: added % 2 ? '#c04040' : '#5aa469'
      }));
      if (useForceUpdate) tr.forceUpdate();
      hint.text(
        '已向分组内添加 ' + added + ' 个子图形' +
        (useForceUpdate ? '（调用了 forceUpdate）' : '（未调用 forceUpdate）') +
        '\n控制柄包围盒宽度：' + Math.round(tr.width())
      );
    }

    // 先不调用 forceUpdate：控制柄不会包住新子图形
    setTimeout(function () { addChild(false); }, 800);
    // 再调用一次：控制柄立刻重算
    setTimeout(function () { addChild(true); }, 2000);

    hint.text('两秒内会向分组添加子图形，观察控制柄何时才跟上。');
  </script>

</body>
</html>
```

## 常见问题

### 什么时候需要 forceUpdate？

Transformer 靠监听节点的变化事件来更新控制柄。直接改被选中节点的
`width`、`scaleX`、`rotation` 这些属性它都能感知，不需要手动干预。

它感知不到的是**分组内部的结构变化**——往 `Konva.Group` 里增删子节点，
分组自身的属性一个都没变，事件自然不会触发。

演示里实测得很清楚：往分组加了一个子图形后，分组包围盒已经是 110，
而控制柄还停在 80；调用 `forceUpdate()` 后两者同步到 160。

### 控制柄总是慢一拍，到处加 forceUpdate 行不行？

不建议。先确认根因——多数「慢一拍」不是 Transformer 的问题，而是你改节点的方式
没有触发变化事件，例如直接改了 `node.attrs.width` 而不是调 `node.width()`。

那种情况下 Transformer 只是症状，图形自身的重绘、命中检测同样会失步。
用属性方法而不是直接写 `attrs`，问题会一起消失。

### 在动画循环里每帧调用会怎样？

会抵消掉 Konva 10.4.0 对 Transformer 做的优化。那一版让未变化的图形边界可以复用、
选择框未变时不重建锚点，而 `forceUpdate()` 正是要求它把这些全部重算。

选中节点多的时候，每帧强制重算的代价相当可观。只在确实发生了
「无法自动感知的变化」时调用。

## 性能提示

`forceUpdate()` 会重算全部锚点的位置与选择框，代价随选中节点数增长。

批量修改分组内容时，把所有改动做完再调用一次，而不是每加一个子节点就调一次。

如果你的场景是频繁增删子节点（例如画布编辑器的图层操作），
更好的做法是在批量操作前 `tr.nodes([])` 解除关联，操作完成后再重新关联——
这比反复 `forceUpdate()` 便宜，也避免了中间态下控制柄乱跳。
