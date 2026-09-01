import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const files = {
  missingSource: resolve(root, 'content/presentations/zz-orbis-missing-source-check.yaml'),
  missingAuthor: resolve(root, 'content/essays/zz-orbis-missing-author-check.md'),
  missingTopic: resolve(root, 'content/knowledge/zz-orbis-missing-topic-check.md'),
  relatedTopic: resolve(root, 'content/topics/zz-orbis-related-integrity-check.yaml'),
  duplicateSource: resolve(root, 'content/sources/github.yml'),
  nestedSource: resolve(root, 'content/sources/nested/invalid.yaml'),
  invalidAuthorId: resolve(root, 'content/authors/Bad-Author.yaml'),
  archivedSource: resolve(root, 'content/sources/zz-orbis-archived-source.yaml'),
  archivedAuthor: resolve(root, 'content/authors/zz-orbis-archived-author.yaml'),
  archivedEssay: resolve(root, 'content/essays/zz-orbis-archived-author-check.md'),
}

async function assertMissing(path: string) {
  try {
    await access(path)
    assert.fail(`Refusing to overwrite integrity fixture: ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

async function runContentValidation(): Promise<{ code: number | null; output: string }> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(pnpm, ['content:validate'], {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk) => { output += chunk.toString() })
    child.once('error', reject)
    child.once('exit', (code) => resolvePromise({ code, output }))
  })
}

for (const path of Object.values(files)) await assertMissing(path)
await mkdir(resolve(root, 'content/sources/nested'), { recursive: true })

try {
  await writeFile(files.missingSource, `kind: presentation
title: Missing Source relation fixture
summary: Execution-level fixture proving declared Source IDs require Registry resolution.
publishedAt: 2099-01-01
status: draft
topics:
  - agent-harness
template: talk-v1
sections:
  - id: source-integrity
    layout: content
    title: Source integrity boundary
    conclusion: Declared Source identities must resolve before presentation generation.
    facts:
      - This fixture is structurally valid but contains one missing Source relation.
    limitations: []
    references:
      - title: Missing Source material
        url: https://example.com/missing-source
        source: zz-orbis-missing-source
        supports: Proves nested Presentation references are included in integrity validation.
references:
  - title: Unsourced material remains valid
    url: https://example.com/unsourced
    supports: Proves Reference.source remains optional.
`, 'utf8')

  await writeFile(files.missingAuthor, `---
kind: essay
title: Missing Author relation fixture
description: Execution-level fixture proving every Essay Author ID requires Registry resolution.
publishedAt: 2099-01-01
status: draft
authors:
  - zz-orbis-missing-author
topics:
  - agent-harness
featured: false
references: []
---

This fixture is structurally valid but contains one unresolved Author identity.
`, 'utf8')

  await writeFile(files.missingTopic, `---
kind: knowledge
title: Missing Topic relation fixture
summary: Execution-level fixture proving every content Topic ID requires repository resolution.
status: draft
publishedAt: 2099-01-01
topics:
  - zz-orbis-missing-topic
references: []
---

This fixture is structurally valid but contains one unresolved Topic identity.
`, 'utf8')

  await writeFile(files.relatedTopic, `name: Related integrity fixture
description: Topic fixture proving missing and self-related Topic identities are rejected.
aliases: []
status: active
related:
  - zz-orbis-related-integrity-check
  - zz-orbis-missing-related-topic
`, 'utf8')

  await writeFile(files.duplicateSource, `name: GitHub duplicate fixture
homepage: https://github.com/
type: official
trustTier: primary
status: active
description: Duplicate extension fixture for canonical Source identity validation.
`, 'utf8')

  await writeFile(files.nestedSource, `name: Nested Source fixture
homepage: https://example.com/nested-source
type: official
trustTier: primary
status: active
description: Nested path fixture for canonical Source identity validation.
`, 'utf8')

  await writeFile(files.invalidAuthorId, `name: Invalid Author ID fixture
status: active
bio: Valid metadata stored under an invalid canonical Author file name.
`, 'utf8')

  await writeFile(files.archivedSource, `name: Archived Source fixture
homepage: https://example.com/archived-source
type: publisher
trustTier: secondary
status: archived
description: Historical Source identity that must remain resolvable.
`, 'utf8')

  await writeFile(files.archivedAuthor, `name: Archived Author fixture
status: archived
url: https://example.com/archived-author
bio: Historical Author identity that must remain resolvable.
`, 'utf8')

  await writeFile(files.archivedEssay, `---
kind: essay
title: Archived identities remain resolvable
description: Positive fixture proving archived Source and Author identities remain historically valid.
publishedAt: 2099-01-01
status: draft
authors:
  - zz-orbis-archived-author
topics:
  - agent-harness
featured: false
references:
  - title: Archived Source material
    url: https://example.com/archived-source/material
    source: zz-orbis-archived-source
    supports: Proves archived identities remain valid historical relations.
---

Archived identities remain part of the repository knowledge graph.
`, 'utf8')

  const result = await runContentValidation()
  assert.notEqual(result.code, 0, `Expected pnpm content:validate to fail for unresolved relations. Output:\n${result.output}`)

  const expected = [
    'Invalid relation: content/essays/zz-orbis-missing-author-check.md: authors[0] -> missing author "zz-orbis-missing-author"',
    'Invalid relation: content/knowledge/zz-orbis-missing-topic-check.md: topics[0] -> missing topic "zz-orbis-missing-topic"',
    'Invalid relation: content/presentations/zz-orbis-missing-source-check.yaml: sections[0].references[0].source -> missing source "zz-orbis-missing-source"',
    'Invalid relation: content/topics/zz-orbis-related-integrity-check.yaml: related[0] -> topic "zz-orbis-related-integrity-check" cannot reference itself',
    'Invalid relation: content/topics/zz-orbis-related-integrity-check.yaml: related[1] -> missing topic "zz-orbis-missing-related-topic"',
    'Invalid registry path: content/sources/nested/invalid.yaml -> nested source entries are not supported',
    'Invalid registry ID: content/authors/Bad-Author.yaml -> "Bad-Author" must match ^[a-z0-9]+(?:-[a-z0-9]+)*$',
    'Duplicate registry ID: source "github"',
  ]

  for (const marker of expected) {
    assert.ok(result.output.includes(marker), `Expected integrity diagnostic:\n${marker}\n\nActual output:\n${result.output}`)
  }

  assert.ok(!result.output.includes('missing source "zz-orbis-archived-source"'), 'Archived Source relations must remain valid')
  assert.ok(!result.output.includes('missing author "zz-orbis-archived-author"'), 'Archived Author relations must remain valid')
  assert.ok(!result.output.includes('missing source "undefined"'), 'Unsourced References must remain valid')

  console.log('Referential integrity negative contract passed')
} finally {
  for (const path of Object.values(files)) await rm(path, { force: true })
  await rm(resolve(root, 'content/sources/nested'), { recursive: true, force: true })
}
