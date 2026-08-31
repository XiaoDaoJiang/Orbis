import assert from 'node:assert/strict'
import { access, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { stringify } from 'yaml'
import { dailyBriefSchema, presentationContentSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig, joinBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const briefSourceDir = resolve(root, config.content.briefsDir)
const presentationSourceDir = resolve(root, config.content.presentationsDir)
const generatedRoot = resolve(root, config.presentation.generatedDir)
const futureDailySlug = 'zz-orbis-multi-presentation-check'
const futureDailyPath = resolve(briefSourceDir, `${futureDailySlug}.yaml`)
const futureDailyDate = '2099-12-31'
const futureDailyStablePath = '2099/12/31'
const nonPublicBriefSlug = 'zz-orbis-non-public-relation-check'
const nonPublicBriefPath = resolve(briefSourceDir, `${nonPublicBriefSlug}.yaml`)
const nonPublicPresentationSlug = 'zz-orbis-non-public-presentation-check'
const nonPublicPresentationPath = resolve(presentationSourceDir, `${nonPublicPresentationSlug}.yaml`)
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

async function run(script: string) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(pnpm, [script], { cwd: root, stdio: 'inherit', env: process.env })
    child.once('error', reject)
    child.once('exit', (code) => code === 0
      ? resolvePromise()
      : reject(new Error(`Command failed with exit code ${code}: pnpm ${script}`)))
  })
}

async function runExpectFailure(script: string): Promise<string> {
  return await new Promise<string>((resolvePromise, reject) => {
    const child = spawn(pnpm, [script], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk) => { output += chunk.toString() })
    child.once('error', reject)
    child.once('exit', (code) => code === 0
      ? reject(new Error(`Expected command to fail: pnpm ${script}`))
      : resolvePromise(output))
  })
}

