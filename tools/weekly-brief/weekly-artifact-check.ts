import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, dailyBriefSchema, weeklyBriefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)
const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])

const daily: Array<{ slug: string; brief: ReturnType<typeof dailyBriefSchema.parse> }> = []
const weekly: Array<{ slug: string; brief: ReturnType<typeof weeklyBriefSchema.parse> }> = []

for (const file of briefFiles) {
  const parsed = briefSchema.parse(await readYaml(file))
  if (parsed.status !== 'published') continue
  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  if (parsed.cadence === 'daily') daily.push({ slug, brief: dailyBriefSchema.parse(parsed) })
  if (parsed.cadence === 'weekly') weekly.push({ slug, brief: weeklyBriefSchema.parse(parsed) })
}

daily.sort((left, right) => right.brief.publishedAt.localeCompare(left.brief.publishedAt) || left.slug.localeCompare(right.slug))
weekly.sort((left, right) => right.brief.publishedAt.localeCompare(left.brief.publishedAt) || left.slug.localeCompare(right.slug))

const latestDaily = daily[0]
const latestWeekly = weekly[0]
assert.ok(latestDaily, 'Weekly artifact check requires one published Daily')
assert.ok(latestWeekly, 'Weekly artifact check requires one published Weekly')

const latestBrief = [...daily, ...weekly]
  .sort((left, right) => right.brief.publishedAt.localeCompare(left.brief.publishedAt) || left.slug.localeCompare(right.slug))[0]
assert.ok(latestBrief, 'Weekly artifact check requires one published Brief')

const weeklyReadingPath = resolve(root, `dist/site/briefs/${latestWeekly.slug}/index.html`)
const weeklyGeneratedPath = resolve(root, `${config.presentation.generatedDir}/${latestWeekly.slug}/slides.md`)
const weeklyDeckPath = resolve(root, `dist/site/slides/${latestWeekly.slug}/index.html`)
const homePath = resolve(root, 'dist/site/index.html')
const briefsPath = resolve(root, 'dist/site/briefs/index.html')
const weeklyIndexPath = resolve(root, 'dist/site/briefs/weekly/index.html')
const archivePath = resolve(root, 'dist/site/archive/index.html')
const rssPath = resolve(root, 'dist/site/rss.xml')
const slidesPath = resolve(root, 'dist/site/slides/index.html')
const latestPath = resolve(root, 'dist/site/latest/index.html')
const archiveJsonPath = resolve(root, 'dist/site/archive.json')

for (const path of [weeklyReadingPath, weeklyGeneratedPath, weeklyDeckPath, homePath, briefsPath, weeklyIndexPath, archivePath, rssPath, slidesPath, latestPath, archiveJsonPath]) {
  await access(path)
}

const weeklyReading = await readFile(weeklyReadingPath, 'utf8')
const weeklyMarkdown = await readFile(weeklyGeneratedPath, 'utf8')
const weeklyDeck = await readFile(weeklyDeckPath, 'utf8')
const home = await readFile(homePath, 'utf8')
const briefsIndex = await readFile(briefsPath, 'utf8')
const weeklyIndex = await readFile(weeklyIndexPath, 'utf8')
const archive = await readFile(archivePath, 'utf8')
const rss = await readFile(rssPath, 'utf8')
const slides = await readFile(slidesPath, 'utf8')
const latest = await readFile(latestPath, 'utf8')
const archiveJson = JSON.parse(await readFile(archiveJsonPath, 'utf8')) as {
  latest: string
  issues: Array<{ date: string; title: string; path: string; topics: string[] }>
}

