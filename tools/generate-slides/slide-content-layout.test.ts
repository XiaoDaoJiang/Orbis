import assert from 'node:assert/strict'
import { CONTENT_LAYOUT, displayUnits, splitText, paginateBlocks, paginateCards, cardHeight, CARD_LAYOUT, renderCards } from '../../apps/slides/templates/content-layout.ts'

// Pagination never rewrites a claim or silently loses whitespace, punctuation,
// astral characters, long Latin tokens, or a non-ASCII title.
for (const text of [
  '中文长标题'.repeat(40),
  'Long Latin title '.repeat(60),
  'unbrokenLatinToken'.repeat(80),
  'WM@#%&'.repeat(100),
  '第一句需要保留。第二句是证据；第三句含有局限！\n  全角 punctuation、emoji 🛰️ 和 supplementary 𠮷。'.repeat(30),
  'A sentence. A second sentence; final evidence is here. '.repeat(40),
  '',
]) {
  for (const budget of [CONTENT_LAYOUT.titleUnits, CONTENT_LAYOUT.coverUnits, CONTENT_LAYOUT.bodyUnits]) {
    const chunks = splitText(text, budget)
    assert.equal(chunks.join(''), text, 'All text must be preserved exactly and in order')
    assert.ok(chunks.every((chunk) => displayUnits(chunk) <= budget + 0.000001))
    if (text) assert.ok(chunks.every(Boolean), 'Nonempty text must not produce empty continuation pages')
  }
}
assert.throws(() => splitText('test', 0), /budget/)
assert.equal(displayUnits('WM@#%&'), 6, 'Wide ASCII glyphs consume full units in every heading/body/card budget')
assert.equal(splitText('W'.repeat(84), CONTENT_LAYOUT.titleUnits).length, 2)
assert.equal(splitText('W'.repeat(312), CONTENT_LAYOUT.bodyUnits).length, 2)
const longBlocks = Array.from({ length: 100 }, (_, index) => ({ id: `source-${index}`, label: '来源', text: '完整中文证据。'.repeat(100), links: [{ url: `https://example.com/${index}`, label: '来源' }] }))
const pages = paginateBlocks(longBlocks)
assert.ok(pages.every((page) => page.length <= CONTENT_LAYOUT.maxBlocks))
for (const block of longBlocks) {
  assert.equal(pages.flat().filter((part) => part.id === block.id).map((part) => part.text).join(''), block.text)
  assert.ok(pages.flat().filter((part) => part.id === block.id).every((part) => part.links?.[0].url === block.links[0].url))
}
console.log('Slide text segmentation and continuation preservation passed')

