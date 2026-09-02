import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { discoverPresentationDescriptors } from '../generate-slides/discover-presentations.ts'
import { listFiles, readYaml } from '../shared/content.ts'
import {
  isPreviewRuntime,
  loadSiteConfig,
  productionSiteUrl,
  runtimeSiteBase,
} from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)
const robots = isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'

function expectFragment(html: string, fragment: string, message: string) {
  assert.ok(html.includes(fragment), `${message}\nExpected fragment: ${fragment}`)
}

const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
assert.ok(descriptors.length > 0, 'SEO site contract requires at least one public Presentation')

for (const descriptor of descriptors) {
  const html = await readFile(resolve(root, `dist/site/${config.presentation.publicPath}/${descriptor.slug}/index.html`), 'utf8')
  const canonical = descriptor.sourceKind === 'brief'
    ? productionSiteUrl(config, `/briefs/${descriptor.slug}/`)
    : productionSiteUrl(config, `/${config.presentation.publicPath}/${descriptor.slug}/`)

  expectFragment(html, `<link rel="canonical" href="${canonical}">`, `Slide ${descriptor.slug} must have canonical identity`)
  expectFragment(html, `<meta name="robots" content="${robots}">`, `Slide ${descriptor.slug} must have runtime robots policy`)
}

const daily: Array<{ slug: string; publishedAt: string; presentationEnabled: boolean }> = []
for (const file of await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published' || brief.cadence !== 'daily') continue
  daily.push({
    slug: basename(file).replace(/\.(yaml|yml)$/, ''),
    publishedAt: brief.publishedAt,
    presentationEnabled: brief.presentation.enabled,
  })
}

daily.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
assert.ok(daily.length > 0, 'SEO site contract requires one published Daily')

for (const entry of daily) {
  const aliasPath = entry.publishedAt.replaceAll('-', '/')
  const html = await readFile(resolve(root, `dist/site/${aliasPath}/index.html`), 'utf8')
  const canonical = productionSiteUrl(config, `/briefs/${entry.slug}/`)
  expectFragment(html, `<link rel="canonical" href="${canonical}">`, `Daily alias ${entry.publishedAt} must canonicalize to Reading`)
  expectFragment(html, `<meta name="robots" content="${robots}">`, `Daily alias ${entry.publishedAt} must have runtime robots policy`)

  if (entry.presentationEnabled) {
    expectFragment(html, `/${config.presentation.publicPath}/${entry.slug}/`, `Daily alias ${entry.publishedAt} must preserve its Slides redirect target`)
  }
}

const latest = daily[0]
const latestHtml = await readFile(resolve(root, 'dist/site/latest/index.html'), 'utf8')
expectFragment(latestHtml, `<link rel="canonical" href="${productionSiteUrl(config, `/briefs/${latest.slug}/`)}">`, '/latest/ must canonicalize to latest Daily Reading')
expectFragment(latestHtml, `<meta name="robots" content="${robots}">`, '/latest/ must have runtime robots policy')

console.log('Assembled SEO canonical contract passed')
