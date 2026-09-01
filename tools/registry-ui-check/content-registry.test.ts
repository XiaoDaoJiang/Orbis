import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
let registryModule: Record<string, unknown>

try {
  registryModule = await import('../../apps/web/src/lib/content-registry.ts') as Record<string, unknown>
} catch (error) {
  assert.fail(`Web content registry helper must exist: ${String(error)}`)
}

for (const path of [
  'apps/web/src/components/AuthorByline.astro',
  'apps/web/src/components/ReferenceList.astro',
]) {
  try {
    await access(resolve(root, path))
  } catch (error) {
    assert.fail(`Web Registry component must exist: ${path}: ${String(error)}`)
  }
}

const buildAuthorIndex = registryModule.buildAuthorIndex as ((entries: unknown[]) => ReadonlyMap<string, any>) | undefined
const buildSourceIndex = registryModule.buildSourceIndex as ((entries: unknown[]) => ReadonlyMap<string, any>) | undefined
const resolveAuthors = registryModule.resolveAuthors as ((ids: string[], index: ReadonlyMap<string, any>) => any[]) | undefined
const resolveReferenceSource = registryModule.resolveReferenceSource as ((id: string | undefined, index: ReadonlyMap<string, any>) => any) | undefined

assert.equal(typeof buildAuthorIndex, 'function')
assert.equal(typeof buildSourceIndex, 'function')
assert.equal(typeof resolveAuthors, 'function')
assert.equal(typeof resolveReferenceSource, 'function')

const authorEntries = [
  {
    id: 'second-author',
    data: { name: 'Second Author', status: 'archived', bio: 'An archived Author fixture without a public URL.' },
  },
  {
    id: 'first-author',
    data: { name: 'First Author', status: 'active', url: 'https://example.com/first-author', bio: 'An active linked Author fixture.' },
  },
]
const sourceEntries = [
  {
    id: 'known-source',
    data: {
      name: 'Known Source',
      homepage: 'https://example.com/known-source',
      type: 'publisher',
      trustTier: 'secondary',
      status: 'archived',
      aliases: [],
      description: 'An archived Source fixture for Web resolution.',
    },
  },
]

const authorIndex = buildAuthorIndex!(authorEntries)
const sourceIndex = buildSourceIndex!(sourceEntries)
const authors = resolveAuthors!(['first-author', 'second-author'], authorIndex)

assert.deepEqual(authors.map((author) => author.id), ['first-author', 'second-author'])
assert.equal(authors[0].url, 'https://example.com/first-author')
assert.equal(authors[1].url, undefined)
assert.equal(authors[1].status, 'archived')
assert.equal(resolveReferenceSource!('known-source', sourceIndex)?.name, 'Known Source')
assert.equal(resolveReferenceSource!('known-source', sourceIndex)?.status, 'archived')
assert.equal(resolveReferenceSource!(undefined, sourceIndex), undefined)
assert.throws(
  () => resolveAuthors!(['missing-author'], authorIndex),
  /Unknown author ID in Web registry resolution: missing-author/,
)
assert.throws(
  () => resolveReferenceSource!('missing-source', sourceIndex),
  /Unknown source ID in Web registry resolution: missing-source/,
)
assert.throws(
  () => buildAuthorIndex!([...authorEntries, authorEntries[0]]),
  /Duplicate author ID in Web registry resolution: second-author/,
)
assert.throws(
  () => buildSourceIndex!([...sourceEntries, sourceEntries[0]]),
  /Duplicate source ID in Web registry resolution: known-source/,
)

console.log('Web content Registry resolution contract passed')
