import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

export type FeedTransport = 'rss' | 'rss-fallback' | 'same-source-html'
export type FeedStatus = 'success' | 'stale' | 'failed'

export interface DiscoveryItem {
  feedId: string
  title: string
  url: string
  publishedAt: string
  summary?: string
  externalLinks: string[]
  transport: FeedTransport
}

export interface FeedConfig {
  id: string
  name: string
  url: string
  homepage?: string
  fallback_urls?: string[]
  enabled?: boolean
  required?: boolean
  fetch?: {
    lookback_hours?: number
    max_feed_items?: number
    parse_full_content?: boolean
    extract_external_links?: boolean
  }
  discovery_fallback?: {
    mode?: 'same-source-html'
    index_url?: string
    follow_recent_item_links?: boolean
    counts_as_rss_success?: boolean
  }
}

export interface FeedsConfig {
  version?: number
  timezone?: string
  policy?: {
    rss_first?: boolean
    lookback_hours?: number
    minimum_successful_feeds?: number
    deduplicate_across_feeds?: boolean
  }
  feeds: FeedConfig[]
}

export interface FeedDiscoveryResult {
  feedId: string
  name: string
  status: FeedStatus
  transport: FeedTransport | null
  sourceUrl: string | null
  rawRssRetrieved: boolean
  items: DiscoveryItem[]
  errors: string[]
}

export interface DiscoveryReport {
  schemaVersion: 1
  generatedAt: string
  lookbackHours: number
  minimumSuccessfulFeeds: number
  successfulFeeds: number
  rssSuccessfulFeeds: number
  meetsMinimumFeeds: boolean
  feeds: FeedDiscoveryResult[]
  items: DiscoveryItem[]
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const DEFAULT_LOOKBACK_HOURS = 48
const DEFAULT_MAX_FEED_ITEMS = 24
const DEFAULT_TIMEOUT_MS = 15_000
const FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000

export async function loadFeedsConfig(path = resolve('config/feeds.yaml')): Promise<FeedsConfig> {
  const parsed: unknown = parseYaml(await readFile(path, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as FeedsConfig).feeds)) {
    throw new Error(`Invalid feed configuration: ${path}`)
  }
  return parsed as FeedsConfig
}

export function parseFeedXml(xml: string, feedId: string, sourceUrl: string): Omit<DiscoveryItem, 'transport'>[] {
  const rssBlocks = extractBlocks(xml, 'item')
  if (rssBlocks.length > 0) {
    return rssBlocks.map((block) => parseRssItem(block, feedId, sourceUrl)).filter(isPresent)
  }

  const atomBlocks = extractBlocks(xml, 'entry')
  if (atomBlocks.length > 0) {
    return atomBlocks.map((block) => parseAtomEntry(block, feedId, sourceUrl)).filter(isPresent)
  }

  throw new Error('Unsupported or empty RSS/Atom document')
}

export function selectRecentItems(
  items: Omit<DiscoveryItem, 'transport'>[],
  now: Date,
  lookbackHours: number,
  maxItems: number,
): Omit<DiscoveryItem, 'transport'>[] {
  const cutoff = now.getTime() - lookbackHours * 60 * 60 * 1000
  const upperBound = now.getTime() + FUTURE_CLOCK_SKEW_MS

  return items
    .filter((item) => {
      const timestamp = Date.parse(item.publishedAt)
      return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= upperBound
    })
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, maxItems)
}

