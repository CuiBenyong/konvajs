---
title: '标尺与参考线'
description: '给 Konva 画布加随缩放平移更新刻度的标尺，并从标尺拖出参考线、让图形吸附。关键是变换内容图层而不是整个舞台。'
sidebar_position: 3
---

设计工具里的标尺有两个要求：**刻度跟着画布缩放平移变化**，**标尺本身纹丝不动**。
很多人第一版写成缩放整个舞台，结果标尺也跟着被放大、移出了屏幕。

## 用法

滚轮缩放、拖动空白处平移；从顶部或左侧标尺按下拖出参考线，拖回标尺上删除；
拖动色块靠近参考线会吸附：

<iframe src="/downloads/code/editor/Rulers_And_Guides.html" style="width: 50vw;height:360px;"></iframe>

```html
/**
 * editor/Rulers_And_Guides.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Rulers And Guides Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #F0F0F0;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    var FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';
    var RULER = 20;       // 标尺宽度（屏幕像素）
    var MIN_GAP = 50;     // 相邻主刻度之间至少隔多少屏幕像素
    var SNAP_PX = 6;      // 吸附距离（屏幕像素）

    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });

    // world：内容图层，缩放平移都作用在它身上。
    // 不能变换 stage——stage 的变换会作用于所有图层，标尺会跟着一起缩放。
    var world = new Konva.Layer();
    // guides：参考线，屏幕坐标，由世界坐标换算得到
    var guides = new Konva.Layer();
    // ui：标尺，永远不变换
    var ui = new Konva.Layer();
    stage.add(world, guides, ui);

    [['#60a5fa', 80, 90], ['#f472b6', 220, 150], ['#34d399', 330, 80]].forEach(function (d) {
      world.add(new Konva.Rect({
        name: 'item', fill: d[0], x: d[1], y: d[2], width: 80, height: 60,
        cornerRadius: 6, draggable: true
      }));
    });
    world.add(new Konva.Text({
      x: 80, y: 250, fontSize: 13, fill: '#555', fontFamily: FONT, lineHeight: 1.5,
      text: '滚轮缩放，拖动空白处平移。\n从顶部或左侧标尺按下并拖出参考线，拖回标尺上删除。\n拖动色块靠近参考线会吸附。'
    }));

    // ---------------- 标尺 ----------------

    // 刻度步长：在 1、2、5 × 10ⁿ 中取屏幕间距不小于 MIN_GAP 的最小值
    function tickStep(scale) {
      var raw = MIN_GAP / scale;
      var pow = Math.pow(10, Math.floor(Math.log10(raw)));
      var candidates = [1, 2, 5, 10];
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i] * pow >= raw) return candidates[i] * pow;
      }
      return 10 * pow;
    }

    function decimals(step) {
      return Math.max(0, -Math.floor(Math.log10(step)));
    }

    // 所有刻度用一个 Shape 的 sceneFunc 一次画完，而不是每个刻度一个节点
    var rulerShape = new Konva.Shape({
      listening: false,
      sceneFunc: function (ctx) {
        var w = stage.width(), h = stage.height();
        var s = world.scaleX(), ox = world.x(), oy = world.y();
        var step = tickStep(s), fixed = decimals(step);

        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, w, RULER);
        ctx.fillRect(0, 0, RULER, h);
        ctx.strokeStyle = '#9ca3af';
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // 顶部：屏幕 x = ox + 世界 x × s
        var startX = Math.ceil((RULER - ox) / s / step) * step;
        for (var wx = startX; ox + wx * s < w; wx += step) {
          var sx = Math.round(ox + wx * s) + 0.5;
          ctx.moveTo(sx, RULER);
          ctx.lineTo(sx, RULER - 8);
          ctx.fillText(wx.toFixed(fixed), sx + 2, 9);
          // 半刻度
          var half = Math.round(ox + (wx + step / 2) * s) + 0.5;
          ctx.moveTo(half, RULER);
          ctx.lineTo(half, RULER - 4);
        }
        // 左侧
        var startY = Math.ceil((RULER - oy) / s / step) * step;
        for (var wy = startY; oy + wy * s < h; wy += step) {
          var sy = Math.round(oy + wy * s) + 0.5;
          ctx.moveTo(RULER, sy);
          ctx.lineTo(RULER - 8, sy);
          ctx.save();
          ctx.translate(9, sy - 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(wy.toFixed(fixed), 0, 0);
          ctx.restore();
          var halfY = Math.round(oy + (wy + step / 2) * s) + 0.5;
          ctx.moveTo(RULER, halfY);
          ctx.lineTo(RULER - 4, halfY);
        }
        ctx.moveTo(0, RULER + 0.5);
        ctx.lineTo(w, RULER + 0.5);
        ctx.moveTo(RULER + 0.5, 0);
        ctx.lineTo(RULER + 0.5, h);
        ctx.stroke();

        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, RULER, RULER);
      }
    });
    ui.add(rulerShape);

    // 标尺上用于按下拖出参考线的透明热区
    var topHit = new Konva.Rect({ x: RULER, y: 0, width: stage.width(), height: RULER, name: 'ruler-top' });
    var leftHit = new Konva.Rect({ x: 0, y: RULER, width: RULER, height: stage.height(), name: 'ruler-left' });
    ui.add(topHit, leftHit);

    // ---------------- 世界坐标 ↔ 屏幕坐标 ----------------

    function toWorld(screen) {
      return world.getAbsoluteTransform().copy().invert().point(screen);
    }
    function toScreen(pt) {
      return world.getAbsoluteTransform().point(pt);
    }

    // ---------------- 参考线 ----------------

    // 参考线存世界坐标（attr worldPos），屏幕位置每次变换后重新换算
    function placeGuide(g) {
      if (g.getAttr('dir') === 'h') {
        g.y(toScreen({ x: 0, y: g.getAttr('worldPos') }).y);
      } else {
        g.x(toScreen({ x: g.getAttr('worldPos'), y: 0 }).x);
      }
    }

    function createGuide(dir) {
      var g = new Konva.Line({
        points: dir === 'h' ? [0, 0, stage.width(), 0] : [0, 0, 0, stage.height()],
        stroke: '#ef4444', strokeWidth: 1, hitStrokeWidth: 9,
        draggable: true, name: 'guide', dir: dir, worldPos: 0,
        // 锁定一个轴：水平线只能上下动，竖直线只能左右动
        dragBoundFunc: function (pos) {
          return dir === 'h' ? { x: 0, y: pos.y } : { x: pos.x, y: 0 };
        }
      });
      g.on('mouseenter', function () {
        stage.container().style.cursor = dir === 'h' ? 'ns-resize' : 'ew-resize';
      });
      g.on('mouseleave', function () { stage.container().style.cursor = ''; });
      g.on('dragmove', function () {
        var p = dir === 'h' ? toWorld({ x: 0, y: g.y() }).y : toWorld({ x: g.x(), y: 0 }).x;
        g.setAttr('worldPos', p);
      });
      g.on('dragend', function () {
        // 拖回标尺上就删除
        if ((dir === 'h' ? g.y() : g.x()) < RULER) {
          stage.container().style.cursor = '';
          g.destroy();
        }
      });
      guides.add(g);
      return g;
    }

    function startGuideDrag(dir, e) {
      var pointer = stage.getPointerPosition();
      var g = createGuide(dir);
      if (dir === 'h') g.y(pointer.y); else g.x(pointer.x);
      g.fire('dragmove');
      g.startDrag(e);
    }
    topHit.on('pointerdown', function (e) { startGuideDrag('h', e); });
    leftHit.on('pointerdown', function (e) { startGuideDrag('v', e); });

    function refresh() {
      guides.find('.guide').forEach(placeGuide);
      rulerShape.getLayer().batchDraw();
    }

    // ---------------- 吸附 ----------------

    world.on('dragmove', function (e) {
      var node = e.target;
      if (!node.hasName('item')) return;
      var threshold = SNAP_PX / world.scaleX(); // 屏幕上的 6px 换算成世界单位
      var box = node.getClientRect({ relativeTo: world });
      guides.find('.guide').forEach(function (g) {
        var p = g.getAttr('worldPos');
        if (g.getAttr('dir') === 'h') {
          [box.y, box.y + box.height / 2, box.y + box.height].some(function (edge) {
            if (Math.abs(edge - p) < threshold) { node.y(node.y() + p - edge); return true; }
          });
        } else {
          [box.x, box.x + box.width / 2, box.x + box.width].some(function (edge) {
            if (Math.abs(edge - p) < threshold) { node.x(node.x() + p - edge); return true; }
          });
        }
      });
    });

    // ---------------- 缩放与平移（只作用于 world） ----------------

    stage.on('wheel', function (e) {
      e.evt.preventDefault();
      var old = world.scaleX();
      var pointer = stage.getPointerPosition();
      var anchor = toWorld(pointer);
      var next = e.evt.deltaY > 0 ? old / 1.1 : old * 1.1;
      next = Math.max(0.05, Math.min(40, next));
      world.scale({ x: next, y: next });
      world.position({ x: pointer.x - anchor.x * next, y: pointer.y - anchor.y * next });
      refresh();
    });

    var panFrom = null;
    stage.on('pointerdown', function (e) {
      if (e.target === stage) {
        panFrom = { pointer: stage.getPointerPosition(), world: world.position() };
      }
    });
    stage.on('pointermove', function () {
      if (!panFrom) return;
      var p = stage.getPointerPosition();
      world.position({
        x: panFrom.world.x + p.x - panFrom.pointer.x,
        y: panFrom.world.y + p.y - panFrom.pointer.y
      });
      refresh();
    });
    stage.on('pointerup pointercancel', function () { panFrom = null; });

    // 初始留出标尺的位置
    world.position({ x: RULER + 10, y: RULER + 10 });

    // 预置一条竖直参考线，便于直接试吸附
    var preset = createGuide('v');
    preset.setAttr('worldPos', 200);
    refresh();
  </script>

</body>
</html>
```

