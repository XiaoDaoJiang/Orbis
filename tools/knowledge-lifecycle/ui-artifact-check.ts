import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const indexHtml = await readFile(resolve(root, 'dist/site/knowledge/index.html'), 'utf8')
const detailHtml = await readFile(resolve(root, 'dist/site/knowledge/verification-loop/index.html'), 'utf8')

assert.match(indexHtml, /data-knowledge-lifecycle-summary/, 'Knowledge index must expose lifecycle summary')
assert.match(indexHtml, /data-current-count="\d+"/, 'Knowledge lifecycle summary must expose current count')
assert.match(indexHtml, /data-attention-count="\d+"/, 'Knowledge lifecycle summary must expose attention count')
assert.match(indexHtml, /data-historical-count="\d+"/, 'Knowledge lifecycle summary must expose historical count')
assert.match(indexHtml, /data-knowledge-section="current"/)
assert.match(indexHtml, /data-knowledge-section="attention"/)
assert.match(indexHtml, /data-knowledge-section="recently-updated"/)
assert.match(indexHtml, /data-knowledge-section="historical"/)

assert.match(detailHtml, /data-knowledge-lifecycle/, 'Knowledge detail must expose lifecycle metadata')
assert.match(detailHtml, /data-editorial-status="active"/)
assert.match(detailHtml, /data-review-health="(?:current|due-soon|overdue)"/)
assert.match(detailHtml, /Next review · 2026-11-01/)
assert.match(detailHtml, /<link rel="canonical" href="https:\/\/xiaodaojiang\.github\.io\/Orbis\/knowledge\/verification-loop\/"/)
assert.match(detailHtml, /"@type":"TechArticle"/, 'Existing Knowledge structured data must remain TechArticle')
assert.doesNotMatch(detailHtml, /rel="canonical" href="[^"]*preview-pr-/, 'Preview identity must not leak into canonical')

console.log('Knowledge lifecycle UI artifact contract passed')
