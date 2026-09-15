import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { PresentationSeoManifest } from './presentation-seo.ts'

const root = resolve(import.meta.dirname, '../..')
const slug = 'native-slidev-authoring'
const sourceRoot = resolve(root, `content/presentations/${slug}`)
const generatedRoot = resolve(root, `apps/slides/generated/${slug}`)
const sourcePath = resolve(sourceRoot, 'slides.md')
const importedSourcePath = resolve(sourceRoot, 'sections/why-native.md')
const generatedPath = resolve(generatedRoot, 'slides.md')
const generatedImportedPath = resolve(generatedRoot, 'sections/why-native.md')
const generatedStyle = resolve(generatedRoot, 'orbis.css')
const generatedFavicon = resolve(generatedRoot, 'favicon.svg')
const manifestPath = resolve(generatedRoot, 'seo.json')
const deckPath = resolve(root, `dist/site/slides/${slug}/index.html`)
const discoveryPath = resolve(root, 'dist/site/slides/index.html')

for (const path of [
  generatedPath,
  generatedImportedPath,
  generatedStyle,
  generatedFavicon,
  manifestPath,
  deckPath,
  discoveryPath,
]) {
  await access(path)
}

assert.equal(
  await readFile(generatedPath, 'utf8'),
  await readFile(sourcePath, 'utf8'),
  'Native Slidev Markdown must pass through without template rendering',
)
assert.equal(
  await readFile(generatedImportedPath, 'utf8'),
  await readFile(importedSourcePath, 'utf8'),
  'Native Slidev support files must remain deck-local build inputs',
)

const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PresentationSeoManifest
assert.match(manifest.canonicalUrl, /\/slides\/native-slidev-authoring\/$/)

const deck = await readFile(deckPath, 'utf8')
assert.match(deck, /<html/i)
assert.ok(deck.includes(`rel="canonical" href="${manifest.canonicalUrl}"`), 'Native deck must receive Orbis canonical metadata')
assert.match(deck, /meta name="robots"/)

const discovery = await readFile(discoveryPath, 'utf8')
const card = discovery.match(/<article[^>]*data-presentation-id="native-slidev-authoring"[\s\S]*?<\/article>/)?.[0]
assert.ok(card, 'Slides discovery must include the native Slidev prototype')
assert.match(card, /data-presentation-source="native"/)
assert.match(card, /Native Slidev Authoring in Orbis/)
assert.doesNotMatch(card, /Read brief/)

console.log('Native Slidev published artifact contract passed')
