import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { renderPresentation } from '../../apps/slides/templates/registry.ts'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'
import { discoverPresentationDescriptors } from './discover-presentations.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const outputRoot = resolve(root, config.presentation.generatedDir)
const siteBase = runtimeSiteBase(config)

const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
if (descriptors.length === 0) throw new Error('No published Slidev deck generated')

await rm(outputRoot, { recursive: true, force: true })
let generated = 0

for (const descriptor of descriptors) {
  const directory = resolve(outputRoot, descriptor.slug)
  await mkdir(directory, { recursive: true })
  await cp(resolve(root, 'apps/slides/style.css'), resolve(directory, 'style.css'))
  await cp(resolve(root, 'apps/slides/layouts'), resolve(directory, 'layouts'), { recursive: true })
  await writeFile(
    resolve(directory, 'slides.md'),
    renderPresentation(descriptor, { siteBase }),
    'utf8',
  )

  generated += 1
  console.log(`Generated Slidev deck: ${descriptor.slug} (${descriptor.template}, ${descriptor.sourceKind})`)
}

console.log(`Generated ${generated} presentation(s)`)
