'use strict';

/**
 * 凭据未配置时只提示、不阻断——缺凭据不应挡住内容发布。
 * 但凭据「已配置却没生效」是真实的接线故障，必须报错：
 * 那种情况下站点所有者以为在收数据，实际一条都没有。
 */
function configured(v) {
  return v.length > 0 && !v.includes('PLACEHOLDER');
}

module.exports = {
  name: '分析与站长验证',
  run(ctx) {
    const problems = [];
    const cfg = ctx.readRoot('src/config/analytics.ts');

    const read = (name) => {
      const m = new RegExp(`${name} = '([^']*)'`).exec(cfg);
      return m ? m[1] : '';
    };
    const ga = read('GA4_MEASUREMENT_ID');
    const gsc = read('GSC_VERIFICATION_TOKEN');
    const baidu = read('BAIDU_VERIFICATION_TOKEN');

    const home = ctx.exists('index.html') ? ctx.read('index.html') : '';

    if (!configured(ga)) {
      console.log('          提示：GA4_MEASUREMENT_ID 仍为占位值，站点未接入流量分析');
    } else if (!home.includes(ga)) {
      problems.push(`GA4 ID ${ga} 已配置但未出现在首页 HTML 中`);
    }

    if (!configured(gsc)) {
      console.log('          提示：GSC_VERIFICATION_TOKEN 仍为占位值，未通过站长验证');
    } else if (!home.includes(gsc)) {
      problems.push('GSC 验证 token 已配置但未出现在首页 HTML 中');
    }

    if (configured(baidu) && !home.includes(baidu)) {
      problems.push('百度验证 token 已配置但未出现在首页 HTML 中');
    }

    return problems;
  },
};
