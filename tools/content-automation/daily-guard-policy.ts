import type { ChangedEntry } from '../path-guard/change-set.ts'
import { resolveDailyTarget } from './daily-target.ts'

export type ScheduledDailyChangeInput = {
  targetDate: string
  changes: ChangedEntry[]
  baseStatus: string | null
}

export function evaluateScheduledDailyChanges(input: ScheduledDailyChangeInput): string[] {
  const target = resolveDailyTarget(input.targetDate)
  const violations: string[] = []

  if (input.changes.length !== 1) {
    return [`Scheduled Daily requires exactly one changed entry; found ${input.changes.length}`]
  }

  const change = input.changes[0]
  if (change.status !== 'A' && change.status !== 'M') {
    violations.push(`Scheduled Daily only allows A/M status for the exact target; got ${change.status}`)
    return violations
  }

  if (change.oldPath) {
    violations.push(`Scheduled Daily rename/copy changes are forbidden: ${change.oldPath} -> ${change.path}`)
  }

  if (change.path !== target.contentPath) {
    violations.push(`Scheduled Daily must modify exact target ${target.contentPath}; got ${change.path}`)
  }

  if (input.baseStatus === 'published') {
    violations.push(`Base target ${target.contentPath} is published; correction-required workflow must be used`)
    return violations
  }

  if (change.status === 'A' && input.baseStatus !== null) {
    violations.push(`A status requires the base target to be missing; base status is ${input.baseStatus}`)
  }

  if (change.status === 'M' && input.baseStatus === null) {
    violations.push('M status requires an existing non-published base target; base target is missing')
  }

  return violations
}
