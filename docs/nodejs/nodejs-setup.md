---
title: '在 Node.js 中使用 Konva'
description: 'Konva 10 的服务端渲染：canvas-backend 与 skia-backend 两个入口、必须同时导入 konva 本体的原因、导出 PNG 到文件，以及容器里中文变方框的成因与解决。'
sidebar_position: 1
---

Konva 能在没有浏览器的 Node.js 里跑，用来在服务端生成图片——
海报合成、分享卡片、报表快照、缩略图预渲染都属于这一类。

Konva 10 的服务端支持与 9.x 完全不同：入口从 `konva/cmj` 换成了
**`konva/canvas-backend`**，并且多了一个基于 Skia 的 `konva/skia-backend`。
照着旧文章写 `require('konva/cmj')` 会直接报 `Package subpath './cmj' is not defined`。

## 安装

后端库是**可选的对等依赖**（`peerDependenciesMeta` 里两个都标了 `optional`），
装 Konva 时不会自动带上，必须自己选一个装：

```bash
npm install konva canvas
# 或者用 Skia 后端
npm install konva skia-canvas
```

| 后端 | 入口 | 说明 |
|---|---|---|
| node-canvas | `konva/canvas-backend` | 最常用，生态成熟，原生模块需编译或下载预编译包 |
| skia-canvas | `konva/skia-backend` | 基于 Skia，文字与路径渲染质量更好，体积更大 |

下文以 `canvas` 为例，`skia-canvas` 只需把导入路径换掉。

## 两个 import 缺一不可

这是最容易踩的一步。后端入口**只装环境适配，不带图形类**：

```js
import Konva from 'konva';      // ① 带来 Rect / Circle / Text / Filters
import 'konva/canvas-backend';  // ② 装上 Node 渲染后端
```

这是 Konva 官方 CHANGELOG 在 10.0.0 的迁移说明里给出的写法。
反过来写也一样能跑（实测两种顺序都正常）——两个模块操作的是同一个单例对象，
从哪个模块拿 `Konva` 引用都行。

少了第①行，你能拿到 `Konva.Stage`，但 `Konva.Rect` 是 `undefined`，
报错是 `Konva.Rect is not a constructor`——看起来像装错了包，
实际只是少导了一个模块。这一点在源码注释里写得很明白：
`canvas-backend` 导出的是"不含图形与滤镜的 Konva 核心对象，
`import 'konva'` 会往同一个对象上补齐它们"。

反过来，只 `import 'konva'` 而不导后端，`new Konva.Stage()` 会抛
`Konva.js unsupported environment.`——Konva 检测不到 DOM，
也没人告诉它该用什么来创建画布。

**两个入口都是 ESM。** CommonJS 项目里要用动态 `import()`，
或者把文件扩展名改成 `.mjs`、在 `package.json` 里设 `"type": "module"`。

## 一个完整的例子

服务端没有 DOM，所以 `Stage` **不传 `container`**：

```js
import Konva from 'konva';
import 'konva/canvas-backend';
import fs from 'node:fs';

const stage = new Konva.Stage({ width: 400, height: 200 });
const layer = new Konva.Layer();

layer.add(new Konva.Rect({
  x: 0, y: 0, width: 400, height: 200, fill: '#f5f5f5',
}));
layer.add(new Konva.Text({
  x: 24, y: 80, text: '服务端渲染', fontSize: 36, fill: '#333',
}));

stage.add(layer);

// 方式一：拿 base64 再自己写文件
const base64 = stage.toDataURL().split(',')[1];
fs.writeFileSync('out.png', Buffer.from(base64, 'base64'));

// 方式二：走 node-canvas 的流，大图更省内存
stage.toCanvas().createPNGStream().pipe(fs.createWriteStream('out2.png'));
```

`stage.toCanvas()` 返回的就是 node-canvas 的 Canvas 实例，
它的 `createPNGStream()` / `createJPEGStream()` 都可以直接用。
大尺寸图片走流比先拼 base64 字符串省得多——base64 会让内存里同时存在
像素数据、二进制 Buffer 和一个比二进制还大三分之一的字符串。

加载图片用 node-canvas 的 `loadImage`，不要指望 `Konva.Image.fromURL`
在服务端按浏览器那套工作：

```js
import { loadImage } from 'canvas';

const img = await loadImage('./logo.png');   // 也支持 http(s) URL 和 Buffer
layer.add(new Konva.Image({ image: img, x: 20, y: 20 }));
```

