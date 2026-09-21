'use strict';

function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      out.push({ __invalid: true });
    }
  }
  return out;
}

module.exports = {
  name: '结构化数据',
  run(ctx) {
    const problems = [];

    if (ctx.exists('index.html')) {
      const types = extractJsonLd(ctx.read('index.html')).map((o) => o['@type']);
      if (!types.includes('WebSite')) problems.push('首页缺 WebSite 结构化数据');
    }

    for (const file of ctx.docHtml().filter((f) => ctx.rel(f).startsWith('docs/'))) {
      const r = ctx.rel(file);
      const blocks = extractJsonLd(ctx.read(r));

      if (blocks.some((b) => b.__invalid)) {
        problems.push(`${r} 含无法解析的 JSON-LD`);
        continue;
      }
      const types = blocks.map((b) => b['@type']);
      if (!types.includes('TechArticle')) problems.push(`${r} 缺 TechArticle`);

      // 必须「有且仅有一个」。Docusaurus 自己会输出一份只有一级的
      // BreadcrumbList，plugins/structuredData.ts 负责把它换成带完整层级的版本。
      // 若换成了「追加」，同页会出现两份互相矛盾的层级声明，
      // 搜索引擎通常两份都不采信。
      const crumbCount = types.filter((t) => t === 'BreadcrumbList').length;
      if (crumbCount === 0) problems.push(`${r} 缺 BreadcrumbList`);
      else if (crumbCount > 1) {
        problems.push(`${r} 有 ${crumbCount} 个 BreadcrumbList，应当有且仅有一个`);
      }

      const articleCount = types.filter((t) => t === 'TechArticle').length;
      if (articleCount > 1) {
        problems.push(`${r} 有 ${articleCount} 个 TechArticle，应当有且仅有一个`);
      }

      const article = blocks.find((b) => b['@type'] === 'TechArticle');
      if (article) {
        for (const field of ['headline', 'description', 'inLanguage', 'url']) {
          if (!article[field]) problems.push(`${r} 的 TechArticle 缺 ${field}`);
        }
        // headline 与 url 必须逐页不同，否则结构化数据反而在告诉搜索引擎
        // 这些页面是同一篇内容。
        if (article.url && !article.url.startsWith('https://')) {
          problems.push(`${r} 的 TechArticle.url 不是绝对地址：${article.url}`);
        }
      }

      const crumb = blocks.find((b) => b['@type'] === 'BreadcrumbList');
      if (crumb) {
        const items = crumb.itemListElement || [];
        // 至少「首页 > 文档 > 本页」三级。少于此说明替换没生效，
        // 拿到的还是 Docusaurus 那份只有一级的版本。
        if (items.length < 3) problems.push(`${r} 的面包屑层级不足（${items.length} 级）`);
        items.forEach((it, i) => {
          if (it.position !== i + 1) problems.push(`${r} 面包屑 position 不连续`);
          if (!it.name || !it.item) problems.push(`${r} 面包屑第 ${i + 1} 项缺 name 或 item`);
        });
      }
    }

    return problems;
  },
};
