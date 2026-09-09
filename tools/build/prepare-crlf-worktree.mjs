import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Deliberately mutate only a disposable CI checkout, never a developer worktree.
// New checkouts use LF via .gitattributes; old Windows checkouts can still be CRLF.
if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('CRLF worktree preparation is only for disposable GitHub Actions checkouts')
}
const root = resolve(import.meta.dirname, '../..')
const files = execFileSync('git', ['ls-files', '-z', '--', 'content/'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter((path) => /\.mdx?$/.test(path))
assert.ok(files.length > 0, 'CRLF regression requires existing tracked Markdown content')
for (const file of files) {
  const path = resolve(root, file)
  const source = await readFile(path, 'utf8')
  const converted = source.replace(/\r?\n/g, '\r\n')
  assert.ok(converted.includes('\r\n'), `Expected multiline Markdown: ${file}`)
  assert.doesNotMatch(converted, /(?<!\r)\n/, `LF remained in CRLF fixture: ${file}`)
  await writeFile(path, converted, 'utf8')
  assert.equal(await readFile(path, 'utf8'), converted)
}
// Git normalizes these line endings for diff; the full build must not change content.
console.log(`Prepared legacy CRLF worktree: ${files.length} tracked Markdown file(s); content and BOM preserved`)
