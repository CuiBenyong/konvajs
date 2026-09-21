'use strict';
const fs = require('fs');
const path = require('path');

const REPORT = 'test/lib/demo-health.json';

function collectDemos(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectDemos(p, base, out);
    else if (e.name.endsWith('.html')) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

module.exports = {
  name: '演示健康',
  run(ctx) {
    const problems = [];

    if (!ctx.existsRoot(REPORT)) {
      problems.push(`${REPORT} 不存在，先运行 npm run demo-health`);
      return problems;
    }

    let report;
    try {
      report = JSON.parse(ctx.readRoot(REPORT));
    } catch (e) {
      problems.push(`${REPORT} 解析失败：${e.message}`);
      return problems;
    }

    // 报告必须覆盖当前磁盘上的每一个演示。少了说明报告过期——
    // 那种情况下「全部通过」是假象。
    const onDisk = collectDemos(
      path.join(ctx.root, 'static', 'downloads', 'code'),
      path.join(ctx.root, 'static')
    ).sort();
    const reported = new Set(report.results.map((r) => r.file));
    const missing = onDisk.filter((f) => !reported.has(f));
    if (missing.length) {
      problems.push(
        `报告未覆盖 ${missing.length} 个演示（如 ${missing[0]}），请重新运行 npm run demo-health`
      );
    }

    for (const r of report.results) {
      if (r.ok) continue;
      const why = [];
      if (r.errors.length) why.push(`控制台错误：${r.errors[0].slice(0, 100)}`);
      if (r.canvasCount === 0) why.push('页面上没有 canvas');
      else if (!r.painted) why.push('canvas 上没有画出任何内容');
      problems.push(`${r.file} — ${why.join('；')}`);
    }

    return problems;
  },
};
