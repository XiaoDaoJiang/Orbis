import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const adapterPath = resolve('config/adapters/chatgpt-scheduled-daily.md')
assert.equal(existsSync(adapterPath), true, 'ChatGPT Scheduled Daily adapter must exist')

const adapter = await readFile(adapterPath, 'utf8')
const feeds = await readFile('config/feeds.yaml', 'utf8')

assert.match(adapter, /XiaoDaoJiang\/Orbis/, 'Adapter must target Orbis as the repository')
assert.match(adapter, /config\/scheduled-task-prompt\.md/, 'Adapter must delegate to the repository Scheduled Daily contract')
assert.match(adapter, /Asia\/Shanghai/, 'Adapter must use Asia/Shanghai target-date semantics')
assert.match(adapter, /targetDate/, 'Adapter must require explicit targetDate')
assert.match(adapter, /automation\/daily\//, 'Adapter must preserve deterministic Daily branch identity')
assert.match(adapter, /connected GitHub|GitHub connector|GitHub transport/i, 'Adapter must use the connected GitHub transport')
assert.match(adapter, /integration base|integration-base|main target/i, 'Adapter must inspect integration-base state before writing')
assert.match(adapter, /exactly one|one PR|same PR/i, 'Adapter must converge on exactly one deterministic PR')
assert.match(adapter, /Native Feed Discovery/, 'Adapter must prefer the repository-owned feed ingestion capability when executable')
assert.match(adapter, /pnpm discovery:feeds/, 'Adapter must document the Native Feed Discovery command')
assert.match(adapter, /runtime\/feed-discovery/, 'Adapter must use the dedicated runtime discovery snapshot branch when repository execution is unavailable')
assert.match(adapter, /path = latest\.json/, 'Adapter must use the stable runtime snapshot path')
assert.match(adapter, /no more than \*\*6 hours\*\* old/, 'Adapter must enforce snapshot freshness')
assert.match(adapter, /meetsMinimumFeeds == true/, 'Adapter must reject snapshots that do not satisfy feed minimums')
assert.match(adapter, /feed discovery: native-feed-snapshot/, 'Adapter must report snapshot transport truthfully')
assert.match(adapter, /not a source of final evidence/, 'Adapter must keep discovery snapshots separate from evidence')
assert.match(adapter, /application\/rss\+xml/, 'Adapter must retain a provider fallback for RSS MIME incompatibility')
assert.match(adapter, /same-source-html/, 'Adapter fallback must preserve subscribed-source discovery when native execution and snapshot transport are unavailable')
assert.match(adapter, /must never be reported as successful raw RSS retrieval/i, 'Adapter must not misreport HTML fallback as RSS success')
assert.match(adapter, /older than the configured lookback window is stale/i, 'Adapter must reject stale feed fallbacks')
assert.match(feeds, /discovery_fallback:/, 'Enabled feed must define a same-source discovery fallback')
assert.match(feeds, /mode:\s*same-source-html/, 'Feed fallback must remain on the same subscribed source')
assert.match(feeds, /counts_as_rss_success:\s*false/, 'HTML fallback must not be counted as raw RSS success')
assert.doesNotMatch(feeds, /imjuya\.github\.io\/juya-ai-daily\/rss\.xml/, 'Stale legacy RSS fallback must not be restored')
assert.match(adapter, /must not direct.*main|不得直接.*main|do not.*main/i, 'Adapter must forbid direct main writes')
assert.match(adapter, /must not.*merge|不得.*merge|do not.*merge/i, 'Adapter must forbid automatic merge')
assert.match(adapter, /must not.*Production Pages|不得.*Production Pages|do not.*Production Pages/i, 'Adapter must forbid Production Pages deployment')
assert.match(adapter, /XiaoDaoJiang\/ai-frontier/, 'Adapter must explicitly prohibit the retired ai-frontier repository')
assert.doesNotMatch(adapter, /Mid-Century Modern|固定 11 页|docs\/latest\/|docs\/archive\.json/, 'Thin adapter must not duplicate the retired/editorial HTML publishing contract')

console.log('ChatGPT Scheduled Daily adapter contract passed')
