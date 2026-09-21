'use strict';
const { siteUrl, legacySiteUrl } = require('../lib/site-meta');

// 规格 §7.2 的映射表共 97 行，其中 `/` → `/` 是恒等映射，写进 _redirects
// 会造成重定向循环，因此不写入。页面级规则实际为 96 条。
const EXPECTED_RULES = 96;

module.exports = {
  name: '301 重定向',
  run(ctx) {
    const problems = [];
    const SITE_URL = siteUrl(ctx);
    const LEGACY_URL = legacySiteUrl(ctx);
    if (!SITE_URL) problems.push('无法从 siteMeta.ts 读出 SITE_URL');
    if (!LEGACY_URL) problems.push('无法从 siteMeta.ts 读出 LEGACY_SITE_URL');

    if (!ctx.exists('_redirects')) {
      problems.push('build/_redirects 不存在，Netlify 不会应用任何重定向');
      return problems;
    }

    const lines = ctx
      .read('_redirects')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    const rules = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) {
        problems.push(`规则格式不合法：${line}`);
        continue;
      }
      rules.push({ from: parts[0], to: parts[1], code: parts[2] });
    }

    // 旧域名拼写错误：迁移前的 static/_redirects 目标写的是
    // front-end-js.tops（多一个 s），会把流量送进一个不存在的域名。
    for (const rule of rules) {
      if (/front-end-js\.tops/.test(rule.to)) {
        problems.push(`目标域名拼写错误（多一个 s）：${rule.to}`);
      }
    }

    const pageRules = rules.filter((r) => r.from.startsWith('/') && !r.from.includes('*'));
    if (pageRules.length !== EXPECTED_RULES) {
      problems.push(`页面级 301 有 ${pageRules.length} 条，期望 ${EXPECTED_RULES} 条`);
    }

    const seenFrom = new Map();
    for (const rule of pageRules) {
      if (!rule.code.startsWith('301')) {
        problems.push(`${rule.from} 使用了 ${rule.code}，应为 301`);
      }
      if (rule.from === rule.to) {
        problems.push(`${rule.from} 指向自身，会造成重定向循环`);
      }
      const prev = seenFrom.get(rule.from);
      if (prev) problems.push(`源地址重复：${rule.from}`);
      else seenFrom.set(rule.from, rule.to);

      // 迁移后页面级规则的目标一律是子域的绝对地址。写成相对路径会让主域上的
      // 旧 URL 先跳到「主域的新路径」再跳一次，多一跳，中间地址还会被短暂收录。
      if (!SITE_URL) {
        // SITE_URL 读不出来时已在上面报过，这里不再逐条重复
      } else if (!rule.to.startsWith(`${SITE_URL}/`)) {
        problems.push(`${rule.from} 的目标不是子域绝对地址：${rule.to}`);
        continue;
      }

      // 目标必须真实存在于构建产物中。301 指向 404 比不做重定向更糟——
      // 搜索引擎会直接丢弃该 URL 累积的权重。
      const target = rule.to
        .replace(SITE_URL, '')
        .replace(/^\//, '')
        .replace(/\/$/, '');
      const candidate = target === '' ? 'index.html' : `${target}/index.html`;
      if (!ctx.exists(candidate)) {
        problems.push(`${rule.from} 指向 ${rule.to}，但构建产物中不存在 ${candidate}`);
      }
    }

    // 主域兜底：主域上还有已收录的 URL，必须全量 301 到子域，否则收录会
    // 停在主域上，与子域形成重复内容。感叹号不能少——主域目前仍是本站的
    // Netlify 域名别名，同一份构建产物在主域下也能命中真实文件，
    // 不强制的话 Netlify 会直接返回文件而不跳转。
    if (SITE_URL && LEGACY_URL) {
      const wildcard = rules.find((r) => r.from === `${LEGACY_URL}/*`);
      if (!wildcard) {
        problems.push(`缺少主域兜底规则 ${LEGACY_URL}/*，主域流量不会转到子域`);
      } else {
        if (wildcard.to !== `${SITE_URL}/:splat`) {
          problems.push(`主域兜底规则的目标应为 ${SITE_URL}/:splat，实际是 ${wildcard.to}`);
        }
        if (wildcard.code !== '301!') {
          problems.push(`主域兜底规则应使用 301!（强制），实际是 ${wildcard.code}`);
        }
      }
    }

    return problems;
  },
};
