import assert from 'node:assert/strict'
import { parse, stringify } from 'yaml'
import { assertDailyCandidateIdentity } from './daily-target.ts'

/** Serialize producer JSON, never interpolate external text into YAML scalars. */
export function serializeDailyCandidate(targetDate: string, source: unknown): string {
  assertDailyCandidateIdentity(targetDate, source)
  const yaml = stringify(source, { defaultStringType: 'QUOTE_DOUBLE', lineWidth: 0 })
  const roundTrip: unknown = parse(yaml)
  // Check the original object, rather than schema output which may add defaults.
  assert.deepEqual(roundTrip, source, 'Daily YAML serialization must preserve every value and type')
  assertDailyCandidateIdentity(targetDate, roundTrip)
  return yaml
}
