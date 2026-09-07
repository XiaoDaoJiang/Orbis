import assert from 'node:assert/strict'
import { evidenceDailyBriefSchema } from '@orbis/content-schema'
import { renderDailyV1 } from '../../apps/slides/templates/daily-v1.ts'

const brief = evidenceDailyBriefSchema.parse({
  kind: 'brief',
  cadence: 'daily',
  evidenceVersion: 1,
  publishedAt: '2026-09-08',
  status: 'published',
  title: 'Evidence V1 renderer contract fixture',
  summary: 'Evidence-aware Daily content must preserve the existing presentation shape.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive Evidence V1 signal summary.',
    impact: 'high',
  })),
  sections: Array.from({ length: 5 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture',
    title: `Evidence section ${index + 1}`,
    conclusion: 'A sufficiently descriptive evidence-aware conclusion.',
    facts: [{
      id: `claim-${index + 1}`,
      text: `Evidence-aware factual claim ${index + 1}.`,
      evidence: ['primary-source'],
    }],
    limitations: [],
  })),
  projects: [],
  radar: [],
  actions: Array.from({ length: 3 }, (_, index) => ({
    title: `Action ${index + 1}`,
    description: 'A concrete Evidence V1 renderer action.',
  })),
  references: [{
    id: 'primary-source',
    title: 'Primary evidence source',
    url: 'https://example.com/primary-evidence',
    supports: 'Supports the Evidence V1 renderer fixture.',
  }],
  archivePicks: [],
  corrections: [],
  presentation: { enabled: true, template: 'daily-v1' },
})

const rendered = renderDailyV1(brief, {
  siteBase: '/Orbis',
  readingHref: '/Orbis/briefs/2026-09-08/',
})

assert.equal((rendered.match(/^---$/gm) ?? []).length / 2, 11, 'Evidence V1 Daily must remain exactly 11 slides')
assert.match(rendered, /Evidence-aware factual claim 1\./)
assert.match(rendered, /https:\/\/example\.com\/primary-evidence/)
assert.doesNotMatch(rendered, /\[object Object\]/)

console.log('Evidence V1 Daily renderer contract passed with 11 slides')
