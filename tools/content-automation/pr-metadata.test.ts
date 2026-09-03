import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/content-automation/pr-metadata.ts')
assert.equal(existsSync(helperPath), true, 'Scheduled Daily PR metadata helper must exist')

const metadata = await import(pathToFileURL(helperPath).href)
assert.equal(typeof metadata.assertDailyAutomationReport, 'function')
assert.equal(typeof metadata.renderDailyAutomationPrMetadata, 'function')

const report = {
  version: 1,
  kind: 'daily',
  targetDate: '2026-09-04',
  branch: 'automation/daily/2026-09-04',
  contentPath: 'content/briefs/2026-09-04.yaml',
  outcome: 'candidate-created',
  sourceCount: 7,
  primarySourceCount: 4,
  validation: 'passed',
  fullBuild: 'not-run',
  unverified: ['Full build was not run in the producer environment.'],
} as const

assert.deepEqual(metadata.assertDailyAutomationReport(report), report)

const rendered = metadata.renderDailyAutomationPrMetadata(report)
assert.equal(rendered.title, 'content: daily brief 2026-09-04')
assert.match(rendered.body, /AI FRONTIER · 2026-09-04/)
assert.match(rendered.body, /automation\/daily\/2026-09-04/)
assert.match(rendered.body, /content\/briefs\/2026-09-04\.yaml/)
assert.match(rendered.body, /Sources: 7 \(primary: 4\)/)
assert.match(rendered.body, /Validation: passed/)
assert.match(rendered.body, /Full build: not-run/)
assert.match(rendered.body, /Full build was not run in the producer environment\./)

const machine = rendered.body.match(/<!-- orbis-content-automation:v1\n([\s\S]*?)\n-->/)
assert.ok(machine, 'PR body must include a stable machine-readable automation report block')
assert.deepEqual(JSON.parse(machine[1]), report)

assert.throws(
  () => metadata.assertDailyAutomationReport({ ...report, branch: 'automation/daily/2026-09-05' }),
  /branch|canonical|target/i,
)
assert.throws(
  () => metadata.assertDailyAutomationReport({ ...report, contentPath: 'content/briefs/other.yaml' }),
  /path|canonical|target/i,
)
assert.throws(
  () => metadata.assertDailyAutomationReport({ ...report, sourceCount: -1 }),
  /source/i,
)
assert.throws(
  () => metadata.assertDailyAutomationReport({ ...report, primarySourceCount: 8 }),
  /primary|source/i,
)
assert.throws(
  () => metadata.assertDailyAutomationReport({ ...report, chainOfThought: 'private reasoning' }),
  /unknown|field|chain/i,
  'Operational metadata must reject provider-private fields',
)

console.log('Scheduled Daily PR metadata contract passed')
