---
title: '中止变换'
description: '用 Konva Transformer 的 stopTransform() 以编程方式结束正在进行的变换。它不会回滚，图形停在中止那一刻的状态。'
sidebar_position: 10
---

`stopTransform()` 立即结束当前正在进行的拖拽变换，常用于「超过某个条件就不让继续」的场景。

## 用法

在 `transform` 事件里判断条件，满足时调用：

```js
rect.on('transform', () => {
  const area = (rect.width() * rect.scaleX()) * (rect.height() * rect.scaleY());
  if (area > 40000) {
    tr.stopTransform();
  }
});
```

调用后拖拽立即结束，`transformend` 随之触发，用户需要重新按下才能继续操作。

<iframe src="/downloads/code/select_and_transform/Stop_Transform.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Stop_Transform.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Stop Transform Demo</title>
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

    var rect = new Konva.Rect({
      x: 80, y: 100, width: 140, height: 100,
      fill: '#d08a3e', stroke: 'black', strokeWidth: 2, draggable: true
    });
    layer.add(rect);

    var tr = new Konva.Transformer({ nodes: [rect] });
    layer.add(tr);

    var MAX_AREA = 40000;
    // 变量名不要用 status。顶层的 var status 会覆盖 window.status——
    // 那是浏览器的遗留属性，赋值会被强制转成字符串，
    // 之后 layer.add(status) 拿到的是字符串，报 "getParent is not a function"。
    // name、top、length、origin 等同理。
    var statusText = new Konva.Text({ x: 20, y: 20, fontSize: 14, fill: '#333', text: '' });
    layer.add(statusText);

    function area() {
      return (rect.width() * rect.scaleX()) * (rect.height() * rect.scaleY());
    }

    rect.on('transform', function () {
      statusText.text('面积 ' + Math.round(area()) + ' / 上限 ' + MAX_AREA);
      if (area() > MAX_AREA) {
        // 不是「拦住不让变大」，而是直接结束这次拖拽交互
        tr.stopTransform();
        statusText.text('面积超过 ' + MAX_AREA + '，已中止本次变换。松手后可重新拖动。');
      }
    });

    statusText.text('把矩形拖大，面积超过 ' + MAX_AREA + ' 时会自动中止变换。');
  </script>

</body>
</html>
```

## 常见问题

### 调用之后图形会回到变换前的样子吗？

不会。`stopTransform()` 只是结束交互，图形保持在中止那一刻的状态。

上面的演示里面积上限是 40000，实测中止时面积是 41171——它停在**刚刚超过**
阈值的那一帧，而不是精确等于阈值。想要精确不超限，用
[`boundBoxFunc`](/docs/select-and-transform/resize-limits) 做钳制。

想真正回滚，得自己在 `transformstart` 里记下原始属性，`stopTransform()` 之后恢复。

### 它和 boundBoxFunc 拒绝新框有什么区别？

`boundBoxFunc` 是「不让它继续变大」，拖拽仍在进行——用户松手前一直握着锚点，
往回拖还能继续调整。

`stopTransform()` 是真的结束这次交互，锚点脱手，必须重新按下。

前者适合软性限制（到边界就停住），后者适合硬性中断（检测到非法状态就终止操作）。

### 对没有在变换的节点调用会报错吗？

不会。Konva 10.6.0 起这是一个空操作。

同一版本还修了一个相关问题：此前 `stopTransform()` 会结束**所有**正在进行的变换，
多点触控下用另一根手指拖动的节点也会被一起停掉。现在它只结束自己这一手势。

## 与其他方案的取舍

三种「限制变换」的手段，语义各不相同，不要混用：

- [`boundBoxFunc`](/docs/select-and-transform/resize-limits)：软性钳制，
  图形贴着边界停住，交互继续。绝大多数尺寸限制都应该用它。
- `stopTransform()`：硬性中断，交互立即结束。适合检测到非法状态时终止。
- 在 `transformend` 里修正：让用户先自由拖，松手后再把结果拉回合法范围。
  实现最简单，但用户会看到一次「回弹」，观感较差。

先想清楚你要的是哪一种，再选 API。