export async function discoverFeeds(
  config: FeedsConfig,
  options: {
    now?: Date
    fetchImpl?: FetchLike
    timeoutMs?: number
  } = {},
): Promise<DiscoveryReport> {
  const now = options.now ?? new Date()
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const defaultLookback = config.policy?.lookback_hours ?? DEFAULT_LOOKBACK_HOURS
  const minimumSuccessfulFeeds = config.policy?.minimum_successful_feeds ?? 1
  const enabledFeeds = config.feeds.filter((feed) => feed.enabled !== false)

  // RSS-first is enforced structurally: every enabled feed's primary RSS URL is
  // attempted before any RSS fallback or same-source HTML fallback is touched.
  const primaryAttempts = await Promise.all(
    enabledFeeds.map(async (feed) => ({
      feed,
      attempt: await attemptRssEndpoint(feed, feed.url, 'rss', now, defaultLookback, fetchImpl, timeoutMs),
    })),
  )

  const feedResults: FeedDiscoveryResult[] = []

  for (const { feed, attempt: primary } of primaryAttempts) {
    const errors = [...primary.errors]
    let rawRssRetrieved = primary.rawRssRetrieved

    if (primary.items.length > 0) {
      feedResults.push(successResult(feed, 'rss', feed.url, rawRssRetrieved, primary.items, errors))
      continue
    }

    let resolved: FeedDiscoveryResult | undefined

    for (const fallbackUrl of feed.fallback_urls ?? []) {
      const fallback = await attemptRssEndpoint(
        feed,
        fallbackUrl,
        'rss-fallback',
        now,
        defaultLookback,
        fetchImpl,
        timeoutMs,
      )
      rawRssRetrieved ||= fallback.rawRssRetrieved
      errors.push(...fallback.errors)
      if (fallback.items.length > 0) {
        resolved = successResult(feed, 'rss-fallback', fallbackUrl, rawRssRetrieved, fallback.items, errors)
        break
      }
    }

    if (resolved) {
      feedResults.push(resolved)
      continue
    }

    if (feed.discovery_fallback?.mode === 'same-source-html' && feed.discovery_fallback.index_url) {
      const htmlFallback = await attemptHtmlFallback(
        feed,
        feed.discovery_fallback.index_url,
        now,
        defaultLookback,
        fetchImpl,
        timeoutMs,
      )
      errors.push(...htmlFallback.errors)
      if (htmlFallback.items.length > 0) {
        feedResults.push(
          successResult(
            feed,
            'same-source-html',
            feed.discovery_fallback.index_url,
            rawRssRetrieved,
            htmlFallback.items,
            errors,
          ),
        )
        continue
      }
    }

    feedResults.push({
      feedId: feed.id,
      name: feed.name,
      status: rawRssRetrieved ? 'stale' : 'failed',
      transport: null,
      sourceUrl: null,
      rawRssRetrieved,
      items: [],
      errors,
    })
  }

  const successfulFeeds = feedResults.filter((feed) => feed.status === 'success').length
  const rssSuccessfulFeeds = feedResults.filter(
    (feed) => feed.status === 'success' && (feed.transport === 'rss' || feed.transport === 'rss-fallback'),
  ).length

  const allItems = feedResults.flatMap((feed) => feed.items)
  const items = config.policy?.deduplicate_across_feeds === false ? allItems : deduplicateItems(allItems)

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    lookbackHours: defaultLookback,
    minimumSuccessfulFeeds,
    successfulFeeds,
    rssSuccessfulFeeds,
    meetsMinimumFeeds: successfulFeeds >= minimumSuccessfulFeeds,
    feeds: feedResults,
    items,
  }
}

