'use strict';

/**
 * 站点地址的唯一读取入口。
 *
 * 各检查器一律从这里取域名，不自己写字符串。2026-09-21 从主域搬到
 * konva-doc-cn 子域时，robots.js 与 llms.js 里各有一处硬编码的旧域名漏改，
 * 检查器于是开始校验一个已经不存在的地址——把读取集中到一处，
 * 下次改域名只需要动 siteMeta.ts。
 */
function read(ctx, name) {
  const src = ctx.readRoot('siteMeta.ts');
  const m = new RegExp(`export const ${name} = '([^']*)'`).exec(src);
  return m ? m[1] : '';
}

/** 当前站点地址，例如 https://konva-doc-cn.front-end-js.top */
function siteUrl(ctx) {
  return read(ctx, 'SITE_URL');
}

/** 迁移前的主域，仍需长期 301 到子域 */
function legacySiteUrl(ctx) {
  return read(ctx, 'LEGACY_SITE_URL');
}

module.exports = { siteUrl, legacySiteUrl };
