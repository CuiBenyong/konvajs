---
title: '中文字体加载'
description: '中文 Web 字体晚于 Konva.Text 创建时，已有节点的换行与基线不会自动更新。用 document.fonts.load 预加载，或对已有节点强制重排。'
sidebar_position: 1
---

典型症状是：字体明明已经加载完，画布上的字也换成了新字体，
**但换行位置、行数、垂直位置还是错的**，Transformer 的框也对不上文字。
`layer.draw()` 调多少次都没用。

原因是 `Konva.Text` 的排版结果在创建那一刻就算好了，字体晚到并不会让它重新算。

## 用法

最稳的做法是**先等字体，再创建文字节点**：

```js
const FONT = '"Source Han Sans SC"';
const content = '双十一大促 · 全场 5 折起，满 300 减 50';

async function createTitle(layer) {
  // 第二个参数传实际要显示的文字，而不是随便一个「中」字
  await document.fonts.load(`32px ${FONT}`, content);

  const title = new Konva.Text({
    text: content,
    fontFamily: `${FONT}, "PingFang SC", "Microsoft YaHei", sans-serif`,
    fontSize: 32,
    width: 360,
  });
  layer.add(title);
  return title;
}
```

`document.fonts.load()` 的第二个参数决定**要下载字体的哪些部分**。
中文 Web 字体几乎都是按 `unicode-range` 切成几十上百个分片的，
浏览器只下载样本文字涉及的分片。只传一个 `'中'`，就只保证了「中」所在的那一片，
其余的字照样是回退字体。

## 为什么已有节点不会更新

`Konva.Text` 的换行结果（每一行放哪些字、各行多宽）和基线偏移，
由内部的 `_setTextData()` 计算。它只在两个时机运行：
**构造时**，以及 `text`、`fontFamily`、`fontSize`、`width` 等排版相关属性**发生变化**时。

字体下载完成不在其中。测量时用的是当时可用的字体，也就是回退字体，
结果就一直留在节点上。之后的 `draw()` 会用新字体画字形，
但沿用的仍是按回退字体算出的换行。

本站用本机 Chrome 实测（`konva@10.7.0`，宽 200、20px，文字为
`'Konva 10.7 WWW mmm iii 中英混排 Transformer width 测试 lorem ipsum dolor'`，
字体服务端延迟 800ms 返回）：

| 节点 | 行数 | 基线偏移 |
|---|---:|---:|
| 字体加载前创建 | 4 | 6.5 |
| 同一节点，字体加载完成后 | **4** | **6.5** |
| 字体加载完成后新建 | 5 | 8 |

已有节点要强制重排，**不能**把属性设成原来的值——`Node#_setAttr` 发现新旧值相等会直接返回，
不触发任何事件，实测 `t.fontFamily(t.fontFamily())` 毫无作用。要先换成别的值再换回来：

```js
document.fonts.ready.then(() => {
  stage.find('Text').forEach((t) => {
    const family = t.fontFamily();
    // 设成相同的值不会触发重排，先换一个值再换回来
    t.fontFamily('');
    t.fontFamily(family);
  });
});
```

实测这样处理后，已有节点的行数与基线和新建节点完全一致。

同一组实测里还有一个现象：**纯中文段落在字体加载前后换行完全相同**。
几乎所有中文字体的汉字都是等宽的全角字形，回退字体和目标字体量出来一样宽。
问题集中在**中英混排、数字、标点**，以及依赖基线的 `verticalAlign` 和 Transformer 包围盒上。
所以只用纯中文测试，很容易误以为没有这个问题。

## 导出图片前等字体

字体只在 canvas 里使用、页面 DOM 没用到时，Chrome 仍会在第一次绘制时开始下载，
但**这一帧用的是回退字体**。Konva 不监听字体加载事件，所以不会自动重绘，
画面会一直停在回退字体的样子，直到别的原因触发下一次绘制。

导出同理：`toDataURL()` 在字体就绪前调用，导出图里就是回退字体。

```js
await document.fonts.load(`32px ${FONT}`, allTextOnStage);
// 如果节点是在字体到达前创建的，先按上一节重排
const url = stage.toDataURL({ pixelRatio: 2 });
```

`pixelRatio` 的取值见[高清导出](/docs/data-and-serialization/high-quality-export)。
在服务端生成图片时字体要用后端库注册，见[在 Node.js 中使用 Konva](/docs/nodejs/nodejs-setup)。

## 国内环境注意事项

**体积**。一套完整的中文字体通常有数 MB 到十几 MB，直接当 Web 字体引用，
移动网络下要等好几秒，这几秒里的画布全是回退字体。要么只保留用到的字做子集化，
要么切成 `unicode-range` 分片按需加载。只有少量固定文案（比如海报模板标题）时，
子集化最划算。

**来源**。Google Fonts 在国内访问不稳定，不要依赖 `fonts.googleapis.com`。
字体文件放在自己的服务器或国内 CDN 上；跨域引用字体时服务端必须返回
`Access-Control-Allow-Origin`，否则浏览器直接拒绝加载，画布上始终是回退字体。

**版权**。微软雅黑、苹方等系统字体的授权**不允许作为 Web 字体分发**，
把它们的字体文件放到服务器上就是侵权。可以免费商用的开源选择有
思源黑体 / Noto Sans SC、思源宋体、霞鹜文楷等（均为 SIL OFL 授权），
具体以各字体随附的授权文本为准。

**回退链**。即使用了 Web 字体，`fontFamily` 也要写完整的回退链，
例如 `'"Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'`，
保证字体加载失败时每个平台都能落到一个实际存在的中文字体上，而不是宋体。

## 常见问题

### 为什么只有英文和数字的位置不对？

因为汉字在几乎所有中文字体里都是等宽全角，回退字体和目标字体测出来一样宽，换行不变；
拉丁字母、数字和标点的字宽则因字体而异。上面的实测里，纯中文段落前后完全一致，
中英混排则从 4 行变成 5 行。

### document.fonts.ready 之后还是不对？

`document.fonts.ready` 只等**已经开始下载**的字体。一个 canvas 还没画过、
DOM 也没用到的字体，根本还没开始下载，`ready` 会立刻兑现。
要主动触发下载，用 `document.fonts.load(font, text)`。

另一种可能是字体确实加载了，但文字节点是之前创建的，排版没有重算——见上面的强制重排。

### 能不能监听字体加载，自动重排？

可以监听 `document.fonts` 的 `loadingdone` 事件，在回调里执行上面的重排循环：

```js
let timer = 0;
document.fonts.addEventListener('loadingdone', () => {
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(() => {
    stage.find('Text').forEach((t) => {
      const family = t.fontFamily();
      t.fontFamily('');
      t.fontFamily(family);
    });
  });
});
```

要做合并：分片字体每下载完一批分片就触发一次，不合并的话一屏文字会被重排几十遍。
