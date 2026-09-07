import type {
  DailyBrief,
  EvidenceDailyBrief,
  EvidenceFact,
} from '@orbis/content-schema'

export type EvidenceIntegrityErrorCode =
  | 'DUPLICATE_SECTION_ID'
  | 'DUPLICATE_CLAIM_ID'
  | 'DUPLICATE_REFERENCE_ID'
  | 'DUPLICATE_EVIDENCE_REFERENCE'
  | 'DUPLICATE_CORRECTION_ID'
  | 'MISSING_EVIDENCE'
  | 'DANGLING_EVIDENCE_REFERENCE'
  | 'UNUSED_REFERENCE'
  | 'INVALID_CORRECTION_TARGET'
  | 'INVALID_CORRECTION_EVIDENCE'
  | 'INVALID_CORRECTION_DATE'
  | 'LEGACY_DAILY_NOT_ALLOWLISTED'

export type EvidenceIntegrityError = {
  code: EvidenceIntegrityErrorCode
  address: string
  message: string
}

export type DailyEvidenceReport = {
  version: 1
  path: string
  publishedAt: string
  mode: 'evidence-v1' | 'legacy-unverified'
  claimCount: number
  boundClaimCount: number
  referenceCount: number
  unusedReferenceCount: number
  correctionCount: number
  lastCorrectedAt?: string
  errors: EvidenceIntegrityError[]
}

export function isEvidenceDailyBrief(brief: DailyBrief): brief is EvidenceDailyBrief {
  return 'evidenceVersion' in brief && brief.evidenceVersion === 1
}

function duplicateValues(values: readonly string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return duplicates
}

function factAddress(sectionId: string, fact: EvidenceFact) {
  return `${sectionId}/${fact.id}`
}

export function evaluateDailyEvidence(
  brief: DailyBrief,
  path: string,
  legacyDailyPaths: ReadonlySet<string>,
): DailyEvidenceReport {
  if (!isEvidenceDailyBrief(brief)) {
    const errors: EvidenceIntegrityError[] = []
    if (!legacyDailyPaths.has(path)) {
      errors.push({
        code: 'LEGACY_DAILY_NOT_ALLOWLISTED',
        address: path,
        message: `Legacy Daily is not in the frozen migration allowlist: ${path}`,
      })
    }

    return {
      version: 1,
      path,
      publishedAt: brief.publishedAt,
      mode: 'legacy-unverified',
      claimCount: 0,
      boundClaimCount: 0,
      referenceCount: brief.references.length,
      unusedReferenceCount: 0,
      correctionCount: 0,
      errors,
    }
  }

  const errors: EvidenceIntegrityError[] = []
  const referenceIds = brief.references.map((reference) => reference.id)
  const referenceIdSet = new Set(referenceIds)
  const usedReferenceIds = new Set<string>()
  const validClaimAddresses = new Set<string>()
  let claimCount = 0
  let boundClaimCount = 0

  for (const duplicate of duplicateValues(brief.sections.map((section) => section.id))) {
    errors.push({
      code: 'DUPLICATE_SECTION_ID',
      address: `section:${duplicate}`,
      message: `Duplicate section id: ${duplicate}`,
    })
  }

  for (const duplicate of duplicateValues(referenceIds)) {
    errors.push({
      code: 'DUPLICATE_REFERENCE_ID',
      address: `reference:${duplicate}`,
      message: `Duplicate reference id: ${duplicate}`,
    })
  }

  for (const [sectionIndex, section] of brief.sections.entries()) {
    for (const duplicate of duplicateValues(section.facts.map((fact) => fact.id))) {
      errors.push({
        code: 'DUPLICATE_CLAIM_ID',
        address: `${section.id}/${duplicate}`,
        message: `Duplicate fact id within section ${section.id}: ${duplicate}`,
      })
    }

    for (const [factIndex, fact] of section.facts.entries()) {
      claimCount += 1
      const address = factAddress(section.id, fact)
      validClaimAddresses.add(address)

      if (!fact.evidence.length) {
        errors.push({
          code: 'MISSING_EVIDENCE',
          address,
          message: `Fact has no evidence binding at sections[${sectionIndex}].facts[${factIndex}]`,
        })
        continue
      }

      const duplicateEvidence = duplicateValues(fact.evidence)
      for (const duplicate of duplicateEvidence) {
        errors.push({
          code: 'DUPLICATE_EVIDENCE_REFERENCE',
          address,
          message: `Fact repeats evidence reference ${duplicate}`,
        })
      }

      let fullyBound = duplicateEvidence.size === 0
      for (const evidenceId of fact.evidence) {
        usedReferenceIds.add(evidenceId)
        if (!referenceIdSet.has(evidenceId)) {
          fullyBound = false
          errors.push({
            code: 'DANGLING_EVIDENCE_REFERENCE',
            address,
            message: `Fact evidence points to missing reference: ${evidenceId}`,
          })
        }
      }

      if (fullyBound) boundClaimCount += 1
    }
  }

  for (const duplicate of duplicateValues(brief.corrections.map((correction) => correction.id))) {
    errors.push({
      code: 'DUPLICATE_CORRECTION_ID',
      address: `correction:${duplicate}`,
      message: `Duplicate correction id: ${duplicate}`,
    })
  }

  for (const [correctionIndex, correction] of brief.corrections.entries()) {
    if (correction.correctedAt < brief.publishedAt) {
      errors.push({
        code: 'INVALID_CORRECTION_DATE',
        address: `corrections[${correctionIndex}].correctedAt`,
        message: `Correction date ${correction.correctedAt} precedes publishedAt ${brief.publishedAt}`,
      })
    }

    for (const [targetIndex, target] of correction.targets.entries()) {
      const address = `${target.section}/${target.fact}`
      if (!validClaimAddresses.has(address)) {
        errors.push({
          code: 'INVALID_CORRECTION_TARGET',
          address: `corrections[${correctionIndex}].targets[${targetIndex}]`,
          message: `Correction target does not resolve to a fact: ${address}`,
        })
      }
    }

    for (const [evidenceIndex, evidenceId] of correction.evidence.entries()) {
      usedReferenceIds.add(evidenceId)
      if (!referenceIdSet.has(evidenceId)) {
        errors.push({
          code: 'INVALID_CORRECTION_EVIDENCE',
          address: `corrections[${correctionIndex}].evidence[${evidenceIndex}]`,
          message: `Correction evidence points to missing reference: ${evidenceId}`,
        })
      }
    }
  }

  let unusedReferenceCount = 0
  for (const referenceId of referenceIds) {
    if (!usedReferenceIds.has(referenceId)) {
      unusedReferenceCount += 1
      errors.push({
        code: 'UNUSED_REFERENCE',
        address: `reference:${referenceId}`,
        message: `Canonical evidence reference is unused: ${referenceId}`,
      })
    }
  }

  const lastCorrectedAt = brief.corrections.length
    ? [...brief.corrections].map((correction) => correction.correctedAt).sort().at(-1)
    : undefined

  return {
    version: 1,
    path,
    publishedAt: brief.publishedAt,
    mode: 'evidence-v1',
    claimCount,
    boundClaimCount,
    referenceCount: brief.references.length,
    unusedReferenceCount,
    correctionCount: brief.corrections.length,
    lastCorrectedAt,
    errors,
  }
}
