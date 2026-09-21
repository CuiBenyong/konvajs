'use strict';

const { siteUrl } = require('../lib/site-meta');

module.exports = {
  name: 'canonical 与 sitemap',
  run(ctx) {
    const problems = [];
    const SITE_URL = siteUrl(ctx);
    if (!SITE_URL) {
      problems.push('无法从 siteMeta.ts 读出 SITE_URL');
      return problems;
    }

    const seen = new Map();
    for (const file of ctx.docHtml()) {
      const r = ctx.rel(file);
      const html = ctx.read(r);

      const matches = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)];
      if (matches.length === 0) {
        problems.push(`${r} 缺 canonical`);
        continue;
      }
      if (matches.length > 1) {
        problems.push(`${r} 有 ${matches.length} 个 canonical，应当唯一`);
      }

      const href = /href="([^"]*)"/.exec(matches[0][0]);
      if (!href) {
        problems.push(`${r} 的 canonical 没有 href`);
        continue;
      }
      const url = href[1];

      if (!url.startsWith(SITE_URL)) {
        problems.push(`${r} 的 canonical 不是本站绝对地址：${url}`);
      }
      // 迁移前的 dumi 实现拼出的是 https://front-end-js.top//guides/...
      // 双斜杠会让搜索引擎把它视作与正常地址不同的另一个 URL。
      if (/[^:]\/\//.test(url)) {
        problems.push(`${r} 的 canonical 含双斜杠：${url}`);
      }

      const prev = seen.get(url);
      if (prev) problems.push(`${r} 与 ${prev} 的 canonical 相同：${url}`);
      else seen.set(url, r);
    }

    if (!ctx.exists('sitemap.xml')) {
      problems.push('sitemap.xml 不存在');
    } else {
      const xml = ctx.read('sitemap.xml');
      const locs = (xml.match(/<loc>/g) || []).length;
      const mods = (xml.match(/<lastmod>/g) || []).length;
      if (locs === 0) problems.push('sitemap.xml 没有任何条目');
      // lastmod 是少数几个 Google 确实会参考的 sitemap 字段。
      if (mods < locs) {
        // lastmod 来自 git 提交记录（docs 的 showLastUpdateTime）。缺失通常
        // 意味着该文件还没 git add——新增页面在首次提交前必然命中这一条。
        problems.push(
          `sitemap 有 ${locs} 条 loc 但只有 ${mods} 条 lastmod。` +
            `lastmod 取自 git 提交记录，缺失多半是有页面尚未 git add`
        );
      }
      if (/front-end-js\.tops/.test(xml)) problems.push('sitemap 中出现拼写错误的域名');
      // sitemap 条目数应与实际页面数相当。差得太多说明有页面被漏掉或多收录。
      const pages = ctx.docHtml().length;
      if (Math.abs(locs - pages) > 2) {
        problems.push(`sitemap 有 ${locs} 条，实际页面 ${pages} 个，差异过大`);
      }
    }

    return problems;
  },
};
