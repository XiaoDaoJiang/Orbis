import type { DailyBrief, EvidenceDailyBrief } from '@orbis/content-schema'
import { assertTargetDate } from '../content-automation/daily-target.ts'
import type { ChangedEntry } from '../path-guard/change-set.ts'
import { isEvidenceDailyBrief } from './daily-evidence.ts'

export type CorrectionGuardViolationCode =
  | 'INVALID_CORRECTION_BRANCH'
  | 'INVALID_CORRECTION_CHANGESET'
  | 'BASE_DAILY_MISSING'
  | 'BASE_DAILY_NOT_PUBLISHED'
  | 'BASE_DAILY_NOT_EVIDENCE_V1'
  | 'CANDIDATE_DAILY_NOT_EVIDENCE_V1'
  | 'DAILY_IDENTITY_MISMATCH'
  | 'CORRECTION_HISTORY_MUTATED'
  | 'MISSING_APPENDED_CORRECTION'
  | 'STABLE_SECTION_REMOVED'
  | 'STABLE_CLAIM_REMOVED'
  | 'STABLE_REFERENCE_REMOVED'
  | 'UNTRACKED_FACT_MUTATION'
  | 'UNTRACKED_REFERENCE_MUTATION'

export type CorrectionGuardViolation = {
  code: CorrectionGuardViolationCode
  address: string
  message: string
}

export type CorrectionBranchTarget = {
  branch: string
  targetDate: string
  slug: string
  contentPath: string
}

export type CorrectionPolicyInput = {
  branch: string
  changes: readonly ChangedEntry[]
  baseBrief: DailyBrief | null
  candidateBrief: DailyBrief | null
}

const CORRECTION_BRANCH = /^correction\/daily\/(\d{4}-\d{2}-\d{2})\/([a-z0-9]+(?:-[a-z0-9]+)*)$/

export function resolveCorrectionBranch(branch: string): CorrectionBranchTarget {
  const match = CORRECTION_BRANCH.exec(branch)
  if (!match) {
    throw new Error(`Invalid correction branch: expected correction/daily/YYYY-MM-DD/<kebab-slug>, got ${branch || '<empty>'}`)
  }

  const targetDate = assertTargetDate(match[1])
  return {
    branch,
    targetDate,
    slug: match[2],
    contentPath: `content/briefs/${targetDate}.yaml`,
  }
}

function sameSemanticValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function factAddress(sectionId: string, factId: string) {
  return `${sectionId}/${factId}`
}

function correctionTargets(brief: EvidenceDailyBrief, startIndex: number) {
  return new Set(
    brief.corrections
      .slice(startIndex)
      .flatMap((correction) => correction.targets.map((target) => factAddress(target.section, target.fact))),
  )
}

function correctionEvidence(brief: EvidenceDailyBrief, startIndex: number) {
  return new Set(brief.corrections.slice(startIndex).flatMap((correction) => correction.evidence))
}

function factsUsingReference(brief: EvidenceDailyBrief, referenceId: string) {
  const addresses = new Set<string>()
  for (const section of brief.sections) {
    for (const fact of section.facts) {
      if (fact.evidence.includes(referenceId)) addresses.add(factAddress(section.id, fact.id))
    }
  }
  return addresses
}

