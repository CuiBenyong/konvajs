---
title: '开始'
description: 'Konva 入门：安装方式（npm、yarn、CDN）、Stage 舞台与 Layer 图层的层次结构，以及一个最小可运行的 Canvas 绘图示例。'
sidebar_position: 1
---

Konva是一个基于 Canvas 开发的 2d JavaScript框架库, 它可以轻松的实现桌面应用和移动应用中的图形交互交互效果.

Konva 可以实现高性能动画, 过渡, 节点嵌套, 局部操作, 滤镜, 缓存, 事件等功能, 不仅仅适用于桌面与移动开发, 还有更为广泛的应用.
## 安装

如果你使用包管理工具

```shell
npm install konva  
# or  
bower install konva
#or
yarn add konva
```

或者通过CDN下载

完整版<a href="https://unpkg.com/konva@10/konva.js" target="_blank">konva.js</a>

压缩版<a href="https://unpkg.com/konva@10/konva.min.js" target="_blank">konva.min.js</a>

## 工作原理

一切都是从一个包含了一系列用户的图层`Konva.Layer`的舞台对象`Konva.Stage`开始的  

每个图层都有两个`<canvas>`渲染器：一个场景渲染器以及一个`hit graph`渲染器(隐藏渲染器)。场景渲染器是你所看到的东西,`hit graph`渲染器则是一个特殊的隐藏画布，它被用来实现高性能的点击检测机制。
  
每个图层都可以包含许多形状，形状分组，以及分组的分组。所有的舞台、图层、分组和形状都是节点，就像是HTML页面中的DOM节点一样。

这里有一个节点的层次结构的示例：

```
                   Stage
                     |
              +------+------+
              |             |
            Layer         Layer
              |             |
        +-----+-----+     Shape
        |           |
      Group       Group
        |           |
        +       +---+---+
        |       |       |
     Shape   Group    Shape
                |
                +
                |
              Shape
```

所有节点都可以被样式化、变换，尽管Konva以及内建了很多形状。比如：三角形，原型，图片，精灵，文本，线条，多边形，正多边形，路径，星型等。

你也可以通过实例化Shape类、并创建一个draw函数来创建自定义的形状。  

每当你准备好一个具有图层和形状的舞台，你就可以绑定事件监听器、节点变换、运行动画、应用滤镜以及做更多事情。  

简单示例：
```js
	// first we need to create a stage *首先我们需要创建一个舞台
	var stage = new Konva.Stage({
	  container: 'container',   // id of container <div> *包裹舞台的DIV元素的ID
	  width: 500,
	  height: 500
	});
	
	// then create layer *然后创建一个图层
	var layer = new Konva.Layer();
	
	// create our shape *创建我们的形状
	var circle = new Konva.Circle({
	  x: stage.getWidth() / 2,
	  y: stage.getHeight() / 2,
	  radius: 70,
	  fill: 'red',
	  stroke: 'black',
	  strokeWidth: 4
	});

	// add the shape to the layer *将形状添加到图层上
	layer.add(circle);
	
	// add the layer to the stage *将图层添加到舞台上
	stage.add(layer);
```
结果:  
![Minimal code demo](/assets/overview-circle.png)


## 基本形状 *Basic shapes*
`Konva.js` 支持这些形状：矩形，椭圆，线，图像，文字，文字路径，星型，标签，SVG路径，正多边形  
你也可以创建自定义的形状：  
```js
     var triangle = new Konva.Shape({
	      sceneFunc: function(context) {
	        context.beginPath();
	        context.moveTo(20, 50);
	        context.lineTo(220, 80);
	        context.quadraticCurveTo(150, 100, 260, 170);
	        context.closePath();
	
	        // special Konva.js method
	        context.fillStrokeShape(this);
	      },
	      fill: '#00D2FF',
	      stroke: 'black',
	      strokeWidth: 4
	});
```
结果:  
![Custom shape](/assets/overview-custom.png)

## 样式  *Styles*

每个形状都支持以下的样式属性：  

- Fill. Solid color, gradients or images *填充：纯色，渐变或者图像纹理
- Stroke (color, width) *描边：颜色，宽度
- Shadow (color, offset, opacity, blur) *阴影：颜色，偏移，透明度，模糊度
- Opacity *透明度

