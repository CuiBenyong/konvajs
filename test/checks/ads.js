'use strict';

const AD_CLIENT = 'ca-pub-9580076271637088';
const REQUIRED_SLOTS = ['5362046383', '5334514048'];
const PLACEMENTS = ['inArticle', 'articleBottom', 'tocSidebar'];

/** 去掉块注释与行注释，避免注释中提到的标识符被当成真实调用。 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

module.exports = {
  name: '广告配置与合规',
  run(ctx) {
    const problems = [];

    if (!ctx.existsRoot('src/config/ads.ts')) {
      problems.push('src/config/ads.ts 不存在');
      return problems;
    }
    const cfg = ctx.readRoot('src/config/ads.ts');

    // 改动 client 会断掉 static/ads.txt 的账号关联，广告将无法投放。
    if (!cfg.includes(AD_CLIENT)) {
      problems.push(`AD_CLIENT 被改动，应为 ${AD_CLIENT}（改动会断掉 ads.txt 关联）`);
    }
    for (const slot of REQUIRED_SLOTS) {
      if (!cfg.includes(slot)) problems.push(`广告位 slot ${slot} 丢失`);
    }
    for (const p of PLACEMENTS) {
      if (!cfg.includes(p)) problems.push(`缺少版位 ${p}`);
    }
    // 每个版位都必须预留高度，否则广告异步填充时会把下方内容顶开产生 CLS。
    // CLS 是 Core Web Vitals 三项指标之一，既影响排名也影响广告可见性评分。
    const minHeightCount = (cfg.match(/minHeight:/g) || []).length;
    if (minHeightCount < PLACEMENTS.length) {
      problems.push(`minHeight 只出现 ${minHeightCount} 次，每个版位都必须预留高度`);
    }

    // AdSense 版位政策禁止在用户未主动请求的情况下刷新广告。换页重建由用户
    // 点击导航触发，属用户主动行为；定时器刷新则违反政策，可能导致账号被
    // 限制投放。这里机械禁止定时器出现在广告目录下。
    for (const file of ['AdUnit.tsx', 'InArticleAd.tsx']) {
      const rel = `src/components/Ad/${file}`;
      if (!ctx.existsRoot(rel)) {
        problems.push(`${rel} 不存在`);
        continue;
      }
      // 先剥掉注释再判断。AdUnit.tsx 的文档注释里写明了「不得使用
      // setInterval / setTimeout」，直接全文匹配会把这段政策说明本身误报为违规。
      if (/setInterval\s*\(|setTimeout\s*\(/.test(stripComments(ctx.readRoot(rel)))) {
        problems.push(`${rel} 含定时器，违反 AdSense 版位政策`);
      }
    }

    // 换页重建依赖 key 中携带 pathname。缺了它，SPA 换页后旧广告会留在原地——
    // 这正是需求 2 要解决的问题。
    const adUnit = ctx.existsRoot('src/components/Ad/AdUnit.tsx')
      ? ctx.readRoot('src/components/Ad/AdUnit.tsx')
      : '';
    if (!/key=\{`\$\{placement\}:\$\{pathname\}`\}/.test(adUnit)) {
      problems.push('AdUnit 未在 key 中携带 pathname，SPA 换页不会重建广告节点');
    }

    // ads.txt 必须原样保留
    if (!ctx.exists('ads.txt')) problems.push('构建产物缺少 ads.txt');
    else if (!ctx.read('ads.txt').includes('pub-9580076271637088')) {
      problems.push('ads.txt 的 publisher id 不正确');
    }

    // 广告脚本必须带 async。Docusaurus 把 scripts 的属性原样透传，不会自动补
    // async（见 @docusaurus/core 的 createBootstrapPlugin）。漏掉它就成了 head
    // 里的阻塞脚本，既拖慢 LCP，也因内容出现得晚而降低广告可见性评分。
    if (ctx.exists('index.html')) {
      const home = ctx.read('index.html');
      const tag = /<script[^>]*adsbygoogle\.js[^>]*>/i.exec(home);
      if (!tag) problems.push('首页未加载 adsbygoogle.js');
      else if (!/\basync\b/.test(tag[0])) problems.push('adsbygoogle.js 缺 async，会阻塞首屏渲染');
    }

    return problems;
  },
};