function validateStableIdentityAndMutations(
  base: EvidenceDailyBrief,
  candidate: EvidenceDailyBrief,
  violations: CorrectionGuardViolation[],
) {
  const appendedStart = base.corrections.length
  const appendedTargets = correctionTargets(candidate, appendedStart)
  const appendedEvidence = correctionEvidence(candidate, appendedStart)
  const candidateSections = new Map(candidate.sections.map((section) => [section.id, section]))

  for (const baseSection of base.sections) {
    const candidateSection = candidateSections.get(baseSection.id)
    if (!candidateSection) {
      violations.push({
        code: 'STABLE_SECTION_REMOVED',
        address: `section:${baseSection.id}`,
        message: `Published section identity was removed or renamed: ${baseSection.id}`,
      })
      continue
    }

    const baseFacts = new Map(baseSection.facts.map((fact) => [fact.id, fact]))
    const candidateFacts = new Map(candidateSection.facts.map((fact) => [fact.id, fact]))

    for (const baseFact of baseSection.facts) {
      const candidateFact = candidateFacts.get(baseFact.id)
      const address = factAddress(baseSection.id, baseFact.id)
      if (!candidateFact) {
        violations.push({
          code: 'STABLE_CLAIM_REMOVED',
          address,
          message: `Published fact identity was removed or renamed: ${address}`,
        })
        continue
      }

      if (!sameSemanticValue(baseFact, candidateFact) && !appendedTargets.has(address)) {
        violations.push({
          code: 'UNTRACKED_FACT_MUTATION',
          address,
          message: `Fact text/evidence changed without a newly appended correction targeting ${address}`,
        })
      }
    }

    for (const candidateFact of candidateSection.facts) {
      if (baseFacts.has(candidateFact.id)) continue
      const address = factAddress(candidateSection.id, candidateFact.id)
      if (!appendedTargets.has(address)) {
        violations.push({
          code: 'UNTRACKED_FACT_MUTATION',
          address,
          message: `New factual claim must be covered by a newly appended correction target: ${address}`,
        })
      }
    }
  }

  const candidateReferences = new Map(candidate.references.map((reference) => [reference.id, reference]))
  for (const baseReference of base.references) {
    const candidateReference = candidateReferences.get(baseReference.id)
    if (!candidateReference) {
      violations.push({
        code: 'STABLE_REFERENCE_REMOVED',
        address: `reference:${baseReference.id}`,
        message: `Published reference identity was removed or renamed: ${baseReference.id}`,
      })
      continue
    }

    if (sameSemanticValue(baseReference, candidateReference)) continue

    const affected = new Set([
      ...factsUsingReference(base, baseReference.id),
      ...factsUsingReference(candidate, baseReference.id),
    ])
    const untracked = [...affected].filter((address) => !appendedTargets.has(address))
    if (!appendedEvidence.has(baseReference.id) || untracked.length) {
      violations.push({
        code: 'UNTRACKED_REFERENCE_MUTATION',
        address: `reference:${baseReference.id}`,
        message: `Published reference changed without appended correction evidence and targets for all affected facts${untracked.length ? `: ${untracked.join(', ')}` : ''}`,
      })
    }
  }
}

export function evaluateCorrectionPolicy(input: CorrectionPolicyInput): CorrectionGuardViolation[] {
  const violations: CorrectionGuardViolation[] = []
  let target: CorrectionBranchTarget

  try {
    target = resolveCorrectionBranch(input.branch)
  } catch (error) {
    violations.push({
      code: 'INVALID_CORRECTION_BRANCH',
      address: 'branch',
      message: error instanceof Error ? error.message : String(error),
    })
    return violations
  }

  const change = input.changes[0]
  if (
    input.changes.length !== 1
    || !change
    || change.status !== 'M'
    || change.path !== target.contentPath
    || change.oldPath
  ) {
    violations.push({
      code: 'INVALID_CORRECTION_CHANGESET',
      address: target.contentPath,
      message: `Correction branch must modify exactly ${target.contentPath} and no other path`,
    })
  }

  if (!input.baseBrief) {
    violations.push({
      code: 'BASE_DAILY_MISSING',
      address: target.contentPath,
      message: `Published correction target does not exist in base: ${target.contentPath}`,
    })
    return violations
  }

  if (input.baseBrief.status !== 'published') {
    violations.push({
      code: 'BASE_DAILY_NOT_PUBLISHED',
      address: target.contentPath,
      message: `Base Daily must already be published, got ${input.baseBrief.status}`,
    })
  }

  if (!isEvidenceDailyBrief(input.baseBrief)) {
    violations.push({
      code: 'BASE_DAILY_NOT_EVIDENCE_V1',
      address: target.contentPath,
      message: 'Published correction guard only supports Evidence V1 Daily targets',
    })
    return violations
  }

  if (!input.candidateBrief || !isEvidenceDailyBrief(input.candidateBrief)) {
    violations.push({
      code: 'CANDIDATE_DAILY_NOT_EVIDENCE_V1',
      address: target.contentPath,
      message: 'Correction candidate must remain an Evidence V1 Daily',
    })
    return violations
  }

  const base = input.baseBrief
  const candidate = input.candidateBrief
  if (
    base.publishedAt !== target.targetDate
    || candidate.publishedAt !== target.targetDate
    || candidate.status !== 'published'
  ) {
    violations.push({
      code: 'DAILY_IDENTITY_MISMATCH',
      address: target.contentPath,
      message: `Branch date, base publishedAt, candidate publishedAt and published status must remain aligned to ${target.targetDate}`,
    })
  }

  if (candidate.corrections.length <= base.corrections.length) {
    violations.push({
      code: 'MISSING_APPENDED_CORRECTION',
      address: 'corrections',
      message: 'Correction candidate must append at least one new correction event',
    })
  }

  for (let index = 0; index < base.corrections.length; index += 1) {
    if (!sameSemanticValue(base.corrections[index], candidate.corrections[index])) {
      violations.push({
        code: 'CORRECTION_HISTORY_MUTATED',
        address: `corrections[${index}]`,
        message: 'Existing correction events are append-only and may not be deleted, edited, or reordered',
      })
    }
  }

  validateStableIdentityAndMutations(base, candidate, violations)
  return violations
}
