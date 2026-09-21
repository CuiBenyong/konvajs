/**
 * 站点分析与站长验证凭据。
 *
 * 这三个值由站点所有者从各平台后台获取。占位值保持原样时，站点仍可正常
 * 构建与上线，只是不会上报数据、不会通过站长验证。verify 会以提示形式
 * 告知，但不阻断构建——凭据缺失不应挡住内容更新的发布。
 *
 * 拿到真值后只改这个文件，不需要动 docusaurus.config.ts。
 */

/** Google Analytics 4 衡量 ID，形如 G-XXXXXXXXXX。 */
export const GA4_MEASUREMENT_ID = 'G-PLACEHOLDER'

/**
 * Google Search Console 的 HTML 标记验证 token（meta 标签的 content 值）。
 *
 * 2026-09-21 站点迁到 konva-doc-cn 子域之后，要验证的是**子域那个资源**
 * （konva-doc-cn.front-end-js.top），不是主域。两者在 GSC 里是不同的资源，
 * token 也不同；填错了会一直验证不过。
 */
export const GSC_VERIFICATION_TOKEN = 'GSC-PLACEHOLDER'

/** 百度站长平台的验证 token。留空表示不接入。 */
export const BAIDU_VERIFICATION_TOKEN = ''

/** 判断某个凭据是否已经填入真值。 */
export function isConfigured(value: string): boolean {
  return value.length > 0 && !value.includes('PLACEHOLDER')
}
