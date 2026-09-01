import type { CollectionEntry } from 'astro:content'

export type ResolvedAuthor = {
  id: string
  name: string
  status: 'active' | 'archived'
  url?: string
  bio?: string
}

export type ResolvedSource = {
  id: string
  name: string
  homepage: string
  type: 'official' | 'publisher' | 'individual' | 'community' | 'aggregator'
  trustTier: 'primary' | 'secondary' | 'discovery'
  status: 'active' | 'archived'
}

function buildIndex<Entry extends { id: string }, Resolved>(
  entries: Entry[],
  kind: 'author' | 'source',
  resolve: (entry: Entry) => Resolved,
): ReadonlyMap<string, Resolved> {
  const index = new Map<string, Resolved>()

  for (const entry of entries) {
    if (index.has(entry.id)) {
      throw new Error(`Duplicate ${kind} ID in Web registry resolution: ${entry.id}`)
    }
    index.set(entry.id, resolve(entry))
  }

  return index
}

export function buildAuthorIndex(
  entries: CollectionEntry<'authors'>[],
): ReadonlyMap<string, ResolvedAuthor> {
  return buildIndex(entries, 'author', (entry) => ({
    id: entry.id,
    name: entry.data.name,
    status: entry.data.status,
    ...(entry.data.url ? { url: entry.data.url } : {}),
    ...(entry.data.bio ? { bio: entry.data.bio } : {}),
  }))
}

export function buildSourceIndex(
  entries: CollectionEntry<'sources'>[],
): ReadonlyMap<string, ResolvedSource> {
  return buildIndex(entries, 'source', (entry) => ({
    id: entry.id,
    name: entry.data.name,
    homepage: entry.data.homepage,
    type: entry.data.type,
    trustTier: entry.data.trustTier,
    status: entry.data.status,
  }))
}

export function resolveAuthors(
  ids: string[],
  index: ReadonlyMap<string, ResolvedAuthor>,
): ResolvedAuthor[] {
  return ids.map((id) => {
    const author = index.get(id)
    if (!author) {
      throw new Error(`Unknown author ID in Web registry resolution: ${id}`)
    }
    return author
  })
}

export function resolveReferenceSource(
  sourceId: string | undefined,
  index: ReadonlyMap<string, ResolvedSource>,
): ResolvedSource | undefined {
  if (!sourceId) return undefined

  const source = index.get(sourceId)
  if (!source) {
    throw new Error(`Unknown source ID in Web registry resolution: ${sourceId}`)
  }
  return source
}
