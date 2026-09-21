import type { JSX } from 'react'
import React from 'react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import clsx from 'clsx'
import { SITE_DESCRIPTION } from '@site/siteMeta'
import styles from './index.module.css'

const FEATURES = [
  {
    emoji: '💎',
    title: 'Canvas',
    description:
      'Konva 是一个基于 Canvas 开发的 2d JavaScript 框架库, 它可以轻松的实现桌面应用和移动应用中的图形交互效果.',
  },
  {
    emoji: '🌈',
    title: '动画实现',
    description:
      'Konva 可以实现高性能动画, 过渡, 节点嵌套, 局部操作, 滤镜, 缓存, 事件等功能, 不仅仅适用于桌面与移动开发, 还有更为广泛的应用.',
  },
  {
    emoji: '🚀',
    title: '高性能',
    description:
      'Konva 允许在你舞台上绘图, 添加事件监听, 移动或缩放某个图形, 独立旋转, 以及高效的动画. 即使应用中含有数千个图形也是可以轻松实现的.',
  },
]

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  // description 用完整站点描述而非 tagline：tagline 只有 32 字符，作为搜索结果
  // 摘要过短，Google 通常会弃用并自行截取页面文字。
  return (
    <Layout title="Konva.js 中文文档" description={SITE_DESCRIPTION}>
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            Konva
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs/intro">
              开始
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/overview">
              教程
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FEATURES.map((f) => (
                <div key={f.title} className="col col--4">
                  <div className="text--center padding-horiz--md">
                    <div className={styles.featureEmoji}>{f.emoji}</div>
                    <Heading as="h3">{f.title}</Heading>
                    <p>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
