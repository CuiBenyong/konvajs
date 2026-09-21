/**
 * 站点级常量的唯一来源。
 *
 * 不放在 docusaurus.config.ts 里导出——Docusaurus 会校验配置模块的导出字段，
 * 任何非配置项的具名导出都会让构建直接失败（"These field(s) are not recognized"）。
 * 放在独立模块里，配置与 plugins/ 下的插件都从这里取值，避免同一个地址
 * 在多处重复硬编码后失去同步。
 */

export const SITE_URL = 'https://front-end-js.top'

export const SITE_DESCRIPTION =
  'Konva.js 中文文档。Konva 是基于 HTML5 Canvas 的 2D JavaScript 框架，支持图形绘制、事件、拖拽、变换、动画、滤镜与高性能缓存，适用于桌面与移动端的交互式图形应用。'
