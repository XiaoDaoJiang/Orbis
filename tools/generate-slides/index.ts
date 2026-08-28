import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, dailyBriefSchema } from '@orbis/content-schema'
import { renderDailyV1 } from '../../apps/slides/templates/daily-v1.ts'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig, runtimeSiteBase } from '../shared/site-config.ts'

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
  const directory = resolve(outputRoot, slug)
  await mkdir(directory, { recursive: true })
  await cp(resolve(root, 'apps/slides/style.css'), resolve(directory, 'style.css'))
  await cp(resolve(root, 'apps/slides/layouts'), resolve(directory, 'layouts'), { recursive: true })

  switch (brief.presentation.template) {
    case 'daily-v1': {
      const daily = dailyBriefSchema.parse(brief)
      await writeFile(resolve(directory, 'slides.md'), renderDailyV1(daily, siteBase), 'utf8')
      break
    }
    default:
      throw new Error(`Unsupported presentation template: ${brief.presentation.template}`)
  }

  generated += 1
  console.log(`Generated Slidev deck: ${slug} (${brief.presentation.template})`)
}

if (generated === 0) throw new Error('No published Slidev deck generated')
console.log(`Generated ${generated} presentation(s)`)
