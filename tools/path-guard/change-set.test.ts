import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/path-guard/change-set.ts')
assert.equal(existsSync(helperPath), true, 'Path Guard change-set helper must exist')

const changeSet = await import(pathToFileURL(helperPath).href)
assert.equal(typeof changeSet.parseNameStatusZ, 'function', 'parseNameStatusZ must exist')

const parsed = changeSet.parseNameStatusZ([
  'A', 'content/briefs/2026-09-03.yaml',
  'M', 'config/site.yaml',
  'D', 'apps/slides/generated/legacy.md',
  'R100', 'dist/old/index.html', 'content/briefs/moved.yaml',
  'C090', 'content/briefs/source.yaml', 'content/briefs/copied.yaml',
  '',
].join('\0'))

assert.deepEqual(parsed, [
  { status: 'A', path: 'content/briefs/2026-09-03.yaml' },
  { status: 'M', path: 'config/site.yaml' },
  { status: 'D', path: 'apps/slides/generated/legacy.md' },
  { status: 'R100', oldPath: 'dist/old/index.html', path: 'content/briefs/moved.yaml' },
  { status: 'C090', oldPath: 'content/briefs/source.yaml', path: 'content/briefs/copied.yaml' },
])

assert.throws(
  () => changeSet.parseNameStatusZ('R100\0only-old-path\0'),
  /rename|copy|path|record/i,
  'Malformed rename/copy records must fail closed',
)

console.log('Path Guard change-set contract passed')
