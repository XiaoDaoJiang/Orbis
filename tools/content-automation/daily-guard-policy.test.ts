import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/content-automation/daily-guard-policy.ts')
assert.equal(existsSync(helperPath), true, 'Scheduled Daily exact diff helper must exist')

const guard = await import(pathToFileURL(helperPath).href)
assert.equal(typeof guard.evaluateScheduledDailyChanges, 'function')

const targetDate = '2026-09-03'
const target = 'content/briefs/2026-09-03.yaml'

const pass = (changes: unknown[], baseStatus: string | null = null) => {
  assert.deepEqual(guard.evaluateScheduledDailyChanges({ targetDate, changes, baseStatus }), [])
}
const fail = (changes: unknown[], pattern: RegExp, baseStatus: string | null = null) => {
  const violations = guard.evaluateScheduledDailyChanges({ targetDate, changes, baseStatus }) as string[]
  assert.ok(violations.length > 0, `Expected violations for ${JSON.stringify(changes)}`)
  assert.match(violations.join('\n'), pattern)
}

pass([{ status: 'A', path: target }])
pass([{ status: 'M', path: target }], 'draft')
pass([{ status: 'M', path: target }], 'needs-review')

fail([{ status: 'D', path: target }], /delet|status|A\/M/i)
fail([{ status: 'R100', oldPath: target, path: 'content/briefs/2026-09-04.yaml' }], /rename|copy|status|exact/i)
fail([{ status: 'R100', oldPath: 'content/briefs/2026-09-04.yaml', path: target }], /rename|copy|status|exact/i)
fail([{ status: 'C100', oldPath: 'content/briefs/source.yaml', path: target }], /rename|copy|status|exact/i)
fail([{ status: 'A', path: 'content/briefs/2026-09-04.yaml' }], /exact|target|2026-09-03/i)
fail([{ status: 'A', path: target }, { status: 'M', path: 'config/site.yaml' }], /exactly one|one changed/i)
fail([{ status: 'A', path: target }, { status: 'A', path: 'content/briefs/2026-09-04.yaml' }], /exactly one|one changed/i)
fail([{ status: 'M', path: target }], /published|correction-required/i, 'published')
fail([{ status: 'A', path: target }], /base|existing|status/i, 'draft')
fail([{ status: 'M', path: target }], /base|missing|status/i, null)

console.log('Scheduled Daily exact diff contract passed')