结构上是三个图层：

- **world**：放全部内容。缩放和平移只改这个图层的 `scale` 与 `position`；
- **guides**：参考线。不变换，每次 world 变化后按世界坐标重新计算屏幕位置；
- **ui**：标尺。不变换，刻度由 world 当前的缩放和偏移算出来。

**不要调用 `stage.scale()` 或 `stage.position()`**。舞台的变换会作用在它下面的所有图层上，
标尺图层也不例外。平移和缩放的其他写法见[拖拽舞台](/docs/drag-and-drop/drag-a-stage)，
这里只是把目标从 stage 换成了 world 图层；图层之间的层级关系见[图层](/docs/groups-and-layers/layering)。

刻度间隔的选法：先算出「多少世界单位对应 50 屏幕像素」，再在 1、2、5 × 10ⁿ 里取不小于它的最小值。
这样放大时刻度自动变细（10 → 5 → 2 → 1 → 0.5），缩小时自动变粗，数字始终是整齐的。

## 世界坐标与屏幕坐标

参考线必须**以世界坐标保存**。如果只存它在屏幕上的 y 值，画布一缩放，
它和图形的相对位置就错了——本该对齐色块上沿的线，放大后跑到了色块中间。

两种坐标互相换算用 world 的绝对变换矩阵：

