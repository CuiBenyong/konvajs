import { defineConfig } from 'dumi';

export default defineConfig({
  favicons: ['https://cdn.jsdelivr.net/gh/CuiBenyong/resources@main/images/konva.png'],
  autoAlias: false,
  themeConfig: {
    name: 'Konva.js',
    logo: 'https://cdn.jsdelivr.net/gh/CuiBenyong/resources@main/images/konva.png',
    prefersColor: { default: 'auto' },
    socialLinks: {
      github: 'https://github.com/CuiBenyong/konvajs'
    },
    hd: { rules: [] },
    footer: 'Made with ❤️ by <a href="https://github.com/CuiBenyong/konvajs" target="_blank" nofollow>Konva.js 中文文档</a>'
  },
  theme: {
    '@c-primary': '#4078c0',
  },
  publicPath: '/',
  analytics: {
    // TODO 替换为新的的 Google Analytics 代码
    // ga_v2: '',
  },
  sitemap: {
    hostname: 'https://front-end-js.top',
  },
  hash: true,
  exportStatic: {},
  // ...(process.env.NODE_ENV === 'development' ? {} : { ssr: {} }),
  headScripts: [
    {
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9580076271637088',
      async: true,
      crossorigin: 'anonymous',
    },
  ],
});