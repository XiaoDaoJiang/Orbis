import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { PresentationSeoManifest } from './presentation-seo.ts'

const root = resolve(import.meta.dirname, '../..')
const slug = 'native-slidev-authoring'
const sourcePath = resolve(root, `content/presentations/${slug}/slides.md`)
const generatedPath = resolve(root, `apps/slides/generated/${slug}/slides.md`)
const generatedStyle = resolve(root, `apps/slides/generated/${slug}/orbis.css`)
const generatedFavicon = resolve(root, `apps/slides/generated/${slug}/favicon.svg`)
const manifestPath = resolve(root, `apps/slides/generated/${slug}/seo.json`)
const deckPath = resolve(root, `dist/site/slides/${slug}/index.html`)
const discoveryPath = resolve(root, 'dist/site/slides/index.html')

for (const path of [generatedPath, generatedStyle, generatedFavicon, manifestPath, deckPath, discoveryPath]) {
  await access(path)
}

assert.equal(
  await readFile(generatedPath, 'utf8'),
  await readFile(sourcePath, 'utf8'),
  'Native Slidev Markdown must pass through without template rendering',
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
