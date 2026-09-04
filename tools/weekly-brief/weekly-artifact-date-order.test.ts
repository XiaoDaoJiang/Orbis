import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const source = await readFile(resolve(root, 'tools/weekly-brief/weekly-artifact-check.ts'), 'utf8')

assert.doesNotMatch(
  source,
  /latestWeekly\.brief\.publishedAt\s*>\s*latestDaily\.brief\.publishedAt/,
  'Weekly artifact verification must not require real Weekly content to be newer than real Daily content',
)
assert.match(
  source,
  /const latestBrief = \[\.\.\.daily, \.\.\.weekly\]/,
  'Homepage latest Brief verification must derive ordering across published Daily and Weekly content',
)
assert.match(
  source,
  /archiveJson\.latest, latestDaily\.brief\.publishedAt/,
  'Daily-only archive latest verification must remain anchored to the newest Daily',
)
assert.match(
  source,
  /expectedLatestTarget/,
  'Daily-only /latest/ verification must remain present',
)

console.log('Weekly artifact real-date-order regression contract passed')
