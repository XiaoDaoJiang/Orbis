import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const required = [
  'dist/site/index.html',
  'dist/site/briefs/2026-08-28/index.html',
  'dist/site/essays/agent-harness-system-layer/index.html',
  'dist/site/topics/agent-harness/index.html',
  'dist/site/knowledge/verification-loop/index.html',
  'dist/site/rss.xml',
  'dist/site/favicon.svg',
  'dist/site/slides/2026-08-28/index.html',
  'apps/slides/generated/2026-08-28/slides.md',
]
for (const file of required) {
  await access(resolve(root, file))
  console.log(`✓ ${file}`)
}
const home = await readFile(resolve(root, 'dist/site/index.html'), 'utf8')
const brief = await readFile(resolve(root, 'dist/site/briefs/2026-08-28/index.html'), 'utf8')
const deck = await readFile(resolve(root, 'dist/site/slides/2026-08-28/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
const slideSource = await readFile(resolve(root, 'apps/slides/generated/2026-08-28/slides.md'), 'utf8')
const frontmatterMarkers = slideSource.match(/^---$/gm) ?? []

assert.match(home, /ORBIS/i)
assert.match(brief, /Harness 正在成为模型之外的能力层/)
assert.match(deck, /Orbis|Harness/i)
assert.match(deck, /\/Orbis\/favicon\.svg/)
assert.doesNotMatch(deck, /cdn\.jsdelivr\.net\/gh\/slidevjs\/slidev\/assets\/favicon\.png/)
assert.match(rss, /<rss/)
assert.equal(frontmatterMarkers.length, 22, 'The daily-v1 prototype must contain exactly 11 slides')
assert.match(slideSource, /FOUR SIGNALS/)
assert.match(slideSource, /FROM SIGNALS TO ACTION/)
assert.match(slideSource, /EXTENDED READING/)
assert.match(slideSource, /favicon: \/Orbis\/favicon\.svg/)
console.log('Prototype artifact checks passed with exactly 11 slides and a local favicon')
