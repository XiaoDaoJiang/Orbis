import { access, appendFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'
import { collectChangedEntries } from '../path-guard/change-set.ts'
import { discoverPresentationDescriptors } from '../generate-slides/discover-presentations.ts'
import { classifyPresentationImpact, type PresentationImpact } from './presentation-impact-policy.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const generatedRoot = resolve(root, config.presentation.generatedDir)
const outputRoot = resolve(root, config.presentation.outputDir)
const siteBase = runtimeSiteBase(config)

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

async function cachedDeckComplete(id: string): Promise<boolean> {
  return await exists(resolve(generatedRoot, id, 'slides.md'))
    && await exists(resolve(generatedRoot, id, 'seo.json'))
    && await exists(resolve(outputRoot, id, 'index.html'))
}

async function writeOutput(name: string, value: string): Promise<void> {
  const output = process.env.GITHUB_OUTPUT
  if (!output) return
  await appendFile(output, `${name}=${value}\n`, 'utf8')
}

const base = argumentValue('--base')
if (!base) throw new Error('presentation-impact requires --base <git-sha>')

const cacheHit = argumentValue('--cache-hit') === 'true'
const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
const currentIds = descriptors.map((descriptor) => descriptor.slug)
const current = new Set(currentIds)

let impact: PresentationImpact
if (!cacheHit) {
  impact = { mode: 'all', ids: [], reasons: ['Slidev cache miss'] }
} else {
  impact = classifyPresentationImpact(await collectChangedEntries(root, base))
}

let buildIds: string[] = []
let removedIds: string[] = []

if (impact.mode === 'ids') {
  buildIds = impact.ids.filter((id) => current.has(id))
  removedIds = impact.ids.filter((id) => !current.has(id))

  for (const id of removedIds) {
    await rm(resolve(generatedRoot, id), { recursive: true, force: true })
    await rm(resolve(outputRoot, id), { recursive: true, force: true })
  }
}

if (impact.mode !== 'all') {
  const rebuild = new Set(buildIds)
  const missing: string[] = []
  for (const id of currentIds) {
    if (rebuild.has(id)) continue
    if (!(await cachedDeckComplete(id))) missing.push(id)
  }
  if (missing.length > 0) {
    impact = {
      mode: 'all',
      ids: [],
      reasons: [`Slidev cache is incomplete for: ${missing.join(', ')}`],
    }
    buildIds = []
    removedIds = []
  }
}

const mode = impact.mode
const ids = mode === 'ids' ? buildIds.join(',') : ''
const removed = removedIds.join(',')

console.log(`Presentation impact: mode=${mode}`)
console.log(`Presentation build IDs: ${ids || '(none)'}`)
console.log(`Presentation removed IDs: ${removed || '(none)'}`)
for (const reason of impact.reasons) console.log(`  - ${reason}`)

await writeOutput('mode', mode)
await writeOutput('ids', ids)
await writeOutput('removed', removed)
