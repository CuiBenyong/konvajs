---
title: '帮助'
description: 'Konva 使用中遇到问题时的求助渠道：StackOverflow 提问、GitHub Issues 报告缺陷、官方路线图与更新日志，以及国内可达的替代渠道。'
sidebar_position: 99
---

遇到问题时，先判断它属于哪一类——是用法不清楚，还是 Konva 本身有缺陷。
两者该去的地方不同。

## 求助渠道

* 用法问题去 <a href="https://stackoverflow.com/questions/tagged/konvajs" target="_blank">StackOverflow 的 konvajs 标签</a>
* 确认是缺陷再去 <a href="https://github.com/konvajs/konva/issues" target="_blank">GitHub Issues</a>
* <a href="https://github.com/konvajs/konva/wiki" target="_blank">Roadmap</a> 与 <a href="https://github.com/konvajs/konva/blob/master/CHANGELOG.md" target="_blank">CHANGELOG</a> 是了解版本变化最可靠的来源
* 作者 lavrton 也提供付费的深度支持，可以通过他的 <a href="https://github.com/lavrton" target="_blank">GitHub 主页</a>联系

## 生态工具

官方框架绑定、TypeScript 类型、调试与性能排查手段集中在
[周边工具](/docs/tools)一页。

## 常见问题

### 提问前该准备什么？

一个**最小可复现示例**。把问题从你的项目里剥离出来，只留下触发问题所必需的代码，
放到 CodeSandbox 或 JSFiddle 上。

这件事的价值不只是方便别人看——剥离的过程中你往往自己就找到原因了。
能复现的问题解决得快，描述性的提问（「我的图形不显示」）通常得不到有效回答。

同时说明 Konva 版本、浏览器与操作系统。Konva 发布节奏很快，
版本不同行为可能就不同。

### StackOverflow 和 GitHub Issues 怎么选？

判断标准是「这是我不会用，还是 Konva 有 bug」。

**不确定用法、不知道该用哪个 API、代码跑不通但不确定原因**——这些去 StackOverflow。
那里有更多人会看到，而且问答会被搜索引擎索引，后来者能受益。

**确认是缺陷**——有最小复现、行为明显违反文档、或者在旧版本正常而新版本失效——
才去开 Issue。开 Issue 前先搜一遍已有的，重复问题很常见。

### 中文社区有哪些？

Konva 没有官方中文社区。实际能找到讨论的地方主要是掘金、思否上的技术文章，
以及少数 QQ / 微信技术群。

比起找中文社区，更有效的办法通常是：先查本站与
<a href="https://konvajs.org/" target="_blank">官方英文文档</a>，
再搜 StackOverflow 上的英文问答。Canvas 相关的问题往往与 Konva 无关，
搜 `canvas` 加上具体现象常常比搜 `konva` 更快找到答案。

## 国内环境注意事项

几个官方渠道在国内的可达性不一致，值得提前知道：

**GitHub** 访问不稳定，克隆仓库、看 Issues 可能需要等待或重试。
只是查阅代码的话，可以用 `github.dev`（把 URL 里的 `github.com` 改成 `github.dev`）
或者国内的镜像站。

**StackOverflow** 通常可以访问，但搜索引擎入口有时不稳，直接用站内搜索更可靠。

**Gitter / Discord** 这类实时聊天基本不可用，不建议把它当作主要求助途径。

**npm 安装慢**的话把 registry 换成国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

注意换了镜像之后 `npm audit` 会失效——npmmirror 没有实现安全审计接口，
需要审计时得临时切回官方源。本站的依赖审计就是因此绕开了 `npm audit` 命令，
改为直接查询官方的批量通告接口。
