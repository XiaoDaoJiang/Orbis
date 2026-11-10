import assert from 'node:assert/strict'
import { access, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { MAX_OPEN_TAGS, MAX_LABEL_LENGTH } from '../../packages/content-schema/src/open-tags.mjs'
import { runPnpm } from '../shared/process.ts'
import { matchesArchiveFilters, emptyArchiveFilters } from '../../apps/web/src/lib/archive-filters.ts'

const root = resolve(import.meta.dirname, '../..')
const id = 'zz-orbis-open-tags-fixture'
const fixturePath = resolve(root, `content/briefs/${id}.yaml`)
const cacheDir = resolve(root, 'node_modules/.astro-fixtures/open-tags')
const fixture = JSON.parse(await readFile(resolve(root, 'content/briefs/2026-11-09.yaml'), 'utf8'))
fixture.title = 'Open keyword fixture'
fixture.summary = 'Tag-only discovery and safe display fixture.'
fixture.topics = []
fixture.tags = ['agent-security', '中文标签', 'Research & "Safety"', '长'.repeat(MAX_LABEL_LENGTH), ...Array.from({ length: MAX_OPEN_TAGS - 4 }, (_, index) => `keyword-${index}`)]
fixture.presentation.enabled = false
try {
  await access(fixturePath)
  assert.fail('Refusing to overwrite an existing open-tag fixture')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}
try {
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2))
  await runPnpm(['build:web'], { cwd: root, capture: true, env: { ASTRO_CACHE_DIR: cacheDir } })
  const detail = await readFile(resolve(root, `dist/web/briefs/${id}/index.html`), 'utf8')
  const archive = await readFile(resolve(root, 'dist/web/archive/index.html'), 'utf8')
  const exactCard = [...archive.matchAll(/<article\b[^>]*data-archive-item[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]).find((html) => html.includes(`/briefs/${id}/`))
  assert.ok(exactCard, 'Fixture must appear in the archive')
  for (const html of [detail, exactCard]) {
    assert.match(html, /data-content-tags[^>]*role="group"[^>]*aria-label="标签"/)
    assert.equal((html.match(/data-content-tag(?:\s|>)/g) ?? []).length, MAX_OPEN_TAGS)
    assert.match(html, /Research &amp; (?:&quot;|&#34;|")Safety(?:&quot;|&#34;|")/)
    assert.ok(html.includes('长'.repeat(MAX_LABEL_LENGTH)))
    assert.doesNotMatch(html, /href="[^"]*\/topics\/agent-security\//)
  }
  assert.match(exactCard, /data-topics(?:="")?\s/)
  const encodedSearch = exactCard.match(/data-search="([^"]*)"/)?.[1]
  assert.ok(encodedSearch)
  assert.ok(matchesArchiveFilters({ kind: 'brief', cadence: 'daily', topics: [], text: encodedSearch }, { ...emptyArchiveFilters, query: 'ＡＧＥＮＴ－ＳＥＣＵＲＩＴＹ' }))
  assert.doesNotMatch(archive, /<option[^>]*value="agent-security"/)
  await assert.rejects(access(resolve(root, 'dist/web/topics/agent-security/index.html')), { code: 'ENOENT' })
  const legacy = await readFile(resolve(root, 'dist/web/briefs/2026-11-09/index.html'), 'utf8')
  assert.doesNotMatch(legacy, /data-content-tags/)
  console.log('Open-tag rendered detail/archive fixture, escaping, tag-only classification and no Topic route passed')
} finally {
  await rm(fixturePath, { force: true })
  await rm(resolve(root, 'dist/web'), { recursive: true, force: true })
  await rm(cacheDir, { recursive: true, force: true })
}
