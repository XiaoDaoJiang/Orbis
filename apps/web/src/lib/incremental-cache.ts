import type { AdjacentContent, DiscoveryItem } from './content-discovery'

type DigestEntry = {
  id: string
  digest?: string | null
}

export type CacheDependencyGroup = {
  name: string
  entries: readonly DigestEntry[]
}

export function requireContentDigest(entry: DigestEntry): string {
  if (!entry.digest) {
    throw new Error(`Missing Astro content digest for incremental cache dependency: ${entry.id}`)
  }
  return entry.digest
}

export function selectEntriesById<Entry extends { id: string }>(
  entries: readonly Entry[],
  ids: readonly (string | undefined)[],
  _kind: string,
): Entry[] {
  const index = new Map(entries.map((entry) => [entry.id, entry]))
  const selected: Entry[] = []
  const seen = new Set<string>()

  for (const id of ids) {
    if (!id || seen.has(id)) continue
    const entry = index.get(id)

    // Dependency selection must not replace the existing renderer/registry
    // validation contract. Missing IDs stay absent here so the normal page
    // resolver reports the canonical Author/Source error during rendering.
    if (!entry) continue

    selected.push(entry)
    seen.add(id)
  }

  return selected
}

function dependencyIdentity(entries: readonly DigestEntry[]) {
  return entries.map((entry) => [entry.id, requireContentDigest(entry)])
}

function relatedContentIdentity(items: readonly DiscoveryItem[]) {
  return items.map((item) => ({
    kind: item.kind,
    id: item.id,
    title: item.title,
    summary: item.summary,
    publishedAt: item.publishedAt,
    href: item.href,
  }))
}

function adjacentItemIdentity(item: DiscoveryItem | undefined) {
  if (!item) return null
  return {
    title: item.title,
    publishedAt: item.publishedAt,
    href: item.href,
  }
}

export function adjacentContentCacheIdentity(adjacent: AdjacentContent) {
  return {
    previous: adjacentItemIdentity(adjacent.previous),
    next: adjacentItemIdentity(adjacent.next),
  }
}

export function buildContentPageCacheKey({
  scope,
  entry,
  dependencyGroups = [],
  related = [],
  extra = null,
}: {
  scope: string
  entry: DigestEntry
  dependencyGroups?: readonly CacheDependencyGroup[]
  related?: readonly DiscoveryItem[]
  extra?: unknown
}): string {
  return `${scope}:v1:${JSON.stringify({
    entry: [entry.id, requireContentDigest(entry)],
    dependencies: dependencyGroups.map((group) => ({
      name: group.name,
      entries: dependencyIdentity(group.entries),
    })),
    related: relatedContentIdentity(related),
    extra,
  })}`
}
