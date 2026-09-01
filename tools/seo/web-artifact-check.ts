import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, essaySchema, knowledgeSchema } from '@orbis/content-schema'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'
import {
  isPreviewRuntime,
  loadSiteConfig,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()

function expectFragment(html: string, fragment: string, message: string) {
  assert.ok(html.includes(fragment), `${message}\nExpected fragment: ${fragment}`)
}

async function firstPublishedEssay() {
  for (const file of await listFiles(resolve(root, 'content/essays'), ['.md', '.mdx'])) {
    const { data } = await readMarkdownFrontmatter(file)
    const parsed = essaySchema.parse(data)
    if (parsed.status === 'published') {
      return { id: basename(file).replace(/\.(md|mdx)$/, ''), data: parsed }
    }
  }
  throw new Error('SEO contract requires one published Essay')
}

async function firstPublishedBrief() {
  for (const file of await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])) {
    const parsed = briefSchema.parse(await readYaml(file))
    if (parsed.status === 'published') {
      return { id: basename(file).replace(/\.(yaml|yml)$/, ''), data: parsed }
    }
  }
  throw new Error('SEO contract requires one published Brief')
}

async function firstPublicKnowledge() {
  for (const file of await listFiles(resolve(root, 'content/knowledge'), ['.md', '.mdx'])) {
    const { data } = await readMarkdownFrontmatter(file)
    const parsed = knowledgeSchema.parse(data)
    if (parsed.status === 'published' || parsed.status === 'active') {
      return { id: basename(file).replace(/\.(md|mdx)$/, ''), data: parsed }
    }
  }
  throw new Error('SEO contract requires one public Knowledge entry')
}

const essay = await firstPublishedEssay()
const brief = await firstPublishedBrief()
const knowledge = await firstPublicKnowledge()

const samples = [
  {
    path: '/',
    file: 'index.html',
    html: await readFile(resolve(root, 'dist/web/index.html'), 'utf8'),
    type: 'website',
  },
  {
    path: `/essays/${essay.id}/`,
    file: `essays/${essay.id}/index.html`,
    html: await readFile(resolve(root, `dist/web/essays/${essay.id}/index.html`), 'utf8'),
    type: 'article',
  },
  {
    path: `/briefs/${brief.id}/`,
    file: `briefs/${brief.id}/index.html`,
    html: await readFile(resolve(root, `dist/web/briefs/${brief.id}/index.html`), 'utf8'),
    type: 'article',
  },
  {
    path: `/knowledge/${knowledge.id}/`,
    file: `knowledge/${knowledge.id}/index.html`,
    html: await readFile(resolve(root, `dist/web/knowledge/${knowledge.id}/index.html`), 'utf8'),
    type: 'article',
  },
]

for (const sample of samples) {
  const canonical = productionSiteUrl(config, sample.path)
  const share = runtimeSiteUrl(config, sample.path)
  const image = runtimeSiteUrl(config, config.site.defaultSocialImage)
  const robots = isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'

  expectFragment(sample.html, `<link rel="canonical" href="${canonical}">`, `${sample.file} must have Production canonical`)
  expectFragment(sample.html, `<meta name="robots" content="${robots}">`, `${sample.file} must have runtime robots policy`)
  expectFragment(sample.html, `<meta property="og:url" content="${share}">`, `${sample.file} must have runtime og:url`)
  expectFragment(sample.html, `<meta property="og:type" content="${sample.type}">`, `${sample.file} must have correct og:type`)
  expectFragment(sample.html, `<meta property="og:image" content="${image}">`, `${sample.file} must have runtime social image`)
  expectFragment(sample.html, '<meta name="twitter:card" content="summary_large_image">', `${sample.file} must have Twitter Card`)
}

const png = await readFile(resolve(root, 'dist/web/social/orbis-default.png'))
assert.equal(png.toString('ascii', 1, 4), 'PNG', 'Social image must be a PNG')
assert.equal(png.readUInt32BE(16), 1200, 'Social image width must be 1200')
assert.equal(png.readUInt32BE(20), 630, 'Social image height must be 630')

console.log('Web SEO artifact contract passed')
