import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const readingHtml = await readFile(resolve(root, 'dist/site/briefs/2026-09-07/index.html'), 'utf8')
const dateAliasHtml = await readFile(resolve(root, 'dist/site/2026/09/07/index.html'), 'utf8')

assert.match(readingHtml, /data-evidence-correction/, 'Corrected Evidence Daily Reading page must expose correction notice')
assert.match(readingHtml, /data-correction-count="1"/, '2026-09-07 must expose exactly one persisted correction event')
assert.match(readingHtml, /已修正 · 2026-09-07/, 'Correction notice must expose the correction date')
assert.match(readingHtml, /data-correction-history/, 'Corrected Evidence Daily must expose correction history')
assert.match(readingHtml, /data-correction-id="openclaw-supervisor-version"/, 'Real PR #33 correction provenance must be present')

const claimMarkers = readingHtml.match(/data-evidence-claim=/g) ?? []
assert.equal(claimMarkers.length, 16, '2026-09-07 must expose all 16 re-verified factual claims')

assert.match(
  readingHtml,
  /id="claim-external-supervision-external-supervisor-mode"/,
  'OpenClaw external supervisor fact must have a stable claim anchor',
)
assert.match(
  readingHtml,
  /id="ref-openclaw-v2026-7-2-beta-2"/,
  'OpenClaw beta release must have a stable reference anchor',
)
assert.match(
  readingHtml,
  /href="#ref-openclaw-v2026-7-2-beta-2"/,
  'Fact evidence must link to the canonical OpenClaw beta reference',
)
assert.match(
  readingHtml,
  /href="#claim-external-supervision-external-supervisor-mode"/,
  'Correction provenance must link back to the affected stable fact',
)
assert.match(readingHtml, /data-reference-id="github-agentic-workflows"/)
assert.match(readingHtml, /data-reference-id="github-mcp-gateway"/)
assert.match(readingHtml, /data-reference-id="github-agentic-workflow-firewall"/)

assert.doesNotMatch(
  readingHtml,
  /rel="canonical" href="[^"]*preview-pr-/,
  'Preview identity must never leak into the Reading canonical URL',
)

assert.match(
  dateAliasHtml,
  /rel="canonical" href="https:\/\/xiaodaojiang\.github\.io\/Orbis\/briefs\/2026-09-07\/"/,
  'Stable Daily date alias must keep the Reading page as canonical identity',
)
assert.match(
  dateAliasHtml,
  /slides\/2026-09-07\//,
  'Stable Daily date alias must continue redirecting to the Daily presentation',
)
assert.doesNotMatch(
  dateAliasHtml,
  /rel="canonical" href="[^"]*preview-pr-/,
  'Preview identity must never leak into the date-alias canonical URL',
)

console.log('Evidence provenance UI artifact contract passed')
