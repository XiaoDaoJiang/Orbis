import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'
import { discoverPresentationDescriptors } from './discover-presentations.ts'
import { buildPresentationSeoManifest } from './presentation-seo.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const descriptors = await discoverPresentationDescriptors({
  root,
  siteBase: runtimeSiteBase(config),
  config,
})

const descriptor = descriptors.find((candidate) => candidate.slug === 'native-slidev-authoring')
assert.ok(descriptor, 'Native Slidev prototype must be discoverable')
assert.equal(descriptor.sourceKind, 'native')
assert.equal(descriptor.template, 'native-slidev')
assert.equal(descriptor.nativeSourceDir, 'content/presentations/native-slidev-authoring')
assert.equal(descriptor.title, 'Native Slidev Authoring in Orbis')
assert.deepEqual(descriptor.topics, ['agent-harness', 'coding-agent'])

const source = await readFile(resolve(root, descriptor.nativeSourceDir, 'slides.md'), 'utf8')
assert.match(source, /<v-clicks>/)
assert.match(source, /layout: two-cols/)
assert.match(source, /css: \.\/orbis\.css/)

const seo = buildPresentationSeoManifest(descriptor, config)
assert.match(seo.canonicalUrl, /\/slides\/native-slidev-authoring\/$/)

console.log('Native Slidev presentation descriptor contract passed')
