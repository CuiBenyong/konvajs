---
title: '教程目录'
description: 'Konva 中文教程总目录，按图形、样式、事件、选择器、滤镜、拖拽、裁剪、动画、补间、序列化、分组图层与性能优化十二个主题组织，可从任一主题进入。'
sidebar_position: 2
---

# 教程目录

本站教程按十二个主题组织，彼此独立，可以从任一主题进入。若你是第一次接触 Konva，
建议先读[开始](/docs/intro)了解舞台（Stage）、图层（Layer）与图形（Shape）的层次关系，
再按下面的顺序推进。

## 基础

- [图形](/docs/shapes/rect)：矩形、圆形、路径、文本等内置图形，以及自定义图形
- [样式](/docs/styling/fill)：填充、描边、阴影、透明度与混合模式
- [事件](/docs/events/event-delegation)：绑定、委托、移动端事件与自定义命中区域
- [选择器](/docs/selectors/select-by-id)：按 id、name 与类型查找节点

## 交互与视觉

- [选择与变换](/docs/select-and-transform/basic-demo)：Transformer 控制柄、缩放限制、旋转吸附与变换事件
- [拖拽](/docs/drag-and-drop/drag-a-line)：拖拽图形、分组与舞台，以及拖拽边界
- [裁剪](/docs/clipping/clipping-function)：矩形裁剪区域与自定义裁剪函数
- [滤镜](/docs/filters/blur)：模糊、亮度、灰度、反色等内置滤镜与滤镜叠加
- [分组与图层](/docs/groups-and-layers/groups)：节点分组、图层管理与层级调整

## 动画与数据

- [动画](/docs/animations/create-an-animation)：基于时间的逐帧动画
- [补间动画](/docs/tweens/linear-easing)：缓动函数、补间控制与补间滤镜
- [数据序列化](/docs/data-and-serialization/serialize-a-stage)：舞台序列化、反序列化与导出图片

## 进阶

- [性能优化](/docs/performance/all-performance-tips)：缓存、批量绘制、命中图与内存泄漏规避

## 常见问题

### 该从哪一章开始读？

完全没接触过 Konva，先读[开始](/docs/intro)，它讲清楚舞台、图层、图形
这三层结构——这是理解后面所有内容的基础。

之后按「图形 → 样式 → 事件」的顺序走，就能做出可交互的画面了。
其余章节都是按需查阅的，不必顺序通读。

### 只想实现某个具体效果，该查哪里？

按问题的性质定位：

- **画不出想要的形状** → [图形](/docs/shapes/rect)，找不到现成的就看[自定义图形](/docs/shapes/custom)
- **外观不对** → [样式](/docs/styling/fill)
- **点不中、点错了** → [事件](/docs/events/binding-events)，特别是[自定义命中区域](/docs/events/custom-hit-region)
- **要让用户能拖能拉** → [选择与变换](/docs/select-and-transform/basic-demo)与[拖拽](/docs/drag-and-drop)
- **要动起来** → 有明确起止用[补间](/docs/tweens/linear-easing)，持续运动用[动画](/docs/animations/create-an-animation)
- **卡** → [性能优化](/docs/performance/all-performance-tips)

### 本站和官方英文文档是什么关系？

本站是 Konva 官方文档的中文翻译，并在此基础上补充了原创内容——
每一页的「常见问题」与末尾的小节都是中文读者实际会遇到的问题，
官方文档里没有。

API 的权威来源始终是
<a href="https://konvajs.org/api/Konva.html" target="_blank">官方 API 参考</a>。
本站内容如与官方冲突，以官方为准，也欢迎到
<a href="https://github.com/CuiBenyong/konvajs" target="_blank">本站仓库</a>提 Issue。

## 与其他方案的取舍

Konva 不是所有 Canvas 场景的正确选择。几个常见的替代方案与它的分界线：

**原生 Canvas API**。如果你要画的只是几个静态图形、或者一张图表，
没有交互需求，直接用原生 API 更轻——不用引入一个几百 KB 的库。
Konva 的价值在于它把「图形」变成了可以持有状态、响应事件、独立变换的对象，
没有这些需求时它就是纯粹的负担。

**SVG**。需要图形随页面缩放保持清晰、需要用 CSS 控制样式、
或者图形数量不多但要求可访问性（屏幕阅读器）时，SVG 更合适。
Canvas 的优势在于**图形数量多**时的性能——上千个元素时 SVG 的 DOM 开销
会让页面明显变慢，而 Canvas 只是多画几笔。

**Fabric.js**。定位与 Konva 最接近，同样是带交互的 Canvas 场景图。
它内置了更完整的图形编辑能力（自由绘制、滤镜、SVG 导入导出），
适合直接做设计工具；Konva 更轻、API 更一致，适合把画布嵌进自己的产品里。

**PixiJS**。基于 WebGL，渲染性能远高于 Canvas 2D，适合游戏、粒子、
需要着色器的视觉效果。代价是文本渲染与 DOM 集成不如 Konva 自然，
而且 WebGL 上下文丢失需要自己处理。

一句话区分：**做图表和静态图形用原生或 SVG，做可交互的画布应用用 Konva，
做完整的设计工具考虑 Fabric，做游戏和高性能视觉用 Pixi。**
