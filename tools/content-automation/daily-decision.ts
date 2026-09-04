export type CandidateOwnership = 'none' | 'owned-open' | 'unowned-open'

export type DailyRepositoryDecision =
  | 'create-candidate'
  | 'update-open-candidate'
  | 'revision-required'
  | 'already-published'
  | 'correction-required'
  | 'blocked'

export type DailyDecisionInput = {
  baseStatus: string | null
  candidateOwnership: CandidateOwnership
  candidateStatus?: string
  attemptingBaseModification?: boolean
}

export function decideDailyAutomation(input: DailyDecisionInput): DailyRepositoryDecision {
  if (input.candidateOwnership === 'unowned-open') return 'blocked'

  if (input.baseStatus === 'published') {
    return input.attemptingBaseModification
      ? 'correction-required'
      : 'already-published'
  }

  if (input.baseStatus !== null) return 'revision-required'
  if (input.candidateOwnership === 'owned-open') return 'update-open-candidate'
  return 'create-candidate'
}
