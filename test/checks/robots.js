'use strict';
const { siteUrl } = require('../lib/site-meta');

// 规格 §6.2 要求显式放行的 UA。通用 User-agent: * 已经允许了所有爬虫，
// 这里显式列出是把立场固定下来：本站希望被 AI 检索系统抓取并引用。
//
// Google-Extended 是唯一不冗余的一条——它控制 Gemini 与 AI Overviews 的
// 内容使用，与 Googlebot 的网页索引是两套独立开关，不放行就不进引用池。
const REQUIRED_AGENTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai', 'YouBot', 'Diffbot',
  'Baiduspider',
];

/** 把 robots.txt 拆成 { agent, rules[] } 的段落。 */
function parseGroups(txt) {
  const groups = [];
  let current = null;
  for (const raw of txt.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, key, value] = m;
    if (key.toLowerCase() === 'user-agent') {
      current = { agent: value.trim(), rules: [] };
      groups.push(current);
    } else if (current) {
      current.rules.push({ key: key.toLowerCase(), value: value.trim() });
    }
  }
  return groups;
}

module.exports = {
  name: 'robots 与 AI 爬虫',
  run(ctx) {
    const problems = [];
    if (!ctx.exists('robots.txt')) {
      problems.push('build/robots.txt 不存在');
      return problems;
    }

    const txt = ctx.read('robots.txt');
    const groups = parseGroups(txt);
    const byAgent = new Map(groups.map((g) => [g.agent.toLowerCase(), g]));

    for (const agent of REQUIRED_AGENTS) {
      const group = byAgent.get(agent.toLowerCase());
      if (!group) {
        problems.push(`未声明 User-agent: ${agent}`);
        continue;
      }
      const allows = group.rules.filter((r) => r.key === 'allow' && r.value === '/');
      const disallows = group.rules.filter((r) => r.key === 'disallow' && r.value !== '');
      if (allows.length === 0) problems.push(`${agent} 缺 Allow: /`);
      if (disallows.length > 0) {
        problems.push(`${agent} 存在 Disallow: ${disallows[0].value}，与放行意图矛盾`);
      }
    }

    const SITE_URL = siteUrl(ctx);
    if (!SITE_URL) {
      problems.push('无法从 siteMeta.ts 读出 SITE_URL');
    } else {
      const expected = new RegExp(
        `Sitemap:\\s*${SITE_URL.replace(/[.]/g, '\\.')}/sitemap\\.xml`
      );
      if (!expected.test(txt)) {
        problems.push(`缺少 Sitemap 声明或地址不是 ${SITE_URL}/sitemap.xml`);
      }
    }
    if (!/llms\.txt/.test(txt)) {
      problems.push('未在 robots.txt 中声明 llms.txt 位置');
    }

    return problems;
  },
};
