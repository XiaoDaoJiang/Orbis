import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const essayPath = resolve(root, 'dist/site/essays/agent-harness-system-layer/index.html')
const dailyPath = resolve(root, 'dist/site/briefs/2026-08-28/index.html')
const knowledgePath = resolve(root, 'dist/site/knowledge/verification-loop/index.html')

for (const path of [essayPath, dailyPath, knowledgePath]) await access(path)

const essay = await readFile(essayPath, 'utf8')
const daily = await readFile(dailyPath, 'utf8')
const knowledge = await readFile(knowledgePath, 'utf8')

assert.ok(essay.includes('data-author-count="1"'), 'Real Essay must render one resolved Author')
assert.ok(essay.includes('data-author-id="xiaodaojiang"'), 'Real Essay must expose canonical Author ID')
assert.ok(essay.includes('data-author-status="active"'), 'Real Essay must expose active Author status')
assert.ok(essay.includes('href="https://github.com/XiaoDaoJiang"'), 'Real Essay must link the Author profile')
assert.ok(essay.includes('>XiaoDaoJiang</a>'), 'Real Essay must render the Author display name')

for (const source of [
  { id: 'astro', homepage: 'https://astro.build/', name: 'Astro' },
  { id: 'github', homepage: 'https://github.com/', name: 'GitHub' },
  { id: 'slidev', homepage: 'https://sli.dev/', name: 'Slidev' },
]) {
  const item = new RegExp(`<li[^>]*data-source-id="${source.id}"[^>]*data-source-type="official"[^>]*data-trust-tier="primary"[^>]*data-source-status="active"`)
  assert.match(daily, item, `Daily References must expose Registry metadata for ${source.id}`)
  assert.ok(daily.includes(`href="${source.homepage}"`), `Daily References must link ${source.id} homepage`)
  assert.ok(daily.includes(`>${source.name}</a>`), `Daily References must render ${source.id} display name`)
}

assert.ok(essay.includes('<h2>References</h2>'), 'Essay frontmatter References must render after the body')
assert.ok(essay.includes('Slidev Building and Hosting'), 'Real unsourced Essay Reference must remain visible')
const essayReferenceItem = essay.match(/<li([^>]*)>\s*<a href="https:\/\/sli\.dev\/guide\/hosting">Slidev Building and Hosting<\/a>/)
assert.ok(essayReferenceItem, 'Real unsourced Essay Reference item must be present')
assert.doesNotMatch(essayReferenceItem[1], /data-source-/, 'Unsourced Essay Reference must not receive Source metadata')

assert.ok(!knowledge.includes('<h2>References</h2>'), 'Knowledge without References must not render an empty Reference section')
assert.ok(essay.includes('Related Content'), 'Essay Related Content must remain present')
assert.ok(daily.includes('/slides/2026-08-28/'), 'Brief to Slides navigation must remain present')

async function assertMissing(path: string, message: string) {
  try {
    await access(path)
    assert.fail(message)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

await assertMissing(resolve(root, 'dist/site/sources/index.html'), 'Plan 40B must not add a Source directory route')
await assertMissing(resolve(root, 'dist/site/authors/index.html'), 'Plan 40B must not add an Author directory route')

console.log('Registry-backed content UI artifact contract passed')
