import assert from 'node:assert/strict'
import type { SiteConfig } from '../shared/site-config.ts'
import {
  absoluteSiteUrl,
  isPreviewRuntime,
  normalizeSiteOrigin,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../shared/site-config.ts'

const config: SiteConfig = {
  version: 1,
  site: {
    name: 'Orbis',
    origin: 'https://xiaodaojiang.github.io',
    basePath: '/Orbis',
    locale: 'zh-CN',
    defaultTitle: 'Orbis',
    defaultDescription: 'Essays, briefs, slides, topics and durable knowledge.',
    defaultSocialImage: '/social/orbis-default.png',
    brandName: 'Orbis',
  },
  content: {
    briefsDir: 'content/briefs',
    presentationsDir: 'content/presentations',
  },
  presentation: {
    generatedDir: 'apps/slides/generated',
    outputDir: 'dist/slides',
    publicPath: 'slides',
  },
  preview: {
    provider: 'raw.githack',
    origin: 'https://raw.githack.com',
    repositoryPath: '/XiaoDaoJiang/Orbis',
    branchPrefix: 'preview-pr-',
  },
}

assert.equal(
  normalizeSiteOrigin('https://xiaodaojiang.github.io/'),
  'https://xiaodaojiang.github.io',
)
assert.equal(
  absoluteSiteUrl(config.site.origin, config.site.basePath, '/briefs/example/'),
  'https://xiaodaojiang.github.io/Orbis/briefs/example/',
)
assert.equal(
  absoluteSiteUrl(config.site.origin, config.site.basePath, '/sitemap.xml'),
  'https://xiaodaojiang.github.io/Orbis/sitemap.xml',
)
assert.equal(
  productionSiteUrl(config, '/briefs/example/'),
  'https://xiaodaojiang.github.io/Orbis/briefs/example/',
)

const oldOrigin = process.env.SITE_ORIGIN
const oldBase = process.env.SITE_BASE
process.env.SITE_ORIGIN = 'https://raw.githack.com'
process.env.SITE_BASE = '/XiaoDaoJiang/Orbis/preview-pr-50'
try {
  assert.equal(isPreviewRuntime(config), true)
  assert.equal(
    runtimeSiteUrl(config, '/briefs/example/'),
    'https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-50/briefs/example/',
  )
  assert.equal(
    productionSiteUrl(config, '/briefs/example/'),
    'https://xiaodaojiang.github.io/Orbis/briefs/example/',
  )
} finally {
  if (oldOrigin === undefined) delete process.env.SITE_ORIGIN
  else process.env.SITE_ORIGIN = oldOrigin
  if (oldBase === undefined) delete process.env.SITE_BASE
  else process.env.SITE_BASE = oldBase
}

assert.throws(() => normalizeSiteOrigin('ftp://example.com'), /HTTP\(S\)/)
assert.throws(() => normalizeSiteOrigin('/relative'), /absolute HTTP\(S\)/)

console.log('SEO URL contract passed')
