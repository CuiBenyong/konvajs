---
title: 'AI 工具与 Konva'
description: '让 AI 编程助手正确生成 Konva 代码：可直接投喂的 llms.txt 与 llms-full.txt、AI 最常写出的过时 API（get、Collection.each、konva/cmj）与纠正方式。'
sidebar_position: 5
---

用 AI 助手写 Konva 代码有一个反复出现的问题：**生成的代码看起来很合理，
跑起来却是空白画面或者 `xxx is not a function`**。

原因不是模型能力不够，而是 Konva 有大量 API 在 Konva 8 和 10 两次大版本里被移除，
而这些 API 在训练语料里（KineticJS 时代的博客、十年前的 StackOverflow 答案）
占比极高。更麻烦的是，**多数被移除的 API 不会报错，只是返回 `undefined`**。

## 直接投喂给模型的入口

本站生成了两份给机器读的文件：

- **[`/llms.txt`](https://front-end-js.top/llms.txt)**——全站目录与每页摘要，
  体积小，适合放进 system prompt 或作为检索索引。
- **[`/llms-full.txt`](https://front-end-js.top/llms-full.txt)**——正文全文，
  适合作为 RAG 语料，或者在处理某个具体问题时整段贴进对话。

用法上最有效的是**把相关页的内容连同你的问题一起给模型**，
而不是指望它记得。例如要写滤镜相关的代码，就先贴滤镜章节的正文，
模型的输出质量会有肉眼可见的提升。

本站的 `robots.txt` 显式允许 GPTBot、ClaudeBot、PerplexityBot 等抓取，
页面也是服务端渲染的完整 HTML（不是需要执行 JS 才有内容的空壳），
所以 AI 搜索能直接读到正文。

## AI 生成 Konva 代码时最常见的过时写法

下面这些是本站在检修 116 个演示时**实际遇到并修复过**的，不是泛泛而谈。

### `get()` 选择器（Konva 8 已移除）

```js
// ❌ AI 很爱写这个，来自 KineticJS 时代
layer.get('#myRect')[0].fill('red');
stage.get('.myGroup').on('click', handler);

// ✅ 现在的写法
layer.findOne('#myRect').fill('red');
stage.find('.myGroup').forEach((n) => n.on('click', handler));
```

**这个错的表现很迷惑**：`get` 不存在，所以 `layer.get(...)` 直接抛
`layer.get is not a function`——这个还算好查。真正难查的是下面这个。

### `Collection.each()`（Konva 8 已移除）

```js
// ❌
layer.children.each((child) => child.opacity(0.5));

// ✅ children 现在就是普通数组
layer.children.forEach((child) => child.opacity(0.5));
```

### `konva/cmj` 服务端入口（Konva 10 已移除）

```js
// ❌ Konva 8/9 的写法，10 里这个 subpath 不存在
const Konva = require('konva/cmj').default;

// ✅
import Konva from 'konva';
import 'konva/canvas-backend';
```

报错是 `Package subpath './cmj' is not defined by "exports"`，
看起来像包坏了，实际是入口改名了。详见
[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。

### CommonJS 里漏了 `.default`（Konva 10 起）

```js
// ❌ 10.0.0 迁移到 ESM 之后，这样拿到的不是 Konva
const Konva = require('konva');

// ✅
const Konva = require('konva').default;
```

这个最阴险——`require('konva')` **不报错**，返回一个模块命名空间对象，
直到你 `new Konva.Stage()` 才报 `Konva.Stage is not a constructor`。

### 手动 `drawImage` 之后不重绘

```js
// ❌ 老教程里常见：直接操作底层 context
layer.getContext().drawImage(img, 0, 0);
```

Konva 现代版本会在属性变化时自动重绘图层，
**你手动画上去的内容会在下一次自动重绘时被清掉**。
正确做法是用 `Konva.Image` 节点，让它成为场景图的一部分。

### CDN 引用老版本

```html
<!-- ❌ -->
<script src="https://unpkg.com/konva@8/konva.min.js"></script>
<!-- ✅ 本站统一用浮动大版本 -->
<script src="https://unpkg.com/konva@10/konva.min.js"></script>
```

## 常见问题

### 为什么 AI 老写出 Konva 8 的 API？

两个原因叠加。

**语料分布。** Konva 的前身 KineticJS 从 2011 年就存在，
加上 Konva 8 之前的版本，网上积累了十几年的示例代码。
Konva 8 是 2021 年发布的，10 是 2025 年——
新 API 的语料量远小于旧 API。

**缺少纠错信号。** 如果被移除的 API 会抛一个明确的
"此 API 已在 v8 移除，请改用 findOne" 错误，那么错误会很快被发现和纠正。
但实际上 `children.each` 只是 `undefined`，
`require('konva')` 只是返回了个对象——**模型在训练时也没有收到"这是错的"这个信号**。

### 怎么让 AI 用最新 API？

按有效性排序：

1. **贴文档。** 把本站相关页面或 `llms.txt` 的对应片段放进对话。
   这比任何提示词技巧都管用。
2. **明确版本号。** 在 prompt 里写"使用 Konva 10.6，ESM 导入"，
   而不是只说"用 Konva"。
3. **给一个正确的骨架。** 先贴一段你已经验证能跑的代码，
   让它在这个基础上改，而不是从零生成。
4. **让它自己验证。** 如果你的工具能跑代码，
   要求它跑一遍并确认画面不是空白——
   Konva 的错误很多是"不报错但没效果"，只有跑起来才看得出。

### 生成的代码跑不出画面怎么排查？

这是最高频的情况，而且**通常不是 API 用错，是漏了 `layer.add()` 或
`stage.add(layer)`**。完整的排查顺序见
[常见问题汇总](/docs/faq)里的「图形画了但看不见」。

一个快速自查：

```js
console.log(stage.getLayers().length);   // 0 说明 layer 没加进 stage
console.log(layer.getChildren().length); // 0 说明图形没加进 layer
```

### AI 写的性能优化建议可信吗？

部分可信，但要小心两类常见的错误建议。

一是**滥用 `cache()`**。AI 很容易对所有东西都建议加缓存，
但缓存本身有成本（一张额外的离屏画布），
对频繁变化的节点是净损失——每次变化都要重建缓存。

二是**图层越多越好**的误解。每个 Layer 都是一个真实的 `<canvas>` 元素，
有独立的内存占用和合成开销。Konva 源码里把 5 作为告警阈值是有道理的。

这两条的正确做法见 [性能优化总览](/docs/performance/all-performance-tips)。

## 国内环境注意事项

**AI 搜索的中文 Konva 语料非常稀薄。** 中文互联网上的 Konva 内容
多数是官方文档的机翻，且版本停留在 7/8 时代。
用中文提问时，模型能检索到的高质量语料比英文少一个数量级，
**换成英文提问往往能得到明显更准确的答案**——
特别是涉及具体 API 行为的问题。

**国内的 AI 编程助手**（通义灵码、文心快码、豆包 MarsCode 等）
在 Konva 这类中等流行度的库上表现差异较大。
如果你发现某个助手反复生成 Konva 8 的写法，
把本站对应页面的内容贴进去通常能立刻纠正——
它们大多支持上下文注入。

**验证比提问更重要。** 无论用哪个助手，Konva 代码都要实际跑一遍。
本站所有演示都通过真实浏览器的自动检查（无控制台报错、画布有非透明像素），
可以直接拿演示代码当作已验证的起点。
