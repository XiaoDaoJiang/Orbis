import type { ChangedEntry } from '../path-guard/change-set.ts'
import { resolveDailyTarget } from './daily-target.ts'

export type ScheduledDailyChangeInput = {
  targetDate: string
  changes: ChangedEntry[]
  baseStatus: string | null
}

export function evaluateScheduledDailyChanges(input: ScheduledDailyChangeInput): string[] {
  const target = resolveDailyTarget(input.targetDate)

  if (input.changes.length !== 1) {
    return [`Scheduled Daily requires exactly one changed entry; found ${input.changes.length}`]
  }

  const change = input.changes[0]
  if (change.status !== 'A' && change.status !== 'M') {
    return [`Scheduled Daily only allows an added exact target; got ${change.status}`]
  }

  if (change.oldPath) {
    return [`Scheduled Daily rename/copy changes are forbidden: ${change.oldPath} -> ${change.path}`]
  }

  if (change.path !== target.contentPath) {
    return [`Scheduled Daily must modify exact target ${target.contentPath}; got ${change.path}`]
  }

  if (input.baseStatus === 'published') {
    return [`Base target ${target.contentPath} is published; correction-required workflow must be used`]
  }

  if (input.baseStatus !== null) {
    return [`Base target ${target.contentPath} already exists with status ${input.baseStatus}; revision-required workflow must be used`]
  }

  if (change.status === 'M') {
    return ['Scheduled Daily target is missing on the base; the PR diff must be A, not M']
  }

  return []
}
