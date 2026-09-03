import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/content-automation/daily-target.ts')
assert.equal(existsSync(helperPath), true, 'Scheduled Daily target helper must exist')

const dailyTarget = await import(pathToFileURL(helperPath).href)
assert.equal(typeof dailyTarget.resolveDailyTarget, 'function')
assert.equal(typeof dailyTarget.assertDailyCandidateIdentity, 'function')

assert.deepEqual(dailyTarget.resolveDailyTarget('2026-09-03'), {
  targetDate: '2026-09-03',
  contentPath: 'content/briefs/2026-09-03.yaml',
  branch: 'automation/daily/2026-09-03',
})

for (const invalid of ['', '2026-9-03', '2026-02-30', '2025-02-29', '03-09-2026']) {
  assert.throws(() => dailyTarget.resolveDailyTarget(invalid), /target|date|YYYY-MM-DD|calendar/i, `Expected invalid targetDate: ${invalid}`)
}

const reference = {
  title: 'Official source',
  url: 'https://example.com/source',
  supports: 'Supports the scheduled Daily identity fixture.',
}

const section = (id: string) => ({
  id,
  layout: 'architecture',
  title: `Section ${id}`,
  conclusion: 'A deterministic conclusion long enough for the Daily schema.',
  facts: ['A deterministic fact for the scheduled Daily identity contract.'],
  limitations: [],
  references: [reference],
})

const validDaily = {
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-09-03',
  status: 'published',
  title: 'Scheduled Daily target identity fixture',
  summary: 'A deterministic Daily fixture used to prove exact target identity semantics.',
  topics: ['agent-runtime'],
  references: [reference],
  signals: [1, 2, 3, 4].map((index) => ({
    title: `Signal ${index}`,
    summary: 'A deterministic signal summary for the scheduled Daily identity fixture.',
    impact: 'high',
  })),
  sections: ['one', 'two', 'three', 'four', 'five'].map(section),
  projects: [],
  radar: [],
  actions: [1, 2, 3].map((index) => ({
    title: `Action ${index}`,
    description: 'A deterministic action for the scheduled Daily identity fixture.',
  })),
  archivePicks: [],
  presentation: { enabled: true, template: 'daily-v1' },
}

const parsed = dailyTarget.assertDailyCandidateIdentity('2026-09-03', validDaily)
assert.equal(parsed.cadence, 'daily')
assert.equal(parsed.publishedAt, '2026-09-03')
assert.equal(parsed.presentation.template, 'daily-v1')

assert.throws(
  () => dailyTarget.assertDailyCandidateIdentity('2026-09-04', validDaily),
  /publishedAt|target|date/i,
  'publishedAt must equal targetDate',
)

assert.throws(
  () => dailyTarget.assertDailyCandidateIdentity('2026-09-03', { ...validDaily, cadence: 'weekly' }),
  /daily|cadence|invalid/i,
  'Weekly cannot satisfy Scheduled Daily identity',
)

assert.throws(
  () => dailyTarget.assertDailyCandidateIdentity('2026-09-03', { ...validDaily, presentation: { enabled: true, template: 'weekly-v1' } }),
  /daily-v1|template|invalid/i,
  'Scheduled Daily must use daily-v1',
)

console.log('Scheduled Daily target identity contract passed')