// The published corpus exercises legacy Daily, Evidence V1 Daily, Weekly and Talk.
// Native author decks must stay outside the generated renderer entirely.
const { resolve } = await import('node:path')
const { readFile } = await import('node:fs/promises')
const { discoverPresentationDescriptors } = await import('./discover-presentations.ts')
const { loadSiteConfig } = await import('../shared/site-config.ts')
const { renderPresentation } = await import('../../apps/slides/templates/registry.ts')
const { escapeHtml, renderSection, renderReferences, renderCover } = await import('../../apps/slides/templates/content-layout.ts')
const root = resolve(import.meta.dirname, '../..')
const styles = await readFile(resolve(root, 'apps/slides/style.css'), 'utf8')
assert.match(styles, /#print-container \.focus-export-note \{ display: block;/, 'Slidev export must disclose its summary-only scope on the live print surface')
assert.doesNotMatch(styles, /html\.print.*display:/, 'A stale upstream print class must not hide playback controls')
const toolbar = await readFile(resolve(root, 'apps/slides/global-top.vue'), 'utf8')
assert.match(toolbar, /watch\(isPrintMode/)
assert.match(toolbar, /classList\.toggle\('print', printing\)/, 'SPA Back from print must restore ordinary document layout')
assert.match(styles, /@media print \{[\s\S]*?\.focus-export-note \{ display: block;/)
const descriptors = await discoverPresentationDescriptors({ root, siteBase: '/Orbis', config: await loadSiteConfig() })
const generated = descriptors.filter((descriptor) => descriptor.sourceKind !== 'native')
assert.ok(generated.length >= 3)
const renderedCounts: number[] = []
function assertPreserved(markdown: string, text: string, message: string) {
  assert.ok(markdown.includes(escapeHtml(text)), message)
}
for (const descriptor of generated) {
  const markdown = renderPresentation(descriptor, { siteBase: '/Orbis' })
  const payload = descriptor.payload as any
  const count = (markdown.match(/^---$/gm) ?? []).length / 2
  renderedCounts.push(count)
  for (const body of markdown.split(/^---$/m).filter((_, index) => index > 0 && index % 2 === 0)) {
    assert.ok((body.match(/<SlideDetails\b/g) ?? []).length <= 1, 'Each slide has at most one details entry point')
  }
  assert.ok(count <= 20, `${descriptor.slug} must keep a focused reading path, got ${count} slides`)
  assertPreserved(markdown, payload.summary, `${descriptor.slug}: full summary must survive in details`)
  const textParts = [...markdown.matchAll(/<span data-content-id="title"[^>]*>(.*?)<\/span>/g)].map((match) => match[1]).join('')
  assert.equal(textParts, escapeHtml(payload.title), `${descriptor.slug}: full title must survive`)
  for (const [index, section] of payload.sections.entries()) {
    for (const text of [section.title, section.conclusion, ...section.facts.map((fact: any) => typeof fact === 'string' ? fact : fact.text), ...section.limitations]) assertPreserved(markdown, text, `${descriptor.slug}: section ${index} text lost`)
    assert.ok(markdown.includes(`${section.facts.length} 项事实 / ${section.limitations.length} 项限制`))
    for (const reference of section.references ?? []) {
      for (const text of [reference.title, reference.supports, reference.url]) assertPreserved(markdown, text, `${descriptor.slug}: section reference lost`)
    }
    for (const fact of section.facts) {
      if (typeof fact === 'string') continue
      for (const evidenceId of fact.evidence) {
        const reference = payload.references.find((item: any) => item.id === evidenceId)
        assert.ok(reference, 'Corpus evidence link must resolve')
        assert.ok(markdown.includes(`href="${escapeHtml(reference.url)}">证据 ${escapeHtml(evidenceId)}`), 'Each factual evidence link must keep its original target')
      }
    }
  }
  for (const reference of [...payload.references, ...(payload.archivePicks ?? [])]) for (const text of [reference.title, reference.supports, reference.url]) assertPreserved(markdown, text, `${descriptor.slug}: reference lost`)
  for (const [key, fields] of Object.entries({ signals: ['title', 'summary'], projects: ['name', 'summary', 'url'], actions: ['title', 'description'], trendMovements: ['topic', 'summary'], nextPeriodWatch: ['title', 'reason'], radar: ['label', 'horizon', 'note'] })) {
    for (const item of payload[key] ?? []) for (const field of fields) assertPreserved(markdown, item[field], `${descriptor.slug}: ${key}.${field} lost`)
  }
  const corpusCards = [
    ...(payload.signals ?? []).map((item: any) => ({ title: item.title, text: item.summary })),
    ...(payload.projects ?? []).map((item: any) => ({ title: item.name, text: item.summary })),
    ...(payload.actions ?? []).map((item: any) => ({ title: item.title, text: item.description })),
    ...(payload.trendMovements ?? []).map((item: any) => ({ title: item.topic, text: item.summary })),
    ...(payload.nextPeriodWatch ?? []).map((item: any) => ({ title: item.title, text: item.reason })),
  ]
  for (const batch of paginateCards(corpusCards)) {
    assert.ok(batch.reduce((sum, item) => sum + cardHeight(item.title, item.summary), 0) + (batch.length - 1) * CARD_LAYOUT.gap <= CARD_LAYOUT.pageHeight, 'Aggregate card geometry must fit, not merely each individual card')
    assert.ok(batch.every((item) => item.summary === item.card.text), 'Current corpus summaries should fit in full without a details-only fallback')
  }
  if (payload.weeklyThesis) assertPreserved(markdown, payload.weeklyThesis, 'Weekly thesis must survive')
  if (payload.weeklyThesis) assert.match(markdown, /label="本页完整判断"/, 'Weekly thesis has a readable unscaled mobile view too')
  if (!descriptor.readingUrl) assert.ok(markdown.includes(`href="/Orbis/slides/${descriptor.slug}/"`), 'Standalone summary exports retain a real interactive-deck route')
  assert.match(markdown, /摘要视图 · 完整证据与限制请在交互版展开/)
  // Budget the visible path separately from details: disclosure content is
  // deliberately scrollable outside the slide canvas, not a clipped slide.
  const visible = markdown.replace(/<SlideDetails\b[^>]*>.*?<\/SlideDetails>/gs, '')
  for (const match of visible.matchAll(/<p class="focus-text">(?:<span[^>]*>)?(.*?)(?:<\/span>)?<\/p>/g)) {
    assert.ok(displayUnits(match[1].replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, 'x')) <= CONTENT_LAYOUT.bodyUnits + 1, 'Main text must respect the visible content budget')
  }
  assert.doesNotMatch(markdown, /\[object Object\]|<script\b|<iframe\b/)
}
assert.ok(descriptors.some((descriptor) => descriptor.sourceKind === 'native'), 'Corpus must include native decks to verify exclusion')

const dangerous = '<script>alert(1)</script> {{ executable }} & "quoted" '
const synthetic = renderSection({ title: `${dangerous}标题`.repeat(20), conclusion: '完整结论，不得丢弃限定条件。'.repeat(70), facts: [{ text: `${dangerous}事实正文`, links: [{ label: '证据一', url: 'https://example.com/?a=1&b=2' }] }], limitations: [`${dangerous}限制仍然保留`], references: [{ title: dangerous, supports: '完整支持信息'.repeat(200), url: 'https://example.com/source' }] }, 0, 'ARCHITECTURE').join('\n')
assert.doesNotMatch(synthetic, /<script|\{\{ executable/)
assertPreserved(synthetic, `${dangerous}事实正文`, 'Dangerous-looking source text is escaped, never executed or lost')
assertPreserved(synthetic, `${dangerous}限制仍然保留`, 'Limitation survives synthetic stress')
const conclusion = [...synthetic.matchAll(/<span data-content-id="section.0.conclusion"[^>]*>(.*?)<\/span>/g)].map((match) => match[1]).join('')
assert.equal(conclusion, '完整结论，不得丢弃限定条件。'.repeat(70))
const hugeReferences = Array.from({ length: 100 }, (_, index) => ({ title: `来源 ${index} ` + 'longLatinToken'.repeat(100), supports: `来源支持 ${index} ` + '中文原始证据。'.repeat(200), url: `https://example.com/reference/${index}?full=1&safe=2` }))
const references = renderReferences('References', hugeReferences, 'stress').join('\n')
for (const reference of hugeReferences) for (const text of Object.values(reference)) assertPreserved(references, text, 'Huge reference preserves every original field')
const cover = renderCover({ title: '超长标题'.repeat(100), summary: dangerous.repeat(100), eyebrow: 'ORBIS', siteBase: '/Orbis' }).join('\n')
assertPreserved(cover, dangerous.repeat(100), 'Long cover summary lives in full-text details')
assert.equal([...cover.matchAll(/<span data-content-id="title"[^>]*>(.*?)<\/span>/g)].map((match) => match[1]).join(''), '超长标题'.repeat(100))
console.log(`Full-content preservation passed for ${generated.length} published decks; ${Math.min(...renderedCounts)}–${Math.max(...renderedCounts)} slides; native excluded`)

const dailyDescriptor = generated.find((item) => item.template === 'daily-v1')!
const longRadarLabel = '宽幅技术标签'.repeat(60)
const radarStress = renderPresentation({ ...dailyDescriptor, payload: { ...(dailyDescriptor.payload as any), radar: [{ label: longRadarLabel, impact: 97, horizon: 14, note: '原文说明必须保留，不将周期指标当作天数。' }] } }, { siteBase: '/Orbis' })
const radarParts = [...radarStress.matchAll(/<span data-content-id="radar.0.label"[^>]*>(.*?)<\/span>/g)].map((match) => match[1])
assert.equal(radarParts.join(''), longRadarLabel, 'Long radar labels continue losslessly instead of overflowing or becoming anonymous items')
assert.ok(radarParts.every((text) => displayUnits(text) <= 30))
assert.match(radarStress, /影响 97\/100/)
assert.match(radarStress, /采用周期 14\/100/)

// Two individually legal cards can exceed a whole page. Their complete summaries
// must move to separate pages, not be clipped or reduced to a hidden excerpt.
const denseCards = Array.from({ length: 2 }, () => ({ title: '长'.repeat(40), text: '证'.repeat(100) }))
assert.ok(cardHeight(denseCards[0].title, denseCards[0].text) < CARD_LAYOUT.pageHeight)
assert.equal(paginateCards(denseCards).length, 2)
assert.ok(cardHeight('W'.repeat(40), 'W'.repeat(100)) >= cardHeight('长'.repeat(40), '证'.repeat(100)), 'Wide Latin glyph runs use conservative full-glyph geometry')
assert.ok(paginateCards(denseCards).flat().every((item) => item.summary === item.card.text))
const stressCards = [
  { title: '超长中文标题'.repeat(100), text: '中文简介。'.repeat(15) },
  { title: 'unbrokenLatinTitle'.repeat(100), text: 'unbrokenLatinSummary'.repeat(80) },
  { title: '正常标题', text: '超长原文，完整保存在详情。'.repeat(200) },
  ...denseCards,
]
const plannedCards = paginateCards(stressCards)
assert.deepEqual(plannedCards.flat().map((item) => item.index), [0, 1, 2, 3, 4], 'Variable-size batches keep original item identities')
for (const batch of plannedCards) assert.ok(batch.reduce((sum, item) => sum + item.height, 0) + (batch.length - 1) * CARD_LAYOUT.gap <= CARD_LAYOUT.pageHeight)
const stressCardMarkup = renderCards({ title: '压力测试', eyebrow: 'TEST', prefix: 'cards', cards: stressCards }).join('\n')
for (const card of stressCards) for (const text of [card.title, card.text]) assertPreserved(stressCardMarkup, text, 'Long titles, Latin tokens and huge summaries remain complete in details')
assert.ok(plannedCards.flat().some((item) => item.summary === '完整介绍见详情'))
console.log('Aggregate card geometry passed for corpus and long-title / Latin-token stress fixtures')
