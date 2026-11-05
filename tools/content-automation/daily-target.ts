import { evidenceDailyBriefSchema, type EvidenceDailyBrief } from '@orbis/content-schema'

import { assertTargetDate } from './daily-automation-contract.mjs'
export { assertTargetDate, resolveDailyTarget } from './daily-automation-contract.mjs'

export function assertDailyCandidateIdentity(targetDate: string, source: unknown): EvidenceDailyBrief {
  const date = assertTargetDate(targetDate)
  const parsed = evidenceDailyBriefSchema.safeParse(source)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid Scheduled Daily Evidence V1 candidate: ${detail}`)
  }

  if (parsed.data.publishedAt !== date) {
    throw new Error(`Scheduled Daily publishedAt ${parsed.data.publishedAt} must equal targetDate ${date}`)
  }

  return parsed.data
}