## 常见问题

### 为什么报 Konva.Rect is not a constructor？

少了 `import 'konva'`。后端入口 `konva/canvas-backend` 只负责告诉 Konva
"用 node-canvas 来创建画布和图片元素"，它导出的核心对象上没有任何图形类。

两行都要写。**顺序不重要，两种写法实测都能跑**——它们操作的是同一个单例对象，
后导入的模块往同一个对象上补东西。建议照官方 CHANGELOG 的形式写
（`import Konva from 'konva'` 在前），这样和你在别处看到的示例一致。

### 为什么报 Konva.js unsupported environment？

反过来的情况：只 `import 'konva'` 没导后端。
Konva 在构造 `Stage` 时会尝试创建一个 canvas 元素，
在 Node 里既没有 `document` 也没有注册过替代实现，于是直接抛错。

如果你在一个同时跑浏览器和服务端的代码库里遇到这个，
检查是不是 SSR 阶段执行到了本该只在客户端跑的绘图代码。

### 中文显示成方框怎么办？

node-canvas 不自带字体，它通过系统的 fontconfig 查找。
本机开发时通常没问题——macOS 和完整的桌面版 Linux 都预装了中文字体。
**问题几乎都出在容器里**：`node:20-slim`、`node:20-alpine`
这类精简镜像不含任何中文字体，中文会渲染成方框（tofu）。

两个办法，推荐第二个：

```dockerfile
# 办法一：在镜像里装字体
RUN apt-get update && apt-get install -y fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
```

```js
// 办法二：把字体文件放进仓库，显式注册（可复现，不依赖镜像）
import { registerFont } from 'canvas';
registerFont('./fonts/NotoSansSC-Regular.otf', { family: 'Noto Sans SC' });
// 注册必须在创建任何 canvas 之前完成
const text = new Konva.Text({ text: '中文', fontFamily: 'Noto Sans SC' });
```

`registerFont` 必须在**第一次创建画布之前**调用，之后再注册不生效。
注意字体文件的授权——思源黑体（Noto Sans CJK / Source Han Sans）是 OFL，
可以随镜像分发；微软雅黑、苹方不行。

### 服务端和浏览器渲染出来的一样吗？

**不一样，不要按像素比对。** 差异来自三处：

字体不同（服务端装的字体和用户机器上的几乎不可能一致），
抗锯齿算法不同（Skia、Cairo、浏览器各有各的实现），
以及文字度量不同——`text.width()` 在两边会返回不同的值，
依赖它做的居中和换行计算结果也就不同。

所以「服务端预渲染 + 前端展示」这种方案，要么全交给服务端出图，
要么接受两边有肉眼可见的细微差别。想做视觉回归测试的话，
基线图必须在同一套环境里生成。

### 能在服务端用滤镜和 cache 吗？

可以，`Konva.Filters` 的 20 个滤镜在 Node 里全部可用，
`cache()` 也正常工作——它们都只依赖 `getImageData` / `putImageData`，
不依赖 DOM。

但要注意性能：滤镜是纯 JS 的逐像素循环，在服务端**阻塞事件循环**。
浏览器里卡一帧只是掉帧，服务端卡住就是这段时间内所有请求都在排队。
大图加滤镜应该丢进 worker 线程或独立的渲染进程。

## 国内环境注意事项

`canvas` 是**原生模块**，`npm install` 时会先尝试从 GitHub Releases
下载预编译的二进制。国内访问 GitHub 不稳，这一步经常超时，
然后回退到本地编译——而本地编译要求先装好一整套图形库，
多数人的机器上并没有。

优先走镜像：

```bash
npm config set canvas_binary_host_mirror https://registry.npmmirror.com/-/binary/canvas
npm install canvas
```

如果只能本地编译，先装系统依赖：

```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Debian / Ubuntu
apt-get install -y build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
```

**Docker 里尤其容易连环踩坑**：基础镜像既没有编译工具链、
也没有图形库、还没有中文字体，三样都要补。
如果构建时间敏感，更省事的做法是用多阶段构建，
在完整镜像里装好 `node_modules` 再拷进精简镜像——
但要注意原生模块的二进制与运行时镜像的 libc 必须匹配
（Alpine 用 musl，Debian 用 glibc，两者不能混），
这也是 Alpine 上跑 node-canvas 格外麻烦的原因。
`skia-canvas` 在这一点上省心一些，它提供的预编译包覆盖面更广。