示例:  
```js
    var pentagon = new Konva.RegularPolygon({
    	x: stage.getWidth() / 2,
    	y: stage.getHeight() / 2,
    	sides: 5,
    	radius: 70,
    	fill: 'red',
    	stroke: 'black',
    	strokeWidth: 4,
    	shadowOffsetX : 20,
    	shadowOffsetY : 25,
    	shadowBlur : 40,
    	opacity : 0.5
    	});
```
结果:
![Styles](/assets/overview-styles.png)

## 事件

使用`Konvajs`，你可以方便地监听用户输入事件（点击，双击，鼠标滑过，触击，连续触击，触摸开始等），属性变更事件（横向缩放变更，填充变更等），和拖拽释放事件（拖拽开始，拖拽移动，托转结束）。   

示例:      
```js
circle.on('mouseout touchend', function() {
	    console.log('user input');
	});
	
	circle.on('xChange', function() {
	    console.log('position change');
	});
	
	circle.on('dragend', function() {
	    console.log('drag stopped');
	});  
```
查看 <a href="/docs/events/binding-events" target="_blank">working example</a>

## 拖拽和释放  *DRAG AND DROP*

`Konvajs`没有内建的拖拽支持，现在并没有任何拖拽事件（drop,dragenter,dragleave,dragover)
但是,<a href="/docs/drag-and-drop/drop-events" target="_blank" >利用框架，可以轻易地实现这个机制。</a>

启用拖拽只需要设置draggable属性为true。  

```js
    shape.draggable('true');
```

然后你就可以支持拖拽事件，并<a href="/docs/drag-and-drop/complex-drag-and-drop" target="_blank" >设置移动区域的限制</a>。


## 滤镜 *Filters*

`Konvajs`有多重滤镜：模糊，反色，杂色等，<a href="https://konvajs.org/api/Konva.Filters.html" target="_blank">Filters API</a>收录了所有的滤镜。

示例:  
![Filter](/assets/overview-filter.png)

## 动画*Animation*  

你可以使用两种方式创建动画:  

使用`Konva.Animation`的示例:  
```js
	var anim = new Konva.Animation(function(frame) {
	    var time = frame.time, // *时间
	        timeDiff = frame.timeDiff, // *间隔时间
	        frameRate = frame.frameRate; // *帧率
	    // update stuff *用于更新动画状态的代码写在下面
	}, layer);
	anim.start();
```

使用`Konva.Tween`的示例:   
```js
     var tween = new Konva.Tween({
	        node: rect,
	        duration: 1,
	        x: 140,
	        rotation: Math.PI * 2,
	        opacity: 1,
	        strokeWidth: 6
	});
	tween.play();
	
	// or new shorter method: *或者更简短的新方法：
	circle.to({
	    duration : 1,
	    fill : 'green'
	});   
```

【译注】:

这里其实是创建动画的两种最常见的方式。

Animation是指每隔一段时间调用一次我们写好的回调，他们会把当前时间、两帧之间的时间差、帧率以传参的方式交给我们，我们则根据这些数据，手动写代码更新画面的状态。

Tween则是描述间隔时间、属性变化之后，让框架自行更新数据。

前者更加灵活，后者更加方便。

## 选择器 *Selectors*

在你创建大型应用时，元素搜索是很有用的。
  
`Konvajs`提供的选择器可以帮你寻找元素。你可以使用`find()`函数（返回一个集合）或者`findOne()`函数(返回集合中的第一个元素)   
 ```js
    var circle = new Konva.Circle({
	        radius: 10,
	        fill: 'red',
	        id : 'face',
	        name : 'red circle'
	});
	layer.add(circle);
	
	// then try to search
	
	// find by type
	layer.find('Circle'); // all circles
	
	// find by id
	layer.findOne('#face');
	
	// find by name (like css class)
	layer.find('.red')  
```
## 序列化和反序列化  *Serialisation and Deserialization*  

你创建的所有对象都可以用JSON的姓氏存储，你可以将它保存在服务器或者HTML5浏览器本地存储里。  
```js
    var json = stage.toJSON();
	Also you can restore objects from JSON:
	
	var json = '{"attrs":{"width":578,"height":200},"className":"Stage","children":[{"attrs":{},"className":"Layer","children":[{"attrs":{"x":100,"y":100,"sides":6,"radius":70,"fill":"red","stroke":"black","strokeWidth":4},"className":"RegularPolygon"}]}]}';
	
	var stage = Konva.Node.create(json, 'container');
```

