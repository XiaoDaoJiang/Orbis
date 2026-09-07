import assert from 'node:assert/strict'
import type { EvidenceDailyBrief } from '@orbis/content-schema'
import type { ChangedEntry } from '../path-guard/change-set.ts'
import {
  evaluateCorrectionPolicy,
  resolveCorrectionBranch,
  type CorrectionGuardViolationCode,
} from './correction-policy.ts'

const path = 'content/briefs/2026-09-07.yaml'
const branch = 'correction/daily/2026-09-07/test-correction'
const validChanges: ChangedEntry[] = [{ status: 'M', path }]

function makeBrief(): EvidenceDailyBrief {
  return {
    kind: 'brief',
    cadence: 'daily',
    evidenceVersion: 1,
    publishedAt: '2026-09-07',
    status: 'published',
    title: 'A published Evidence Daily fixture',
    summary: 'A sufficiently descriptive Evidence Daily fixture for correction policy tests.',
    topics: ['agent-harness'],
    signals: Array.from({ length: 4 }, (_, index) => ({
      title: `Signal ${index + 1}`,
      summary: 'A sufficiently descriptive signal summary.',
      impact: 'high' as const,
    })),
    sections: Array.from({ length: 5 }, (_, index) => ({
      id: `section-${index + 1}`,
      layout: 'architecture' as const,
      title: `Section ${index + 1}`,
      conclusion: 'A sufficiently descriptive section conclusion.',
      facts: [{
        id: `claim-${index + 1}`,
        text: `Published factual claim ${index + 1}.`,
        evidence: ['source-one'],
      }],
      limitations: [],
    })),
    projects: [],
    radar: [],
    actions: Array.from({ length: 3 }, (_, index) => ({
      title: `Action ${index + 1}`,
      description: 'A concrete action description for the fixture.',
    })),
    references: [{
      id: 'source-one',
      title: 'Primary source one',
      url: 'https://example.com/source-one',
      source: 'github',
      supports: 'Supports all fixture claims.',
      accessedAt: '2026-09-07',
    }],
    archivePicks: [],
    corrections: [{
      id: 'existing-correction',
      correctedAt: '2026-09-07',
      summary: 'Existing correction history must remain immutable.',
      targets: [{ section: 'section-1', fact: 'claim-1' }],
      evidence: ['source-one'],
    }],
    presentation: { enabled: true, template: 'daily-v1' },
  }
}

function clone(brief: EvidenceDailyBrief): EvidenceDailyBrief {
  return structuredClone(brief)
}

function appendCorrection(
  brief: EvidenceDailyBrief,
  targets = [{ section: 'section-1', fact: 'claim-1' }],
  evidence = ['source-one'],
) {
  brief.corrections.push({
    id: `new-correction-${brief.corrections.length}`,
    correctedAt: '2026-09-07',
    summary: 'New correction event records this published-content change.',
    targets,
    evidence,
  })
  return brief
}

function violations(candidate: EvidenceDailyBrief, overrides: Partial<Parameters<typeof evaluateCorrectionPolicy>[0]> = {}) {
  return evaluateCorrectionPolicy({
    branch,
    changes: validChanges,
    baseBrief: makeBrief(),
    candidateBrief: candidate,
    ...overrides,
  })
}

function assertHas(result: ReturnType<typeof evaluateCorrectionPolicy>, code: CorrectionGuardViolationCode) {
  assert.ok(result.some((violation) => violation.code === code), `Expected violation ${code}, got ${result.map((item) => item.code).join(', ')}`)
}

const resolved = resolveCorrectionBranch(branch)
assert.equal(resolved.targetDate, '2026-09-07')
assert.equal(resolved.contentPath, path)
assert.throws(() => resolveCorrectionBranch('correction/daily/2026-09-07'))
assert.throws(() => resolveCorrectionBranch('correction/daily/2026-02-30/impossible-date'))

const valid = appendCorrection(clone(makeBrief()))
assert.deepEqual(violations(valid), [], 'A pure append-only correction must pass')

const changedFact = appendCorrection(clone(makeBrief()))
changedFact.sections[0].facts[0].text = 'Corrected factual claim text.'
assert.deepEqual(violations(changedFact), [], 'A fact mutation covered by a new correction target must pass')

const untrackedFact = appendCorrection(clone(makeBrief()), [{ section: 'section-2', fact: 'claim-2' }])
untrackedFact.sections[0].facts[0].text = 'Untracked factual mutation.'
assertHas(violations(untrackedFact), 'UNTRACKED_FACT_MUTATION')

