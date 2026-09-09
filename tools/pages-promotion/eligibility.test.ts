import assert from 'node:assert/strict'
import {
  evaluatePromotionEligibility,
  type PromotionEligibilityInput,
} from './eligibility.ts'

const sha = '1111111111111111111111111111111111111111'
const otherSha = '2222222222222222222222222222222222222222'

const valid: PromotionEligibilityInput = {
  sourceConclusion: 'success',
  sourceEvent: 'push',
  sourceBranch: 'main',
  sourceSha: sha,
  currentMainSha: sha,
  associatedPullRequests: [
    {
      baseRef: 'main',
      mergedAt: '2026-09-09T00:00:00Z',
      mergeCommitSha: sha,
    },
  ],
}

assert.deepEqual(evaluatePromotionEligibility(valid), {
  eligible: true,
  reason: 'eligible',
})

assert.deepEqual(
  evaluatePromotionEligibility({ ...valid, sourceConclusion: 'failure' }),
  { eligible: false, reason: 'source-not-successful' },
)

assert.deepEqual(
  evaluatePromotionEligibility({ ...valid, sourceEvent: 'workflow_dispatch' }),
  { eligible: false, reason: 'source-not-push' },
)

assert.deepEqual(
  evaluatePromotionEligibility({ ...valid, sourceBranch: 'feature/example' }),
  { eligible: false, reason: 'source-not-main' },
)

assert.deepEqual(
  evaluatePromotionEligibility({ ...valid, currentMainSha: otherSha }),
  { eligible: false, reason: 'stale-main' },
)

assert.deepEqual(
  evaluatePromotionEligibility({ ...valid, associatedPullRequests: [] }),
  { eligible: false, reason: 'missing-merged-pr' },
)

assert.deepEqual(
  evaluatePromotionEligibility({
    ...valid,
    associatedPullRequests: [
      valid.associatedPullRequests[0],
      {
        baseRef: 'main',
        mergedAt: '2026-09-09T00:01:00Z',
        mergeCommitSha: sha,
      },
    ],
  }),
  { eligible: false, reason: 'ambiguous-merged-pr' },
)

assert.deepEqual(
  evaluatePromotionEligibility({
    ...valid,
    associatedPullRequests: [
      {
        baseRef: 'main',
        mergedAt: '2026-09-09T00:00:00Z',
        mergeCommitSha: otherSha,
      },
    ],
  }),
  { eligible: false, reason: 'merge-sha-mismatch' },
)

assert.deepEqual(
  evaluatePromotionEligibility({
    ...valid,
    associatedPullRequests: [
      {
        baseRef: 'feature/base',
        mergedAt: '2026-09-09T00:00:00Z',
        mergeCommitSha: sha,
      },
    ],
  }),
  { eligible: false, reason: 'missing-merged-pr' },
)

assert.deepEqual(
  evaluatePromotionEligibility({
    ...valid,
    associatedPullRequests: [
      {
        baseRef: 'main',
        mergedAt: null,
        mergeCommitSha: sha,
      },
    ],
  }),
  { eligible: false, reason: 'missing-merged-pr' },
)

console.log('Merge-gated Production eligibility policy contract passed')
