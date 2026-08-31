import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { presentationContentSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadSiteConfig } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const archive = await readFile(resolve(root, 'dist/site/archive/index.html'), 'utf8')
const rss = await readFile(resolve(root, 'dist/site/rss.xml'), 'utf8')
const files = await listFiles(resolve(root, config.content.presentationsDir), ['.yaml', '.yml'])
let published = 0

for (const file of files) {
  const presentation = presentationContentSchema.parse(await readYaml(file))
  if (presentation.status !== 'published') continue
  published += 1
  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  assert.ok(!archive.includes(presentation.title), `Standalone Presentation ${slug} must not enter generic Archive discovery`)
  assert.ok(!rss.includes(presentation.title), `Standalone Presentation ${slug} must not enter RSS in Plan 20B`)
}

assert.ok(published > 0, 'Presentation scope check requires at least one published standalone Presentation')
console.log(`Presentation scope checks passed for ${published} standalone Presentation(s): excluded from Archive and RSS`)
