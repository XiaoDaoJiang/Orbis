import assert from 'node:assert/strict'
import { evidenceDailyBriefSchema, legacyDailyBriefSchema } from '@orbis/content-schema'
import {
  claimAnchorId,
  correctionHistory,
  isEvidenceDailyBrief,
  latestCorrection,
  referenceAnchorId,
} from '../../apps/web/src/lib/evidence-integrity.ts'

const reference = {
  id: 'source-one',
  title: 'Example primary source',
  url: 'https://example.com/source',
  supports: 'Supports the Evidence reading fixture.',
}

const evidenceBrief = evidenceDailyBriefSchema.parse({
  kind: 'brief',
  cadence: 'daily',
  evidenceVersion: 1,
  publishedAt: '2026-09-07',
  status: 'published',
  title: 'Evidence UI contract fixture',
  summary: 'A deterministic fixture for Evidence reading UI semantics.',
  topics: ['agent-harness'],
  signals: [1, 2, 3, 4].map((index) => ({
    title: `Signal ${index}`,
    summary: 'A sufficiently descriptive signal summary for the fixture.',
    impact: 'high',
  })),
  sections: [1, 2, 3, 4, 5].map((index) => ({
    id: `section-${index}`,
    layout: 'architecture',
    title: `Section ${index}`,
    conclusion: 'A sufficiently descriptive conclusion for the fixture.',
    facts: [{
      id: `claim-${index}`,
      text: 'A concrete factual statement supported by explicit evidence.',
      evidence: ['source-one'],
    }],
    limitations: [],
  })),
  projects: [],
  radar: [],
  actions: [1, 2, 3].map((index) => ({
    title: `Action ${index}`,
    description: 'A sufficiently descriptive action for the fixture.',
  })),
  references: [reference],
  archivePicks: [],
  corrections: [
    {
      id: 'later-fix',
      correctedAt: '2026-09-08',
      summary: 'A later correction used to verify deterministic ordering.',
      targets: [{ section: 'section-1', fact: 'claim-1' }],
      evidence: ['source-one'],
    },
    {
      id: 'earlier-fix',
      correctedAt: '2026-09-07',
      summary: 'An earlier correction used to verify deterministic ordering.',
      targets: [{ section: 'section-2', fact: 'claim-2' }],
      evidence: ['source-one'],
    },
  ],
  presentation: { enabled: true, template: 'daily-v1' },
})

assert.equal(isEvidenceDailyBrief(evidenceBrief), true)
assert.equal(claimAnchorId('external-supervision', 'external-supervisor-mode'), 'claim-external-supervision-external-supervisor-mode')
assert.equal(referenceAnchorId('openclaw-v2026-7-2-beta-2'), 'ref-openclaw-v2026-7-2-beta-2')
assert.deepEqual(correctionHistory(evidenceBrief).map((item) => item.id), ['earlier-fix', 'later-fix'])
assert.equal(latestCorrection(evidenceBrief)?.id, 'later-fix')

const legacy = legacyDailyBriefSchema.parse({
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-09-06',
  status: 'published',
  title: 'Legacy Daily UI fixture',
  summary: 'A deterministic legacy Daily fixture for compatibility testing.',
  topics: ['agent-harness'],
  signals: [1, 2, 3, 4].map((index) => ({
    title: `Signal ${index}`,
    summary: 'A sufficiently descriptive legacy signal summary.',
    impact: 'high',
  })),
  sections: [1, 2, 3, 4, 5].map((index) => ({
    id: `legacy-${index}`,
    layout: 'architecture',
    title: `Legacy Section ${index}`,
    conclusion: 'A sufficiently descriptive legacy conclusion.',
    facts: ['A legacy string fact remains renderable.'],
    limitations: [],
    references: [{ title: 'Legacy source', url: 'https://example.com/legacy', supports: 'Supports legacy rendering.' }],
  })),
  projects: [],
  radar: [],
  actions: [1, 2, 3].map((index) => ({
    title: `Action ${index}`,
    description: 'A sufficiently descriptive legacy action.',
  })),
  references: [{ title: 'Legacy source', url: 'https://example.com/legacy', supports: 'Supports legacy rendering.' }],
  archivePicks: [],
  presentation: { enabled: true, template: 'daily-v1' },
})

assert.equal(isEvidenceDailyBrief(legacy), false)

console.log('Evidence reading UI contract passed')
