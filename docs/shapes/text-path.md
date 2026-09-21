---
title: 'Text 路径文字'
description: '用 Konva.TextPath 让文字沿 SVG 路径排列：data 给出路径，text 给出文字内容，常用于弧形标题与环绕文字。'
sidebar_position: 12
---

路径文字让文本沿任意曲线排列，常用于弧形标题、环绕徽章这类效果。

## 用法

要使用`Konva`添加文本路径, 我们可以实例化一个`Konva.TextPath()`对象.

有关属性和方法的完整列表,请参阅<a href="https://konvajs.org/api/Konva.TextPath.html" target="_blank">Konva.TextPath</a>文档

<iframe src="/downloads/code/shapes/TextPath.html" style="width: 50vw;height:300px;"></iframe>


```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/konva@10/konva.min.js"></script>
  <meta charset="utf-8">
  <title>Konva TextPath Demo</title>
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
  var width = window.innerWidth;
  var height = window.innerHeight;

  var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
  });

    var layer = new Konva.Layer();

    var textpath = new Konva.TextPath({
      x: 10,
      y: 50,
      fill: '#333',
      fontSize: 16,
      fontFamily: 'Arial',
      text: 'All the world\'s a stage, and all the men and women merely players.',
      data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'
    });

    layer.add(textpath);

    // add the layer to the stage
    stage.add(layer);
  </script>

</body>
</html>

```

## 常见问题

### 文字尾部被截断了，没有任何提示？

`TextPath` 会沿路径逐字摆放，路径走完就停——多出来的字符直接不画，不报错也不换行。

要么缩短文本，要么加长路径。可以用 `path.getLength()` 量出路径长度，
和 `textPath.getTextWidth()` 比较，提前判断是否放得下。

### 文字上下颠倒了？

文字的朝向由路径方向决定。同一条视觉上相同的曲线，点的顺序反过来，
文字就会倒过来贴在另一侧。

不需要改文本或加旋转，把 `data` 里的路径方向反转即可——例如把一段从左到右的
弧线改写成从右到左。

### 中文字符在弯曲处间距为什么不均匀？

字符是沿路径逐个定位的，曲率大的地方相邻字符的基线方向差异大，视觉间距就会
显得忽宽忽窄。汉字是方块字、字宽一致，这个现象比西文更明显。

用 `letterSpacing` 做整体微调可以缓解。Konva 10.4.0 起 `letterSpacing` 按字素
计算，含 emoji 的文本间距行为和以前不同，如果之前调过这个值，升级后要复核。

## 国内环境注意事项

路径文字对字体的敏感度比普通文本更高。[`Konva.Text`](/docs/shapes/text) 那一页
提到的 Web Font 问题在这里同样存在，而且后果更严重——回退字体的字宽不同，
整段文字沿路径的总长度随之改变，原本刚好排满的文字可能变成排不下而被截断。

所以路径文字务必在 `document.fonts.ready` 之后再创建或重绘，
不要依赖「先画出来再说」。

另外，如果字体是从公共 CDN 加载的中文字体，体积通常在几 MB 量级，
国内加载时间可能达到数秒。这种场景下更稳妥的做法是只加载用到的字形子集，
或者干脆改用系统字体。
