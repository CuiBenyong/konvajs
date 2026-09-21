'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(BUILD);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const rel = (abs) => path.relative(BUILD, abs).split(path.sep).join('/');

const ctx = {
  buildDir: BUILD,
  root: ROOT,
  rel,
  read: (r) => fs.readFileSync(path.join(BUILD, r), 'utf8'),
  exists: (r) => fs.existsSync(path.join(BUILD, r)),
  readRoot: (r) => fs.readFileSync(path.join(ROOT, r), 'utf8'),
  existsRoot: (r) => fs.existsSync(path.join(ROOT, r)),
  allFiles,
  htmlFiles,
  // 文档页 = build 下的 index.html，排除搜索页。
  // 首页 index.html 也算，它同样需要 title/description/canonical。
  docHtml: () =>
    htmlFiles.filter((f) => {
      const r = rel(f);
      return r.endsWith('index.html') && !r.startsWith('search/');
    }),
};

const checks = [
  require('./checks/build-sanity'),
  require('./checks/deps'),
  require('./checks/metadata'),
  require('./checks/redirects'),
  require('./checks/robots'),
];

let failed = 0;
for (const check of checks) {
  const problems = check.run(ctx);
  if (problems.length === 0) {
    console.log(`  PASS  ${check.name}`);
  } else {
    failed += problems.length;
    console.log(`  FAIL  ${check.name}`);
    for (const p of problems.slice(0, 20)) console.log(`          ${p}`);
    if (problems.length > 20) console.log(`          ... 另有 ${problems.length - 20} 条`);
  }
}

console.log('');
if (failed) {
  console.error(`verify 失败：${failed} 个问题`);
  process.exit(1);
}
console.log('verify 全部通过');
