import assert from 'node:assert/strict'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { discoverPresentationDescriptors } from '../generate-slides/discover-presentations.ts'
import { runPnpm } from '../shared/process.ts'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const generatedRoot = resolve(root, config.presentation.generatedDir)
const outputRoot = resolve(root, config.presentation.outputDir)
const siteBase = runtimeSiteBase(config)
const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
const target = descriptors[0]?.slug
if (!target) throw new Error('Scoped presentation integration requires at least one published presentation')

const preservedId = 'zz-orbis-preserved-slide-cache'
const generatedSentinel = resolve(generatedRoot, preservedId, 'sentinel.txt')
const outputSentinel = resolve(outputRoot, preservedId, 'sentinel.txt')

try {
  await mkdir(resolve(generatedRoot, preservedId), { recursive: true })
  await writeFile(generatedSentinel, 'generated-cache', 'utf8')

  const generated = await runPnpm(['generate:slides'], {
    cwd: root,
    capture: true,
    env: { SLIDES_IDS: target },
  })
  assert.match(generated.output, new RegExp(`Generated Slidev deck: ${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  assert.match(generated.output, /Generated 1 presentation\(s\) \[scope=ids\]/)
  assert.equal(await readFile(generatedSentinel, 'utf8'), 'generated-cache', 'Scoped generation must preserve unrelated generated decks')
  await access(resolve(generatedRoot, target, 'slides.md'))
  await access(resolve(generatedRoot, target, 'seo.json'))

  await mkdir(resolve(outputRoot, preservedId), { recursive: true })
  await writeFile(outputSentinel, 'built-cache', 'utf8')

  const built = await runPnpm(['build:slides'], {
    cwd: root,
    capture: true,
    env: { SLIDES_IDS: target },
  })
  assert.match(built.output, new RegExp(`Built Slidev deck: ${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  assert.match(built.output, /Built 1 presentation\(s\) \[scope=ids\]/)
  assert.equal(await readFile(outputSentinel, 'utf8'), 'built-cache', 'Scoped build must preserve unrelated built decks')
  await access(resolve(outputRoot, target, 'index.html'))

  console.log(`Scoped Slidev generate/build integration passed: ${target}`)
} finally {
  await rm(generatedRoot, { recursive: true, force: true })
  await rm(outputRoot, { recursive: true, force: true })
}
