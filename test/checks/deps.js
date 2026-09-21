'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

// 与规格 §8 的版本下限一一对应。
const REQUIRED = {
  '@docusaurus/core': '3.10.2',
  '@docusaurus/preset-classic': '3.10.2',
};

// dumi 时代的遗留依赖，必须被移除：
// @umijs/preset-dumi 是 dumi 1 的 preset，与 dumi 2 不兼容且本项目从未使用；
// gatsby-plugin-netlify 属于 Gatsby 生态，本项目不是 Gatsby。
const FORBIDDEN = ['dumi', '@umijs/preset-dumi', 'gatsby-plugin-netlify', 'patch-package'];

// 规格 §8 的门槛：0 高危 0 中危。低危不阻断，但会打印出来。
const BLOCKING = ['critical', 'high', 'moderate'];

module.exports = {
  name: '依赖与安全',
  run(ctx) {
    const problems = [];
    const pkg = JSON.parse(ctx.readRoot('package.json'));
    const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

    for (const [name, version] of Object.entries(REQUIRED)) {
      if (!all[name]) problems.push(`缺少依赖 ${name}`);
      else if (!all[name].includes(version)) {
        problems.push(`${name} 版本为 ${all[name]}，期望 ${version}`);
      }
    }
    for (const name of FORBIDDEN) {
      if (all[name]) problems.push(`遗留依赖 ${name} 未移除`);
    }

    // 审计走 test/lib/audit.mjs，不走 npm audit CLI，原因见该文件顶部注释。
    let report;
    try {
      const out = execFileSync(process.execPath, [path.join(ctx.root, 'test/lib/audit.mjs')], {
        cwd: ctx.root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      report = JSON.parse(out);
    } catch (err) {
      problems.push(`无法运行依赖审计：${err.message}`);
      return problems;
    }

    if (!report.ok) {
      // 审计跑不起来不等于没有漏洞。这里必须报为问题，
      // 否则网络故障会被静默当成「安全」。
      problems.push(`依赖审计未能完成：${report.error}`);
      return problems;
    }

    for (const severity of BLOCKING) {
      const n = report.counts[severity] || 0;
      if (n > 0) {
        const hits = report.findings
          .filter((f) => f.severity === severity)
          .map((f) => `${f.name}@${f.range}（${f.title}）`);
        problems.push(`${severity} 漏洞 ${n} 个：${hits.join('；')}`);
      }
    }
    if (report.counts.low > 0) {
      console.log(`          提示：另有 ${report.counts.low} 个低危漏洞，不阻断构建`);
    }

    return problems;
  },
};
