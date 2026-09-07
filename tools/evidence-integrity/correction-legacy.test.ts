import assert from 'node:assert/strict'
import type { EvidenceDailyBrief, LegacyDailyBrief } from '@orbis/content-schema'
import { evaluateCorrectionPolicy } from './correction-policy.ts'

const branch = 'correction/daily/2026-09-07/legacy-proof'
const path = 'content/briefs/2026-09-07.yaml'

const legacy: LegacyDailyBrief = {
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-09-07',
  status: 'published',
  title: 'Legacy published Daily fixture',
  summary: 'A sufficiently descriptive legacy published Daily fixture for fail-closed tests.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive legacy signal summary.',
    impact: 'high' as const,
  })),
  sections: Array.from({ length: 5 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture' as const,
    title: `Section ${index + 1}`,
    conclusion: 'A sufficiently descriptive legacy section conclusion.',
    facts: [`Legacy factual claim ${index + 1}.`],
    limitations: [],
    references: [{
      title: 'Legacy source',
      url: 'https://example.com/legacy-source',
      supports: 'Supports the legacy fixture.',
    }],
  })),
  projects: [],
  radar: [],
  actions: Array.from({ length: 3 }, (_, index) => ({
    title: `Action ${index + 1}`,
    description: 'A concrete legacy action description.',
  })),
  references: [{
    title: 'Legacy source',
    url: 'https://example.com/legacy-source',
    supports: 'Supports the legacy fixture.',
  }],
  archivePicks: [],
  presentation: { enabled: true, template: 'daily-v1' },
}

const evidence: EvidenceDailyBrief = {
  kind: 'brief',
  cadence: 'daily',
  evidenceVersion: 1,
  publishedAt: '2026-09-07',
  status: 'published',
  title: 'Evidence published Daily fixture',
  summary: 'A sufficiently descriptive Evidence published Daily fixture for fail-closed tests.',
  topics: ['agent-harness'],
  signals: legacy.signals,
  sections: Array.from({ length: 5 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture' as const,
    title: `Section ${index + 1}`,
    conclusion: 'A sufficiently descriptive Evidence section conclusion.',
    facts: [{ id: `claim-${index + 1}`, text: `Evidence factual claim ${index + 1}.`, evidence: ['source-one'] }],
    limitations: [],
  })),
  projects: [],
  radar: [],
  actions: legacy.actions,
  references: [{
    id: 'source-one',
    title: 'Evidence source',
    url: 'https://example.com/evidence-source',
    supports: 'Supports the Evidence fixture.',
  }],
  archivePicks: [],
  corrections: [{
    id: 'new-correction',
    correctedAt: '2026-09-07',
    summary: 'A new correction cannot directly upgrade a legacy base through correction mode.',
    targets: [{ section: 'section-1', fact: 'claim-1' }],
    evidence: ['source-one'],
  }],
  presentation: { enabled: true, template: 'daily-v1' },
}

const legacyBase = evaluateCorrectionPolicy({
  branch,
  changes: [{ status: 'M', path }],
  baseBrief: legacy,
  candidateBrief: evidence,
})
assert.ok(legacyBase.some((issue) => issue.code === 'BASE_DAILY_NOT_EVIDENCE_V1'))

const legacyCandidate = evaluateCorrectionPolicy({
  branch,
  changes: [{ status: 'M', path }],
  baseBrief: evidence,
  candidateBrief: legacy,
})
assert.ok(legacyCandidate.some((issue) => issue.code === 'CANDIDATE_DAILY_NOT_EVIDENCE_V1'))

console.log('Legacy published Daily correction fail-closed contract passed')
