export interface AssociatedPullRequest {
  baseRef: string
  mergedAt: string | null
  mergeCommitSha: string | null
}

export interface PromotionEligibilityInput {
  sourceConclusion: string | null
  sourceEvent: string
  sourceBranch: string
  sourceSha: string
  currentMainSha: string
  associatedPullRequests: AssociatedPullRequest[]
}

export type PromotionEligibilityReason =
  | 'eligible'
  | 'source-not-successful'
  | 'source-not-push'
  | 'source-not-main'
  | 'stale-main'
  | 'missing-merged-pr'
  | 'ambiguous-merged-pr'
  | 'merge-sha-mismatch'

export interface PromotionEligibilityDecision {
  eligible: boolean
  reason: PromotionEligibilityReason
}

export function evaluatePromotionEligibility(
  input: PromotionEligibilityInput,
): PromotionEligibilityDecision {
  if (input.sourceConclusion !== 'success') {
    return { eligible: false, reason: 'source-not-successful' }
  }

  if (input.sourceEvent !== 'push') {
    return { eligible: false, reason: 'source-not-push' }
  }

  if (input.sourceBranch !== 'main') {
    return { eligible: false, reason: 'source-not-main' }
  }

  if (input.sourceSha !== input.currentMainSha) {
    return { eligible: false, reason: 'stale-main' }
  }

  const mergedToMain = input.associatedPullRequests.filter(
    (pr) => pr.baseRef === 'main' && pr.mergedAt !== null,
  )

  if (mergedToMain.length === 0) {
    return { eligible: false, reason: 'missing-merged-pr' }
  }

  if (mergedToMain.length > 1) {
    return { eligible: false, reason: 'ambiguous-merged-pr' }
  }

  if (mergedToMain[0].mergeCommitSha !== input.sourceSha) {
    return { eligible: false, reason: 'merge-sha-mismatch' }
  }

  return { eligible: true, reason: 'eligible' }
}
