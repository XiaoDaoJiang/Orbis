import assert from 'node:assert/strict'
import { basename, resolve } from 'node:path'
import {
  dailyBriefSchema,
  presentationContentSchema,
  weeklyBriefSchema,
} from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'

const root = resolve(import.meta.dirname, '../..')
const briefDir = resolve(root, 'content/briefs')
const presentationDir = resolve(root, 'content/presentations')
const siteBase = '/Orbis'

const briefFiles = await listFiles(briefDir, ['.yaml', '.yml'])
let weekly: ReturnType<typeof weeklyBriefSchema.parse> | undefined
let weeklySlug: string | undefined
let daily: ReturnType<typeof dailyBriefSchema.parse> | undefined

for (const file of briefFiles) {
  const raw = await readYaml(file)
  const weeklyResult = weeklyBriefSchema.safeParse(raw)
  if (weeklyResult.success && weeklyResult.data.status === 'published') {
    weekly = weeklyResult.data
    weeklySlug = basename(file).replace(/\.(yaml|yml)$/, '')
  }

  const dailyResult = dailyBriefSchema.safeParse(raw)
  if (dailyResult.success && dailyResult.data.status === 'published') {
    daily ??= dailyResult.data
  }
}

assert.ok(weekly, 'weekly-v1 test requires one published Weekly')
assert.ok(weeklySlug)
assert.ok(daily, 'weekly-v1 test requires one published Daily for wrong-payload rejection')

const readingUrl = `${siteBase}/briefs/${weeklySlug}/`
const descriptor = toBriefPresentationDescriptor(weekly, { slug: weeklySlug, readingUrl })

let weeklyRenderer: typeof import('../../apps/slides/templates/weekly-v1.ts')
try {
  weeklyRenderer = await import('../../apps/slides/templates/weekly-v1.ts')
} catch (error) {
  assert.fail(`weekly-v1 renderer must exist: ${String(error)}`)
}

const registry = await import('../../apps/slides/templates/registry.ts')
const markdown = registry.renderPresentation(descriptor, { siteBase })
assert.equal(
  markdown,
  weeklyRenderer.renderWeeklyV1(weekly, { siteBase, readingHref: readingUrl }),
  'Registry must delegate weekly-v1 to the dedicated Weekly renderer',
)

const slideCount = (markdown.match(/^---$/gm) ?? []).length / 2
assert.equal(slideCount, weekly.sections.length + 5, 'weekly-v1 slide count must equal sections + 5')
assert.equal(slideCount, 8, 'Current real Weekly has 3 sections and must render exactly 8 slides')

for (const marker of ['ORBIS · WEEKLY', 'WEEKLY THESIS', 'TREND MOVEMENTS', 'NEXT PERIOD WATCH', 'REFERENCES']) {
  assert.ok(markdown.includes(marker), `Weekly presentation must contain semantic marker: ${marker}`)
}
for (const marker of ['FOUR SIGNALS', 'OPEN SOURCE RADAR', 'IMPACT × ADOPTION HORIZON', 'FROM SIGNALS TO ACTION']) {
  assert.ok(!markdown.includes(marker), `Weekly presentation must not contain Daily marker: ${marker}`)
}
assert.ok(markdown.includes(readingUrl), 'Weekly presentation must link to its Brief reading page')

const minWeekly = weeklyBriefSchema.parse({
  ...weekly,
  sections: weekly.sections.slice(0, 2),
})
const maxSections = Array.from({ length: 6 }, (_, index) => ({
  ...weekly.sections[index % weekly.sections.length],
  id: `weekly-max-${index + 1}`,
  title: `Weekly max section ${index + 1}`,
}))
const maxWeekly = weeklyBriefSchema.parse({ ...weekly, sections: maxSections })

const minMarkdown = weeklyRenderer.renderWeeklyV1(minWeekly, { siteBase, readingHref: readingUrl })
const maxMarkdown = weeklyRenderer.renderWeeklyV1(maxWeekly, { siteBase, readingHref: readingUrl })
assert.equal((minMarkdown.match(/^---$/gm) ?? []).length / 2, 7, 'Two Weekly sections must render 7 slides')
assert.equal((maxMarkdown.match(/^---$/gm) ?? []).length / 2, 11, 'Six Weekly sections must render 11 slides')

const unsafeWeekly = weeklyBriefSchema.parse({
  ...weekly,
  title: '<script>alert(1)</script> Safe Weekly title',
  summary: '<iframe src="https://example.com"></iframe> Safe Weekly summary.',
  weeklyThesis: '<script>alert(2)</script> Safe Weekly thesis remains sufficiently long.',
  trendMovements: weekly.trendMovements.map((movement, index) => index === 0
    ? {
        ...movement,
        summary: '<iframe src="https://example.com"></iframe> Safe trend summary.',
      }
    : movement),
})
const unsafeMarkdown = weeklyRenderer.renderWeeklyV1(unsafeWeekly, { siteBase, readingHref: readingUrl })
assert.doesNotMatch(unsafeMarkdown, /<script|<iframe/i, 'weekly-v1 must not emit raw executable HTML from content fields')
assert.match(unsafeMarkdown, /&lt;script&gt;/, 'weekly-v1 must HTML-escape script-like content')
assert.match(unsafeMarkdown, /&lt;iframe/, 'weekly-v1 must HTML-escape iframe-like content')

const presentationFiles = await listFiles(presentationDir, ['.yaml', '.yml'])
let talk: ReturnType<typeof presentationContentSchema.parse> | undefined
for (const file of presentationFiles) {
  const result = presentationContentSchema.safeParse(await readYaml(file))
  if (result.success && result.data.status === 'published') {
    talk = result.data
    break
  }
}
assert.ok(talk, 'weekly-v1 test requires one published standalone Talk for wrong-payload rejection')

assert.throws(
  () => registry.renderPresentation({ ...descriptor, readingUrl: undefined }, { siteBase }),
  /weekly-v1 requires readingUrl/,
  'weekly-v1 must require a Brief reading URL',
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, payload: daily }, { siteBase }),
  'weekly-v1 must reject a Daily payload',
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, payload: talk }, { siteBase }),
  'weekly-v1 must reject a standalone Talk payload',
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, template: 'unsupported-v1' }, { siteBase }),
  /Unsupported presentation template: unsupported-v1/,
  'existing unsupported-template behavior must remain unchanged',
)

console.log(`Weekly Presentation contract passed: ${weeklySlug}`)
