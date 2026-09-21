'use strict';
const { siteUrl, legacySiteUrl } = require('../lib/site-meta');

module.exports = {
  name: 'llms.txt',
  run(ctx) {
    const problems = [];

    if (!ctx.exists('llms.txt')) {
      problems.push('llms.txt 不存在');
      return problems;
    }

    const txt = ctx.read('llms.txt');
    const entries = (txt.match(/^- \[/gm) || []).length;
    const pages = ctx.docHtml().length;

    // 条目数应与实际页面数相当。少了说明有页面没被收录，
    // AI 检索时就看不到那些页面。
    if (entries < pages - 2) {
      problems.push(`llms.txt 有 ${entries} 条目，实际页面 ${pages} 个，收录不全`);
    }

    // 条目必须是绝对地址——AI 系统拿到相对路径无法直接抓取。
    const relativeLinks = (txt.match(/^- \[[^\]]*\]\((?!https:\/\/)/gm) || []).length;
    if (relativeLinks > 0) {
      problems.push(`llms.txt 有 ${relativeLinks} 条相对链接，必须使用绝对地址`);
    }
    const SITE_URL = siteUrl(ctx);
    if (!SITE_URL) {
      problems.push('无法从 siteMeta.ts 读出 SITE_URL');
    } else if (!txt.includes(SITE_URL)) {
      problems.push(`llms.txt 中不含本站绝对地址 ${SITE_URL}`);
    }
    // 迁移后若仍出现主域地址，说明有硬编码漏改，AI 抓到的会是跳转前的地址
    const LEGACY = legacySiteUrl(ctx);
    if (LEGACY && new RegExp(`${LEGACY.replace(/[.]/g, '\\.')}(?![\\w-])`).test(txt)) {
      problems.push(`llms.txt 中仍出现迁移前的主域 ${LEGACY}`);
    }
    // 每条都应带摘要，否则 llms.txt 相对 sitemap.xml 就没有增量价值。
    const withoutDesc = (txt.match(/^- \[[^\]]*\]\([^)]*\)$/gm) || []).length;
    if (withoutDesc > 5) {
      problems.push(`llms.txt 有 ${withoutDesc} 条无摘要，与 sitemap.xml 相比失去增量价值`);
    }

    if (!ctx.exists('llms-full.txt')) {
      problems.push('llms-full.txt 不存在');
    } else {
      const full = ctx.read('llms-full.txt');
      if (full.length < 10000) {
        problems.push(`llms-full.txt 仅 ${full.length} 字符，正文可能未写入`);
      }
      if (!/^## /m.test(full)) {
        problems.push('llms-full.txt 没有章节标题，格式不正确');
      }
    }

    return problems;
  },
};
