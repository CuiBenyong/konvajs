---
title: '复制与粘贴'
description: 'Konva 节点的复制粘贴：画布内用 clone，跨页面用 toObject 写入系统剪贴板再 Node.create 还原；Image 节点的图片不会被序列化，粘贴系统图片则读 clipboardData。'
sidebar_position: 2
---

复制粘贴分两种需求，做法完全不同：

- **画布内原地复制**（Ctrl/⌘ + D）：直接 `node.clone()`，不经过剪贴板；
- **复制到剪贴板再粘贴**（Ctrl/⌘ + C / V）：能跨标签页、跨刷新，
  要把节点序列化成文本写进系统剪贴板，粘贴时再还原。

## 用法

选中图形后按 Ctrl/⌘ + C、Ctrl/⌘ + V；也可以在别的应用里复制一张图片，切回来直接粘贴：

<iframe src="/downloads/code/editor/Clipboard.html" style="width: 50vw;height:300px;"></iframe>

```html
/**
 * editor/Clipboard.html
 */
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva Copy And Paste Demo</title>
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
    // 剪贴板里的内容带上这个标记，粘贴时据此判断是不是自己写进去的
    var CLIPBOARD_TYPE = 'konva-zh-demo/nodes';

    var stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });
    var layer = new Konva.Layer();
    stage.add(layer);

    var uid = 0;
    function nextId() {
      uid += 1;
      return 'node-' + uid;
    }

    layer.add(new Konva.Rect({
      id: nextId(), name: 'item', x: 40, y: 90, width: 90, height: 70,
      fill: '#60a5fa', cornerRadius: 6, draggable: true
    }));
    layer.add(new Konva.Star({
      id: nextId(), name: 'item', x: 220, y: 125, numPoints: 5,
      innerRadius: 20, outerRadius: 42, fill: '#fbbf24', draggable: true
    }));

    // 图片节点：image 属性是 DOM 对象，toObject() 不会序列化它，
    // 所以另外用自定义属性 src 记下地址，还原时按地址重新加载
    function loadImageNode(node) {
      var img = new window.Image();
      img.onload = function () { node.image(img); };
      img.src = node.getAttr('src');
    }
    var lion = new Konva.Image({
      id: nextId(), name: 'item', x: 300, y: 80, width: 90, height: 90, draggable: true
    });
    lion.setAttr('src', '/assets/lion.png');
    loadImageNode(lion);
    layer.add(lion);

    var tr = new Konva.Transformer();
    layer.add(tr);

    var info = new Konva.Text({
      x: 20, y: 16, fontSize: 13, fill: '#333', fontFamily: FONT, lineHeight: 1.5,
      text: '点选图形后：Ctrl/⌘ + C 复制、Ctrl/⌘ + V 粘贴、Ctrl/⌘ + D 原地复制。\n也可以从别处复制一张图片，直接粘贴到画布上。'
    });
    var clipStatus = new Konva.Text({
      x: 20, y: 56, fontSize: 13, fill: '#2563eb', fontFamily: FONT, text: '剪贴板：空'
    });
    layer.add(info, clipStatus);

    stage.on('click tap', function (e) {
      if (e.target === stage) return tr.nodes([]);
      if (e.target.hasName('item')) tr.nodes([e.target]);
    });

    // ---- 复制 ----
    // 系统剪贴板不一定可写，页面里再存一份
    var memory = null;
    var pasteCount = 0;

    function serialize(nodes) {
      return JSON.stringify({
        type: CLIPBOARD_TYPE,
        nodes: nodes.map(function (n) { return n.toObject(); })
      });
    }

    document.addEventListener('copy', function (e) {
      var nodes = tr.nodes();
      if (!nodes.length) return;
      var data = serialize(nodes);
      // copy 事件里同步写入，不需要剪贴板权限，HTTP 页面也可用
      e.clipboardData.setData('text/plain', data);
      e.preventDefault();
      memory = data;
      pasteCount = 0;
      clipStatus.text('剪贴板：' + nodes.length + ' 个节点');
    });

    // ---- 粘贴 ----
    function restore(json) {
      var parsed;
      try { parsed = JSON.parse(json); } catch (err) { return false; }
      if (!parsed || parsed.type !== CLIPBOARD_TYPE) return false;

      pasteCount += 1;
      var offset = 20 * pasteCount;
      var created = parsed.nodes.map(function (obj) {
        var node = Konva.Node.create(obj);
        // id 必须重新生成：find('#id') 只返回第一个，重复的 id 会让选择错乱
        node.id(nextId());
        node.position({ x: node.x() + offset, y: node.y() + offset });
        if (node.getAttr('src')) loadImageNode(node);
        layer.add(node);
        return node;
      });
      tr.moveToTop();
      tr.nodes(created);
      return true;
    }

    function pasteImageFile(file) {
      var url = URL.createObjectURL(file);
      var node = new Konva.Image({
        id: nextId(), name: 'item', x: 60, y: 190, draggable: true
      });
      // object URL 只在当前页面有效；要跨页面复制，应先上传拿到正式地址
      node.setAttr('src', url);
      var img = new window.Image();
      img.onload = function () {
        var scale = Math.min(1, 160 / img.width, 160 / img.height);
        node.setAttrs({ image: img, width: img.width * scale, height: img.height * scale });
        tr.nodes([node]);
      };
      img.src = url;
      layer.add(node);
      tr.moveToTop();
    }

    document.addEventListener('paste', function (e) {
      var items = e.clipboardData ? e.clipboardData.items : [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.indexOf('image/') === 0) {
          e.preventDefault();
          pasteImageFile(items[i].getAsFile());
          clipStatus.text('剪贴板：已粘贴一张系统图片');
          return;
        }
      }
      var text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      if (restore(text || memory || '')) {
        e.preventDefault();
        clipStatus.text('剪贴板：已粘贴 ' + tr.nodes().length + ' 个节点');
      }
    });

    // ---- 原地复制：画布内部直接 clone，不经过剪贴板 ----
    window.addEventListener('keydown', function (e) {
      var el = e.target;
      if (e.isComposing || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && tr.nodes().length) {
        e.preventDefault(); // 否则浏览器会弹出「添加书签」
        var copies = tr.nodes().map(function (n) {
          var c = n.clone({ id: nextId(), x: n.x() + 20, y: n.y() + 20 });
          layer.add(c);
          return c;
        });
        tr.moveToTop();
        tr.nodes(copies);
        clipStatus.text('原地复制了 ' + copies.length + ' 个节点');
      }
    });
  </script>

</body>
</html>
```

