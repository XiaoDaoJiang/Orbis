import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const web = resolve(root, 'dist/web')
const slides = resolve(root, 'dist/slides')
const site = resolve(root, 'dist/site')

await rm(site, { recursive: true, force: true })
await mkdir(site, { recursive: true })
await cp(web, site, { recursive: true })
await cp(slides, resolve(site, 'slides'), { recursive: true })
console.log(`Assembled prototype: ${site}`)
