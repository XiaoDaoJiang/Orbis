import assert from 'node:assert/strict'
import { access, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { stringify } from 'yaml'
import { loadSiteConfig } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const sourceDir = resolve(root, config.content.briefsDir)
const slug = 'zz-orbis-invalid-weekly-check'
const path = resolve(sourceDir, `${slug}.yaml`)
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

async function assertMissing(target: string) {
  try {
    await access(target)
    assert.fail(`Refusing to overwrite existing invalid Weekly fixture: ${target}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
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

const reference = {
  title: 'Plan 30 Weekly Brief',
  url: 'https://github.com/XiaoDaoJiang/Orbis/blob/planning/product-capability-roadmap/docs/plan/30-weekly-brief.md',
  supports: 'Defines the dedicated Weekly cadence contract.',
}

const invalidHybridWeekly = {
  kind: 'brief',
  cadence: 'weekly',
  publishedAt: '2026-09-01',
  status: 'published',
  title: 'Invalid hybrid Weekly source fixture',
  summary: 'This fixture deliberately carries a Daily-only field that strict Weekly validation must reject.',
  topics: ['agent-harness'],
  period: { from: '2026-08-26', to: '2026-09-01' },
  weeklyThesis: 'Weekly must remain a cadence-specific judgment rather than silently accepting Daily-only content fields.',
  trendMovements: [
    { topic: 'agent-harness', direction: 'rising', summary: 'Weekly validation now has a dedicated cadence boundary.' },
    { topic: 'coding-agent', direction: 'stable', summary: 'The validation path must reject hybrid source shapes before publication.' },
  ],
  sections: [
    {
      id: 'weekly-contract',
      layout: 'architecture',
      title: 'Weekly contract remains strict',
      conclusion: 'Daily-only fields must not be silently stripped from Weekly content.',
      facts: ['The Weekly schema is strict at the cadence boundary.'],
      limitations: [],
      references: [reference],
    },
    {
      id: 'validation-path',
      layout: 'system-map',
      title: 'Content validation enforces the schema',
      conclusion: 'Invalid Weekly source must fail the repository content validation command.',
      facts: ['The validator parses every Brief through the shared Brief schema.'],
      limitations: [],
      references: [reference],
    },
  ],
  nextPeriodWatch: [
    { title: 'Reject hybrid fields', reason: 'The strict cadence contract should remain enforced as Weekly evolves.' },
  ],
  references: [reference],
  presentation: { enabled: false, template: 'weekly-v1' },
  signals: [
    { title: 'Daily-only field', summary: 'This field makes the Weekly source invalid by design.', impact: 'high' },
  ],
}

await assertMissing(path)
await writeFile(path, stringify(invalidHybridWeekly), 'utf8')
try {
  const output = await runExpectFailure('content:validate')
  assert.match(output, new RegExp(`Invalid content: content/briefs/${slug}\\.yaml`))
  assert.match(output, /signals/)
  console.log(`Invalid hybrid Weekly validation gate passed: ${slug}`)
} finally {
  await rm(path, { force: true })
}
