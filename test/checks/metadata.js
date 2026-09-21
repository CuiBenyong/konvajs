'use strict';

// 迁移前 96/97 页的 description 为空字符串。这个检查确保补写工作真的做了，
// 而不是让 Docusaurus 用站点级 description 给每页兜底——那样全站近百页
// 会共用同一条摘要，在搜索结果里等同于没有摘要。
//
// 与站点描述做「完全相等」比较，而不是子串匹配：页面摘要完全可以正当地
// 以「Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架」这类介绍性文字起笔，
// 子串匹配会把这类正常摘要误判成兜底。
const MIN_DESCRIPTION_CHARS = 40;

/** 从 siteMeta.ts 取站点描述，保证与实际配置同源，不在此处重复硬编码。 */
function siteDescription(ctx) {
  const m = /export const SITE_DESCRIPTION =\s*\n?\s*'([^']*)'/.exec(ctx.readRoot('siteMeta.ts'));
  return m ? m[1] : '';
}

function extractDescription(html) {
  const m =
    /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html) ??
    /<meta\s+[^>]*content="([^"]*)"[^>]*name="description"/i.exec(html);
  return m ? m[1].trim() : '';
}

function extractTitle(html) {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return m ? m[1].trim() : '';
}

module.exports = {
  name: '页面元数据',
  run(ctx) {
    const problems = [];
    const seenTitles = new Map();
    const siteDesc = siteDescription(ctx);

    for (const file of ctx.docHtml()) {
      const r = ctx.rel(file);
      const html = ctx.read(r);

      const title = extractTitle(html);
      if (!title) {
        problems.push(`${r} 缺 <title>`);
      } else {
        const prev = seenTitles.get(title);
        if (prev) problems.push(`${r} 的 title 与 ${prev} 重复：「${title}」`);
        else seenTitles.set(title, r);
      }

      const desc = extractDescription(html);
      if (!desc) {
        problems.push(`${r} 缺 description`);
      } else if (r !== 'index.html' && siteDesc && desc === siteDesc) {
        // 首页豁免：首页就是站点本身，用站点描述是正确的，不算兜底。
        problems.push(`${r} 使用了站点级 description 兜底，未撰写页面级摘要`);
      } else if (desc.length < MIN_DESCRIPTION_CHARS) {
        problems.push(`${r} 的 description 仅 ${desc.length} 字符，短于 ${MIN_DESCRIPTION_CHARS}`);
      }
    }

    return problems;
  },
};
