'use strict';

/**
 * SSR 阶段 AdUnit 渲染的是等高占位 div（useIsBrowser 在服务端返回 false），
 * 因此静态 HTML 里应当看到这个内联高度，而不是 ins 元素。
 *
 * 用静态正则字面量而非 new RegExp(`...${n}...`)：模板字符串里的反斜杠要写成
 * `\\s` 才能传出一个 `\s` 给 RegExp，写成 `\\\\s` 会得到字面反斜杠加 s，
 * 匹配永远失败。静态字面量没有这层转义。
 *
 * 280 这个值来自 src/config/ads.ts 中 articleBottom 的 minHeight，
 * 两处需保持一致——ads.js 已校验每个版位都设了 minHeight。
 */
const ARTICLE_PLACEHOLDER = /min-height:\s*280px/i;

module.exports = {
  name: '广告挂载',
  run(ctx) {
    const problems = [];
    const docs = ctx.docHtml().filter((f) => ctx.rel(f).startsWith('docs/'));

    if (docs.length === 0) {
      problems.push('未找到任何文档页');
      return problems;
    }

    for (const file of docs) {
      const r = ctx.rel(file);
      if (!ARTICLE_PLACEHOLDER.test(ctx.read(r))) {
        problems.push(`${r} 未渲染正文广告占位符（缺 min-height: 280px）`);
      }
    }

    if (ctx.exists('index.html') && !ARTICLE_PLACEHOLDER.test(ctx.read('index.html'))) {
      problems.push('首页未渲染底部广告占位符');
    }

    return problems;
  },
};
