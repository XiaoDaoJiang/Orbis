import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  parsePresentationScope,
  preparePresentationOutput,
  selectPresentationIds,
} from './presentation-scope.ts'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

assert.deepEqual(parsePresentationScope([], {}), { mode: 'all', ids: [] })
assert.deepEqual(parsePresentationScope([], { SLIDES_IDS: 'deck-b, deck-a,deck-b' }), {
  mode: 'ids',
  ids: ['deck-b', 'deck-a'],
})
assert.deepEqual(parsePresentationScope(['--ids', 'deck-a,deck-b'], { SLIDES_IDS: 'ignored' }), {
  mode: 'ids',
  ids: ['deck-a', 'deck-b'],
})
assert.deepEqual(parsePresentationScope(['--ids=deck-a'], {}), { mode: 'ids', ids: ['deck-a'] })
assert.throws(() => parsePresentationScope(['--ids', '../escape'], {}), /Unsafe presentation ID/)
assert.throws(() => parsePresentationScope(['--ids'], {}), /requires a comma-separated value/)
assert.throws(() => parsePresentationScope(['--ids=a', '--ids=b'], {}), /only be provided once/)

assert.deepEqual(
  selectPresentationIds(['deck-a', 'deck-b'], { mode: 'all', ids: [] }),
  ['deck-a', 'deck-b'],
)
assert.deepEqual(
  selectPresentationIds(['deck-a', 'deck-b'], { mode: 'ids', ids: ['deck-b'] }),
  ['deck-b'],
)
assert.throws(
  () => selectPresentationIds(['deck-a'], { mode: 'ids', ids: ['missing'] }),
  /Unknown presentation ID\(s\): missing/,
)

const tempRoot = await mkdtemp(join(tmpdir(), 'orbis-presentation-scope-'))
try {
  const outputRoot = resolve(tempRoot, 'output')
  const deckA = resolve(outputRoot, 'deck-a')
  const deckB = resolve(outputRoot, 'deck-b')
  await mkdir(deckA, { recursive: true })
  await mkdir(deckB, { recursive: true })
  await writeFile(resolve(deckA, 'sentinel.txt'), 'a', 'utf8')
  await writeFile(resolve(deckB, 'sentinel.txt'), 'b', 'utf8')

  await preparePresentationOutput(outputRoot, ['deck-a'], { mode: 'ids', ids: ['deck-a'] })
  assert.equal(await exists(deckA), false, 'Scoped preparation must replace the selected deck directory')
  assert.equal(await readFile(resolve(deckB, 'sentinel.txt'), 'utf8'), 'b', 'Scoped preparation must preserve unrelated deck output')

  await preparePresentationOutput(outputRoot, [], { mode: 'all', ids: [] })
  assert.equal(await exists(deckB), false, 'Full preparation must clear historical deck output')
  assert.equal(await exists(outputRoot), true, 'Full preparation must recreate the output root')

  console.log('Presentation build scope contracts passed')
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}