```js
// 屏幕 → 世界：比如把指针位置换算成内容里的坐标
function toWorld(screen) {
  return world.getAbsoluteTransform().copy().invert().point(screen);
}

// 世界 → 屏幕：比如由参考线的世界坐标算出该画在哪里
function toScreen(pt) {
  return world.getAbsoluteTransform().point(pt);
}
```

注意 `copy()`：`invert()` 会原地修改矩阵，不先复制就会把节点自己的变换缓存改坏。

吸附也在世界坐标里做：`node.getClientRect({ relativeTo: world })` 取得色块在世界坐标下的包围盒，
与参考线的世界坐标比较。吸附距离要按缩放换算——屏幕上的 6 像素，
在放大 4 倍时只相当于 1.5 个世界单位，写成固定值的话，放大后几乎吸不上，缩小后又吸得过猛。
锁定参考线只能沿一个方向拖动用的是 `dragBoundFunc`，见[拖拽边界](/docs/drag-and-drop/simple-drag-bounds)。

## 性能提示

标尺在每次滚轮、每次平移移动时都要重画，一次拖动就是几十上百次。
所有刻度应该用**一个** `Konva.Shape` 的 `sceneFunc` 一次画完：一屏几十个刻度，
就是几十次 `moveTo` / `lineTo`，加一次 `stroke()`。反过来，每个刻度建一个 `Konva.Line`、
每个数字建一个 `Konva.Text`，每次变换都要销毁重建上百个节点，还要为它们维护命中检测，开销高出几个数量级。

标尺图形本身设为 `listening: false`，不参与命中检测；要从标尺上拖出参考线，
另外放两个透明矩形作热区即可，热区是固定的，不随缩放重建。

吸附计算只对**当前正在拖动的节点**做，每次 `dragmove` 遍历一遍参考线。
参考线通常只有几条到十几条，直接遍历比引入空间索引更简单也更快。
图形之间相互吸附（每个节点对所有节点）才需要考虑按坐标排序或分桶。

## 常见问题

### 为什么缩放后标尺也变大了？

缩放的是 stage。舞台的 `scale` 会作用在所有图层上，标尺图层也被一起放大了。
把缩放和平移改到内容图层（演示里的 world）上，标尺图层保持原始变换即可。

### 刻度数字在高倍放大下变成很长的小数？

刻度值是按步长累加出来的，浮点误差会让 `0.1 + 0.2` 显示成 `0.30000000000000004`。
按步长的小数位数格式化：`value.toFixed(Math.max(0, -Math.floor(Math.log10(step))))`，
步长为 0.5 时保留一位，为 5 时不保留。

### 和官方的对象吸附示例有什么区别？

官方 sandbox 里的 Objects Snapping 示例是**图形之间**互相吸附：拖动时临时画出对齐线，松手就消失。
这里是**用户主动放置、持久存在**的参考线，保存在世界坐标里，缩放平移后仍然在原处。
两者可以叠加：拖动时先检查参考线，再检查其他图形的边缘和中线。
