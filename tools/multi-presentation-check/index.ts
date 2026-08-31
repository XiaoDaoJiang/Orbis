import assert from 'node:assert/strict'
import { access, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { stringify } from 'yaml'
import { dailyBriefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig, joinBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const sourceDir = resolve(root, config.content.briefsDir)
const generatedRoot = resolve(root, config.presentation.generatedDir)
const fixtureSlug = 'zz-orbis-multi-presentation-check'
const fixturePath = resolve(sourceDir, `${fixtureSlug}.yaml`)
const fixtureDate = '2099-12-31'
const fixtureStablePath = '2099/12/31'
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

const files = await listFiles(sourceDir, ['.yaml', '.yml'])
let seed: ReturnType<typeof dailyBriefSchema.parse> | undefined
let seedSlug: string | undefined

for (const file of files) {
  const result = dailyBriefSchema.safeParse(await readYaml(file))
  if (!result.success) continue
  if (result.data.status !== 'published' || !result.data.presentation.enabled) continue
  seed = result.data
  seedSlug = basename(file).replace(/\.(yaml|yml)$/, '')
  break
}

assert.ok(seed, 'Multi-presentation check requires one published daily-v1 presentation as a seed')
assert.ok(seedSlug)

const fixture = {
  ...seed,
  publishedAt: fixtureDate,
  title: 'Orbis multi-presentation integration fixture',
  summary: 'Ephemeral CI fixture proving that multiple published Brief presentations can be generated, built, assembled and validated together.',
}

dailyBriefSchema.parse(fixture)

try {
  await access(fixturePath)
  throw new Error(`Refusing to overwrite existing fixture path: ${fixturePath}`)
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

await writeFile(fixturePath, stringify(fixture), 'utf8')
console.log(`Created ephemeral multi-presentation fixture: ${fixtureSlug}`)

try {
  await run('generate:slides')
  await run('build:web')
  await run('build:slides')
  await run('assemble')
  await run('test:site')

  const seedDeck = resolve(root, `dist/site/slides/${seedSlug}/index.html`)
  const fixtureBrief = resolve(root, `dist/site/briefs/${fixtureSlug}/index.html`)
  const fixtureDeck = resolve(root, `dist/site/slides/${fixtureSlug}/index.html`)
  const fixtureSource = resolve(generatedRoot, fixtureSlug, 'slides.md')
  const fixtureStable = resolve(root, `dist/site/${fixtureStablePath}/index.html`)
  const latestPath = resolve(root, 'dist/site/latest/index.html')
  const archivePath = resolve(root, 'dist/site/archive.json')

  await access(seedDeck)
  await access(fixtureBrief)
  await access(fixtureDeck)
  await access(fixtureSource)
  await access(fixtureStable)
  await access(latestPath)
  await access(archivePath)

  const siteBase = runtimeSiteBase(config)
  const expectedDeckBase = `${joinBasePath(siteBase, config.presentation.publicPath, fixtureSlug)}/`
  const deckHtml = await readFile(fixtureDeck, 'utf8')
  const stableHtml = await readFile(fixtureStable, 'utf8')
  const latestHtml = await readFile(latestPath, 'utf8')
  const archive = JSON.parse(await readFile(archivePath, 'utf8')) as {
    latest?: string
    issues?: Array<{ date?: string; path?: string }>
  }

  assert.ok(deckHtml.includes(expectedDeckBase), `Fixture deck must reference its own base path: ${expectedDeckBase}`)
  assert.ok(stableHtml.includes(expectedDeckBase), `Stable Daily route must redirect to fixture deck: ${expectedDeckBase}`)
  assert.equal(archive.latest, fixtureDate, 'A newer published Daily must promote archive.latest')
  assert.ok(archive.issues?.some((issue) => issue.date === fixtureDate && issue.path === `${fixtureStablePath}/`), 'Merged archive must include the future Daily fixture')

  const expectedLatestTarget = `${joinBasePath(siteBase, fixtureStablePath)}/`
  assert.ok(latestHtml.includes(expectedLatestTarget), `/latest/ must advance to ${expectedLatestTarget}`)

  console.log(`Multi-presentation integration check passed: ${seedSlug} + ${fixtureSlug}`)
  console.log(`Future Daily promotion check passed: latest=${fixtureDate}, stable=/${fixtureStablePath}/`)
} finally {
  await rm(fixturePath, { force: true })
  await rm(generatedRoot, { recursive: true, force: true })
  await rm(resolve(root, 'dist'), { recursive: true, force: true })
  console.log('Cleaned ephemeral multi-presentation fixture and artifacts')
}
