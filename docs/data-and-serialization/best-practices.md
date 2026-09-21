---
title: '序列化的最佳实践'
description: 'toJSON 只保存属性不保存函数，它是渲染层快照而不是数据模型；把它直接存进数据库等于把业务数据绑死在第三方库的内部格式上。'
sidebar_position: 4
---

Konva 提供了 `toJSON()` 和 `Konva.Node.create()`，看起来存档读档一步到位。
但直接用它做持久化，多半会在半年后后悔。

## toJSON 保存什么、不保存什么

**保存**：节点类型（`className`）和 `attrs` 里的属性值。

**不保存**：

- **所有函数**——事件回调、`sceneFunc`、`hitFunc`、`dragBoundFunc`、
  `clipFunc`、`filters` 数组里的滤镜函数，一个都不留。
- **图片对象**——`Konva.Image` 的 `image` 属性是一个 DOM `Image`，
  序列化后只剩一个没有图的空壳。
- **缓存**——`cache()` 生成的位图不会被保存。

所以反序列化出来的舞台是"形状对了、但什么都不会动"的状态。

```js
const json = stage.toJSON();
const restored = Konva.Node.create(json, 'container');
// 此时所有事件、自定义绘制、图片都没了
```

Konva 10.6.0 修了一个相关问题：`toObject()` / `toJSON()` / `clone()`
此前会丢掉那些"恰好等于计算值"的显式 `width`、`height`、`dragDistance`，
导致还原出来的 `Text` 重新排版、换行位置变了。
现在这些属性会出现在序列化结果里。

## 不要把 Konva 的 JSON 当数据模型

这是本页最重要的一条。

`toJSON()` 的产物是**渲染层的快照**，它的结构由 Konva 的内部实现决定，
会随版本变化（上面那个 10.6.0 的变更就是例子）。
把它直接存进数据库，等于**把你的业务数据绑死在一个第三方库的内部格式上**。

后果在升级时才显现：Konva 改了某个属性的默认值或序列化行为，
你数据库里存量的几万条记录全部要迁移，而你没有任何 schema 可依。

正确的做法是**自己定义一份领域模型**：

```js
// 你的数据模型 —— 描述「这张图里有什么」，而不是「Konva 怎么画它」
const doc = {
  version: 1,
  items: [
    { id: 'a1', type: 'photo',  src: 'https://...', x: 10, y: 20, w: 200, h: 150 },
    { id: 'a2', type: 'label',  text: '标题',      x: 10, y: 190, size: 24 },
  ],
};

// 渲染：从领域模型生成 Konva 节点
function render(doc, layer) {
  doc.items.forEach((item) => layer.add(createNode(item)));
}

// 保存：序列化领域模型，不是序列化 Konva
function save(layer) {
  return { version: 1, items: layer.getChildren().map(nodeToItem) };
}
```

多写的这一层换来三件事：**版本号让你能平滑迁移**、
**数据结构由你控制**、**换渲染库不用动数据**。

什么时候可以直接用 `toJSON()`？**临时状态**——
撤销重做栈、页面刷新前的草稿、剪贴板内容。
这些数据生命周期短，不跨版本，格式变了也无所谓。

## 常见问题

### 反序列化后事件全没了怎么办？

统一重新绑定。用 `name` 或 `id` 作为锚点，而不是依赖节点顺序：

```js
const stage = Konva.Node.create(json, 'container');

stage.find('.draggable-item').forEach((node) => {
  node.draggable(true);
  node.on('click', handleClick);
});
stage.find('.custom-shape').forEach((node) => {
  node.sceneFunc(mySceneFunc);
});
```

**给需要重新绑定的节点在创建时就设好 `name`**，
这是让反序列化可维护的关键——否则你只能靠遍历和类型判断去猜哪个是哪个。
见[按名称选择](/docs/selectors/select-by-name)。

### 图片怎么恢复？

JSON 里存 URL，反序列化后遍历所有 `Image` 节点重新加载：

```js
const stage = Konva.Node.create(json, 'container');

await Promise.all(
  stage.find('Image').map((node) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { node.image(img); resolve(); };
    img.onerror = resolve;          // 失败也要 resolve，否则整个 Promise.all 卡住
    img.src = node.getAttr('src');  // 自己存的自定义属性
  })),
);
stage.draw();
```

两个要点：`src` 得是你自己用 `setAttr('src', url)` 存的自定义属性
（Konva 不会自动保存图片地址）；`onerror` 也要 resolve，
否则一张图挂掉会让整个恢复流程永远卡住。

更完整的加载流程见[复杂加载](/docs/data-and-serialization/complex-load)。

### JSON 太大了怎么办？

按收益排序：

**只序列化领域模型。** 这是最有效的一条——Konva 的 JSON 里有大量
你不关心的属性，自己的模型可以只存必要字段，通常能小一个数量级。

**抽稀 `points`。** 自由绘制的线条动辄上万个点。
用 Ramer–Douglas–Peucker 之类的算法抽稀，
视觉上看不出区别，体积能降 80% 以上。

**数值降精度。** 坐标存到小数点后两位足够，
`123.45678901234` 和 `123.46` 在画面上没有区别，但字符数差了一倍。

**别存图片本身。** 如果有人把 base64 的图片塞进了属性里，
那才是体积的大头。存 URL。

### 版本升级后旧数据读不出来了？

如果你用的是自己的领域模型，加一个 `version` 字段和一组迁移函数即可。
如果你存的是 Konva 的 JSON——只能逐个字段对照新旧版本的行为差异，
这就是不该直接存它的理由。

## 与其他方案的取舍

**Konva `toJSON()`** → 适合临时状态（撤销栈、草稿、剪贴板）。
零成本、零代码。不适合长期存储。

**自定义 schema** → 适合任何需要长期保存、需要版本演进、
或者可能被其他系统读取的场景。多写一层映射代码，
换来对数据的完全控制。**业务系统默认选这个。**

**导出 SVG** → 适合"存档给人看"而不是"存档再编辑"。
通用性最好（任何工具都能打开），但从 SVG 回到可编辑的 Konva 场景图
需要自己写解析，通常不值得。Konva 本身也不提供 SVG 导出。

**导出图片（PNG / JPEG）** → 只适合最终产物，不可回编辑。
常见做法是**同时存两份**：一份自定义 schema 用于编辑，
一份 PNG 用于列表页缩略图和分享——
缩略图从 schema 现渲染太慢，直接存图片快得多。
导出时注意 `pixelRatio` 的默认值，见[导出高清图片](/docs/data-and-serialization/high-quality-export)。