async function assertMissing(path: string, message: string) {
  try {
    await access(path)
    assert.fail(message)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

const briefFiles = await listFiles(briefSourceDir, ['.yaml', '.yml'])
let dailySeed: ReturnType<typeof dailyBriefSchema.parse> | undefined
let dailySeedSlug: string | undefined

for (const file of briefFiles) {
  const result = dailyBriefSchema.safeParse(await readYaml(file))
  if (!result.success) continue
  if (result.data.status !== 'published' || !result.data.presentation.enabled) continue
  dailySeed = result.data
  dailySeedSlug = basename(file).replace(/\.(yaml|yml)$/, '')
  break
}

assert.ok(dailySeed, 'Multi-presentation check requires one published daily-v1 presentation as a seed')
assert.ok(dailySeedSlug)

const presentationFiles = await listFiles(presentationSourceDir, ['.yaml', '.yml'])
let talkSeed: ReturnType<typeof presentationContentSchema.parse> | undefined
let talkSeedSlug: string | undefined

for (const file of presentationFiles) {
  const result = presentationContentSchema.safeParse(await readYaml(file))
  if (!result.success || result.data.status !== 'published') continue
  talkSeed = result.data
  talkSeedSlug = basename(file).replace(/\.(yaml|yml)$/, '')
  break
}

assert.ok(talkSeed, 'Multi-presentation check requires one published standalone talk-v1 presentation as a seed')
assert.ok(talkSeedSlug)

const duplicatePath = resolve(presentationSourceDir, `${dailySeedSlug}.yaml`)
const duplicateFixture = {
  ...talkSeed,
  title: 'Orbis duplicate presentation slug fixture',
  summary: 'Ephemeral fixture proving duplicate slugs across Brief and standalone Presentation sources fail before generated output is written.',
}
presentationContentSchema.parse(duplicateFixture)

await assertMissing(duplicatePath, `Refusing to overwrite duplicate-slug fixture path: ${duplicatePath}`)
await rm(generatedRoot, { recursive: true, force: true })
await writeFile(duplicatePath, stringify(duplicateFixture), 'utf8')
try {
  const failure = await runExpectFailure('generate:slides')
  assert.match(failure, new RegExp(`Duplicate presentation slug: ${dailySeedSlug}`))
  await assertMissing(generatedRoot, 'Duplicate slug failure must happen before generated source output is written')
  console.log(`Duplicate presentation slug gate passed: ${dailySeedSlug}`)
} finally {
  await rm(duplicatePath, { force: true })
}

const futureDailyFixture = {
  ...dailySeed,
  publishedAt: futureDailyDate,
  title: 'Orbis future Daily integration fixture',
  summary: 'Ephemeral CI fixture preserving future Daily promotion coverage while Daily and standalone Talk decks build through one Presentation Platform.',
}
const nonPublicBriefFixture = {
  ...dailySeed,
  publishedAt: '2098-12-30',
  status: 'needs-review' as const,
  title: 'Orbis non-public related content fixture',
  summary: 'Ephemeral CI fixture proving that non-public Briefs with overlapping Topics never leak into reading pages, Related Content, or generated decks.',
}
const nonPublicPresentationFixture = {
  ...talkSeed,
  publishedAt: '2100-01-01',
  status: 'needs-review' as const,
  title: 'Orbis non-public standalone presentation fixture',
  summary: 'Ephemeral CI fixture proving a newer non-public standalone Presentation never generates a deck or enters public Presentation discovery.',
}

dailyBriefSchema.parse(futureDailyFixture)
dailyBriefSchema.parse(nonPublicBriefFixture)
presentationContentSchema.parse(nonPublicPresentationFixture)

await assertMissing(futureDailyPath, `Refusing to overwrite existing fixture path: ${futureDailyPath}`)
await assertMissing(nonPublicBriefPath, `Refusing to overwrite existing fixture path: ${nonPublicBriefPath}`)
await assertMissing(nonPublicPresentationPath, `Refusing to overwrite existing fixture path: ${nonPublicPresentationPath}`)

await writeFile(futureDailyPath, stringify(futureDailyFixture), 'utf8')
await writeFile(nonPublicBriefPath, stringify(nonPublicBriefFixture), 'utf8')
await writeFile(nonPublicPresentationPath, stringify(nonPublicPresentationFixture), 'utf8')
console.log(`Created ephemeral future Daily fixture: ${futureDailySlug}`)
console.log(`Created ephemeral non-public Brief fixture: ${nonPublicBriefSlug}`)
console.log(`Created ephemeral non-public standalone Presentation fixture: ${nonPublicPresentationSlug}`)

try {
  await run('generate:slides')
  await run('build:web')
  await run('build:slides')
  await run('assemble')
  await run('test:site')

  const seedBrief = resolve(root, `dist/site/briefs/${dailySeedSlug}/index.html`)
  const seedDailyDeck = resolve(root, `dist/site/slides/${dailySeedSlug}/index.html`)
  const talkDeck = resolve(root, `dist/site/slides/${talkSeedSlug}/index.html`)
  const talkSource = resolve(generatedRoot, talkSeedSlug, 'slides.md')
  const futureDailyBrief = resolve(root, `dist/site/briefs/${futureDailySlug}/index.html`)
  const futureDailyDeck = resolve(root, `dist/site/slides/${futureDailySlug}/index.html`)
  const futureDailySource = resolve(generatedRoot, futureDailySlug, 'slides.md')
  const futureDailyStable = resolve(root, `dist/site/${futureDailyStablePath}/index.html`)
  const nonPublicBrief = resolve(root, `dist/site/briefs/${nonPublicBriefSlug}/index.html`)
  const nonPublicBriefSource = resolve(generatedRoot, nonPublicBriefSlug, 'slides.md')
  const nonPublicPresentationSource = resolve(generatedRoot, nonPublicPresentationSlug, 'slides.md')
  const nonPublicPresentationDeck = resolve(root, `dist/site/slides/${nonPublicPresentationSlug}/index.html`)
  const latestPath = resolve(root, 'dist/site/latest/index.html')
  const archivePath = resolve(root, 'dist/site/archive.json')
  const slidesIndexPath = resolve(root, 'dist/site/slides/index.html')
  const homePath = resolve(root, 'dist/site/index.html')

  await access(seedBrief)
  await access(seedDailyDeck)
  await access(talkDeck)
  await access(talkSource)
  await access(futureDailyBrief)
  await access(futureDailyDeck)
  await access(futureDailySource)
  await access(futureDailyStable)
  await access(latestPath)
  await access(archivePath)
  await access(slidesIndexPath)
  await access(homePath)
  await assertMissing(nonPublicBrief, 'needs-review Brief must not have a public reading page')
  await assertMissing(nonPublicBriefSource, 'needs-review Brief must not generate a presentation source')
  await assertMissing(nonPublicPresentationSource, 'needs-review standalone Presentation must not generate a presentation source')
  await assertMissing(nonPublicPresentationDeck, 'needs-review standalone Presentation must not have a public deck')

  const siteBase = runtimeSiteBase(config)
  const expectedFutureDailyDeckBase = `${joinBasePath(siteBase, config.presentation.publicPath, futureDailySlug)}/`
  const expectedTalkDeckBase = `${joinBasePath(siteBase, config.presentation.publicPath, talkSeedSlug)}/`
  const seedHtml = await readFile(seedBrief, 'utf8')
  const futureDailyDeckHtml = await readFile(futureDailyDeck, 'utf8')
  const talkDeckHtml = await readFile(talkDeck, 'utf8')
  const talkMarkdown = await readFile(talkSource, 'utf8')
  const stableHtml = await readFile(futureDailyStable, 'utf8')
  const latestHtml = await readFile(latestPath, 'utf8')
  const slidesIndexHtml = await readFile(slidesIndexPath, 'utf8')
  const homeHtml = await readFile(homePath, 'utf8')
  const archive = JSON.parse(await readFile(archivePath, 'utf8')) as {
    latest?: string
    issues?: Array<{ date?: string; path?: string }>
  }

  assert.ok(futureDailyDeckHtml.includes(expectedFutureDailyDeckBase), `Future Daily deck must reference its own base path: ${expectedFutureDailyDeckBase}`)
  assert.ok(talkDeckHtml.includes(expectedTalkDeckBase), `Standalone Talk must reference its own base path: ${expectedTalkDeckBase}`)
  assert.match(talkMarkdown, /REFERENCES/)
  assert.ok(slidesIndexHtml.includes(`data-presentation-id="${talkSeedSlug}"`), 'Slides discovery must include the published standalone Talk')
  assert.ok(slidesIndexHtml.includes('data-presentation-source="presentation"'), 'Slides discovery must expose standalone source metadata')
  assert.ok(!slidesIndexHtml.includes(nonPublicPresentationFixture.title), 'Slides discovery must exclude non-public standalone Presentations')
  assert.ok(!homeHtml.includes(nonPublicPresentationFixture.title), 'Homepage must exclude non-public standalone Presentations even when newer')

  assert.ok(stableHtml.includes(expectedFutureDailyDeckBase), `Stable Daily route must redirect to future Daily deck: ${expectedFutureDailyDeckBase}`)
  assert.equal(archive.latest, futureDailyDate, 'A newer published Daily must promote archive.latest')
  assert.ok(archive.issues?.some((issue) => issue.date === futureDailyDate && issue.path === `${futureDailyStablePath}/`), 'Structured archive must include the future Daily fixture')

  const expectedLatestTarget = `${joinBasePath(siteBase, futureDailyStablePath)}/`
  assert.ok(latestHtml.includes(expectedLatestTarget), `/latest/ must advance to ${expectedLatestTarget}`)
  assert.ok(!seedHtml.includes(nonPublicBriefFixture.title), 'needs-review Brief title must not leak into a public reading page')
  assert.ok(!seedHtml.includes(`data-related-id="brief:${nonPublicBriefSlug}"`), 'needs-review Brief must not leak into Related Content')

  console.log(`Mixed Presentation integration passed: Daily=${dailySeedSlug}, Talk=${talkSeedSlug}, future Daily=${futureDailySlug}`)
  console.log(`Future Daily promotion check passed: latest=${futureDailyDate}, stable=/${futureDailyStablePath}/`)
  console.log(`Non-public source exclusion passed: Brief=${nonPublicBriefSlug}, Presentation=${nonPublicPresentationSlug}`)
} finally {
  await rm(futureDailyPath, { force: true })
  await rm(nonPublicBriefPath, { force: true })
  await rm(nonPublicPresentationPath, { force: true })
  await rm(generatedRoot, { recursive: true, force: true })
  await rm(resolve(root, 'dist'), { recursive: true, force: true })
  console.log('Cleaned ephemeral mixed-source fixtures and artifacts')
}
