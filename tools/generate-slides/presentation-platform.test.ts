import assert from 'node:assert/strict'
import { basename, resolve } from 'node:path'
import { dailyBriefSchema } from '@orbis/content-schema'
import { renderDailyV1 } from '../../apps/slides/templates/daily-v1.ts'
import { listFiles, readYaml } from '../shared/content.ts'

const root = resolve(import.meta.dirname, '../..')
const sourceDir = resolve(root, 'content/briefs')

async function loadBriefSource() {
  try {
    return await import('./brief-source.ts')
  } catch (error) {
    assert.fail(`Expected Presentation Platform Brief adapter module to exist: ${String(error)}`)
  }
}

async function loadRegistry() {
  try {
    return await import('../../apps/slides/templates/registry.ts')
  } catch (error) {
    assert.fail(`Expected Presentation Platform Template Registry module to exist: ${String(error)}`)
  }
}

const files = await listFiles(sourceDir, ['.yaml', '.yml'])
let daily: ReturnType<typeof dailyBriefSchema.parse> | undefined
let slug: string | undefined

for (const file of files) {
  const result = dailyBriefSchema.safeParse(await readYaml(file))
  if (!result.success) continue
  if (result.data.status !== 'published' || !result.data.presentation.enabled) continue
  daily = result.data
  slug = basename(file).replace(/\.(yaml|yml)$/, '')
  break
}

assert.ok(daily, 'Presentation Platform test requires one published daily-v1 Brief')
assert.ok(slug)

const siteBase = '/Orbis'
const readingUrl = `${siteBase}/briefs/${slug}/`
const briefSource = await loadBriefSource()
const registry = await loadRegistry()

assert.equal(typeof briefSource.toBriefPresentationDescriptor, 'function', 'Brief adapter must export toBriefPresentationDescriptor')
assert.equal(typeof registry.renderPresentation, 'function', 'Template Registry must export renderPresentation')

const descriptor = briefSource.toBriefPresentationDescriptor(daily, { slug, readingUrl })

assert.equal(descriptor.id, slug)
assert.equal(descriptor.slug, slug)
assert.equal(descriptor.title, daily.title)
assert.equal(descriptor.publishedAt, daily.publishedAt)
assert.deepEqual(descriptor.topics, daily.topics)
assert.equal(descriptor.template, 'daily-v1')
assert.equal(descriptor.sourceKind, 'brief')
assert.equal(descriptor.readingUrl, readingUrl)
assert.equal(descriptor.payload, daily)

assert.equal(
  registry.renderPresentation(descriptor, { siteBase }),
  renderDailyV1(daily, { siteBase, readingHref: readingUrl }),
  'Registry rendering must preserve the existing daily-v1 Markdown output exactly',
)

assert.throws(
  () => registry.renderPresentation({ ...descriptor, template: 'unsupported-v1' }, { siteBase }),
  /Unsupported presentation template: unsupported-v1/,
)

assert.throws(
  () => registry.renderPresentation({ ...descriptor, readingUrl: undefined }, { siteBase }),
  /daily-v1 requires readingUrl/,
)

console.log(`Presentation Platform contract passed for daily-v1: ${slug}`)
