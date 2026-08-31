import type { CollectionEntry } from 'astro:content'

export type PresentationSourceKind = 'brief' | 'presentation'
export type PresentationCadence = CollectionEntry<'briefs'>['data']['cadence']

export type PresentationDiscoveryItem = {
  id: string
  title: string
  summary: string
  publishedAt: string
  topics: string[]
  sourceKind: PresentationSourceKind
  presentationHref: string
  readingHref?: string
  cadence?: PresentationCadence
}

function publicHref(base: string, ...segments: string[]): string {
  const normalizedBase = base.replace(/\/$/, '')
  const path = segments.map((segment) => segment.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')
  return `${normalizedBase}/${path}/`
}

export function sortPresentationsNewestFirst<T extends Pick<PresentationDiscoveryItem, 'publishedAt' | 'title' | 'id'>>(
  items: T[],
): T[] {
  return [...items].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id))
}

export function buildPublicPresentations(
  briefs: CollectionEntry<'briefs'>[],
  presentations: CollectionEntry<'presentations'>[],
  base: string,
): PresentationDiscoveryItem[] {
  const briefItems: PresentationDiscoveryItem[] = briefs
    .filter((entry) => entry.data.status === 'published' && entry.data.presentation.enabled)
    .map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      summary: entry.data.summary,
      publishedAt: entry.data.publishedAt,
      topics: entry.data.topics,
      sourceKind: 'brief',
      presentationHref: publicHref(base, 'slides', entry.id),
      readingHref: publicHref(base, 'briefs', entry.id),
      cadence: entry.data.cadence,
    }))

  const standaloneItems: PresentationDiscoveryItem[] = presentations
    .filter((entry) => entry.data.status === 'published')
    .map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      summary: entry.data.summary,
      publishedAt: entry.data.publishedAt,
      topics: entry.data.topics,
      sourceKind: 'presentation',
      presentationHref: publicHref(base, 'slides', entry.id),
    }))

  return sortPresentationsNewestFirst([...briefItems, ...standaloneItems])
}
