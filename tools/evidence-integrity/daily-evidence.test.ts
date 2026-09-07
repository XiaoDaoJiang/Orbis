import assert from 'node:assert/strict'
import {
  evidenceDailyBriefSchema,
  legacyDailyBriefSchema,
  type EvidenceDailyBrief,
} from '@orbis/content-schema'
import { evaluateDailyEvidence } from './daily-evidence.ts'

const legacy = legacyDailyBriefSchema.parse({
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-09-07',
  status: 'published',
  title: 'Legacy Daily fixture for migration boundary',
  summary: 'Legacy Daily remains readable but is not evidence-covered.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive legacy signal summary.',
    impact: 'high',
  })),
  sections: Array.from({ length: 5 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture',
    title: `Legacy section ${index + 1}`,
    conclusion: 'A sufficiently descriptive legacy conclusion.',
    facts: ['A legacy fact with only section-level references.'],
    limitations: [],
    references: [{
      title: 'Legacy source',
      url: 'https://example.com/legacy',
      supports: 'Legacy section-level support.',
    }],
  })),
  projects: [],
  radar: [],
  actions: Array.from({ length: 3 }, (_, index) => ({
    title: `Action ${index + 1}`,
    description: 'A concrete legacy action item.',
  })),
  references: [{
    title: 'Legacy source',
    url: 'https://example.com/legacy',
    supports: 'Legacy top-level support.',
  }],
  archivePicks: [],
  presentation: { enabled: true, template: 'daily-v1' },
})

const evidence = evidenceDailyBriefSchema.parse({
  kind: 'brief',
  cadence: 'daily',
  evidenceVersion: 1,
  publishedAt: '2026-09-08',
  status: 'published',
  title: 'Evidence V1 Daily fixture for relation validation',
  summary: 'Every factual claim has an explicit reference identity binding.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive evidence signal summary.',
    impact: 'high',
  })),
  sections: Array.from({ length: 5 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture',
    title: `Evidence section ${index + 1}`,
    conclusion: 'A sufficiently descriptive evidence conclusion.',
    facts: [{
      id: `claim-${index + 1}`,
      text: `Evidence-bound factual claim ${index + 1}.`,
      evidence: ['source-one'],
    }],
    limitations: [],
  })),
  projects: [],
  radar: [],
  actions: Array.from({ length: 3 }, (_, index) => ({
    title: `Action ${index + 1}`,
    description: 'A concrete Evidence V1 action item.',
  })),
  references: [{
    id: 'source-one',
    title: 'Primary source',
    url: 'https://example.com/source-one',
    source: 'github',
    supports: 'Supports all test claims.',
  }],
  archivePicks: [],
  corrections: [{
    id: 'fix-claim-one',
    correctedAt: '2026-09-08',
    summary: 'Records a correction against a stable claim address.',
    targets: [{ section: 'section-1', fact: 'claim-1' }],
    evidence: ['source-one'],
  }],
  presentation: { enabled: true, template: 'daily-v1' },
})

const frozen = new Set(['content/briefs/2026-09-07.yaml'])

const legacyAllowed = evaluateDailyEvidence(legacy, 'content/briefs/2026-09-07.yaml', frozen)
assert.equal(legacyAllowed.mode, 'legacy-unverified')
assert.deepEqual(legacyAllowed.errors, [])

const legacyRejected = evaluateDailyEvidence(legacy, 'content/briefs/2026-09-08.yaml', frozen)
assert.deepEqual(legacyRejected.errors.map((error) => error.code), ['LEGACY_DAILY_NOT_ALLOWLISTED'])

const validReport = evaluateDailyEvidence(evidence, 'content/briefs/2026-09-08.yaml', frozen)
assert.equal(validReport.mode, 'evidence-v1')
assert.equal(validReport.claimCount, 5)
assert.equal(validReport.boundClaimCount, 5)
assert.equal(validReport.referenceCount, 1)
assert.equal(validReport.unusedReferenceCount, 0)
assert.equal(validReport.correctionCount, 1)
assert.equal(validReport.lastCorrectedAt, '2026-09-08')
assert.deepEqual(validReport.errors, [])

function mutated(mutator: (value: EvidenceDailyBrief) => void) {
  const value = structuredClone(evidence) as EvidenceDailyBrief
  mutator(value)
  return evaluateDailyEvidence(value, 'content/briefs/2026-09-08.yaml', frozen).errors.map((error) => error.code)
}

assert.ok(mutated((value) => { value.sections[0].facts[1] = structuredClone(value.sections[0].facts[0]) }).includes('DUPLICATE_CLAIM_ID'))
assert.ok(mutated((value) => { value.references[1] = structuredClone(value.references[0]) }).includes('DUPLICATE_REFERENCE_ID'))
assert.ok(mutated((value) => { value.sections[0].facts[0].evidence = [] }).includes('MISSING_EVIDENCE'))
assert.ok(mutated((value) => { value.sections[0].facts[0].evidence = ['missing-source'] }).includes('DANGLING_EVIDENCE_REFERENCE'))
assert.ok(mutated((value) => {
  value.references.push({
    id: 'unused-source',
    title: 'Unused source',
    url: 'https://example.com/unused',
    supports: 'This source is intentionally unused.',
  })
}).includes('UNUSED_REFERENCE'))
assert.ok(mutated((value) => { value.corrections[0].targets = [{ section: 'section-1', fact: 'missing-claim' }] }).includes('INVALID_CORRECTION_TARGET'))
assert.ok(mutated((value) => { value.corrections[0].evidence = ['missing-source'] }).includes('INVALID_CORRECTION_EVIDENCE'))
assert.ok(mutated((value) => { value.corrections[0].correctedAt = '2026-09-07' }).includes('INVALID_CORRECTION_DATE'))

console.log('Daily evidence integrity evaluator tests passed')
