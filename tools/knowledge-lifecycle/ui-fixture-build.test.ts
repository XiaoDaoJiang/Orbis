import assert from 'node:assert/strict'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const today = '2026-09-02'
const ids = {
  overdue: 'zz-orbis-lifecycle-overdue',
  needsReview: 'zz-orbis-lifecycle-needs-review',
  archived: 'zz-orbis-lifecycle-archived',
  replacement: 'zz-orbis-lifecycle-replacement',
} as const

const fixtures = [
  {
    id: ids.overdue,
    content: `---\nkind: knowledge\ntitle: Lifecycle Overdue Fixture\nsummary: Fixed-date overdue lifecycle UI fixture.\nstatus: active\npublishedAt: 2026-08-01\nupdatedAt: 2026-08-20\nreviewAt: 2026-09-01\ntopics:\n  - coding-agent\nreferences: []\n---\n\nOverdue lifecycle fixture.\n`,
  },
  {
    id: ids.needsReview,
    content: `---\nkind: knowledge\ntitle: Lifecycle Needs Review Fixture\nsummary: Explicit needs-review lifecycle UI fixture.\nstatus: needs-review\npublishedAt: 2026-08-02\nupdatedAt: 2026-08-21\nreviewAt: 2026-11-01\ntopics:\n  - coding-agent\nreferences: []\n---\n\nNeeds-review lifecycle fixture.\n`,
  },
  {
    id: ids.archived,
    content: `---\nkind: knowledge\ntitle: Lifecycle Archived Fixture\nsummary: Archived lifecycle UI fixture with replacement.\nstatus: archived\npublishedAt: 2026-07-01\nupdatedAt: 2026-08-10\nreviewAt: 2026-08-01\nsupersededBy: ${ids.replacement}\ntopics:\n  - coding-agent\nreferences: []\n---\n\nArchived lifecycle fixture.\n`,
  },
  {
    id: ids.replacement,
    content: `---\nkind: knowledge\ntitle: Lifecycle Replacement Fixture\nsummary: Replacement lifecycle UI fixture due soon.\nstatus: active\npublishedAt: 2026-08-25\nupdatedAt: 2026-09-01\nreviewAt: 2026-09-16\ntopics:\n  - coding-agent\nreferences: []\n---\n\nReplacement lifecycle fixture.\n`,
  },
] as const

const fixturePaths = fixtures.map(({ id }) => resolve(root, `content/knowledge/${id}.md`))
const indexPath = resolve(root, 'dist/web/knowledge/index.html')
const detailPath = (id: string) => resolve(root, `dist/web/knowledge/${id}/index.html`)

async function assertMissing(path: string) {
  try {
    await access(path)
    assert.fail(`Refusing to overwrite lifecycle fixture: ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

async function runBuildWeb(): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(pnpm, ['build:web'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, KNOWLEDGE_EVALUATION_DATE: today },
    })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk) => { output += chunk.toString() })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Expected build:web success, received ${code}\n${output}`))
      else resolvePromise()
    })
  })
}

for (const path of fixturePaths) await assertMissing(path)

try {
  for (const [index, fixture] of fixtures.entries()) {
    const path = fixturePaths[index]
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, fixture.content, 'utf8')
  }

  await runBuildWeb()

  const indexHtml = await readFile(indexPath, 'utf8')
  assert.match(indexHtml, /data-knowledge-section="current"/, 'Knowledge index must expose Current section')
  assert.match(indexHtml, /data-knowledge-section="attention"/, 'Knowledge index must expose Attention section')
  assert.match(indexHtml, /data-knowledge-section="historical"/, 'Knowledge index must expose Historical section')
  assert.match(indexHtml, /data-knowledge-section="recently-updated"/, 'Knowledge index must expose Recently Updated section')
  assert.match(indexHtml, new RegExp(`data-knowledge-id="${ids.overdue}"[^>]*data-review-health="overdue"`), 'Overdue Knowledge must be visible in lifecycle index')
  assert.match(indexHtml, new RegExp(`data-knowledge-id="${ids.needsReview}"[^>]*data-editorial-status="needs-review"`), 'Explicit needs-review Knowledge must be visible in lifecycle index')
  assert.match(indexHtml, new RegExp(`data-knowledge-id="${ids.archived}"[^>]*data-editorial-status="archived"`), 'Archived Knowledge must be visible in Historical section')
  assert.match(indexHtml, new RegExp(`data-knowledge-id="${ids.replacement}"[^>]*data-review-health="due-soon"`), 'Due-soon Knowledge must be visible in lifecycle index')

  const needsReviewHtml = await readFile(detailPath(ids.needsReview), 'utf8')
  assert.match(needsReviewHtml, /data-knowledge-lifecycle/, 'Needs-review detail must render lifecycle metadata')
  assert.match(needsReviewHtml, /data-editorial-status="needs-review"/)
  assert.match(needsReviewHtml, /data-review-health="current"/)
  assert.match(needsReviewHtml, /data-lifecycle-notice="needs-review"/)

  const archivedHtml = await readFile(detailPath(ids.archived), 'utf8')
  assert.match(archivedHtml, /data-editorial-status="archived"/)
  assert.match(archivedHtml, /data-lifecycle-notice="archived"/)
  assert.match(archivedHtml, new RegExp(`href="[^"]*/knowledge/${ids.replacement}/"[^>]*data-relation="replaced-by"`), 'Archived entry must link to replacement')
  assert.doesNotMatch(archivedHtml, /http-equiv="refresh"/i, 'Archived detail must not redirect')
  assert.match(archivedHtml, new RegExp(`<link rel="canonical" href="https://xiaodaojiang.github.io/Orbis/knowledge/${ids.archived}/"`), 'Archived detail must remain self-canonical')

  const replacementHtml = await readFile(detailPath(ids.replacement), 'utf8')
  assert.match(replacementHtml, /data-review-health="due-soon"/)
  assert.match(replacementHtml, new RegExp(`href="[^"]*/knowledge/${ids.archived}/"[^>]*data-relation="supersedes"`), 'Replacement entry must expose derived inverse relation')

  const overdueHtml = await readFile(detailPath(ids.overdue), 'utf8')
  assert.match(overdueHtml, /data-review-health="overdue"/)
  assert.match(overdueHtml, /data-lifecycle-notice="overdue"/)

  console.log('Knowledge lifecycle fixed-date UI fixture contract passed')
} finally {
  for (const path of fixturePaths) await rm(path, { force: true })
  await rm(resolve(root, 'dist/web'), { recursive: true, force: true })
}
