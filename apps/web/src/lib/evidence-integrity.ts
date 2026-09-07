import type { DailyBrief, EvidenceDailyBrief } from '@orbis/content-schema'

export function isEvidenceDailyBrief(brief: DailyBrief): brief is EvidenceDailyBrief {
  return 'evidenceVersion' in brief && brief.evidenceVersion === 1
}

export function claimAnchorId(sectionId: string, factId: string) {
  return `claim-${sectionId}-${factId}`
}

export function referenceAnchorId(referenceId: string) {
  return `ref-${referenceId}`
}

export function correctionHistory(brief: EvidenceDailyBrief) {
  return [...brief.corrections].sort((left, right) => {
    const byDate = left.correctedAt.localeCompare(right.correctedAt)
    return byDate || left.id.localeCompare(right.id)
  })
}

export function latestCorrection(brief: EvidenceDailyBrief) {
  return correctionHistory(brief).at(-1)
}
