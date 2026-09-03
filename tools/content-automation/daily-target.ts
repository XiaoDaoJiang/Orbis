import { dailyBriefSchema, type DailyBrief } from '@orbis/content-schema'
import type { DailyTarget } from './contracts.ts'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function assertTargetDate(targetDate: string): string {
  if (!DATE_PATTERN.test(targetDate)) {
    throw new Error(`Invalid targetDate: expected YYYY-MM-DD, got ${targetDate || '<empty>'}`)
  }

  const [year, month, day] = targetDate.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day))
  if (
    value.getUTCFullYear() !== year
    || value.getUTCMonth() !== month - 1
    || value.getUTCDate() !== day
  ) {
    throw new Error(`Invalid targetDate calendar date: ${targetDate}`)
  }

  return targetDate
}

export function resolveDailyTarget(targetDate: string): DailyTarget {
  const date = assertTargetDate(targetDate)
  return {
    targetDate: date,
    contentPath: `content/briefs/${date}.yaml`,
    branch: `automation/daily/${date}`,
  }
}

export function assertDailyCandidateIdentity(targetDate: string, source: unknown): DailyBrief {
  const date = assertTargetDate(targetDate)
  const parsed = dailyBriefSchema.safeParse(source)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid Scheduled Daily candidate: ${detail}`)
  }

  if (parsed.data.publishedAt !== date) {
    throw new Error(`Scheduled Daily publishedAt ${parsed.data.publishedAt} must equal targetDate ${date}`)
  }

  return parsed.data
}
