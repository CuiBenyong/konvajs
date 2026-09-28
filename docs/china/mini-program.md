---
title: '在小程序中使用 Konva'
description: 'Konva 依赖 DOM 创建画布，不能直接运行在微信小程序的逻辑层。可选方案是 web-view 内嵌 H5、uni-app 与 Taro 的 H5 端，或改用小程序原生 Canvas 2D。'
sidebar_position: 4
---

先说结论：**Konva 不能直接在微信小程序里运行**，其他各家小程序也一样。

Konva 创建任何画布都走 `Konva.Util.createCanvasElement()`，它的第一步是检查浏览器环境，
然后调用 `document.createElement('canvas')`。小程序的逻辑层没有 `document`，
所以连 `new Konva.Stage()` 这一步都过不去。本站在同样没有 DOM 的 Node.js 里实测，
导入 `konva` 和创建 `Konva.Rect` 都能成功，但一创建舞台就抛出：

```
Konva.js unsupported environment.

Looks like you are trying to use Konva.js in Node.js environment (or in a Web Worker),
because "document" object is undefined.
```

这句提示里给出的 `konva/canvas-backend` 是给 Node.js 用的 node-canvas 原生模块，小程序里同样装不了。

## 用法

实际可行的路线有三条。

**1. `<web-view>` 内嵌 H5 页面。** 把画布功能做成一个普通的网页，小程序里用 `<web-view>` 打开：

```html
<!-- pages/editor/editor.wxml -->
<web-view src="https://your-domain.com/editor?id={{id}}"></web-view>
```

H5 页面里照常 `import Konva from 'konva'`，功能不受任何限制。
H5 与小程序之间的通信需要在 H5 里引入微信 JS-SDK：
用 `wx.miniProgram.navigateTo` / `redirectTo` 把结果带参数传回小程序页面；
`wx.miniProgram.postMessage` 发出的消息**不会立即送达**，只在小程序后退、组件销毁、分享等
特定时机才触发 `<web-view>` 的 `message` 事件，不适合做实时交互。具体行为以微信官方文档为准。

**2. uni-app。** 编译到 H5 时就是普通网页，Konva 正常可用。
编译到 App 时，可以把画布代码放进 `renderjs` 模块——它运行在视图层的 WebView 里，有完整的 DOM。
**编译到各家小程序时不可用**，原因同上，`renderjs` 也不支持小程序端。

```html
<!-- 仅 H5 与 App 端生效 -->
<script module="konvaView" lang="renderjs">
import Konva from 'konva';

export default {
  mounted() {
    const stage = new Konva.Stage({ container: 'konva-box', width: 300, height: 300 });
    // ...
  },
};
</script>
```

**3. Taro。** 情况与 uni-app 一样：H5 端可用，小程序端不可用。

如果必须在小程序原生页面里画，就只能改用小程序的 Canvas 2D 接口（`<canvas type="2d">`），
等于放弃 Konva、自己实现图形对象和交互。

## 与其他方案的取舍

**web-view** 是功能最完整的一条：Konva 的全部能力、现成的编辑器代码都能直接复用，
同一套页面还能在浏览器、App 里跑。代价有三：需要在小程序管理后台配置业务域名；
个人主体的小程序不能使用 `<web-view>`（以微信官方文档为准）；
打开时要多加载一次 H5 页面，首屏比原生页面慢，与小程序的通信也只能靠跳转和延迟送达的消息。

**原生 Canvas 2D** 的性能和体验最好，也不受主体类型限制。但 Konva 帮你做的事——
图形对象模型、命中检测、拖拽、Transformer、分层重绘、序列化——都要自己重新实现。
只画静态图表、海报合成这类没有交互的场景，原生接口足够；
有选中、拖拽、缩放旋转的编辑器，自己实现的成本通常远高于 web-view 带来的不便。

判断方法：交互复杂、且可以接受 web-view 的限制，选 web-view；
主体是个人、或者页面必须是原生页面，而交互又简单，选原生 Canvas 2D；
交互复杂又必须原生，考虑面向小程序设计的图形库，不要试图把 Konva 硬塞进去。

## 常见问题

### 有没有 Konva 的小程序适配版？

Konva 官方没有小程序版本。社区里有过一些通过伪造 `document`、替换画布创建函数来适配的尝试，
但事件系统、图片加载、离屏画布都要逐一对接，大多停留在很旧的 Konva 版本上。
采用前务必确认它的维护状态和对应的 Konva 版本，否则本站和官方文档的写法对它都不适用。

### web-view 里的 Konva 性能会差吗？

和在手机浏览器里打开同一个网页基本同级，没有额外的性能损失。
需要注意的是移动端的画布内存上限，图层多、屏幕像素比高时容易白屏，
估算方法与解决办法见[移动端画布内存上限](/docs/china/webview-canvas-limits)。

### 能不能只在小程序里用 Konva 做计算，不画图？

不涉及画布的部分可以。在没有 DOM 的环境里，`Konva.Transform` 的矩阵运算、
`Konva.Util` 里的颜色转换等纯计算函数都能用（本站在 Node.js 里实测），但任何需要画布的操作——
创建舞台和图层、导出图片，甚至创建 `Konva.Text`（它在构造时就要测量文字）——都会抛出同样的错误。
需要在服务端而不是小程序里生成图片的话，见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。
