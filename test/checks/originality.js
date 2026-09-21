'use strict';
const fs = require('fs');
const path = require('path');

/**
 * 强制校验的范围。
 *
 * 全部内容已于 P5 改造完毕，这里收敛为单个 'docs/' 前缀——
 * 此后新增的任何页面都自动纳入校验，不需要再维护这个列表。
 *
 * 之前是逐章节追加的：一次性对全部页面开启会让 CI 立刻全红，
 * 真实的回归就淹没在里面了。现在没有未开工的页面，这层保护不再需要。
 */
const ENFORCED_PREFIXES = ['docs/'];

/** 每页必须有的小节。 */
const REQUIRED_SECTION = '常见问题';

/** 第三个小节三选一，按页面性质定。 */
const THIRD_SECTIONS = ['国内环境注意事项', '与其他方案的取舍', '性能提示'];

/**
 * 原创小节的散文字数下限（不含代码块）。
 *
 * 150 这个值来自实测：改造前全站散文中位数只有 137 字，整页加起来都不到。
 * 要求单个原创小节就达到 150，是为了确保它真的承载了内容，
 * 而不是一个标题加一句套话。
 */
const MIN_SECTION_CHARS = 150;

/**
 * h2 数量下限。
 *
 * 与 src/config/ads.ts 的 IN_ARTICLE_RULES.minHeadings 对齐——少于 3 个小节，
 * 该页拿不到正文内广告位。两处需一起改。
 */
const MIN_H2 = 3;

function walkMd(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** 去掉代码块、iframe 与 HTML 标签后的纯文字长度（忽略空白）。 */
function proseLength(text) {
  let t = text.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  t = t.replace(/<[^>]+>/g, '');
  return t.replace(/\s+/g, '').length;
}

/** 按 ## 切分正文，返回 [{ title, body }]。开篇（无标题那段）不计入。 */
function splitSections(body) {
  return body
    .split(/^## +/m)
    .slice(1)
    .map((chunk) => {
      const nl = chunk.indexOf('\n');
      return {
        title: (nl === -1 ? chunk : chunk.slice(0, nl)).trim(),
        body: nl === -1 ? '' : chunk.slice(nl + 1),
      };
    });
}

module.exports = {
  name: '原创增量段',
  REQUIRED_SECTION,
  THIRD_SECTIONS,
  run(ctx) {
    const problems = [];
    const files = walkMd(path.join(ctx.root, 'docs')).filter((f) => {
      const rel = path.relative(ctx.root, f).split(path.sep).join('/');
      return ENFORCED_PREFIXES.some((p) => rel.startsWith(p));
    });

    if (files.length === 0) {
      problems.push('ENFORCED_PREFIXES 没有匹配到任何页面，校验范围配置有误');
      return problems;
    }

    for (const file of files) {
      const rel = path.relative(ctx.root, file).split(path.sep).join('/');
      const text = fs.readFileSync(file, 'utf8');
      const body = text.startsWith('---') ? text.split('---').slice(2).join('---') : text;
      const sections = splitSections(body);

      if (sections.length < MIN_H2) {
        problems.push(
          `${rel} 只有 ${sections.length} 个 h2，需要至少 ${MIN_H2} 个（少于此则拿不到正文内广告位）`
        );
      }

      const titles = sections.map((s) => s.title);
      if (!titles.includes(REQUIRED_SECTION)) {
        problems.push(`${rel} 缺「${REQUIRED_SECTION}」小节`);
      }
      if (!THIRD_SECTIONS.some((t) => titles.includes(t))) {
        problems.push(`${rel} 缺第三类小节，需要以下之一：${THIRD_SECTIONS.join('、')}`);
      }

      // 原创小节必须真的有内容
      for (const s of sections) {
        if (s.title !== REQUIRED_SECTION && !THIRD_SECTIONS.includes(s.title)) continue;
        const len = proseLength(s.body);
        if (len < MIN_SECTION_CHARS) {
          problems.push(`${rel} 的「${s.title}」只有 ${len} 字，少于 ${MIN_SECTION_CHARS} 字`);
        }
      }

      // 常见问题下必须是 ### 问句，FAQPage 结构化数据据此提取
      const faq = sections.find((s) => s.title === REQUIRED_SECTION);
      if (faq) {
        const questions = [...faq.body.matchAll(/^### +(.+)$/gm)].map((m) => m[1].trim());
        if (questions.length === 0) {
          problems.push(`${rel} 的「${REQUIRED_SECTION}」下没有 ### 问句，无法生成 FAQPage`);
        }
        for (const q of questions) {
          if (!/[？?]$/.test(q)) {
            problems.push(`${rel} 的问句「${q}」没有以问号结尾`);
          }
        }
      }
    }

    return problems;
  },
};
