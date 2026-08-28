import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const siteBase = runtimeSiteBase(config)

const required = [
  'dist/site/index.html',
  'dist/site/essays/agent-harness-system-layer/index.html',
  'dist/site/topics/agent-harness/index.html',
  'dist/site/knowledge/verification-loop/index.html',
  'dist/site/rss.xml',
  'dist/site/favicon.svg',
]

for (const file of required) {
  await access(resolve(root, file))
  console.log(`✓ ${file}`)
}

const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])
let publishedDecks = 0
for (const file of briefFiles) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status !== 'published') continue

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  await access(resolve(root, `dist/site/briefs/${slug}/index.html`))
  console.log(`✓ dist/site/briefs/${slug}/index.html`)

  if (!brief.presentation.enabled) continue
  publishedDecks += 1
  const deckPath = resolve(root, `dist/site/slides/${slug}/index.html`)
  const sourcePath = resolve(root, `${config.presentation.generatedDir}/${slug}/slides.md`)
  await access(deckPath)
  await access(sourcePath)

  const deck = await readFile(deckPath, 'utf8')
  const slideSource = await readFile(sourcePath, 'utf8')
  assert.match(deck, /<html/i)
  assert.doesNotMatch(deck, /cdn\.jsdelivr\.net\/gh\/slidevjs\/slidev\/assets\/favicon\.png/)
  assert.match(slideSource, new RegExp(`favicon: ["']?${siteBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/favicon\\.svg`))

  if (brief.presentation.template === 'daily-v1') {
    const frontmatterMarkers = slideSource.match(/^---$/gm) ?? []
    assert.equal(frontmatterMarkers.length, 22, `${slug} daily-v1 must contain exactly 11 slides`)
    assert.match(slideSource, /FOUR SIGNALS/)
    assert.match(slideSource, /FROM SIGNALS TO ACTION/)
    assert.match(slideSource, /EXTENDED READING/)
  }
  console.log(`✓ slides/${slug} (${brief.presentation.template})`)
}

assert.ok(publishedDecks > 0, 'At least one published presentation is required')
const home = await readFile(resolve(root, 'dist/site/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
assert.match(home, /ORBIS/i)
assert.match(rss, /<rss/)
console.log(`Prototype artifact checks passed for ${publishedDecks} published presentation(s)`)
