import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const slug = 'zz-orbis-archived-registry-ui-check'
const sourceId = 'zz-orbis-archived-ui-source'
const authorId = 'zz-orbis-archived-ui-author'
const sourcePath = resolve(root, `content/sources/${sourceId}.yaml`)
const authorPath = resolve(root, `content/authors/${authorId}.yaml`)
const essayPath = resolve(root, `content/essays/${slug}.md`)
const outputPath = resolve(root, `dist/web/essays/${slug}/index.html`)

const sourceContent = `name: Archived UI Source
homepage: https://example.com/archived-ui-source
type: publisher
trustTier: secondary
status: archived
description: Ephemeral archived Source for Registry-backed UI verification.
`

const authorContent = `name: Archived UI Author
status: archived
bio: Ephemeral archived unlinked Author for Registry-backed UI verification.
`

const essayContent = `---
kind: essay
title: Archived Registry UI fixture
description: Ephemeral public Essay proving archived Author and Source metadata remain visible in existing reading UI.
publishedAt: 2099-02-01
status: published
authors:
  - ${authorId}
topics:
  - agent-harness
featured: false
references:
  - title: Archived Source material
    url: https://example.com/archived-ui-source/material
    source: ${sourceId}
    supports: Proves archived Source metadata remains visible and linked.
  - title: Unsourced fixture material
    url: https://example.com/unsourced-ui-material
    supports: Proves omitted Reference.source does not receive fabricated metadata.
---

This temporary Essay exists only while the Registry UI integration contract runs.
`

async function assertMissing(path: string) {
  try {
    await access(path)
    assert.fail(`Refusing to overwrite Registry UI fixture: ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

async function runBuildWeb(expectSuccess: boolean): Promise<string> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(pnpm, ['build:web'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk) => { output += chunk.toString() })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (expectSuccess && code !== 0) {
        reject(new Error(`Expected build:web success, received ${code}\n${output}`))
      } else if (!expectSuccess && code === 0) {
        reject(new Error(`Expected build:web failure\n${output}`))
      } else {
        resolvePromise(output)
      }
    })
  })
}

for (const path of [sourcePath, authorPath, essayPath]) await assertMissing(path)

try {
  for (const [path, content] of [
    [sourcePath, sourceContent],
    [authorPath, authorContent],
    [essayPath, essayContent],
  ] as const) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }

  await runBuildWeb(true)
  const html = await readFile(outputPath, 'utf8')
  assert.ok(html.includes(`data-author-id="${authorId}"`), 'Archived Author ID must be rendered')
  assert.ok(html.includes('data-author-status="archived"'), 'Archived Author status must be rendered')
  assert.ok(html.includes('Archived UI Author'), 'Archived Author display name must be rendered')
  assert.ok(html.includes(`data-source-id="${sourceId}"`), 'Archived Source ID must be rendered')
  assert.ok(html.includes('data-source-status="archived"'), 'Archived Source status must be rendered')
  assert.ok(html.includes('href="https://example.com/archived-ui-source"'), 'Archived Source homepage must remain linked')
  assert.ok(html.includes('registry-status'), 'Archived identities must expose visible status text')

  const unsourcedItem = html.match(/<li([^>]*)>[^<]*<a href="https:\/\/example\.com\/unsourced-ui-material">Unsourced fixture material<\/a>/)
  assert.ok(unsourcedItem, 'Unsourced Reference must remain visible')
  assert.doesNotMatch(unsourcedItem[1], /data-source-/, 'Unsourced Reference must not receive Source metadata')

  await rm(authorPath, { force: true })
  const missingAuthorOutput = await runBuildWeb(false)
  assert.match(missingAuthorOutput, new RegExp(`Unknown author ID in Web registry resolution: ${authorId}`))

  await writeFile(authorPath, authorContent, 'utf8')
  await rm(sourcePath, { force: true })
  const missingSourceOutput = await runBuildWeb(false)
  assert.match(missingSourceOutput, new RegExp(`Unknown source ID in Web registry resolution: ${sourceId}`))

  console.log('Archived Registry UI and direct-build defense contract passed')
} finally {
  await rm(sourcePath, { force: true })
  await rm(authorPath, { force: true })
  await rm(essayPath, { force: true })
  await rm(resolve(root, 'dist/web'), { recursive: true, force: true })
}
