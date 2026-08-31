import type { CollectionEntry } from 'astro:content'

export type DiscoveryKind = 'brief' | 'essay' | 'knowledge'
export type BriefCadence = CollectionEntry<'briefs'>['data']['cadence']

export type DiscoveryItem = {
  id: string
  kind: DiscoveryKind
  title: string
  summary: string
  publishedAt: string
  topics: string[]
  href: string
  cadence?: BriefCadence
  presentationHref?: string
}

export type DiscoveryIdentity = Pick<DiscoveryItem, 'kind' | 'id'>

export type AdjacentContent = {
  previous?: DiscoveryItem
  next?: DiscoveryItem
}

function publicHref(base: string, ...segments: string[]): string {
  const normalizedBase = base.replace(/\/$/, '')
  const path = segments.map((segment) => segment.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')
  return `${normalizedBase}/${path}/`
}

export function isPublicBrief(entry: CollectionEntry<'briefs'>): boolean {
  return entry.data.status === 'published'
}

export function isPublicEssay(entry: CollectionEntry<'essays'>): boolean {
  return entry.data.status === 'published'
}

export function isPublicKnowledge(entry: CollectionEntry<'knowledge'>): boolean {
  return entry.data.status === 'published' || entry.data.status === 'active'
}

export function isPublicTopic(entry: CollectionEntry<'topics'>): boolean {
  return entry.data.status !== 'archived'
}

export function toBriefDiscoveryItem(entry: CollectionEntry<'briefs'>, base: string): DiscoveryItem {
  return {
    id: entry.id,
    kind: 'brief',
    title: entry.data.title,
    summary: entry.data.summary,
    publishedAt: entry.data.publishedAt,
    topics: entry.data.topics,
    href: publicHref(base, 'briefs', entry.id),
    cadence: entry.data.cadence,
    presentationHref: entry.data.presentation.enabled ? publicHref(base, 'slides', entry.id) : undefined,
  }
}

export function toEssayDiscoveryItem(entry: CollectionEntry<'essays'>, base: string): DiscoveryItem {
  return {
    id: entry.id,
    kind: 'essay',
    title: entry.data.title,
    summary: entry.data.description,
    publishedAt: entry.data.publishedAt,
    topics: entry.data.topics,
    href: publicHref(base, 'essays', entry.id),
  }
}

export function toKnowledgeDiscoveryItem(entry: CollectionEntry<'knowledge'>, base: string): DiscoveryItem {
  return {
    id: entry.id,
    kind: 'knowledge',
    title: entry.data.title,
    summary: entry.data.summary,
    publishedAt: entry.data.publishedAt,
    topics: entry.data.topics,
    href: publicHref(base, 'knowledge', entry.id),
  }
}

export function sortDiscoveryNewestFirst<T extends { publishedAt: string; title: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title))
}

export function filterBriefsByCadence(
  entries: CollectionEntry<'briefs'>[],
  cadence: BriefCadence,
): CollectionEntry<'briefs'>[] {
  return entries.filter((entry) => isPublicBrief(entry) && entry.data.cadence === cadence)
}

export function buildPublicDiscoveryItems(
  briefs: CollectionEntry<'briefs'>[],
  essays: CollectionEntry<'essays'>[],
  knowledge: CollectionEntry<'knowledge'>[],
  base: string,
): DiscoveryItem[] {
  return [
    ...briefs.filter(isPublicBrief).map((entry) => toBriefDiscoveryItem(entry, base)),
    ...essays.filter(isPublicEssay).map((entry) => toEssayDiscoveryItem(entry, base)),
    ...knowledge.filter(isPublicKnowledge).map((entry) => toKnowledgeDiscoveryItem(entry, base)),
  ]
}

function identity(item: DiscoveryIdentity): string {
  return `${item.kind}:${item.id}`
}

function sharedTopicCount(left: DiscoveryItem, right: DiscoveryItem): number {
  const topics = new Set(left.topics)
  return right.topics.filter((topic) => topics.has(topic)).length
}

export function getRelatedContent(
  current: DiscoveryItem,
  candidates: DiscoveryItem[],
  limit = 3,
): DiscoveryItem[] {
  if (limit <= 0) return []

  return candidates
    .filter((candidate) => identity(candidate) !== identity(current))
    .map((candidate) => ({ candidate, shared: sharedTopicCount(current, candidate) }))
    .filter(({ shared }) => shared > 0)
    .sort((left, right) =>
      right.shared - left.shared
      || right.candidate.publishedAt.localeCompare(left.candidate.publishedAt)
      || left.candidate.title.localeCompare(right.candidate.title)
      || left.candidate.kind.localeCompare(right.candidate.kind)
      || left.candidate.id.localeCompare(right.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

export function getDailyAdjacency(
  entries: CollectionEntry<'briefs'>[],
  currentId: string,
  base: string,
): AdjacentContent {
  const sequence = entries
    .filter((entry) => isPublicBrief(entry) && entry.data.cadence === 'daily')
    .map((entry) => toBriefDiscoveryItem(entry, base))
    .sort((left, right) =>
      left.publishedAt.localeCompare(right.publishedAt)
      || left.title.localeCompare(right.title)
      || left.id.localeCompare(right.id))

  const currentIndex = sequence.findIndex((entry) => entry.id === currentId)
  if (currentIndex < 0) return {}

  return {
    previous: sequence[currentIndex - 1],
    next: sequence[currentIndex + 1],
  }
}
