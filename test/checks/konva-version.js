'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 规格 §4.2.1：CDN 引用采用浮动大版本，不钉死精确版本。
 *
 * Konva 一个月内连发五个版本（10.3.2 至 10.6.0），钉死精确版本意味着每隔
 * 几周批量替换两百多处并重验全部演示。本次改造的起因之一，正是上一轮钉死的
 * 9.3.6 长期无人跟进。允许的写法只有 konva@10/konva.js 与 konva@10/konva.min.js。
 *
 * 只检查「真的会被浏览器加载的引用」，即 konva@<版本>/<路径> 这种带路径的形式。
 * 正文里裸提一句 `konva@10`（例如「本站跟随 konva@10 浮动大版本」）不是引用，
 * 不参与校验——否则写文档解释版本策略反而会被自己的检查拦下。
 */
const CDN_REF = /konva@([^/\s"'`)\]]+)\/([^\s"'`)\]]+)/g;
const ALLOWED_PATH = /^konva(\.min)?\.js$/;

/**
 * 反例豁免：docs 里需要展示「错误写法」才能说清楚问题，
 * 例如 ai-tools 页要演示 AI 常生成的 konva@8 引用。
 * 用 ❌ 标记所在行或紧邻的上一行非空行来豁免，标记必须显式写出，
 * 避免把真的写错的引用也一起放过。
 */
function isCounterExample(lines, i) {
  if (lines[i].includes('❌')) return true;
  for (let k = i - 1; k >= 0 && k >= i - 3; k--) {
    if (lines[k].trim() === '') continue;
    return lines[k].includes('❌');
  }
  return false;
}

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

module.exports = {
  name: 'Konva 版本引用',
  run(ctx) {
    const problems = [];
    const targets = [
      ...walk(path.join(ctx.root, 'docs'), ['.md']),
      ...walk(path.join(ctx.root, 'static', 'downloads'), ['.html']),
    ];

    for (const file of targets) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const bad = new Set();
      const badPath = new Set();
      let real = 0;

      lines.forEach((line, i) => {
        for (const m of line.matchAll(CDN_REF)) {
          // 反例只在 docs 正文里允许；演示 HTML 会被真的加载，不给豁免
          if (rel.startsWith('docs/') && isCounterExample(lines, i)) continue;
          real++;
          if (m[1] !== '10') bad.add(`konva@${m[1]}`);
          else if (!ALLOWED_PATH.test(m[2])) badPath.add(`konva@10/${m[2]}`);
        }
      });

      if (bad.size) problems.push(`${rel} 仍引用旧版本：${[...bad].join('、')}`);
      if (badPath.size) problems.push(`${rel} 的引用路径不合法：${[...badPath].join('、')}`);
    }

    return problems;
  },
};
