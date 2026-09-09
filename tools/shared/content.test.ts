import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readMarkdownFrontmatter } from './content.ts'

const directory = await mkdtemp(join(tmpdir(), 'orbis frontmatter 中文 '))
let count = 0
async function readFixture(source: string) {
  const path = join(directory, `fixture-${count++}.md`)
  await writeFile(path, source, 'utf8')
  const original = await readFile(path)
  try {
    return await readMarkdownFrontmatter(path)
  } finally {
    assert.deepEqual(await readFile(path), original, 'Reading must not rewrite source bytes')
  }
}

try {
  const header = ['title: 中文标题', 'enabled: true', 'topics:', '  - coding-agent']
  const expectedData = { title: '中文标题', enabled: true, topics: ['coding-agent'] }
  const body = '\r\n# Body 中文\n\n  preserve spaces  \r\n---\n\uFEFFinside body\n'
  for (const bom of ['', '\uFEFF']) {
    for (const newline of ['\n', '\r\n']) {
      // Delimiter line endings can differ after edits in an existing worktree.
      for (const ending of ['\n', '\r\n', '']) {
        const expectedBody = ending ? body : ''
        const source = `${bom}---${newline}${header.join(newline)}${newline}---${ending}${expectedBody}`
        assert.deepEqual(await readFixture(source), { data: expectedData, body: expectedBody })
      }
    }
  }

  assert.deepEqual(await readFixture('--- \t\r\ntitle: whitespace\r\n---\t \r\nbody'), { data: { title: 'whitespace' }, body: 'body' })
  assert.deepEqual(await readFixture('---\n---\nbody'), { data: null, body: 'body' })
  assert.deepEqual(await readFixture('\uFEFF---\r\n---'), { data: null, body: '' })
  const block = '---\nsummary: |\n  first\n  second\n---\n'
  assert.deepEqual((await readFixture(block.replaceAll('\n', '\r\n'))).data, (await readFixture(block)).data)

  for (const invalid of [
    '# No frontmatter\n',
    '\n---\ntitle: later\n---\n',
    ' ---\ntitle: indented\n---\n',
    '---invalid\ntitle: invalid opener\n---\n',
    '---\ntitle: unclosed\n',
    '---\ntitle: invalid closer\n---suffix\nbody',
    '---\r\ntitle: invalid closer\r\n----\r\nbody',
    '---\ntitle: invalid closer\n--- # not a fence\nbody',
  ]) {
    await assert.rejects(readFixture(invalid), /Missing YAML frontmatter/)
  }
  // Tolerant text input must not turn malformed YAML into empty/valid metadata.
  await assert.rejects(readFixture('---\r\ntitle: [unterminated\r\n---\r\nbody'), (error: unknown) => {
    assert.ok(error instanceof Error)
    assert.doesNotMatch(error.message, /Missing YAML frontmatter/)
    return true
  })
  await assert.rejects(readFixture('---\ntitle: first\ntitle: second\n---\nbody'), /Map keys must be unique/)
  console.log(`Markdown frontmatter contracts passed (${count} fixtures): LF, CRLF, mixed endings, BOM, EOF, body preservation and invalid input`)
} finally {
  await rm(directory, { recursive: true, force: true })
}
