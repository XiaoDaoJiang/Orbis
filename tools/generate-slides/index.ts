import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { renderPresentation } from '../../apps/slides/templates/registry.ts'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const sourceDir = resolve(root, config.content.briefsDir)
const outputRoot = resolve(root, config.presentation.generatedDir)
const siteBase = runtimeSiteBase(config)

await rm(outputRoot, { recursive: true, force: true })
const files = await listFiles(sourceDir, ['.yaml', '.yml'])
let generated = 0

for (const file of files) {
  const brief = briefSchema.parse(await readYaml(file))
  if (!brief.presentation.enabled || brief.status !== 'published') continue

  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const readingUrl = `${joinBasePath(siteBase, 'briefs', slug)}/`
  const descriptor = toBriefPresentationDescriptor(brief, { slug, readingUrl })
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
  console.log(`Generated Slidev deck: ${descriptor.slug} (${descriptor.template})`)
}

if (generated === 0) throw new Error('No published Slidev deck generated')
console.log(`Generated ${generated} presentation(s)`)