for (const marker of ['period', 'thesis', 'trends', 'sections', 'watch', 'references']) {
  assert.ok(
    weeklyReading.includes(`data-weekly-section="${marker}"`),
    `Weekly reading page must expose semantic section marker: ${marker}`,
  )
}
for (const movement of latestWeekly.brief.trendMovements) {
  assert.ok(weeklyReading.includes(`data-trend-direction="${movement.direction}"`), `Weekly reading must expose trend direction ${movement.direction}`)
  assert.ok(weeklyReading.includes(`data-trend-topic="${movement.topic}"`), `Weekly reading must expose trend topic ${movement.topic}`)
}
assert.ok(weeklyReading.includes(latestWeekly.brief.period.from), 'Weekly reading must show period.from')
assert.ok(weeklyReading.includes(latestWeekly.brief.period.to), 'Weekly reading must show period.to')
assert.ok(!weeklyReading.includes('Four signals'), 'Weekly reading page must not reuse Daily Four signals semantics')
assert.ok(!weeklyReading.includes('From signals to action'), 'Weekly reading page must not reuse Daily action semantics')
assert.doesNotMatch(weeklyReading, /data-adjacent=["']previous["']/, 'Weekly reading must not expose Daily previous adjacency')
assert.doesNotMatch(weeklyReading, /data-adjacent=["']next["']/, 'Weekly reading must not expose Daily next adjacency')

const weeklyReadingHref = `${joinBasePath(siteBase, 'briefs', latestWeekly.slug)}/`
const weeklySlidesHref = `${joinBasePath(siteBase, 'slides', latestWeekly.slug)}/`
assert.ok(weeklyReading.includes(weeklySlidesHref), 'Weekly Reading must link to Weekly Slides')
assert.ok(weeklyMarkdown.includes(weeklyReadingHref), 'Weekly generated presentation must link back to Weekly Reading')
for (const marker of ['ORBIS · WEEKLY', 'WEEKLY THESIS', 'TREND MOVEMENTS', 'NEXT PERIOD WATCH', 'REFERENCES']) {
  assert.ok(weeklyMarkdown.includes(marker), `Weekly generated presentation must contain marker: ${marker}`)
}
for (const marker of ['FOUR SIGNALS', 'OPEN SOURCE RADAR', 'IMPACT × ADOPTION HORIZON', 'FROM SIGNALS TO ACTION']) {
  assert.ok(!weeklyMarkdown.includes(marker), `Weekly generated presentation must not contain Daily marker: ${marker}`)
}
assert.ok(weeklyDeck.includes(weeklySlidesHref), `Weekly built deck must reference its own base path: ${weeklySlidesHref}`)

assert.ok(
  home.includes(`data-home-id="brief:${latestBrief.slug}"`),
  `Homepage Latest Brief must follow publishedAt ordering across Daily and Weekly: ${latestBrief.slug}`,
)
assert.ok(briefsIndex.includes(latestWeekly.brief.title), 'Briefs index must include the published Weekly')
assert.ok(weeklyIndex.includes(latestWeekly.brief.title), 'Weekly index must include the published Weekly')
assert.ok(archive.includes(latestWeekly.brief.title), 'Archive must include the published Weekly')
assert.ok(archive.includes('data-cadence="weekly"'), 'Archive must preserve Weekly cadence metadata')
assert.ok(rss.includes(`/briefs/${latestWeekly.slug}/`), 'RSS must include the Weekly reading URL')
assert.ok(!rss.includes(`/slides/${latestWeekly.slug}/`), 'RSS must keep Weekly identity on the Reading URL rather than the Slides URL')

for (const topic of latestWeekly.brief.topics) {
  const topicHtml = await readFile(resolve(root, `dist/site/topics/${topic}/index.html`), 'utf8')
  assert.ok(topicHtml.includes(latestWeekly.brief.title), `Topic ${topic} must include the published Weekly`)
}

assert.ok(slides.includes(latestWeekly.brief.title), 'Slides discovery must include the presentation-enabled Weekly')
assert.ok(slides.includes(`data-presentation-id="${latestWeekly.slug}"`), 'Slides discovery must expose the Weekly presentation id')
assert.ok(slides.includes('data-presentation-source="brief"'), 'Slides discovery must expose Brief source metadata')
assert.ok(slides.includes(`Brief presentation · weekly · ${latestWeekly.brief.publishedAt}`), 'Slides discovery must expose Weekly cadence metadata')

assert.equal(archiveJson.latest, latestDaily.brief.publishedAt, 'archive.json.latest must remain the newest Daily date')
assert.ok(!archiveJson.issues.some((issue) => issue.title === latestWeekly.brief.title), 'archive.json issues must remain Daily-only')
assert.ok(!archiveJson.issues.some((issue) => issue.date === latestWeekly.brief.publishedAt), 'Weekly publishedAt must not enter Daily archive issues')
const expectedDailyIssues = daily.map(({ brief }) => brief.publishedAt).sort((left, right) => right.localeCompare(left))
assert.deepEqual(archiveJson.issues.map((issue) => issue.date), expectedDailyIssues, 'archive.json issues must map exactly to published Daily dates')

const dailyStablePath = latestDaily.brief.publishedAt.replaceAll('-', '/')
const expectedLatestTarget = `${joinBasePath(siteBase, dailyStablePath)}/`
assert.ok(latest.includes(expectedLatestTarget), `/latest/ must remain on the newest Daily stable route: ${expectedLatestTarget}`)

console.log(`Weekly reading + presentation contract passed: ${latestWeekly.slug}`)
console.log(`Weekly discovery contract passed: Briefs/Weekly/Archive/RSS/Topics/Slides include ${latestWeekly.slug}`)
console.log(`Homepage latest Brief ordering passed: ${latestBrief.slug}`)
console.log(`Daily latest isolation passed: Weekly=${latestWeekly.brief.publishedAt}, Daily latest=${latestDaily.brief.publishedAt}`)
