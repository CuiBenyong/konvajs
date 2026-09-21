---
title: '防止内存溢出'
description: '避免 Konva 内存泄漏：彻底删除节点用 destroy()，仅临时移出用 remove()。destroy() 之后的节点不可复用，引擎已解除全部引用。'
sidebar_position: 8
---

### 删除形状

Konva中有两个非常接近的方法 `remove()` 和 `destroy()` 。 如果你想彻底地删除节点，你需要使用 `destroy()` 方法。
如果你将来需要重用节点，你应该使用 `remove()` 方法，然后在需要的时候将其再次添加到任何容器。
不要在 `destroy()`操作之后重用节点, 因为 `destroy()` 会从KonvaJS引擎中删除对节点的所有引用。

### Tween动画

当你使用 `Konva.Tween` 实例来创建动画时，你必须在使用后销毁它。

```javascript
var tween = new Konva.Tween({
    node : circle,
    x : 0,
    duration : 0.5,
    onFinish : function() {
        // remove all references from Konva
        tween.destroy();
    }
});
tween.play();
```

或者如果你不需要重用tween实例, 你可以使用更为简单的 `to()` 方法来创建动画:

```javascript
// tween will be automatically started and destroyed on finish
circle.to({
    x : 0,
    duration : 0.5
});
```

## 监听节点销毁

Konva 10.4.0 起，`node.destroy()` 开始时会触发 `destroy` 事件。这让你可以在
节点被销毁的那一刻清理挂在它身上的外部资源，例如定时器、订阅或缓存：

```js
shape.on('destroy', () => {
  clearInterval(timerId);
  unsubscribe();
});
```

框架内部也用到了这个事件：`Transformer` 会把被销毁的节点从 `nodes()` 中移除，
`Tween` 会停止该节点上的补间。在 10.4.0 之前，销毁一个正被 Transformer 选中
或正在补间的节点会留下悬空引用。

## 常见问题

### remove 和 destroy 到底该用哪个？

`remove()` 只是把节点从父容器里摘出来，节点对象、它的事件监听、它的缓存都还在，
你手里的变量仍然引用着它。之后可以再 `add` 回任何容器。

`destroy()` 是彻底销毁：从父容器移除、解绑全部监听器、清理缓存、
并从 Konva 的内部注册表里删掉。销毁后的节点不能再使用。

判断很简单：**以后还要用就 `remove()`，不要了就 `destroy()`**。
用错的后果是：该用 destroy 时用了 remove，节点游离在内存里回收不掉；
该用 remove 时用了 destroy，之后 `add` 回去会得到一个坏掉的节点。

### 为什么 destroy 之后内存还是没降？

最常见的原因是**你自己还持有引用**。数组里存着、闭包里捕获着、
Map 的 key 是它——只要还有一条引用链，垃圾回收器就不会回收。

`destroy()` 解除的是 Konva 内部的引用，你自己代码里的引用得自己清。

第二个常见原因是缓存。被缓存的节点持有一张位图，`destroy()` 会清理它，
但如果你只是 `remove()` 了节点，那张位图会一直占着内存。

### 长时间运行的应用要注意什么？

三处最容易累积：

**未停止的动画**。`Konva.Animation` 不会因为节点销毁而自动停止，
它会继续每帧调用回调，而回调里往往还引用着已销毁的节点。
销毁节点前先 `anim.stop()`。

**未解绑的监听器**。尤其是绑在 `stage` 或 `window` 上的——节点销毁了，
监听器还在，闭包里捕获的节点也就回收不掉。用
[命名空间](/docs/events/remove-by-name)批量清理。

**未清理的缓存**。定期检查是否有节点缓存了但再也用不到。

## 性能提示

内存问题不像性能问题那样立刻可见，需要主动测量。

浏览器 DevTools 的 Memory 面板可以拍堆快照。做法是：执行一轮
「创建一批节点 → 销毁它们」，然后强制 GC、拍快照，再重复一轮、再拍。
比较两次快照，如果 Konva 相关对象的数量持续增长，就是泄漏。

几个降低风险的习惯：

**销毁走统一出口**。写一个 `destroyNode(node)` 函数，里面依次停动画、
解监听、清缓存、`destroy()`，所有地方都调它，而不是各处散落 `node.destroy()`。

**容器销毁优于逐个销毁**。`group.destroy()` 会递归销毁全部子节点，
比自己遍历更不容易漏。

**警惕缓存的内存量级**。一个 500×500 的节点在 2 倍屏上缓存要占约 4MB，
这比多数人的直觉大得多。见[图形缓存](/docs/performance/shape-caching)。
