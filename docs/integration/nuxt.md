---
title: '在 Nuxt 中使用'
description: 'vue-konva 的 v-stage 在 setup 阶段就创建 Konva.Stage，Nuxt 服务端渲染时会报 document is not defined。用 ClientOnly、.client.vue 组件或按路由关闭 SSR 解决。'
sidebar_position: 2
---

在 Nuxt 里直接写 `<v-stage>`，页面会返回 500，服务端日志是 `document is not defined`。

这一点和 [Next.js](/docs/integration/nextjs) **不同**。差别出在两个绑定库创建舞台的时机上：
react-konva 把 `new Konva.Stage()` 放在 `useLayoutEffect` 里，服务端不执行；
vue-konva（4.0.1）的 `v-stage` 则在组件的 `setup()` 里就创建舞台，并且当场调用
`document.createElement('div')` 作为临时容器。`setup()` 在服务端渲染时同样会执行，
所以只要 `v-stage` 进入了服务端的渲染树，就一定报错。

本站用 Nuxt 4.5.2 + vue-konva 4.0.1 + konva 10.7.0 实测复现：不做任何处理时首页返回 500；
下面三种写法都返回 200，浏览器里画布正常绘制，控制台没有报错。

## 用法

注册插件时加上 `.client` 后缀，只在浏览器端注册组件：

```ts
// plugins/vue-konva.client.ts
import VueKonva from 'vue-konva';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueKonva);
});
```

页面里用 `<ClientOnly>` 把舞台包起来：

```vue
<template>
  <main>
    <ClientOnly>
      <v-stage :config="{ width: 300, height: 150 }">
        <v-layer>
          <v-rect :config="{ x: 20, y: 20, width: 100, height: 60, fill: '#3b82f6' }" />
        </v-layer>
      </v-stage>
      <template #fallback>
        <div style="width: 300px; height: 150px">画布加载中…</div>
      </template>
    </ClientOnly>
  </main>
</template>
```

服务端渲染出的是 `fallback` 里的占位内容，舞台只在浏览器里创建。

## 三种写法怎么选

**`<ClientOnly>`**，如上。粒度最细：页面其余部分照常服务端渲染，只有画布这一块留给浏览器。

**`.client.vue` 组件**。把画布封装成组件，文件名以 `.client.vue` 结尾，
例如 `components/KonvaBox.client.vue`。Nuxt 会让它只在客户端渲染，
使用处不用再包 `<ClientOnly>`，服务端在它的位置输出一个空的 `<div>`：

```vue
<!-- components/KonvaBox.client.vue -->
<template>
  <v-stage :config="{ width: 300, height: 150 }">
    <v-layer>
      <v-rect :config="{ x: 20, y: 20, width: 100, height: 60, fill: '#3b82f6' }" />
    </v-layer>
  </v-stage>
</template>
```

**按路由关闭 SSR**。在 `nuxt.config.ts` 里写路由规则，匹配到的页面整页只在浏览器渲染：

```ts
export default defineNuxtConfig({
  routeRules: {
    '/editor/**': { ssr: false },
  },
});
```

## 与其他方案的取舍

三种写法解决的是同一个报错，区别在**有多少内容失去了服务端渲染**。

`<ClientOnly>` 只让出画布这一块，标题、说明文字、页面结构仍由服务端输出，
对搜索引擎和首屏速度的影响最小，适合「内容页里嵌一个交互画布」的场景。
它的代价是每个使用处都要包一层，并记得写 `fallback`。

`.client.vue` 效果与 `<ClientOnly>` 相同，但把「只在客户端」这个约束收进了组件自身，
使用者不用关心，适合画布组件在多处复用的情况。缺点是服务端只输出一个空 `div`，
没有 `fallback` 可以定制，需要自己用外层容器固定尺寸。

`routeRules` 最省事，一行配置解决整个目录，但整页都变成客户端渲染，
页面在 JavaScript 执行前是空白的，搜索引擎也看不到任何内容。
它只适合登录后才能访问、本来就不需要被收录的编辑器页面。

## 常见问题

### 为什么 Next.js 不用处理，Nuxt 要？

因为两个绑定库创建舞台的时机不同。react-konva 在 `useLayoutEffect` 里创建，服务端渲染时 effect 不执行，
`<Stage>` 只输出一个空 `div`；vue-konva 的 `v-stage` 在 `setup()` 里就创建，而 `setup()` 在服务端也会执行。
这不是 Konva 本身的差异，两者用的是同一个 Konva。

### 插件不加 .client 后缀行不行？

实测也可以：插件在服务端注册组件本身不会报错，报错只发生在服务端**渲染** `v-stage` 时，
只要 `v-stage` 被 `<ClientOnly>` 包住就没问题。但这些组件在服务端永远用不上，
加上 `.client` 后缀后服务端就不再加载它们。实测不加后缀时，构建产物的
`.output/server/node_modules` 里会带上一份 `konva`；加上后缀，这份就不见了。

### fallback 里放什么？

放一个和舞台**同样尺寸**的占位块，文字或骨架屏都可以。
尺寸不一致的话，舞台在浏览器里创建出来的那一刻，下方内容会整体跳动，
既难看也会拉低页面的布局稳定性指标（CLS）。
