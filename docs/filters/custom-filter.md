---
title: 'Custom Filter 自定义滤镜'
description: '写自己的 Konva 滤镜：函数签名在 10.6.0 起是 (imageData, pixelRatio)，必须用 pixelRatio 把节点坐标换算成缓存像素，否则效果在高分屏上尺寸减半。'
sidebar_position: 15
---

Konva 的滤镜就是一个普通函数。它拿到一份 `ImageData`，
原地修改里面的像素，就这么简单。

<iframe src="/downloads/code/filters/Custom_Filter.html" style="width: 50vw;height:340px;"></iframe>

```js
function Invert(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = 255 - d[i];      // R
    d[i + 1] = 255 - d[i + 1];  // G
    d[i + 2] = 255 - d[i + 2];  // B
    // d[i + 3] 是 alpha，一般不动
  }
}

node.cache();
node.filters([Invert]);
```

函数里的 `this` 指向节点本身，所以可以读取节点上的自定义属性作为参数。

## 签名是 (imageData, pixelRatio)

**Konva 10.6.0 起，滤镜函数会收到第二个参数 `pixelRatio`。**
这不是可选的锦上添花——不用它，你的滤镜在高分屏上就是错的。

原因是：`imageData` 是**缓存画布**的像素，而缓存画布的分辨率
由 `cache({ pixelRatio })` 决定，默认等于设备像素比。
在 2x 屏上，一个 100×100 的节点对应的是 200×200 的缓存像素。

所以任何"以长度为单位"的参数——描边宽度、模糊半径、马赛克块大小、
扫描线间距——都必须乘以 `pixelRatio` 才是真正的像素数：

```js
function Scanlines(imageData, pixelRatio) {
  // gap 是节点坐标里的 6px，在 2x 缓存里对应 12 个像素
  const step = Math.max(1, Math.round(6 * (pixelRatio || 1)));
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      d[i] *= 0.25;
      d[i + 1] *= 0.25;
      d[i + 2] *= 0.25;
    }
  }
}
```

漏掉 `pixelRatio` 的话，在 2x 屏上扫描线会**密一倍**，
在 3x 屏上密两倍——同一份代码在不同设备上呈现不同的视觉尺寸。
上面的演示把正确和错误的两个版本并排放在一起，差别一眼可见。

Konva 自己在 10.6.0 里修的正是这个问题：`blurRadius`、`pixelSize`
和 CSS 滤镜里的长度此前都是按缓存像素算的，
导致同一个节点在更高的 `pixelRatio` 下看起来模糊程度不同。
现在它们统一按节点坐标算，代价就是自定义滤镜需要自己做这一步换算。

写 `pixelRatio || 1` 而不是直接用 `pixelRatio`，
是为了兼容旧版本调用时第二个参数为 `undefined` 的情况。

## 给滤镜传参数的两种办法

滤镜函数里的 `this` 指向节点，所以参数可以挂在节点上。
下面两种写法都实测可用。

**办法一：闭包。** 最简单，参数在创建滤镜时就固定：

```js
function makeScanlines(gap) {
  return function (imageData, pixelRatio) {
    const step = Math.max(1, Math.round(gap * (pixelRatio || 1)));
    const d = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] *= 0.25; d[i + 1] *= 0.25; d[i + 2] *= 0.25;
      }
    }
  };
}

node.cache();
node.filters([makeScanlines(10)]);
```

要改参数就换一个新函数进 `filters()`。适合参数不常变的场景。

**办法二：`setAttr` / `getAttr`。** 参数存在节点上，可以随时改：

```js
function Scanlines(imageData, pixelRatio) {
  const gap = this.getAttr('scanGap') || 6;
  const step = Math.max(1, Math.round(gap * (pixelRatio || 1)));
  // ... 同上
}

node.setAttr('scanGap', 8);
node.cache();
node.filters([Scanlines]);

// 之后改参数
node.setAttr('scanGap', 12);
node.getLayer().draw();   // setAttr 不会自动重跑滤镜，要手动触发
```

**注意 `setAttr` 不会自动触发重绘**——内置滤镜的属性之所以改了就生效，
是因为它们注册时带了一个 `afterSetFilter` 回调。用 `setAttr` 就得自己
调一次 `layer.draw()`。

### 为什么不用 Konva.Factory

网上能搜到用 `Konva.Factory.addGetterSetter()` 注册自定义属性的写法，
让参数用起来和内置滤镜一样（`node.scanGap(10)`）。

**这个写法在用 CDN / UMD 构建时会直接抛错**，因为
`Konva.Factory` 和 `Konva.Validators` **没有挂在全局 `Konva` 命名空间上**。
实测 `typeof Konva.Factory` 是 `undefined`，
调用 `Konva.Factory.addGetterSetter` 报
`Cannot read properties of undefined`。

