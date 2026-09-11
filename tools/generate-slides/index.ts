import { cp, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { renderPresentation } from '../../apps/slides/templates/registry.ts'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'
import {
  parsePresentationScope,
  preparePresentationOutput,
  selectPresentationIds,
} from '../shared/presentation-scope.ts'
import { discoverPresentationDescriptors } from './discover-presentations.ts'
import { buildPresentationSeoManifest } from './presentation-seo.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const outputRoot = resolve(root, config.presentation.generatedDir)
const siteBase = runtimeSiteBase(config)

const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
if (descriptors.length === 0) throw new Error('No published Slidev deck generated')

const scope = parsePresentationScope(process.argv.slice(2))
const selectedIds = selectPresentationIds(descriptors.map((descriptor) => descriptor.slug), scope)
const selected = selectedIds.map((id) => descriptors.find((descriptor) => descriptor.slug === id)!)

await preparePresentationOutput(outputRoot, selectedIds, scope)

for (const descriptor of selected) {
  const directory = resolve(outputRoot, descriptor.slug)
  await mkdir(directory, { recursive: true })
  await cp(resolve(root, 'apps/slides/style.css'), resolve(directory, 'style.css'))
  await cp(resolve(root, 'apps/slides/layouts'), resolve(directory, 'layouts'), { recursive: true })
  await writeFile(
    resolve(directory, 'slides.md'),
    renderPresentation(descriptor, { siteBase }),
    'utf8',
  )
  await writeFile(
    resolve(directory, 'seo.json'),
    `${JSON.stringify(buildPresentationSeoManifest(descriptor, config), null, 2)}\n`,
    'utf8',
  )

  console.log(`Generated Slidev deck: ${descriptor.slug} (${descriptor.template}, ${descriptor.sourceKind})`)
}

console.log(`Generated ${selected.length} presentation(s) [scope=${scope.mode}]`)
