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

export function sortDiscoveryNewestFirst<T extends { publishedAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title))
}

export function filterBriefsByCadence(
  entries: CollectionEntry<'briefs'>[],
  cadence: BriefCadence,
): CollectionEntry<'briefs'>[] {
  return entries.filter((entry) => isPublicBrief(entry) && entry.data.cadence === cadence)
}
