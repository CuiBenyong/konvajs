'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 页面名与演示文件名允许不一致的例外。
 *
 * common-easings 页引用 Common_Easing.html，只是单复数差异，演示内容是对的。
 * 加白名单而不是改文件名：改名要同时改引用，收益为零。
 */
const NAME_MISMATCH_ALLOWED = new Set(['docs/tweens/common-easings.md']);

/** 去掉大小写、下划线、连字符后比较，用于判断「是不是同一个东西」。 */
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function walkMd(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

module.exports = {
  name: '演示引用正确性',
  run(ctx) {
    const problems = [];
    const docsDir = path.join(ctx.root, 'docs');
    if (!fs.existsSync(docsDir)) {
      problems.push('docs 目录不存在');
      return problems;
    }

    for (const file of walkMd(docsDir)) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8');
      const srcs = [...text.matchAll(/src="\/downloads\/code\/([^"]+)"/g)].map((m) => m[1]);

      for (const src of srcs) {
        const onDisk = path.join(ctx.root, 'static', 'downloads', 'code', src);
        if (!fs.existsSync(onDisk)) {
          problems.push(`${rel} 引用的演示不存在：/downloads/code/${src}`);
          continue;
        }
        if (NAME_MISMATCH_ALLOWED.has(rel)) continue;

        const page = path.basename(rel, '.md');
        const demo = path.basename(src, '.html');
        if (norm(page) !== norm(demo)) {
          problems.push(`${rel} 的演示名与页面不符：页面 ${page}，演示 ${demo}`);
        }
      }
    }

    return problems;
  },
};
