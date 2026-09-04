import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/content-automation/daily-decision.ts')
assert.equal(existsSync(helperPath), true, 'Scheduled Daily decision helper must exist')

const decision = await import(pathToFileURL(helperPath).href)
assert.equal(typeof decision.decideDailyAutomation, 'function')

assert.equal(decision.decideDailyAutomation({
  baseStatus: null,
  candidateOwnership: 'none',
}), 'create-candidate')

assert.equal(decision.decideDailyAutomation({
  baseStatus: null,
  candidateOwnership: 'owned-open',
  candidateStatus: 'published',
}), 'update-open-candidate', 'Feature-branch published status is still only a candidate when base is missing')

assert.equal(decision.decideDailyAutomation({
  baseStatus: 'draft',
  candidateOwnership: 'none',
}), 'revision-required')

assert.equal(decision.decideDailyAutomation({
  baseStatus: 'needs-review',
  candidateOwnership: 'none',
}), 'revision-required')

assert.equal(decision.decideDailyAutomation({
  baseStatus: 'published',
  candidateOwnership: 'none',
}), 'already-published')

assert.equal(decision.decideDailyAutomation({
  baseStatus: 'published',
  candidateOwnership: 'none',
  attemptingBaseModification: true,
}), 'correction-required')

assert.equal(decision.decideDailyAutomation({
  baseStatus: null,
  candidateOwnership: 'unowned-open',
}), 'blocked')

assert.equal(decision.decideDailyAutomation({
  baseStatus: 'published',
  candidateOwnership: 'unowned-open',
}), 'blocked', 'Conflicting candidate ownership fails closed even when base is already published')

console.log('Scheduled Daily decision contract passed')
