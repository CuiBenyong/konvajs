'use strict';

// 规格 §7.2 的映射表共 97 行，其中 `/` → `/` 是恒等映射，写进 _redirects
// 会造成重定向循环，因此不写入。页面级规则实际为 96 条。
const EXPECTED_RULES = 96;

module.exports = {
  name: '301 重定向',
  run(ctx) {
    const problems = [];

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

      // 目标必须真实存在于构建产物中。301 指向 404 比不做重定向更糟——
      // 搜索引擎会直接丢弃该 URL 累积的权重。
      const target = rule.to.replace(/^\//, '').replace(/\/$/, '');
      const candidate = target === '' ? 'index.html' : `${target}/index.html`;
      if (!ctx.exists(candidate)) {
        problems.push(`${rule.from} 指向 ${rule.to}，但构建产物中不存在 ${candidate}`);
      }
    }

    return problems;
  },
};