演示没有调用 `navigator.clipboard`，而是监听 `document` 的 `copy` 与 `paste` 事件。
用户按下复制粘贴快捷键时，浏览器会派发这两个事件，并在事件对象上提供 `clipboardData`，
在回调里**同步**读写即可：不需要申请权限，不弹确认框，HTTP 页面也能用。

序列化用 `node.toObject()`，还原用 `Konva.Node.create(obj)`。写进剪贴板的 JSON 里加一个
`type` 字段作标记：用户剪贴板里可能是任何文字，粘贴时先确认是自己写进去的，再去还原。

`navigator.clipboard.writeText()` 留给**没有快捷键**的场景，比如右键菜单里的「复制」按钮。
点击按钮不会触发 `copy` 事件，只能调用这个异步接口，它的限制见下文。

## 图片节点要单独处理

`toObject()` 会跳过所有「不是普通对象」的属性。`Konva.Image` 的 `image` 属性是一个
`HTMLImageElement`，**不会被序列化**；还原出来的节点尺寸、位置都对，就是一片空白。

做法是创建图片节点时用自定义属性记下地址，还原后按地址重新加载：

```js
const node = new Konva.Image({ x: 0, y: 0, width: 90, height: 90 });
node.setAttr('src', '/assets/lion.png'); // 自定义属性会正常进入 toObject() 的结果

function loadImageNode(node) {
  const img = new window.Image();
  img.onload = () => node.image(img);
  img.src = node.getAttr('src');
}
```

同样会丢失的还有**函数形式的滤镜**：`filters` 属性只保留字符串形式的 CSS 滤镜
（如 `'blur(4px)'`），`Konva.Filters.Blur` 这类函数会被过滤掉，
需要的话也要像 `src` 一样另存滤镜名，还原时再映射回函数。
这些规则对整个舞台的序列化同样成立，见[舞台序列化](/docs/data-and-serialization/serialize-a-stage)。

从系统剪贴板粘贴进来的图片，演示里用 `URL.createObjectURL()` 生成地址。这种地址只在当前页面有效，
刷新或换一个标签页就失效了。要支持跨页面复制，应该先把图片上传到服务器，拿到正式地址再写进 `src`。

## 国内环境注意事项

`navigator.clipboard` 只在**安全上下文**里存在，也就是 HTTPS 页面或 `localhost`。
很多公司内网的后台系统仍是 HTTP 部署，在这些页面里 `navigator.clipboard` 直接是 `undefined`，
调用就会报错。这也是演示优先用 `copy` / `paste` 事件的原因：它们不受这个限制。

读取剪贴板的 `navigator.clipboard.readText()` 限制更多：Chrome 会弹出权限请求，
Safari 会在页面上弹出一个「粘贴」确认按钮，部分国产浏览器和 App 内置浏览器则直接拒绝。
所以**粘贴一律走 `paste` 事件**，不要为了「点击按钮粘贴」去主动读剪贴板。

手机上情况又不同：没有键盘快捷键，`copy` / `paste` 事件基本不会发生，
App 内置浏览器里跨应用粘贴图片也很难做到。移动端的编辑器应该另外提供「复制」「粘贴」按钮
（页面内部用内存变量中转即可），以及一个「上传图片」入口。

## 常见问题

### 粘贴出来的图片是空白的？

`Konva.Image` 的 `image` 属性是 DOM 对象，`toObject()` 不会序列化它，
还原出来的节点没有图片。创建时用 `node.setAttr('src', url)` 记下地址，
还原后按 `src` 重新加载，写法见上文。

### 粘贴后 id 重复了怎么办？

`Konva.Node.create()` 会原样还原 `id`，粘贴一次就有两个 id 相同的节点。
`stage.findOne('#id')` 只返回第一个，依赖 id 的选择、撤销、同步逻辑都会出错。
还原后立刻给每个新节点重新赋 id；粘贴的是 Group 的话，要用 `group.find('*')` 连同子节点一起改。

### 复制的节点能粘贴到 Figma 或 PPT 里吗？

不能直接粘贴，这些软件不认识 Konva 的 JSON。要互通的话，复制时额外写入一份 PNG：
用 `node.toBlob()` 生成图片，再用
`navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` 写进剪贴板。
这样粘贴到别的软件里得到的是图片，粘贴回自己的画布时仍可以读 JSON 还原成可编辑的节点。
