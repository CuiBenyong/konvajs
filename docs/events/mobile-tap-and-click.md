---
title: '移动端 tap 与 click'
description: 'Konva 按输入类型只派发 click 或 tap 之一，并默认对触摸事件调用 preventDefault 抑制浏览器的合成点击；把 preventDefault 关掉会让双重触发回来。'
sidebar_position: 17
---

移动端最经典的坑是"一次点击执行了两遍"。
这一页讲清楚 Konva 在这件事上帮你挡掉了什么、什么情况下会漏过来。

<iframe src="/downloads/code/events/Mobile_Tap_And_Click.html" style="width: 50vw;height:300px;"></iframe>

## click 和 tap 不会同时触发

先说结论，因为这和很多老文章讲的不一样：

**Konva 把 `pointerclick` 按输入类型映射成 `click`（鼠标）
或 `tap`（触摸），只会得到其中一个。**

实测一次鼠标点击与一次手指轻点收到的事件序列：

```
鼠标： pointerdown → mousedown  → pointerup → pointerclick → mouseup  → click
触摸： pointerdown → touchstart → pointerup → pointerclick → touchend → tap
```

末尾一个是 `click`，另一个是 `tap`，没有任何一次交互同时产生两者。

所以下面这种写法是**安全**的，桌面和移动端都只会执行一次：

```js
shape.on('click tap', handler);   // 空格分隔，注册两个事件名
```

## Konva 默认替你调用了 preventDefault

浏览器有一套"兼容性鼠标事件"机制：手指轻点之后，
浏览器会补发一组合成的 `mousedown` / `mouseup` / `click`，
好让只写了鼠标逻辑的老页面在手机上也能用。
这正是"双重触发"的历史来源。

Konva 默认把它挡掉了。源码里在处理按下事件时：

```js
// only call preventDefault if the shape is listening for events
const isTouch = evt.type.indexOf('touch') >= 0;
if (shape.preventDefault() && evt.cancelable && isTouch) {
  evt.preventDefault();
}
```

节点的 `preventDefault` 属性**默认是 `true`**，
所以只要图形在监听事件，触摸事件就会被 `preventDefault()`，
浏览器的合成点击不再产生。

**这意味着你把 `preventDefault` 关掉之后，双重触发会回来：**

```js
shape.preventDefault(false);   // 合成 click 不再被抑制
```

而关掉它是有正当理由的——`preventDefault()` 会一并阻止页面滚动，
如果你的画布是页面的一部分、用户需要在画布上滑动来滚动页面，
就必须关掉它。这时候就得小心事件重复，见
[移动端滚动](/docs/events/mobile-scrolling)。

## dragDistance 影响轻触的判定

`Konva.dragDistance` 默认 **3**（像素）。手指按下后移动超过这个距离，
Konva 判定为拖拽，`tap` 就不会触发了。

手指远不如鼠标稳，按下的瞬间偏移三五个像素很正常。
**默认值对触摸设备偏小**，表现为"明明点了一下，却没有反应"。

```js
Konva.dragDistance = 8;   // 全局
shape.dragDistance(8);    // 或者只改某个节点
```

调大的副作用是拖拽启动会有一点"迟钝感"，
需要在"点不中"和"拖不动"之间权衡。移动端优先的应用一般设 6–10。

## 常见问题

### 还有 300ms 点击延迟吗？

现代浏览器基本没有了。这个延迟原本是为了等待判断是不是双击缩放，
当页面声明了 `<meta name="viewport" content="width=device-width">`
（即已适配移动端、不可缩放或由浏览器管理缩放）之后，
Chrome 和 Safari 都已移除。

所以第一件事是确认你的页面有这个 meta 标签。

仍可能有延迟的场景是**老旧的 WebView**——
一些 App 内置浏览器的内核版本很旧。如果确实遇到，
用 `touchstart` 代替 `tap` 能规避，但要自己处理"按下后滑走不应算点击"的逻辑。

### 为什么我在手机上点不中小按钮？

两个原因通常同时存在：

**命中区域太小。** 手指的接触面积远大于鼠标指针。
细线要设 `hitStrokeWidth`，小图标要用 `hitFunc` 把命中区扩大到
至少 44×44 的 CSS 像素（这是 iOS 人机界面指南的建议值），
见[自定义命中区域](/docs/events/custom-hit-region)。

**`dragDistance` 太小。** 见上面一节。

### 双击在移动端怎么写？

`dbltap`，对应桌面的 `dblclick`：

```js
shape.on('dblclick dbltap', handler);
```

映射关系和单击一致——`pointerdblclick` 按输入类型映射成
`dblclick` 或 `dbltap` 之一。

### 长按怎么实现？

Konva 没有内置长按事件，自己用定时器实现：

```js
let timer = null;

shape.on('pointerdown', () => {
  timer = setTimeout(() => { timer = null; onLongPress(); }, 500);
});
shape.on('pointerup pointercancel pointerout', () => {
  clearTimeout(timer);
  timer = null;
});
shape.on('click tap', () => {
  if (timer === null) return;   // 已经当作长按处理了，别再当点击
});
```

**`pointercancel` 必须清理定时器**，否则来电或系统手势打断之后，
长按回调仍然会在半秒后触发。

## 国内环境注意事项

**微信内置浏览器是必测环境。** 安卓端微信用的是 X5 内核（基于较旧的 Chromium），
在触摸事件、字体回退、`preventDefault` 的生效范围上和标准 Chrome 都有差异。
iOS 端微信用的是系统 WKWebView，行为更接近 Safari。
**桌面浏览器的移动端模拟器复现不出这些差异**，必须真机测。

调试手段上，微信里看不到控制台，实用的办法是引入 vConsole：

```html
<script src="https://unpkg.com/vconsole/dist/vconsole.min.js"></script>
<script>new VConsole();</script>
```

排查"执行了两次"这类问题时，直接在处理函数里打印 `e.type` 和
`e.evt.pointerType`，一眼就能看出是哪个事件重复了。

**各家 App 的 WebView 内核版本差异很大。** 如果你的画布要嵌进
第三方 App（小程序的 web-view、各类资讯 App 的内置浏览器），
不要假设它们支持指针事件。保险的写法是用 `click tap` 这类传统事件名，
Konva 内部会把指针事件映射过来，两边都能工作。
