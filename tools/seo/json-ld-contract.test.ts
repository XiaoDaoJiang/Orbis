import assert from 'node:assert/strict'

let module: Record<string, unknown>
try {
  module = await import('../../apps/web/src/lib/json-ld.ts') as Record<string, unknown>
} catch (error) {
  assert.fail(`JSON-LD helper must exist: ${String(error)}`)
}

type ResolvedAuthorFixture = {
  id: string
  name: string
  status: 'active' | 'archived'
  url?: string
}

type BuildWebSiteJsonLd = () => Record<string, unknown>
type BuildEssayJsonLd = (input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
  authors: ResolvedAuthorFixture[]
}) => Record<string, unknown>
type BuildBriefJsonLd = (input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}) => Record<string, unknown>
type BuildKnowledgeJsonLd = (input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
}) => Record<string, unknown>
type SerializeJsonLd = (value: Record<string, unknown>) => string

const buildWebSiteJsonLd = module.buildWebSiteJsonLd as BuildWebSiteJsonLd | undefined
const buildEssayJsonLd = module.buildEssayJsonLd as BuildEssayJsonLd | undefined
const buildBriefJsonLd = module.buildBriefJsonLd as BuildBriefJsonLd | undefined
const buildKnowledgeJsonLd = module.buildKnowledgeJsonLd as BuildKnowledgeJsonLd | undefined
const serializeJsonLd = module.serializeJsonLd as SerializeJsonLd | undefined

for (const [name, value] of Object.entries({
  buildWebSiteJsonLd,
  buildEssayJsonLd,
  buildBriefJsonLd,
  buildKnowledgeJsonLd,
  serializeJsonLd,
})) {
  assert.equal(typeof value, 'function', `${name} must be exported`)
}

const home = buildWebSiteJsonLd!()
assert.equal(home['@context'], 'https://schema.org')
assert.equal(home['@type'], 'WebSite')
assert.equal(home.name, 'Orbis')
assert.equal(home.url, 'https://xiaodaojiang.github.io/Orbis/')
assert.equal(home.description, 'Essays, briefs, slides, topics and durable knowledge.')
assert.equal(home.inLanguage, 'zh-CN')

const authors: ResolvedAuthorFixture[] = [
  { id: 'author-a', name: 'Author A', status: 'active', url: 'https://example.com/a' },
  { id: 'author-b', name: 'Author B', status: 'archived' },
]
const essay = buildEssayJsonLd!({
  title: 'Essay title',
  description: 'Essay description long enough.',
  publishedAt: '2026-08-01',
  updatedAt: '2026-08-02',
  canonicalPath: '/essays/example/',
  authors,
})
assert.equal(essay['@context'], 'https://schema.org')
assert.equal(essay['@type'], 'Article')
assert.equal(essay.headline, 'Essay title')
assert.equal(essay.description, 'Essay description long enough.')
assert.equal(essay.url, 'https://xiaodaojiang.github.io/Orbis/essays/example/')
assert.equal(essay.mainEntityOfPage, essay.url)
assert.equal(essay.datePublished, '2026-08-01')
assert.equal(essay.dateModified, '2026-08-02')
assert.equal(essay.inLanguage, 'zh-CN')
assert.deepEqual(essay.author, [
  { '@type': 'Person', name: 'Author A', url: 'https://example.com/a' },
  { '@type': 'Person', name: 'Author B' },
])

const essayWithoutUpdate = buildEssayJsonLd!({
  title: 'Essay without update',
  description: 'Essay fallback date contract.',
  publishedAt: '2026-08-03',
  canonicalPath: '/essays/no-update/',
  authors: [authors[0]],
})
assert.equal(essayWithoutUpdate.dateModified, '2026-08-03')

const brief = buildBriefJsonLd!({
  title: 'Brief title',
  description: 'Brief summary long enough.',
  publishedAt: '2026-08-04',
  canonicalPath: '/briefs/example/',
})
assert.equal(brief['@type'], 'Article')
assert.equal(brief.url, 'https://xiaodaojiang.github.io/Orbis/briefs/example/')
assert.equal(brief.mainEntityOfPage, brief.url)
assert.equal(brief.datePublished, '2026-08-04')
assert.equal('author' in brief, false)
assert.equal('publisher' in brief, false)

const knowledge = buildKnowledgeJsonLd!({
  title: 'Knowledge title',
  description: 'Knowledge summary long enough.',
  publishedAt: '2026-08-05',
  updatedAt: '2026-08-06',
  canonicalPath: '/knowledge/example/',
})
assert.equal(knowledge['@type'], 'TechArticle')
assert.equal(knowledge.url, 'https://xiaodaojiang.github.io/Orbis/knowledge/example/')
assert.equal(knowledge.mainEntityOfPage, knowledge.url)
assert.equal(knowledge.datePublished, '2026-08-05')
assert.equal(knowledge.dateModified, '2026-08-06')
assert.equal('author' in knowledge, false)
assert.equal('publisher' in knowledge, false)
assert.equal('reviewAt' in knowledge, false)

const serialized = serializeJsonLd!({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '</script><script>alert(1)</script>',
})
assert.doesNotThrow(() => JSON.parse(serialized))
assert.equal(serialized.includes('</script>'), false)
assert.equal(serialized.includes('\\u003c/script>'), true)

console.log('JSON-LD builder contract passed')