async function attemptRssEndpoint(
  feed: FeedConfig,
  url: string,
  transport: Extract<FeedTransport, 'rss' | 'rss-fallback'>,
  now: Date,
  defaultLookback: number,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<{ rawRssRetrieved: boolean; items: DiscoveryItem[]; errors: string[] }> {
  try {
    const xml = await fetchText(url, fetchImpl, timeoutMs, 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1')
    const parsed = parseFeedXml(xml, feed.id, url)
    const lookback = feed.fetch?.lookback_hours ?? defaultLookback
    const maxItems = feed.fetch?.max_feed_items ?? DEFAULT_MAX_FEED_ITEMS
    const recent = selectRecentItems(parsed, now, lookback, maxItems).map((item) => ({ ...item, transport }))
    const errors = recent.length === 0 ? [`${url}: no usable items inside ${lookback}h lookback`] : []
    return { rawRssRetrieved: true, items: recent, errors }
  } catch (error) {
    return {
      rawRssRetrieved: false,
      items: [],
      errors: [`${url}: ${errorMessage(error)}`],
    }
  }
}

async function attemptHtmlFallback(
  feed: FeedConfig,
  indexUrl: string,
  now: Date,
  defaultLookback: number,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<{ items: DiscoveryItem[]; errors: string[] }> {
  try {
    const html = await fetchText(indexUrl, fetchImpl, timeoutMs, 'text/html, */*;q=0.1')
    const lookback = feed.fetch?.lookback_hours ?? defaultLookback
    const maxItems = feed.fetch?.max_feed_items ?? DEFAULT_MAX_FEED_ITEMS
    const candidates = extractDatedHtmlLinks(html, indexUrl)
      .filter((item) => isInsideLookback(item.publishedAt, now, lookback))
      .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
      .slice(0, maxItems)

    const items: DiscoveryItem[] = []
    const errors: string[] = []

    for (const candidate of candidates) {
      let summary: string | undefined
      let externalLinks: string[] = []

      if (feed.discovery_fallback?.follow_recent_item_links) {
        try {
          const itemHtml = await fetchText(candidate.url, fetchImpl, timeoutMs, 'text/html, */*;q=0.1')
          summary = stripMarkup(itemHtml).slice(0, 1200) || undefined
          if (feed.fetch?.extract_external_links !== false) {
            externalLinks = extractExternalLinks(itemHtml, candidate.url)
          }
        } catch (error) {
          errors.push(`${candidate.url}: ${errorMessage(error)}`)
        }
      }

      items.push({
        feedId: feed.id,
        title: candidate.title,
        url: candidate.url,
        publishedAt: candidate.publishedAt,
        summary,
        externalLinks,
        transport: 'same-source-html',
      })
    }

    if (items.length === 0) {
      errors.push(`${indexUrl}: no dated items inside ${lookback}h lookback`)
    }
    return { items, errors }
  } catch (error) {
    return { items: [], errors: [`${indexUrl}: ${errorMessage(error)}`] }
  }
}

async function fetchText(
  url: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  accept: string,
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept,
        'user-agent': 'Orbis-Feed-Discovery/1.0',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function successResult(
  feed: FeedConfig,
  transport: FeedTransport,
  sourceUrl: string,
  rawRssRetrieved: boolean,
  items: DiscoveryItem[],
  errors: string[],
): FeedDiscoveryResult {
  return {
    feedId: feed.id,
    name: feed.name,
    status: 'success',
    transport,
    sourceUrl,
    rawRssRetrieved,
    items,
    errors,
  }
}

function parseRssItem(block: string, feedId: string, sourceUrl: string): Omit<DiscoveryItem, 'transport'> | undefined {
  const url = resolveUrl(textFromTag(block, ['link']) ?? textFromTag(block, ['guid']), sourceUrl)
  const publishedAt = normalizeDate(textFromTag(block, ['pubDate', 'date', 'published', 'updated']))
  if (!url || !publishedAt) return undefined

  const contentRaw = rawFromTag(block, ['encoded', 'description', 'content']) ?? ''
  const title = textFromTag(block, ['title']) || url
  const summary = stripMarkup(contentRaw).slice(0, 1200) || undefined

  return {
    feedId,
    title,
    url,
    publishedAt,
    summary,
    externalLinks: extractExternalLinks(contentRaw, url),
  }
}

function parseAtomEntry(block: string, feedId: string, sourceUrl: string): Omit<DiscoveryItem, 'transport'> | undefined {
  const url = atomEntryUrl(block, sourceUrl) ?? resolveUrl(textFromTag(block, ['id']), sourceUrl)
  const publishedAt = normalizeDate(textFromTag(block, ['published', 'updated', 'date']))
  if (!url || !publishedAt) return undefined

  const contentRaw = rawFromTag(block, ['content', 'summary']) ?? ''
  const title = textFromTag(block, ['title']) || url

  return {
    feedId,
    title,
    url,
    publishedAt,
    summary: stripMarkup(contentRaw).slice(0, 1200) || undefined,
    externalLinks: extractExternalLinks(contentRaw, url),
  }
}

function atomEntryUrl(block: string, baseUrl: string): string | undefined {
  const tagPattern = /<(?:[\w.-]+:)?link\b([^>]*)\/?\s*>/gi
  let first: string | undefined
  for (const match of block.matchAll(tagPattern)) {
    const href = attributeValue(match[1], 'href')
    if (!href) continue
    const resolved = resolveUrl(href, baseUrl)
    if (!resolved) continue
    first ??= resolved
    const rel = attributeValue(match[1], 'rel')
    if (!rel || rel.toLowerCase() === 'alternate') return resolved
  }
  return first
}

function extractBlocks(xml: string, localName: string): string[] {
  const name = escapeRegExp(localName)
  const pattern = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}\\s*>`,
    'gi',
  )
  return [...xml.matchAll(pattern)].map((match) => match[1])
}

function rawFromTag(xml: string, localNames: string[]): string | undefined {
  for (const localName of localNames) {
    const name = escapeRegExp(localName)
    const pattern = new RegExp(
      `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}\\s*>`,
      'i',
    )
    const match = xml.match(pattern)
    if (match) return unwrapCdata(match[1]).trim()
  }
  return undefined
}

function textFromTag(xml: string, localNames: string[]): string | undefined {
  const raw = rawFromTag(xml, localNames)
  return raw === undefined ? undefined : stripMarkup(raw)
}

function attributeValue(attributes: string, name: string): string | undefined {
  const escaped = escapeRegExp(name)
  const match = attributes.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  const value = match?.[1] ?? match?.[2]
  return value === undefined ? undefined : decodeEntities(value).trim()
}

function extractDatedHtmlLinks(html: string, baseUrl: string): Array<{ title: string; url: string; publishedAt: string }> {
  const results: Array<{ title: string; url: string; publishedAt: string }> = []
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  const seen = new Set<string>()

  for (const match of html.matchAll(pattern)) {
    const href = attributeValue(match[1], 'href')
    const url = resolveUrl(href, baseUrl)
    if (!url || seen.has(url)) continue
    const title = stripMarkup(match[2]) || url
    const dateMatch = `${title} ${href ?? ''}`.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
    if (!dateMatch) continue
    const publishedAt = normalizeDate(`${dateMatch[1]}T00:00:00Z`)
    if (!publishedAt) continue
    seen.add(url)
    results.push({ title, url, publishedAt })
  }
  return results
}

function extractExternalLinks(raw: string, itemUrl: string): string[] {
  const baseHost = safeHost(itemUrl)
  const links = new Set<string>()
  const hrefPattern = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi

  for (const match of raw.matchAll(hrefPattern)) {
    const resolved = resolveUrl(match[1] ?? match[2], itemUrl)
    if (resolved && safeHost(resolved) !== baseHost) links.add(resolved)
  }

  const textPattern = /https?:\/\/[^\s<>"')\]]+/gi
  for (const match of unwrapCdata(raw).matchAll(textPattern)) {
    const resolved = resolveUrl(decodeEntities(match[0]), itemUrl)
    if (resolved && safeHost(resolved) !== baseHost) links.add(resolved)
  }

  return [...links]
}

function deduplicateItems(items: DiscoveryItem[]): DiscoveryItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${canonicalUrl(item.url)}|${normalizeTitle(item.title)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value)
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|campaign$)/i.test(key)) url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return value
  }
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined
}

function isInsideLookback(value: string, now: Date, lookbackHours: number): boolean {
  const timestamp = Date.parse(value)
  const cutoff = now.getTime() - lookbackHours * 60 * 60 * 1000
  return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= now.getTime() + FUTURE_CLOCK_SKEW_MS
}

function resolveUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(decodeEntities(value).trim(), baseUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    url.hash = ''
    return url.toString()
  } catch {
    return undefined
  }
}

function safeHost(value: string): string | undefined {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return undefined
  }
}

function stripMarkup(value: string): string {
  return decodeEntities(
    unwrapCdata(value)
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function unwrapCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  }
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : full
    }
    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : full
    }
    return named[entity.toLowerCase()] ?? full
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined
}