Konva 命名空间导出的是 `Util`、`Transform`、`Node`、`Container`、`Stage`、
`Layer`、`FastLayer`、`Group`、`DD`、`Shape`、`Animation`、`Tween`、
`Easings`、`Context`、`Canvas` 这些，`Factory` 不在其中。

用 ESM 的项目可以从子路径导入（`konva` 的 `exports` 里开放了 `./lib/*`）：

```js
import { Factory } from 'konva/lib/Factory';
import { Node } from 'konva/lib/Node';
```

但这是在用内部实现，不属于公开 API，大版本升级时可能变。
**除非你在写一个要分发的滤镜库，否则用上面两种办法就够了。**

## 源码里有但文档里没有的滤镜

一个实用的技巧：**写自定义滤镜之前，先翻一眼 Konva 的源码目录**。

`konva/lib/filters/` 下有 20 个文件，但官方文档只覆盖了其中一部分。
例如 `Posterize.js` 实现了色调分离（注册了 `levels` 属性，默认 `0.5`），
功能完整可用，却没有对应的文档页。

```js
node.cache();
node.filters([Konva.Filters.Posterize]);
node.levels(0.02);   // 注意这个值要很小才看得出效果
```

`levels` 的换算是 `Math.round(levels * 254) + 1`，
所以 `levels(0.5)` 其实允许 **128** 个色阶，跟原图几乎没差别。
实测一条 40 级的黑白渐变：`levels(0.2)` 后仍有 40 个灰阶（毫无变化），
`levels(0.02)` 降到 6 个，`levels(0.01)` 降到 4 个。
要做出明显的色调分离效果，值得从 `0.02` 附近开始试。

这类"有实现没文档"的东西，读源码比搜索更快。
源码里每个滤镜都不到一百行，看懂一个再写自己的会容易很多。

## 常见问题

### 为什么我的滤镜没有生效？

按这个顺序查：

1. **忘了 `cache()`。** 滤镜作用在缓存画布上，没有缓存就没有像素可处理。
2. **改了节点内容但没重新 `cache()`。** 缓存是快照，
   节点尺寸、子节点变化之后要 `node.cache()` 重建。
3. **函数写成了返回新数组。** 滤镜必须**原地修改** `imageData.data`，
   返回值会被忽略。`d = d.map(...)` 这种写法不起作用。
4. **只改了 RGB 但整块是透明的。** 如果 alpha 是 0，
   改 RGB 不会有任何视觉效果。

### 能在滤镜里读取相邻像素吗？

能，但要注意**不能边读边写**。像模糊、浮雕这类邻域滤镜，
如果直接在 `imageData.data` 上原地修改，
后面的像素会读到已经被改过的值，结果是错的。

正确做法是先复制一份原始数据：

```js
function Blur3x3(imageData) {
  const src = new Uint8ClampedArray(imageData.data);  // 快照
  const d = imageData.data;
  // 从 src 读，往 d 写
}
```

### 滤镜可以是异步的吗？

不可以。滤镜在绘制流程里同步调用，返回 Promise 不会被等待。

需要异步处理（比如调用 WASM 或 Worker）的话，
思路是在滤镜之外完成计算，把结果画到一个离屏 canvas，
再用 `Konva.Image` 显示——不要试图把异步塞进滤镜函数。

## 性能提示

自定义滤镜跑在**主线程**，而且是**逐像素的 JS 循环**。
一张 1000×1000 的图在 2x 缓存下有四百万个像素、一千六百万个数组元素，
哪怕每个元素只做一次乘法，也足以让一帧超时。

几条能显著拉开差距的写法：

**把 `imageData.data` 存成局部变量。** `imageData.data` 每次访问都是一次
属性查找，在千万次循环里这个开销不可忽略。

**循环里不要创建对象。** `{r, g, b}` 这样的临时对象会触发大量 GC，
在滤镜里直接用局部的数字变量。

**用位运算代替 `Math.round`。** `(x + 0.5) | 0` 比 `Math.round(x)` 快，
在这种规模的循环里差别看得见。注意它只对非负数正确。

**别在动画里重复 `cache()`。** 缓存一次，之后改参数即可。

**大图考虑 OffscreenCanvas + Worker。** 把像素数据 `postMessage`
到 Worker 里处理（用 transferable 避免拷贝），
算完再画回主线程。这是唯一能真正避免掉帧的办法，
代价是复杂度上升，只在确实需要时再上。

最后一条：**先确认浏览器原生没有现成的**。
模糊、色相旋转、对比度这些 [CSS 滤镜](/docs/filters/css-filters)
都有原生实现，走的是 GPU，比任何手写循环都快。
自定义滤镜应该用来实现原生没有的效果，而不是重新发明模糊。
