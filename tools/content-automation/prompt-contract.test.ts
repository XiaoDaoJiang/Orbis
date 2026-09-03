import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const daily = await readFile('config/daily-task-prompt.md', 'utf8')
const scheduled = await readFile('config/scheduled-task-prompt.md', 'utf8')

for (const [name, text] of [['daily-task-prompt', daily], ['scheduled-task-prompt', scheduled]] as const) {
  assert.match(text, /targetDate/, `${name} must require an explicit targetDate`)
  assert.match(text, /Asia\/Shanghai/, `${name} must keep Asia/Shanghai date semantics explicit`)
  assert.match(text, /automation\/daily\/YYYY-MM-DD/, `${name} must document the deterministic automation branch`)
  assert.match(text, /content\/briefs\/YYYY-MM-DD\.yaml/, `${name} must document the exact Daily target path`)
  assert.match(text, /already-published/, `${name} must define the published-main no-write outcome`)
  assert.match(text, /correction/i, `${name} must route published corrections explicitly`)
}

assert.doesNotMatch(
  daily,
  /若存在则更新该 structured Brief/,
  'Daily prompt must not instruct Scheduled Daily to silently update an existing main target',
)
assert.doesNotMatch(
  scheduled,
  /同日期已存在则更新/,
  'Scheduled entry prompt must not silently overwrite an existing main target',
)

console.log('Scheduled Daily prompt idempotency contract passed')
