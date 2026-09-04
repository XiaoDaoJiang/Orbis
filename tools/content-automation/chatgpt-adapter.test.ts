import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const adapterPath = resolve('config/adapters/chatgpt-scheduled-daily.md')
assert.equal(existsSync(adapterPath), true, 'ChatGPT Scheduled Daily adapter must exist')

const adapter = await readFile(adapterPath, 'utf8')

assert.match(adapter, /XiaoDaoJiang\/Orbis/, 'Adapter must target Orbis as the repository')
assert.match(adapter, /config\/scheduled-task-prompt\.md/, 'Adapter must delegate to the repository Scheduled Daily contract')
assert.match(adapter, /Asia\/Shanghai/, 'Adapter must use Asia/Shanghai target-date semantics')
assert.match(adapter, /targetDate/, 'Adapter must require explicit targetDate')
assert.match(adapter, /automation\/daily\//, 'Adapter must preserve deterministic Daily branch identity')
assert.match(adapter, /connected GitHub|GitHub connector|GitHub transport/i, 'Adapter must use the connected GitHub transport')
assert.match(adapter, /integration base|integration-base|main target/i, 'Adapter must inspect integration-base state before writing')
assert.match(adapter, /exactly one|one PR|same PR/i, 'Adapter must converge on exactly one deterministic PR')
assert.match(adapter, /must not direct.*main|不得直接.*main|do not.*main/i, 'Adapter must forbid direct main writes')
assert.match(adapter, /must not.*merge|不得.*merge|do not.*merge/i, 'Adapter must forbid automatic merge')
assert.match(adapter, /must not.*Production Pages|不得.*Production Pages|do not.*Production Pages/i, 'Adapter must forbid Production Pages deployment')
assert.match(adapter, /XiaoDaoJiang\/ai-frontier/, 'Adapter must explicitly prohibit the retired ai-frontier repository')
assert.doesNotMatch(adapter, /Mid-Century Modern|固定 11 页|docs\/latest\/|docs\/archive\.json/, 'Thin adapter must not duplicate the retired/editorial HTML publishing contract')

console.log('ChatGPT Scheduled Daily adapter contract passed')
