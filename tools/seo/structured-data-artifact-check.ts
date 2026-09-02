import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const siteRoot = resolve(root, 'dist/site')

function canonicalUrl(html: string, label: string): string {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
  assert.ok(match, `${label} must emit canonical metadata`)
  return match[1]
}

function jsonLd(html: string, label: string): Record<string, unknown> {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  assert.equal(matches.length, 1, `${label} must emit JSON-LD`)
  const source = matches[0][1]
  assert.doesNotThrow(() => JSON.parse(source), `${label} JSON-LD must be valid JSON`)
  const value = JSON.parse(source) as Record<string, unknown>
  const serialized = JSON.stringify(value)
  assert.equal(serialized.includes('raw.githack.com'), false, `${label} JSON-LD must not use Preview origin`)
  assert.equal(serialized.includes('preview-pr-'), false, `${label} JSON-LD must not use Preview branch identity`)
  assert.equal(value.url, canonicalUrl(html, label), `${label} JSON-LD url must equal canonical URL`)
  return value
}

const homeHtml = await readFile(resolve(siteRoot, 'index.html'), 'utf8')
const essayHtml = await readFile(resolve(siteRoot, 'essays/agent-harness-system-layer/index.html'), 'utf8')
const briefHtml = await readFile(resolve(siteRoot, 'briefs/2026-08-28/index.html'), 'utf8')
const knowledgeHtml = await readFile(resolve(siteRoot, 'knowledge/verification-loop/index.html'), 'utf8')

const home = jsonLd(homeHtml, 'Homepage')
assert.equal(home['@context'], 'https://schema.org')
assert.equal(home['@type'], 'WebSite')
assert.equal(home.name, 'Orbis')
assert.equal(home.url, 'https://xiaodaojiang.github.io/Orbis/')
assert.equal(home.inLanguage, 'zh-CN')

const essay = jsonLd(essayHtml, 'Essay')
assert.equal(essay['@context'], 'https://schema.org')
assert.equal(essay['@type'], 'Article')
assert.equal(essay.headline, 'Agent Harness 为什么成为系统竞争层')
assert.equal(essay.datePublished, '2026-08-28')
assert.equal(essay.dateModified, '2026-08-28')
assert.deepEqual(essay.author, [
  {
    '@type': 'Person',
    name: 'XiaoDaoJiang',
    url: 'https://github.com/XiaoDaoJiang',
  },
])
assert.equal('publisher' in essay, false, 'Essay must not invent publisher metadata')

const brief = jsonLd(briefHtml, 'Brief')
assert.equal(brief['@context'], 'https://schema.org')
assert.equal(brief['@type'], 'Article')
assert.equal(brief.headline, 'Harness 正在成为模型之外的能力层')
assert.equal(brief.datePublished, '2026-08-28')
assert.equal('author' in brief, false, 'Brief must not invent author metadata')
assert.equal('publisher' in brief, false, 'Brief must not invent publisher metadata')

const knowledge = jsonLd(knowledgeHtml, 'Knowledge')
assert.equal(knowledge['@context'], 'https://schema.org')
assert.equal(knowledge['@type'], 'TechArticle')
assert.equal(knowledge.headline, 'Verification Loop')
assert.equal(knowledge.datePublished, '2026-08-28')
assert.equal(knowledge.dateModified, '2026-08-28')
assert.equal('author' in knowledge, false, 'Knowledge must not invent author metadata')
assert.equal('publisher' in knowledge, false, 'Knowledge must not invent publisher metadata')
assert.equal('reviewAt' in knowledge, false, 'Knowledge reviewAt must not be mapped into JSON-LD')

console.log('Structured data artifact contract passed')
