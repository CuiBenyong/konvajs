---
title: '在 Next.js 中使用'
description: 'Konva 10 与 react-konva 19 在 Next.js App Router 下只需 use client，不必再用 dynamic 关闭 SSR。说明服务端渲染的实际输出、水合不一致与按需加载。'
sidebar_position: 1
---

搜「Next.js Konva」，大多数答案都会告诉你必须写
`dynamic(() => import('./Canvas'), { ssr: false })`，否则会报 `Cannot find module 'canvas'`。
**这是 Konva 9 时代的结论。** Konva 10 不再默认加载 Node 端的原生画布模块，
react-konva 的 README 也已改为：Konva 10+ 在 Next.js 里用 Client Component（`'use client'`）即可，
不需要额外的 canvas 配置。

## 用法

画布组件标上 `'use client'`，页面里像普通组件一样引入：

```jsx
// app/Canvas.jsx
'use client';

import { Stage, Layer, Rect, Text } from 'react-konva';

export default function Canvas() {
  return (
    <Stage width={300} height={150}>
      <Layer>
        <Rect x={20} y={20} width={100} height={60} fill="#3b82f6" draggable />
        <Text x={20} y={100} text="你好 Next.js" fontSize={18} />
      </Layer>
    </Stage>
  );
}
```

```jsx
// app/page.jsx —— 这是 Server Component
import Canvas from './Canvas';

export default function Page() {
  return (
    <main>
      <Canvas />
    </main>
  );
}
```

为什么服务端渲染不报错：Client Component 在服务端同样会预渲染一次，但 react-konva 的
`<Stage>` 在渲染阶段只输出一个空的 `<div>`，真正的 `new Konva.Stage()` 放在 `useLayoutEffect` 里，
而 effect 在服务端不执行。本站用 Next.js 16.3.6 + react-konva 19.3.0 + konva 10.7.0 实测，
`next build` 预渲染出的 HTML 是 `<main><div></div></main>`，浏览器加载后画布正常绘制，
控制台没有水合报错。

反过来，如果在 Server Component 里**直接创建舞台**，一定会失败。
导入 `konva` 本身没问题，但 `new Konva.Stage()` 需要 `document`：

```
Konva.js unsupported environment.

Looks like you are trying to use Konva.js in Node.js environment (or in a Web Worker),
because "document" object is undefined.
```

要在服务端真正生成图片（分享卡片、海报），应该在 Route Handler 里用 Node 画布后端，
见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。

## 水合不一致

Konva 本身不会引起水合问题，常见的坑来自**用 `window` 决定舞台尺寸**：

```jsx
// ❌ 服务端没有 window，这里要么直接报错，要么两端算出的尺寸不同
<Stage width={window.innerWidth} height={window.innerHeight}>
```

正确写法是先用固定值渲染，挂载后再测量容器：

```jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

export default function ResponsiveCanvas() {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const box = boxRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} style={{ width: '100%', height: 400 }}>
      {size.width > 0 && (
        <Stage width={size.width} height={size.height}>
          <Layer>
            <Rect width={size.width} height={size.height} fill="#f1f5f9" />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
```

两端首次渲染都是一个空容器，内容一致；尺寸在浏览器里测出来后才画舞台。

## 性能提示

不需要 `dynamic()` 来避免报错，不代表它没有用处。`konva.min.js`（10.7.0）约 188 KB，
gzip 后约 56 KB，再加上 react-konva 和 React 协调器的代码。直接 `import` 画布组件，
这部分代码会进入该路由的首屏包。对**只有编辑器页才用画布**的站点，
这是给其他页面白白增加的下载和解析时间。

这时 `dynamic()` 的价值是**拆包**：

```jsx
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <div style={{ height: 400 }}>编辑器加载中…</div>,
});
```

这里的 `ssr: false` 不是为了规避报错，而是让服务端连那个空 `div` 都不渲染，省掉一次无意义的预渲染；
`loading` 占位的高度要与画布一致，避免加载完成时布局跳动。
画布是首屏核心内容的页面（比如编辑器本身）则不必拆，直接引入反而更快。

版本搭配上，react-konva 的主版本号跟随 React：React 19 用 react-konva 19，React 18 用 react-konva 18。

## 常见问题

### 升级到 Konva 10 后还需要装 canvas 包吗？

只在浏览器里画图，不需要。`canvas`（node-canvas）只有在 Node.js 里**真正渲染画布**时才需要，
例如在 Route Handler 里生成图片，并且要配合 `import 'konva/canvas-backend'` 使用。
Konva 9 及更早的版本会在 Node 环境自动加载它，这正是旧答案要求 `ssr: false` 的原因。

### 报 window is not defined 怎么办？

多半是你自己的代码在模块顶层或渲染阶段访问了 `window`、`document`，而不是 Konva。
把这些访问移进 `useEffect`，或者像上面那样先用固定值渲染。
另一种情况是用了会在导入时就访问 `window` 的第三方库，那才需要用 `dynamic(..., { ssr: false })` 引入它。

### 构建时出现 Several Konva instances detected？

这是 Server Component 里也导入了 `konva` 的信号：服务端组件和客户端组件的服务端预渲染各自加载了一份，
Konva 检测到同一进程里有两个实例就会提示。本站实测，把 Server Component 里的 `import Konva` 去掉后，
这条提示随之消失。服务端组件里通常用不到 Konva，把所有 Konva 代码收进 `'use client'` 组件即可。

### Pages Router 也一样吗？

一样。react-konva 创建舞台的时机与路由方案无关，Pages Router 下的页面组件直接引入画布组件即可，
只是没有 `'use client'` 这个标记。
