---
order: 1
group:
  title: 性能优化
  order: 9
title: 技巧
description: ''
keywords: []
---



1. <a href="https://konvajs.github.io/docs/performance/Batch_Draw.html" target="_blank">`batchDraw` 方法</a>
2. <a href="https://konvajs.github.io/docs/performance/Layer_Management.html" target="__blank" >图层管理</a>
3. <a href="https://konvajs.github.io/docs/performance/Shape_Caching.html" target="__blank">形状缓存</a>
4. <a href="https://konvajs.github.io/docs/performance/Optimize_Animation.html" target="__blank">动画优化</a>
5. <a href="https://konvajs.github.io/docs/performance/Shape_Redraw.html" target="__blank">形状重绘</a>
6. 如果你的形状只有位置变换（`x` 和 `y`, 没有`scale`, `rotation`）,设置`transformsEnabled = 'position'`。
7. 如果你不需要在图层上添加事件, 设置 `layer.hitGraphEnabled(false)` ,  或者使用<a href="https://konvajs.github.io/api/Konva.Group.html" target="__blank">Konva.FastLayer</a>。 参见 <a href="https://konvajs.github.io/docs/sandbox/Animation_Stress_Test.html" target="__blank">演示</a>。
8. 对于移动应用程序将视口设置为：`<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">`。
9. 如果您发现在视网膜屏幕的设备上的性能不佳, 设置 `Konva.pixelRatio = 1` .确保结果的质量能满足您的需求。
10. 当拖动节点时，您可以在单独的一个图层上移动它, 拖动完成后将其移回到原来的图层。
11. <a href="https://konvajs.github.io/docs/performance/Optimize_Strokes.html" target="__blank">优化描边的绘制</a>。
12. 如果形状同时设置了填充，描边和透明度，您可以设置 `shape.perfectDrawEnabled(false)` 。详细信息参见 <a href="https://konvajs.github.io/docs/performance/Disable_Perfect_Draw.html" target="__blank">禁用 Perfect Drawing</a>。
13. 尽可能设置 `shape.listening(false)` 。 更多信息参见 <a href="https://konvajs.github.io/docs/performance/Listening_False.html" target="__blank">Listening false</a>。
14. <a href="https://konvajs.github.io/docs/performance/Avoid_Memory_Leaks.html" target="__blank" >防止内存泄漏</a>。


