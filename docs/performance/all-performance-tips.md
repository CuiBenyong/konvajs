---
title: '技巧'
description: 'Konva 性能优化清单：批量绘制、图层管理、图形缓存、关闭完美绘制、禁用事件监听、描边优化与内存泄漏规避，逐条给出适用场景。'
sidebar_position: 1
---

Konva 的性能优化手段不少，但它们各自解决的是不同的瓶颈。用错方向，努力会白费。

## 优化清单

1. <a href="/docs/performance/batch-draw" target="_blank">`batchDraw` 方法</a>
2. <a href="/docs/performance/layer-management" target="_blank" >图层管理</a>
3. <a href="/docs/performance/shape-caching" target="_blank">形状缓存</a>
4. <a href="/docs/performance/optimize-animation" target="_blank">动画优化</a>
5. <a href="/docs/performance/shape-redraw" target="_blank">形状重绘</a>
6. 如果你的形状只有位置变换（`x` 和 `y`, 没有`scale`, `rotation`）,设置`transformsEnabled = 'position'`。
7. 如果你不需要在图层上添加事件, 设置 `layer.hitGraphEnabled(false)` ,  或者使用<a href="https://konvajs.org/api/Konva.FastLayer.html" target="_blank">Konva.FastLayer</a>。 参见 <a href="https://konvajs.org/docs/sandbox/Animation_Stress_Test.html" target="_blank">演示</a>。
8. 对于移动应用程序将视口设置为：`<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">`。
9. 如果您发现在视网膜屏幕的设备上的性能不佳, 设置 `Konva.pixelRatio = 1` .确保结果的质量能满足您的需求。
10. 当拖动节点时，您可以在单独的一个图层上移动它, 拖动完成后将其移回到原来的图层。
11. <a href="/docs/performance/optimize-strokes" target="_blank">优化描边的绘制</a>。
12. 如果形状同时设置了填充，描边和透明度，您可以设置 `shape.perfectDrawEnabled(false)` 。详细信息参见 <a href="/docs/performance/disable-perfect-draw" target="_blank">禁用 Perfect Drawing</a>。
13. 尽可能设置 `shape.listening(false)` 。 更多信息参见 <a href="/docs/performance/listening-false" target="_blank">Listening false</a>。
14. <a href="/docs/performance/avoid-memory-leaks" target="_blank" >防止内存泄漏</a>。


## 常见问题

### 该从哪里开始优化？

先测量，不要凭感觉。打开浏览器的 Performance 面板录一段，
看时间花在哪——是脚本执行、还是 Canvas 绘制、还是布局。

经验上 Konva 应用的瓶颈按出现频率排序是：**节点数量过多** > 
**每帧重绘了不需要重绘的图层** > **单个节点的绘制成本**（阴影、滤镜、复杂路径）。
多数人一上来就去优化第三项，而真正的问题往往在前两项。

### 缓存是不是总能提速？

不是。`cache()` 把节点渲染成位图，之后每帧只贴图——前提是这张图**不用重做**。

如果节点每帧都在变（位置、颜色、尺寸），缓存就要每帧重建，
那比直接绘制还慢，因为多了一次离屏渲染和一次贴图。

判断标准很简单：这个节点多久变一次？几秒才变一次，缓存；每帧都变，别缓存。
注意**位移和整体缩放不算「变」**——移动一个缓存节点不需要重建缓存。

### 节点数量多少算多？

没有绝对数字，取决于每个节点的复杂度和有多少在监听事件。

一个粗略的参考：几百个简单图形通常没问题；上千个就要开始考虑
关掉不必要的监听、把静态部分合并缓存；上万个则需要改变思路——
比如把静态内容预渲染成一张图片，只保留交互部分作为真实节点。

## 与其他方案的取舍

三种主要手段各有其适用信号，不要混为一谈：

**分层**（[图层管理](/docs/performance/layer-management)）解决的是「重绘范围过大」。
信号是：画面上只有一小部分在动，却每帧重绘全部内容。把动静分开即可。

**缓存**（[图形缓存](/docs/performance/shape-caching)）解决的是「单个节点画得太慢」。
信号是：节点数量不多，但每个都带阴影、滤镜或复杂路径。

**减少节点**解决的是「节点太多」。信号是：节点数以千计，且多数是静态装饰。
办法是合并成一个自定义图形，或者预渲染成图片。

还有一类是**关掉不需要的功能**：[禁用事件监听](/docs/performance/listening-false)、
[关闭 Perfect Drawing](/docs/performance/disable-perfect-draw)、
[描边绘制优化](/docs/performance/optimize-strokes)。这些成本低、风险小，
可以先做，但收益通常不如前三项显著。
