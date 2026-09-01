import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const schemaModule = await import('@orbis/content-schema') as Record<string, unknown>
const sourceSchema = schemaModule.sourceSchema as { parse?: unknown } | undefined
const authorSchema = schemaModule.authorSchema as { parse?: unknown } | undefined

assert.equal(typeof sourceSchema?.parse, 'function', 'sourceSchema must exist')
assert.equal(typeof authorSchema?.parse, 'function', 'authorSchema must exist')

for (const path of [
  'content/sources/astro.yaml',
  'content/sources/github.yaml',
  'content/sources/slidev.yaml',
  'content/authors/xiaodaojiang.yaml',
]) {
  await access(resolve(root, path))
}

const sourceFiles = (await readdir(resolve(root, 'content/sources'), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && ['.yaml', '.yml'].includes(extname(entry.name)))
  .map((entry) => basename(entry.name, extname(entry.name)))
  .sort()
const authorFiles = (await readdir(resolve(root, 'content/authors'), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && ['.yaml', '.yml'].includes(extname(entry.name)))
  .map((entry) => basename(entry.name, extname(entry.name)))
  .sort()

assert.deepEqual(sourceFiles, ['astro', 'github', 'slidev'])
assert.deepEqual(authorFiles, ['xiaodaojiang'])

const contentConfig = await readFile(resolve(root, 'apps/web/src/content.config.ts'), 'utf8')
assert.match(contentConfig, /const sources = defineCollection/)
assert.match(contentConfig, /const authors = defineCollection/)
assert.match(contentConfig, /pattern: '\*\.\{yaml,yml\}'/)

const pathGuard = await readFile(resolve(root, 'config/path-guard.yaml'), 'utf8')
assert.doesNotMatch(pathGuard, /content\/sources\//)
assert.doesNotMatch(pathGuard, /content\/authors\//)

const agents = await readFile(resolve(root, 'AGENTS.md'), 'utf8')
assert.match(agents, /Source\/Author Registry/)
assert.match(agents, /explicit human review/)

console.log('Source/Author Registry contract passed')
