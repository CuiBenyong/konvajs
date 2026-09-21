---
title: '文字动画'
description: '用 Konva.Animation 做打字机与逐字跳动：文字必须按字素切分否则 emoji 会被劈开，改 text() 会触发重新排版，比改坐标贵得多。'
sidebar_position: 5
---

文字动画和图形动画的区别在于：改 `x` / `y` 只是换个位置画，
改 `text()` 却要重新测量、重新换行、重新算每一行的宽度。
**它贵得多**，写法上的讲究也因此更多。

<iframe src="/downloads/code/animations/Text_Animations.html" style="width: 50vw;height:300px;"></iframe>

## 打字机：必须按字素切分

最直觉的写法是 `full.slice(0, n)`——**这个写法对中文没问题，对 emoji 会出事。**

`String.prototype.slice` 按 UTF-16 码元切分。一个 emoji 往往由多个码元组成
（👨‍👩‍👧 是三个人物 emoji 加两个零宽连接符，共 11 个码元），
从中间切开会得到半个字符，渲染成乱码或替换符。

正确做法是先按**字素**（grapheme）切成数组：

```js
const full = '你好，Konva 👨‍👩‍👧 世界！';

const graphemes = Intl.Segmenter
  ? Array.from(
      new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(full),
      (s) => s.segment,
    )
  : Array.from(full);   // 退路：至少按码点切，比 slice 好

const text = new Konva.Text({ x: 20, y: 20, text: '', fontSize: 22 });
layer.add(text);

const anim = new Konva.Animation((frame) => {
  const n = Math.floor(frame.time / 160);
  if (n >= graphemes.length) { anim.stop(); return; }
  text.text(graphemes.slice(0, n).join(''));
}, layer);
anim.start();
```

`Intl.Segmenter` 在现代浏览器里都有；
`Array.from(str)` 按码点切，能正确处理单个 emoji，但仍会拆开 ZWJ 组合。

顺带一提，**Konva 自己的排版从 10.4.0 起已经是字素感知的**——
国旗 emoji 和 ZWJ 组合在换行和 `letterSpacing` 时不会被拆开。
但那是 Konva 内部的绘制逻辑，**你传给它的字符串怎么切，得你自己负责**。

## 逐字跳动：charRenderFunc

`charRenderFunc` 让你接管每个字素的绘制。它**只接收一个对象参数**：

```js
const bouncing = new Konva.Text({
  x: 20, y: 60, text: 'Konva 动画 Bounce', fontSize: 26, fill: '#c06040',
  charRenderFunc: ({ char, index, x, y, context }) => {
    const dy = Math.sin(phase + index * 0.6) * 6;
    context.fillText(char, x, y + dy);
  },
});

let phase = 0;
new Konva.Animation((frame) => {
  phase = frame.time / 200;
  layer.batchDraw();
}, layer).start();
```

参数字段见 [Text 文字](/docs/shapes/text) 里的完整表格。
两个容易踩的点：**回调签名不是 `(ctx, info)`**（写错了会报
`Cannot read properties of undefined`），
以及 **`index` 是跨行累加的全局序号**，要按行内位置做效果得用 `column`。

## 常见问题

### 为什么文字动画特别卡？

因为每次 `text()` 赋值都会让 Konva 重新做一遍排版：
测量每个字素的宽度、计算换行位置、算出每行的对齐偏移。
文本越长，这个过程越贵。

对比一下：改 `x` 只是改一个数字，下一帧用新的变换矩阵画；
改 `text` 要重新走一遍完整的文字布局流程。

Konva 10.4.0 对此做过优化——`charRenderFunc` 和长文本换行
此前的复杂度是文本长度的**平方**，现在已经修正。
但即便是线性的，长文本每帧重排依然不便宜。

### 能用 Tween 做打字机吗？

不能。`Konva.Tween` 只对**数值型**属性插值，
`text` 是字符串，没法在 `'你好'` 和 `'你好世'` 之间取中间值。

这和渐变色标的情况一样——凡是数组型或结构化的属性，
都只能用 `Konva.Animation` 每帧自己算，见
[复杂补间动画](/docs/tweens/complex-tweening)。

理论上可以用 Tween 驱动一个无关的数值属性，再在 `onUpdate` 里把它换算成字数。
但 Tween 必须绑定在节点的某个属性上，为此借用一个不影响显示的属性
既绕又难读——**这种场景直接用 `Animation` 就好**，
它本来就是为"每帧自己算"设计的。

### 中英文混排时文字在抖动？

因为每加一个字，整段文字的宽度就变一次，
如果你每帧根据 `text.width()` 重新居中，位置就会跟着跳。

解法是**固定容器宽度**，用 `align` 而不是每帧重算：

```js
new Konva.Text({
  x: 20, y: 20,
  width: 300,        // 固定宽度
  align: 'center',   // 由 Konva 在这个宽度内对齐
  text: '',
});
```

这样文字在固定的框里居中，加字时不会整体位移。

### 文字淡入淡出用什么？

这个可以用 Tween——`opacity` 是数值：

```js
text.opacity(0);
new Konva.Tween({ node: text, duration: 0.5, opacity: 1 }).play();
```

逐字淡入则要用 `charRenderFunc`，在回调里根据 `index`
和当前进度设 `context.globalAlpha`。

## 性能提示

文字动画的开销集中在**重排**上，优化思路都是围绕"少排版"。

**把已完成的部分固化。** 打字机效果如果文本很长，
每帧都在重排整段。更好的结构是：已经打完的行做成一个独立的、
不再变化的 `Konva.Text` 并 `cache()`，
只让**当前正在打的那一行**保持活动状态。
排版成本从"整段"降到"一行"。

**限制更新频率。** 打字机不需要 60fps——
每秒 6～10 个字就已经很快了。在 `Animation` 回调里判断字数有没有变化，
没变就直接返回，不要每帧都赋值 `text()`：

```js
let last = -1;
const anim = new Konva.Animation((frame) => {
  const n = Math.floor(frame.time / 160);
  if (n === last) return;      // 关键：字数没变就什么都不做
  last = n;
  text.text(graphemes.slice(0, n).join(''));
}, layer);
```

这一条的收益最大——它把每秒 60 次重排降到每秒 6 次。

**文字动画单独放一层。** 正在动的文字和静态内容放在同一个图层，
意味着每次重排都要重绘整层。拆到独立的 Layer 上，
每帧只重绘这一层，见[图层管理](/docs/performance/layer-management)。

**`charRenderFunc` 有额外成本。** 启用它之后 Konva 必须逐字素绘制，
没法用浏览器一次性绘制整行的快路径。
只在确实需要逐字控制时才用，做整体的移动、缩放、淡入用普通属性即可。