const newFact = appendCorrection(clone(makeBrief()), [{ section: 'section-1', fact: 'claim-new' }])
newFact.sections[0].facts.push({ id: 'claim-new', text: 'A newly added corrected fact.', evidence: ['source-one'] })
assert.deepEqual(violations(newFact), [], 'A newly added fact covered by the appended correction must pass')

const newFactUntracked = appendCorrection(clone(makeBrief()))
newFactUntracked.sections[0].facts.push({ id: 'claim-new', text: 'An untracked new fact.', evidence: ['source-one'] })
assertHas(violations(newFactUntracked), 'UNTRACKED_FACT_MUTATION')

const noAppend = clone(makeBrief())
assertHas(violations(noAppend), 'MISSING_APPENDED_CORRECTION')

const deletedHistory = clone(makeBrief())
deletedHistory.corrections = []
assertHas(violations(deletedHistory), 'MISSING_APPENDED_CORRECTION')
assertHas(violations(deletedHistory), 'CORRECTION_HISTORY_MUTATED')

const editedHistory = appendCorrection(clone(makeBrief()))
editedHistory.corrections[0].summary = 'Rewritten history is forbidden.'
assertHas(violations(editedHistory), 'CORRECTION_HISTORY_MUTATED')

const reorderedHistoryBase = makeBrief()
reorderedHistoryBase.corrections.push({
  id: 'existing-correction-two',
  correctedAt: '2026-09-07',
  summary: 'Second immutable historical correction event.',
  targets: [{ section: 'section-2', fact: 'claim-2' }],
  evidence: ['source-one'],
})
const reordered = clone(reorderedHistoryBase)
reordered.corrections = [reordered.corrections[1], reordered.corrections[0]]
appendCorrection(reordered)
const reorderedResult = evaluateCorrectionPolicy({ branch, changes: validChanges, baseBrief: reorderedHistoryBase, candidateBrief: reordered })
assertHas(reorderedResult, 'CORRECTION_HISTORY_MUTATED')

const removedSection = appendCorrection(clone(makeBrief()))
removedSection.sections[0].id = 'renamed-section'
assertHas(violations(removedSection), 'STABLE_SECTION_REMOVED')

const removedClaim = appendCorrection(clone(makeBrief()), [{ section: 'section-1', fact: 'renamed-claim' }])
removedClaim.sections[0].facts[0].id = 'renamed-claim'
assertHas(violations(removedClaim), 'STABLE_CLAIM_REMOVED')

const removedReference = appendCorrection(clone(makeBrief()))
removedReference.references[0].id = 'renamed-source'
removedReference.sections.forEach((section) => { section.facts[0].evidence = ['renamed-source'] })
removedReference.corrections.at(-1)!.evidence = ['renamed-source']
assertHas(violations(removedReference), 'STABLE_REFERENCE_REMOVED')

const changedReference = appendCorrection(clone(makeBrief()))
changedReference.references[0].url = 'https://example.com/corrected-source'
assertHas(violations(changedReference), 'UNTRACKED_REFERENCE_MUTATION')

const trackedReference = appendCorrection(
  clone(makeBrief()),
  Array.from({ length: 5 }, (_, index) => ({ section: `section-${index + 1}`, fact: `claim-${index + 1}` })),
  ['source-one'],
)
trackedReference.references[0].url = 'https://example.com/corrected-source'
assert.deepEqual(violations(trackedReference), [], 'Reference mutation must be explicitly evidenced and target all affected facts')

assertHas(violations(valid, { branch: 'correction/daily/2026-09-06/wrong-date' }), 'INVALID_CORRECTION_CHANGESET')
assertHas(violations(valid, { changes: [...validChanges, { status: 'M', path: 'README.md' }] }), 'INVALID_CORRECTION_CHANGESET')
assertHas(violations(valid, { changes: [{ status: 'A', path }] }), 'INVALID_CORRECTION_CHANGESET')
assertHas(violations(valid, { baseBrief: null }), 'BASE_DAILY_MISSING')

const draftBase = makeBrief()
draftBase.status = 'draft'
assertHas(violations(valid, { baseBrief: draftBase }), 'BASE_DAILY_NOT_PUBLISHED')

const mismatched = appendCorrection(clone(makeBrief()))
mismatched.publishedAt = '2026-09-06'
assertHas(violations(mismatched), 'DAILY_IDENTITY_MISMATCH')

console.log('Published Daily correction policy contract passed')
