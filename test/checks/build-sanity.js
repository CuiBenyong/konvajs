'use strict';

// 迁移前 dumi 产出的空壳为 630 字节。含正文的页面远超此值，
// 取 5000 作为阈值可机械区分两者，且留足余量给内容最短的页面。
const MIN_HTML_BYTES = 5000;
const EXPECTED_DOC_PAGES = 97;

module.exports = {
  name: '构建健全性',
  run(ctx) {
    const problems = [];

    if (!ctx.exists('index.html')) {
      problems.push('build/index.html 不存在，构建未产出首页');
      return problems;
    }

    const docs = ctx.docHtml();
    if (docs.length < EXPECTED_DOC_PAGES) {
      problems.push(`文档页只有 ${docs.length} 个，期望至少 ${EXPECTED_DOC_PAGES} 个`);
    }

    for (const file of docs) {
      const html = ctx.read(ctx.rel(file));
      if (html.length < MIN_HTML_BYTES) {
        problems.push(`${ctx.rel(file)} 仅 ${html.length} 字节，疑似空壳（阈值 ${MIN_HTML_BYTES}）`);
      }
      // 正文必须出现在静态 HTML 里，而不是只存在于客户端渲染后。
      // 不执行 JS 的 AI 爬虫只能看到这里的内容。
      if (!/[一-龥]/.test(html)) {
        problems.push(`${ctx.rel(file)} 静态 HTML 中不含任何中文，正文未参与 SSG`);
      }
    }

    return problems;
  },
};
