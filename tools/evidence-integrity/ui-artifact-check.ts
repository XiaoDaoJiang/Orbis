import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const dailyHtml = await readFile(resolve(root, 'dist/site/2026/09/07/index.html'), 'utf8')

assert.match(dailyHtml, /data-evidence-correction/, 'Corrected Evidence Daily must expose correction notice')
assert.match(dailyHtml, /data-correction-count="1"/, '2026-09-07 must expose exactly one persisted correction event')
assert.match(dailyHtml, /已修正 · 2026-09-07/, 'Correction notice must expose the correction date')
assert.match(dailyHtml, /data-correction-history/, 'Corrected Evidence Daily must expose correction history')
assert.match(dailyHtml, /data-correction-id="openclaw-supervisor-version"/, 'Real PR #33 correction provenance must be present')

const claimMarkers = dailyHtml.match(/data-evidence-claim=/g) ?? []
assert.equal(claimMarkers.length, 16, '2026-09-07 must expose all 16 re-verified factual claims')

assert.match(
  dailyHtml,
  /id="claim-external-supervision-external-supervisor-mode"/,
  'OpenClaw external supervisor fact must have a stable claim anchor',
)
assert.match(
  dailyHtml,
  /id="ref-openclaw-v2026-7-2-beta-2"/,
  'OpenClaw beta release must have a stable reference anchor',
)
assert.match(
  dailyHtml,
  /href="#ref-openclaw-v2026-7-2-beta-2"/,
  'Fact evidence must link to the canonical OpenClaw beta reference',
)
assert.match(
  dailyHtml,
  /href="#claim-external-supervision-external-supervisor-mode"/,
  'Correction provenance must link back to the affected stable fact',
)
assert.match(dailyHtml, /data-reference-id="github-agentic-workflows"/)
assert.match(dailyHtml, /data-reference-id="github-mcp-gateway"/)
assert.match(dailyHtml, /data-reference-id="github-agentic-workflow-firewall"/)

assert.doesNotMatch(
  dailyHtml,
  /rel="canonical" href="[^"]*preview-pr-/,
  'Preview identity must never leak into the Daily canonical URL',
)

console.log('Evidence provenance UI artifact contract passed')
