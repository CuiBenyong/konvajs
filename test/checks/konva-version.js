'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 规格 §4.2.1：CDN 引用采用浮动大版本，不钉死精确版本。
 *
 * Konva 一个月内连发五个版本（10.3.2 至 10.6.0），钉死精确版本意味着每隔
 * 几周批量替换两百多处并重验全部演示。本次改造的起因之一，正是上一轮钉死的
 * 9.3.6 长期无人跟进。允许的写法只有 konva@10/konva.js 与 konva@10/konva.min.js。
 */
const ALLOWED_PATH = /konva@10\/konva(\.min)?\.js/;
const ANY_KONVA_CDN = /konva@[^/\s"']+/g;

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
      const text = fs.readFileSync(file, 'utf8');
      const refs = text.match(ANY_KONVA_CDN) || [];
      if (refs.length === 0) continue;

      const bad = [...new Set(refs.filter((r) => r !== 'konva@10'))];
      if (bad.length) {
        problems.push(`${rel} 仍引用旧版本：${bad.join('、')}`);
        continue;
      }
      // 防止写成 konva@10/konva-min.js 之类不存在的路径
      if (!ALLOWED_PATH.test(text)) {
        problems.push(`${rel} 的 konva@10 引用路径不合法`);
      }
    }

    return problems;
  },
};
