/** Conservative typography budgets for the 980 × 551 generated canvas.
 * These are pagination budgets, never truncation limits. Native decks bypass them.
 * One display unit is a CJK/wide Latin glyph; other ASCII glyphs use 0.65.
 */
export const CONTENT_LAYOUT = { titleUnits: 42, coverUnits: 56, bodyUnits: 156, lineUnits: 30, pageLines: 9, maxBlocks: 2 } as const

export function escapeHtml(value: string | number) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;').replaceAll('{', '&#123;').replaceAll('}', '&#125;')
    .replaceAll('\n', '&#10;').replaceAll('\r', '&#13;')
}

export function displayUnits(text: string): number {
  return Array.from(text).reduce((sum, character) => sum + (/^[\x00-\x7f]$/.test(character) && !/[MW@#%&]/.test(character) ? 0.65 : 1), 0)
}

/** Prefer sentences, then spaces/punctuation; a long token still makes progress.
 * Slices concatenate to exactly the input, including all whitespace and punctuation.
 */
export function splitText(text: string, budget: number): string[] {
  if (!Number.isFinite(budget) || budget < 1) throw new Error('Text budget must be at least one display unit')
  const characters = Array.from(text)
  const chunks: string[] = []
  let start = 0
  while (start < characters.length) {
    let end = start
    let used = 0
    let sentence = 0
    let boundary = 0
    while (end < characters.length && used + displayUnits(characters[end]) <= budget) {
      used += displayUnits(characters[end])
      end++
      if (/[。！？!?；;]/u.test(characters[end - 1]) || (characters[end - 1] === '.' && /\s/.test(characters[end] ?? ''))) sentence = end
      if (/[\s，、,:：]/u.test(characters[end - 1])) boundary = end
    }
    if (end < characters.length) {
      // Do not produce tiny fragments merely to stop at an early boundary.
      if (sentence > start && displayUnits(characters.slice(start, sentence).join('')) >= budget * 0.45) end = sentence
      else if (boundary > start && displayUnits(characters.slice(start, boundary).join('')) >= budget * 0.65) end = boundary
    }
    chunks.push(characters.slice(start, end).join(''))
    start = end
  }
  return chunks.length ? chunks : ['']
}

export type ContentLink = { url: string; label: string }
export type ContentBlock = { id: string; label: string; text: string; links?: ContentLink[]; kind?: string }
type Fragment = ContentBlock & { part: number; parts: number }
export function markedText(id: string, text: string, part: number, parts: number) {
  return `<span data-content-id="${escapeHtml(id)}" data-part="${part}" data-parts="${parts}">${escapeHtml(text)}</span>`
}
export function linksMarkup(links: ContentLink[] = []) {
  return links.length ? `<div class="focus-links">${links.map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)} ↗</a>`).join(' ')}</div>` : ''
}
function fragmentCost(fragment: Fragment) {
  return Math.max(1, Math.ceil(displayUnits(fragment.text) / CONTENT_LAYOUT.lineUnits)) + 1 + (fragment.links?.length ? 1 : 0)
}
export function paginateBlocks(blocks: ContentBlock[]): Fragment[][] {
  const pages: Fragment[][] = []
  for (const block of blocks) {
    const chunks = splitText(block.text, CONTENT_LAYOUT.bodyUnits)
    for (let index = 0; index < chunks.length; index++) {
      const fragment = { ...block, text: chunks[index], part: index + 1, parts: chunks.length }
      const current = pages.at(-1)
      if (!current || current.length >= CONTENT_LAYOUT.maxBlocks || current.reduce((sum, item) => sum + fragmentCost(item), 0) + fragmentCost(fragment) > CONTENT_LAYOUT.pageLines) pages.push([fragment])
      else current.push(fragment)
    }
  }
  return pages
}
export function page(eyebrow: string, heading: string, content: string, progress: string) {
  return `---\nlayout: orbis-default\n---\n\n<div class="focus-page"><div class="eyebrow">${escapeHtml(eyebrow)}</div><h2 class="focus-heading">${heading}</h2><div class="focus-body">${content}</div><div class="focus-progress">${escapeHtml(progress)}</div></div>\n`
}

export function renderFocusPages(input: { id: string; eyebrow: string; title: string; blocks: ContentBlock[]; readingHref?: string }): string[] {
  const pages: string[] = []
  const titleParts = splitText(input.title, CONTENT_LAYOUT.titleUnits)
  const shortTitle = titleParts.length === 1 ? input.title : input.eyebrow
  if (titleParts.length > 1) {
    titleParts.forEach((text, index) => pages.push(page(input.eyebrow, markedText(`${input.id}.title`, text, index + 1, titleParts.length), '', `标题 · ${index + 1} / ${titleParts.length}${index ? ' · 续' : ''}`)))
  }
  const batches = paginateBlocks(input.blocks)
  batches.forEach((batch, index) => {
    const heading = titleParts.length === 1 && index === 0 ? markedText(`${input.id}.title`, shortTitle, 1, 1) : escapeHtml(shortTitle)
    const body = batch.map((block) => `<div class="focus-block ${escapeHtml(block.kind ?? '')}"><div class="focus-label">${escapeHtml(block.label)}${block.parts > 1 ? ` · ${block.part}/${block.parts}${block.part > 1 ? ' 续' : ''}` : ''}</div><p class="focus-text">${markedText(block.id, block.text, block.part, block.parts)}</p>${linksMarkup(block.links)}</div>`).join('')
    const details = input.blocks.map((block) => `<section class="detail-conclusion"><h3>${escapeHtml(block.label)}</h3><p>${escapeHtml(block.text)}</p>${linksMarkup(block.links)}</section>`).join('')
    pages.push(page(input.eyebrow, heading, body + detailsMarkup(input.title, '本页完整判断', details, input.readingHref) + exportNotice(input.readingHref), `${index + 1} / ${batches.length}${index ? ' · 续' : ''}`))
  })
  if (!batches.length && titleParts.length === 1) pages.push(page(input.eyebrow, markedText(`${input.id}.title`, input.title, 1, 1), '', ''))
  return pages
}

export function detailsMarkup(title: string, label: string, content: string, readingHref?: string) {
  return `<SlideDetails title="${escapeHtml(title)}" label="${escapeHtml(label)}"${readingHref ? ` reading-href="${escapeHtml(readingHref)}"` : ''}>${content}</SlideDetails>`
}
export function detailText(id: string, text: string) { return markedText(id, text, 1, 1) }
export function exportNotice(readingHref?: string) {
  return `<div class="focus-export-note">摘要视图 · 完整证据与限制请在交互版展开${readingHref ? ` · <a href="${escapeHtml(readingHref)}">阅读版 ↗</a>` : ''}</div>`
}
export function renderCover(input: { title: string; summary: string; eyebrow: string; siteBase: string; readingHref?: string; metadata?: string }): string[] {
  const chunks = splitText(input.title, CONTENT_LAYOUT.coverUnits)
  return chunks.map((chunk, index) => {
    const frontmatter = index === 0
      ? `theme: default\ntitle: ${JSON.stringify(escapeHtml(input.title))}\nlayout: orbis-cover\ntransition: fade-out\ncolorSchema: auto\naspectRatio: 16/9\nfavicon: ${JSON.stringify(`${input.siteBase}/favicon.svg`.replace(/^\/\//, '/'))}\nfonts:\n  provider: none\n  sans: 'Noto Sans CJK SC, PingFang SC, Microsoft YaHei, Inter, system-ui, sans-serif'\n  mono: 'Noto Sans Mono CJK SC, ui-monospace, monospace'\nlang: zh-CN`
      : 'layout: orbis-cover'
    return `---\n${frontmatter}\n---\n\n<div class="focus-cover"><div class="eyebrow">${escapeHtml(input.eyebrow)}</div><h1>${markedText('title', chunk, index + 1, chunks.length)}</h1>${input.metadata ? `<div class="weekly-period">${escapeHtml(input.metadata)}</div>` : ''}${index === 0 ? detailsMarkup(input.title, '完整简介', `<p>${detailText('summary', input.summary)}</p>`, input.readingHref) : ''}${input.readingHref ? `<a class="reading-link" href="${escapeHtml(input.readingHref)}">阅读版 ↗</a>` : ''}${chunks.length > 1 ? `<div class="focus-progress">标题 · ${index + 1} / ${chunks.length}${index ? ' · 续' : ''}</div>` : ''}${exportNotice(input.readingHref)}</div>\n`
  })
}

export type Reference = { title: string; supports: string; url: string; publishedAt?: string }
export function referencesDetail(references: Reference[], prefix: string) {
  return `<ol class="detail-references">${references.map((reference, index) => `<li>${reference.publishedAt ? `${escapeHtml(reference.publishedAt)} · ` : ''}<a href="${escapeHtml(reference.url)}">${detailText(`${prefix}.${index}.title`, reference.title)}</a><p>${detailText(`${prefix}.${index}.supports`, reference.supports)}</p></li>`).join('')}</ol>`
}
export function referenceBlocks(references: Reference[], prefix: string): ContentBlock[] {
  return references.map((reference, index) => ({ id: `${prefix}.${index}.title`, label: `来源 ${index + 1}`, text: reference.title, links: [{ url: reference.url, label: '原始来源' }] }))
}
export function renderReferences(title: string, references: Reference[], prefix: string, readingHref?: string) {
  const batches: Reference[][] = []
  for (const reference of references) {
    const current = batches.at(-1)
    if (!current || current.length >= 4 || current.reduce((n, item) => n + Math.min(displayUnits(item.title), 48), 0) + Math.min(displayUnits(reference.title), 48) > 128) batches.push([reference])
    else current.push(reference)
  }
  return batches.map((batch, index) => page('REFERENCES · EXTENDED READING', escapeHtml(title), `<ol class="focus-reference-index">${batch.map((reference, i) => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(displayUnits(reference.title) <= 48 ? reference.title : `来源 ${batches.slice(0, index).flat().length + i + 1} · ${new URL(reference.url).hostname} · 完整题名见详情`)}</a></li>`).join('')}</ol><div class="focus-detail-actions">${detailsMarkup(title, `展开 ${batch.length} 项来源及支持内容`, referencesDetail(batch, `${prefix}.page${index}`), readingHref)}<!--reading-return--></div>${exportNotice(readingHref)}`, `${index + 1} / ${batches.length}`))
}

export type FocusSection = { title: string; conclusion: string; facts: { text: string; links?: ContentLink[] }[]; limitations: string[]; references: Reference[] }
export function renderSection(section: FocusSection, index: number, eyebrow: string, readingHref?: string): string[] {
  const id = `section.${index}`
  const titleChunks = splitText(section.title, CONTENT_LAYOUT.titleUnits)
  const conclusionChunks = splitText(section.conclusion, CONTENT_LAYOUT.bodyUnits)
  const pages: string[] = []
  if (titleChunks.length > 1) titleChunks.forEach((title, part) => pages.push(page(eyebrow, markedText(`${id}.title`, title, part + 1, titleChunks.length), '', `标题 · ${part + 1}/${titleChunks.length}`)))
  const details = `<section class="detail-conclusion"><h3>结论</h3><p>${detailText(`${id}.conclusion.full`, section.conclusion)}</p></section><section class="detail-facts"><h3>事实 · ${section.facts.length} 项</h3><ol>${section.facts.map((fact, factIndex) => `<li>${detailText(`${id}.fact.${factIndex}`, fact.text)}${linksMarkup(fact.links)}</li>`).join('')}</ol></section><section class="detail-limitations"><h3>限制 · ${section.limitations.length} 项</h3>${section.limitations.length ? `<ul>${section.limitations.map((text, limitationIndex) => `<li>${detailText(`${id}.limitation.${limitationIndex}`, text)}</li>`).join('')}</ul>` : '<p>原文未列出限制。</p>'}</section><section class="detail-sources"><h3>来源</h3>${referencesDetail(section.references, `${id}.references`)}</section>`
  conclusionChunks.forEach((conclusion, part) => {
    const shortFact = part === 0 && conclusionChunks.length === 1 && section.facts[0] && displayUnits(conclusion) + displayUnits(section.facts[0].text) <= 112 ? section.facts[0] : undefined
    const heading = titleChunks.length === 1 ? (part === 0 ? detailText(`${id}.title`, section.title) : escapeHtml(section.title)) : `主题 ${index + 1}`
    pages.push(page(eyebrow, heading, `<div class="focus-block focus-conclusion"><div class="focus-label">核心结论${conclusionChunks.length > 1 ? ` · ${part + 1}/${conclusionChunks.length}` : ''}</div><p class="focus-text">${markedText(`${id}.conclusion`, conclusion, part + 1, conclusionChunks.length)}</p></div>${shortFact ? `<div class="focus-block focus-featured-fact"><div class="focus-label">事实 1 / ${section.facts.length}</div><p class="focus-text">${escapeHtml(shortFact.text)}</p></div>` : ''}<div class="focus-detail-actions">${detailsMarkup(section.title, `证据与限制 · ${section.facts.length} 项事实 / ${section.limitations.length} 项限制`, details, readingHref)}</div>${exportNotice(readingHref)}`, `主题 ${index + 1}${conclusionChunks.length > 1 ? ` · ${part + 1}/${conclusionChunks.length}${part ? ' · 续' : ''}` : ''}`))
  })
  return pages
}

export type FocusCard = { title: string; text: string; label?: string; url?: string }
export const CARD_LAYOUT = { pageHeight: 250, gap: 10, titleColumns: 35, summaryColumns: 42, titleLineHeight: 25, summaryLineHeight: 23.8, paddingAndBorder: 21, summaryMargin: 6 } as const
export function cardHeight(title: string, summary: string) {
  return CARD_LAYOUT.paddingAndBorder + Math.max(1, Math.ceil(displayUnits(title) / CARD_LAYOUT.titleColumns)) * CARD_LAYOUT.titleLineHeight + CARD_LAYOUT.summaryMargin + Math.max(1, Math.ceil(displayUnits(summary) / CARD_LAYOUT.summaryColumns)) * CARD_LAYOUT.summaryLineHeight
}
/** Plan the complete visible card list, including its inter-card gap. A pair
 * that cannot fit becomes two pages; only a single oversized item uses details.
 */
export function paginateCards(cards: FocusCard[]) {
  const batches: { card: FocusCard; index: number; title: string; summary: string; height: number }[][] = []
  cards.forEach((card, index) => {
    const title = displayUnits(card.title) <= 48 ? card.title : `条目 ${index + 1} · 展开完整标题`
    const summary = cardHeight(title, card.text) <= CARD_LAYOUT.pageHeight ? card.text : '完整介绍见详情'
    const item = { card, index, title, summary, height: cardHeight(title, summary) }
    const current = batches.at(-1)
    if (!current || current.length === 2 || current.reduce((sum, entry) => sum + entry.height, 0) + current.length * CARD_LAYOUT.gap + item.height > CARD_LAYOUT.pageHeight) batches.push([item])
    else current.push(item)
  })
  return batches
}

export function renderCards(input: { title: string; eyebrow: string; prefix: string; cards: FocusCard[]; readingHref?: string }): string[] {
  const batches = paginateCards(input.cards)
  return batches.map((batch, index) => {
    const cards = batch.map(({ card, index: originalIndex, title, summary }) => `<article class="focus-card"><div class="focus-label">${escapeHtml(card.label ?? `${originalIndex + 1} / ${input.cards.length}`)}</div><h3>${escapeHtml(title)}</h3><p class="focus-card-summary">${escapeHtml(summary)}</p></article>`).join('')
    const details = batch.map(({ card, index: originalIndex }) => {
      const id = `${input.prefix}.${originalIndex}`
      return `<section><h3>${detailText(`${id}.title`, card.title)}</h3><p>${detailText(`${id}.text`, card.text)}</p>${card.url ? linksMarkup([{ url: card.url, label: '原始来源' }]) : ''}</section>`
    }).join('')
    return page(input.eyebrow, escapeHtml(input.title), `<div class="focus-card-list">${cards}</div>${detailsMarkup(input.title, `完整介绍 · ${batch.length} 项`, details, input.readingHref)}${exportNotice(input.readingHref)}`, `${index + 1} / ${batches.length}`)
  })
}

/** Preserve the cover/end reading-route affordance without duplicating it on every slide. */
export function finishDeck(pages: string[], readingHref?: string, interactiveHref?: string) {
  if (readingHref && pages.length > 1) {
    const last = pages.length - 1
    pages[last] = pages[last].replace('<!--reading-return-->', `<a class="reading-link" href="${escapeHtml(readingHref)}">返回阅读版 ↗</a>`)
  }
  const output = pages.join('\n\n')
  return !readingHref && interactiveHref
    ? output.replaceAll('<div class="focus-export-note">', `<div class="focus-export-note"><a href="${escapeHtml(interactiveHref)}">完整交互版 ↗</a> · `)
    : output
}
