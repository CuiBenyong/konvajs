---
title: '自定义控制柄样式'
description: '调整 Konva Transformer 的锚点填充、描边、尺寸、圆角与边框样式，让控制柄与产品风格一致，并适配触屏的点按精度。'
sidebar_position: 4
---

Transformer 的默认外观是中性的白底细框。它的锚点与边框都可以按产品风格调整。

## 用法

常用属性分两组——锚点与边框：

```js
const tr = new Konva.Transformer({
  nodes: [rect],
  anchorFill: '#fff',
  anchorStroke: '#c04040',
  anchorStrokeWidth: 2,
  anchorSize: 16,          // 默认 10
  anchorCornerRadius: 8,
  borderStroke: '#c04040',
  borderStrokeWidth: 2,
  borderDash: [6, 4],
});
```

这些属性一次作用于全部锚点。需要按锚点区分时用
[`anchorStyleFunc`](/docs/select-and-transform/complex-styling)。

<iframe src="/downloads/code/select_and_transform/Transformer_Styling.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * select_and_transform/Transformer_Styling.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Transformer Styling Demo</title>
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

    var plain = new Konva.Rect({
      x: 60, y: 100, width: 110, height: 90,
      fill: '#bbb', draggable: true
    });
    layer.add(plain);
    layer.add(new Konva.Transformer({ nodes: [plain] }));

    var styled = new Konva.Rect({
      x: 280, y: 100, width: 110, height: 90,
      fill: '#4078c0', draggable: true
    });
    layer.add(styled);
    layer.add(new Konva.Transformer({
      nodes: [styled],
      anchorFill: '#fff',
      anchorStroke: '#c04040',
      anchorStrokeWidth: 2,
      // 默认 10。触屏上偏小，这里放大到 16 便于点按
      anchorSize: 16,
      anchorCornerRadius: 8,
      borderStroke: '#c04040',
      borderStrokeWidth: 2,
      borderDash: [6, 4]
    }));

    layer.add(new Konva.Text({
      x: 20, y: 20, fontSize: 14, fill: '#333',
      text: '左：默认样式    右：自定义锚点与边框'
    }));
  </script>

</body>
</html>
```

## 常见问题

### anchorSize 改大之后点击区域会跟着变大吗？

会。`anchorSize` 同时决定视觉尺寸与命中区域，两者是同一个矩形。

这是件好事——想让锚点更好点，直接调大即可，不需要额外设置命中区域。
代价是锚点视觉上也变大了，小图形上可能显得笨重。

### 怎么隐藏某些锚点？

用 `enabledAnchors` 列出要保留的那些：

```js
enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
```

**不要把 `anchorSize` 设成 0 来「隐藏」**。那样锚点确实看不见了，但命中区域
并没有消失（或者变成一个难以预测的极小区域），用户可能在空处意外触发缩放。

### 边框和锚点能分别设置吗？

可以，它们是两组独立的属性：`anchor*` 管锚点，`border*` 管包围框。

一个常见需求是「只要边框、不要锚点」——用于表示「已选中但不可编辑」的状态。
把 `enabledAnchors` 设为空数组、`resizeEnabled` 与 `rotateEnabled` 设为 `false` 即可，
边框仍然显示。

## 国内环境注意事项

默认的 `anchorSize: 10` 是按鼠标精度设计的，在触屏上偏小。

移动端浏览器——尤其是微信内置浏览器——的实际可点按区域受系统手势、
页面缩放、边缘返回手势多重影响，10 像素的锚点在手机上很难准确点中，
靠近屏幕边缘时还可能被系统手势拦截。

触屏场景建议把 `anchorSize` 提到 16 以上，并给舞台留出边距，
不要让可操作的图形贴着屏幕边缘。如果要同时支持桌面与移动，
按 `window.matchMedia('(pointer: coarse)')` 判断指针精度，分别给两套尺寸，
比按屏幕宽度判断准确——平板接鼠标时屏幕宽但指针是精确的。
