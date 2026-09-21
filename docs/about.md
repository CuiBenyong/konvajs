---
title: '关于 Konva'
description: 'Konva 的项目背景、版本演进的几个分水岭（10.0 的 ESM 迁移、10.4 的字素排版、10.6 的滤镜尺度修正）、许可证与维护现状，以及本中文站与官方文档的关系。'
sidebar_position: 97
---

Konva 是一个基于 HTML5 Canvas 的 2D JavaScript 框架，
由 <a href="https://github.com/lavrton" target="_blank">Anton Lavrenov（lavrton）</a>
维护，采用 MIT 许可证。

它的前身是 KineticJS。KineticJS 在 2014 年前后停止维护，
Konva 从它 fork 而来并持续发展至今——所以网上那些讲 KineticJS 的老文章，
概念大体还对，API 已经对不上了。

## 版本演进的几个分水岭

升级时真正需要留意的是这几个版本。以下信息来自官方 CHANGELOG，
本站演示统一跟随 `konva@10` 浮动大版本。

**10.0.0（2025-09-07）——ESM 迁移。** 整个模块从 CommonJS 改为 ES Module。
CommonJS 环境里必须改成 `require('konva').default`，
少了 `.default` 会拿到一个模块命名空间对象，看起来像 Konva 但什么都不是。
同时**去掉了对 Node.js 环境的默认支持**，服务端渲染要显式引入后端
（见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)）。
这一版还改了文字定位以对齐 DOM/CSS 的渲染，
想要旧行为可以设 `Konva.legacyTextRendering = true`。

**10.4.0（2026-09-07）——字素感知排版。** 文本排版从按 UTF-16 码元
改为按字素（grapheme）。国旗 emoji 和 ZWJ 组合表情（如 👨‍👩‍👧）
不会再被从中间拆开，`letterSpacing` 也改为每个字素加一次间距。
**如果你的布局依赖旧的按码元计算的间距，含 emoji 的文本宽度会变化。**
这一版还新增了 `destroy` 事件，并修掉了一批"抛错之后整个图层不再绘制"的问题——
比如不设 `sides` 的 `RegularPolygon`、负的 `radius` / `cornerRadius`。

**10.5.0（2026-09-08）——`Stage.eventBatchFunc()`。** 给框架集成层用的，
可以把原生输入事件批量处理。注意直接的 `fire()` 调用和程序化的属性改动不走批处理。

**10.6.0（2026-09-19）——滤镜尺度修正与自定义滤镜签名变更。**
`blurRadius`、`pixelSize` 和 CSS 滤镜里的长度此前是按**缓存像素**算的，
导致同一个节点在更高的 `pixelRatio` 下看起来模糊程度不同；
现在统一按**节点坐标**算。配套地，**自定义滤镜函数的签名变成了
`(imageData, pixelRatio)`**——第二个参数是新增的，
用它把节点长度换算成像素，见[自定义滤镜](/docs/filters/custom-filter)。
另外闭合路径（`z` 命令）的 `getLength()` 现在包含闭合边，与 SVG 一致。

## 常见问题

### Konva 还在维护吗？

在。从上面的时间线能看出节奏：10.3.0 到 10.6.0 之间只隔了几个月，
其中 10.4.0、10.5.0、10.6.0 三个版本发布在两周之内，
每一版都有几十条修复。

但要清楚这是一个**高度依赖单个维护者**的项目。
这不是唱衰——很多基础库都是这个状态——而是说，
把它放进长期项目之前，你应当知道这个事实，
并做好"某天需要自己维护一个 fork"的心理准备。MIT 许可证允许你这么做。

### 升级大版本要注意什么？

Konva 的 CHANGELOG 写得很细，**每条破坏性变更都带 `Note:` 说明影响范围**，
这在开源项目里不常见，值得直接读原文而不是看二手总结。

实践上的顺序是：先看有没有 `Breaking Changes` 段落；
再搜自己项目里用到的 API 名字；最后跑一遍视觉回归——
Konva 的很多变更是"渲染结果差几个像素"这类，
类型检查和单元测试都发现不了，只有截图比对能看出来。

特别留意**文字相关**的变更。10.0.0 改过文字定位、10.4.0 改过字素处理、
10.6.0 改过下划线的包围盒和带 `letterSpacing` 时的宽度测量——
文字是这个库里改动最频繁的部分，也是最容易让布局悄悄错位的部分。

### 本站和官方文档是什么关系？

本站是 Konva 官方文档的中文翻译，并在此基础上补充了原创内容——
每一页的「常见问题」与末尾的小节都是中文读者实际会遇到的问题，
官方文档里没有这些。

**API 的权威来源始终是
<a href="https://konvajs.org/api/Konva.html" target="_blank">官方 API 参考</a>。**
本站内容如与官方冲突，以官方为准。发现错误欢迎到
<a href="https://github.com/CuiBenyong/konvajs" target="_blank">本站仓库</a>提 Issue。

本站所有演示都会在真实浏览器里跑一遍自动检查（无控制台报错、
画布有内容），所以你看到的示例代码是能跑的——这一点和很多翻译站不同。

## 国内环境注意事项

**看 CHANGELOG 比看任何中文总结都可靠**，但 GitHub 在国内访问不稳。
几个替代入口：把仓库 URL 里的 `github.com` 换成 `github.dev`
可以在网页版 VS Code 里直接看文件；
npm 包页面（`registry.npmmirror.com/konva`）能查到所有版本号和发布时间；
`npm view konva versions` 也能拿到完整版本列表，不需要访问 GitHub。

**版本选择上，本站建议跟随 `konva@10` 浮动大版本而不是锁死小版本。**
理由是 Konva 的补丁版本里修的多半是"某个属性组合下画错"这类问题，
锁死小版本意味着你会一直带着这些 bug。
真正需要锁定的是**生产构建**——在 `package-lock.json` 里锁，
而不是在 `package.json` 的版本范围里锁。
