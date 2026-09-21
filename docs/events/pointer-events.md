---
title: 'Pointer 指针事件'
description: 'Konva 的 pointerdown / pointermove / pointerup 统一处理鼠标、触摸与手写笔，并按 pointerType 同时派发对应的鼠标或触摸事件——混着监听会收到两次。'
sidebar_position: 16
---

指针事件（Pointer Events）是浏览器用来统一鼠标、触摸、手写笔的一套抽象。
Konva 把它接了进来，`Konva.pointerEventsEnabled` 默认就是 `true`。

<iframe src="/downloads/code/events/Pointer_Events.html" style="width: 50vw;height:300px;"></iframe>

```js
shape.on('pointerdown', (e) => {
  console.log(e.evt.pointerType);   // 'mouse' | 'touch' | 'pen'
});
```

## 事件列表

| 事件 | 说明 |
|---|---|
| `pointerdown` | 按下（鼠标键、手指触屏、笔尖接触） |
| `pointermove` | 移动 |
| `pointerup` | 抬起 |
| `pointercancel` | 系统中断了这次交互（来电、手势接管） |
| `pointerclick` | 一次完整的点击 |
| `pointerdblclick` | 双击 |
| `pointerover` / `pointerout` | 进入 / 离开（冒泡） |
| `pointerenter` / `pointerleave` | 进入 / 离开（不冒泡） |

## 一次交互会派发两套事件

这是本页最重要的一点，也是"点一下执行了两遍"最常见的原因。

Konva 内部按 `pointerType` 把指针事件**同时映射成**对应的鼠标或触摸事件，
两套都会派发。下面是在真实浏览器里对同一个矩形监听九个事件、
各操作一次测出来的实际顺序：

**鼠标点击一次：**

```
pointerdown → mousedown → pointerup → pointerclick → mouseup → click
```

**手指轻点一次：**

```
pointerdown → touchstart → pointerup → pointerclick → touchend → tap
```

两点结论：

**同时监听 `pointerdown` 和 `mousedown` 会收到两次。**
它们不是"二选一"的关系，而是同一个物理动作的两种表述。
`pointerup` / `mouseup`、`pointerclick` / `click` 同理。

**但 `click` 和 `tap` 不会同时触发。** 注意上面两行——
鼠标那行末尾是 `click`，触摸那行末尾是 `tap`，
`pointerclick` 根据 `pointerType` 只映射成其中一个。
所以 `on('click tap')` 这种写法是安全的，见
[移动端 tap 与 click](/docs/events/mobile-tap-and-click)。

**选一套用，不要混。** 新代码用指针事件（一套代码覆盖三种输入），
或者用 `click tap` 这类传统写法，但不要两者都注册。

## 常见问题

### 该用 pointer 还是 mouse + touch？

新代码用 pointer。一套监听覆盖鼠标、触摸、手写笔，
不需要为移动端和桌面端写两份逻辑，也不用担心两者的事件顺序差异。

需要下探到具体设备的场景只有几种：
读取手写笔压感（`e.evt.pressure`）、
处理多指手势（需要跟踪多个 `pointerId`）、
或者要精确控制触摸时的滚动行为。

### 怎么知道是鼠标还是触摸？

原生事件对象上的 `pointerType`：

```js
shape.on('pointerdown', (e) => {
  if (e.evt.pointerType === 'touch') {
    // 手指：命中区域要更大，不要依赖 hover
  } else if (e.evt.pointerType === 'pen') {
    console.log('压感', e.evt.pressure);   // 0 ~ 1
  }
});
```

这比判断 `'ontouchstart' in window` 可靠得多——
后者只能判断设备**支持**触摸，判断不了用户**这一次**用的是什么。
现在很多笔记本既有触摸屏又有鼠标。

### 多指触摸怎么区分是哪根手指？

用 `pointerId`。每根手指按下时分配一个 id，直到抬起为止保持不变：

```js
const active = new Map();

shape.on('pointerdown', (e) => {
  active.set(e.evt.pointerId, { x: e.evt.clientX, y: e.evt.clientY });
});
shape.on('pointerup pointercancel', (e) => {
  active.delete(e.evt.pointerId);
});
```

**`pointercancel` 一定要处理。** 系统中断（来电、通知、浏览器接管手势）时
只会派发 `pointercancel`，不会派发 `pointerup`。
只监听 `pointerup` 的话，那根手指会永远留在你的 Map 里，
后续的手势判断全部错乱。

Konva 10.5.0 修过一个相关问题：`touchcancel` 此前会让
`Transformer` 保持激活状态，现在取消时会正确派发
`pointercancel` / `touchcancel`。

### pointerclick 和 click 有区别吗？

对鼠标操作来说没有——`pointerclick` 会被映射成 `click`，两者都会触发。
**所以不要两个都监听**，否则一次点击处理两遍。

区别在触摸时：`pointerclick` 映射成 `tap` 而不是 `click`。
所以 `pointerclick` 是"跨设备的点击"，`click` 是"鼠标的点击"。

## 性能提示

`pointermove` 的触发频率很高——高刷新率屏幕上可以到每秒 120 次以上，
而每一次 Konva 都要做一遍命中检测（读取命中图上的一个像素）。
在 `pointermove` 里做重活是卡顿最常见的来源。

几条实践：

**别在 `pointermove` 里调 `getClientRect()` 或 `find()`。**
前者要递归遍历子树，后者要遍历整棵场景图。
把结果在 `pointerdown` 时算好存起来。

**拖拽过程中关掉命中检测。** `Konva.hitOnDragEnabled` 默认就是 `false`，
拖拽时不做命中检测——这是个好默认值，不要为了"拖的时候也要 hover 效果"
随手打开它，代价比看起来大。

**用 `Stage.eventBatchFunc()` 批量处理。** Konva 10.5.0 新增，
原本是给框架集成层用的，可以把原生输入处理合并到一次批量更新里：

```js
stage.eventBatchFunc((fn) => requestAnimationFrame(fn));
```

注意它只作用于原生输入事件，直接的 `fire()` 调用和程序化的属性变更不走批处理。

**调大 `Konva.dragDistance`。** 默认 3px，意味着手指抖动 3px 就进入拖拽。
移动端调到 6–10 能减少误触发的拖拽，也就减少了拖拽期间的持续计算。