## 性能 *Performance*  

`Konvajs`有很多工具，可以改善你的应用的性能。其中最关键的方法有：  

缓存允许你在缓冲画布上绘制一个元素，然后从那个canvas上绘制元素。在有很多组合节点时，这将会提高你的性能，比如说文本或者具有很多阴影和描边的形状。  
```js
shape.cache();
```
<a href="/docs/performance/shape-caching" target="_blank">Demo</a>

【译注】：Canvas的矢量绘制性能很差，而位图绘制则稍好。所以将复杂的图形先保存到图片或者另外的画布中，然后做完位图绘制到主画布上，是很常见的优化手法 .
   
分层 由于框架支持多个`<canvas>`元素，您可以自由放置对象。
例如，您的应用程序由复杂的背景和几种移动的形状组成。 您可以使用一层作为背景，另一层用于形状。
更新形状时，您不需要更新背景画布 <a href="/docs/performance/layer-management" target="_blank">Demo</a>

<a href="/docs/performance/all-performance-tips" target="_blank">All_Performance_Tips</a>

## 常见问题

### npm 装完之后怎么在普通 HTML 里用？

这是最常见的卡点。`npm install konva` 装下来的是 ES 模块，
直接在 `<script>` 里写 `import Konva from 'konva'` 浏览器会报错——
除非给 script 标签加上 `type="module"`，或者用打包工具处理。

不想引入构建流程的话，直接用 CDN 版本，它挂在全局 `Konva` 上：

```html
<script src="https://unpkg.com/konva@10/konva.min.js"></script>
<script>
  var stage = new Konva.Stage({ container: 'c', width: 400, height: 300 });
</script>
```

本站所有演示用的都是这种方式，复制粘贴就能跑。

另外 Konva 10.0.0 起包本身已经全面转为 ES 模块，
在 CommonJS 环境里 `require` 需要取 `.default`：`const Konva = require('konva').default`。

### container 传什么？

可以是元素的 id 字符串，也可以是 DOM 元素本身：

```js
new Konva.Stage({ container: 'my-div' });
new Konva.Stage({ container: document.getElementById('my-div') });
```

要点是这个元素**必须已经存在于文档中**。在 React、Vue 里于组件挂载完成前
创建舞台，会因为拿不到元素而失败——要放在 `useEffect` 或 `onMounted` 里。

### 代码没报错，但画布上什么都没有？

按这个顺序查：

1. **图形加到图层了吗**——`layer.add(shape)`
2. **图层加到舞台了吗**——`stage.add(layer)`。漏掉这一步是最常见的原因
3. **图形有尺寸吗**——`Konva.Rect` 不设 `width`/`height` 时为 0，填充色再鲜艳也看不见
4. **有填充或描边吗**——两者都没设置的图形不会被画出来，也不参与命中检测
5. **坐标在可视范围内吗**——舞台尺寸之外的内容不显示

这五条覆盖了绝大多数「白屏」情况。

## 国内环境注意事项

本站演示统一使用 `https://unpkg.com/konva@10/konva.min.js`。
unpkg 在国内的访问速度波动较大，偶尔会超时。几个可用的替代地址：

```html
<!-- jsDelivr，国内通常比 unpkg 稳定 -->
<script src="https://cdn.jsdelivr.net/npm/konva@10/konva.min.js"></script>

<!-- 字节跳动的公共 CDN -->
<script src="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/konva/9.2.0/konva.min.js"></script>
```

注意第三方镜像的版本更新往往滞后，上面字节 CDN 的版本就明显落后于最新版。
生产环境更稳妥的做法是把 konva 打包进自己的产物，或者放到自己的 CDN 上，
不依赖公共镜像的可用性。

**关于版本号写法**：本站演示写的是 `konva@10` 而不是精确版本，
unpkg 会解析到 10.x 的最新版。这样文档不会因为小版本发布而过期——
Konva 在 2026 年 8 到 9 月一个月内就发了五个版本，钉死版本号很快就会陈旧。
代价是上游一旦引入回归，演示会跟着坏，所以本站配套做了演示健康检查，
每次构建都用真实浏览器跑一遍全部演示页。

你自己的项目里建议钉死精确版本并用 lockfile 锁定，那是另一套权衡——
文档要的是「永远展示当前版本的用法」，项目要的是「构建结果可复现」。
