import type { DiscoveryItem } from './content-discovery'

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
  kind: string,
): Entry[] {
  const index = new Map(entries.map((entry) => [entry.id, entry]))
  const selected: Entry[] = []
  const seen = new Set<string>()

  for (const id of ids) {
    if (!id || seen.has(id)) continue
    const entry = index.get(id)
    if (!entry) {
      throw new Error(`Unknown ${kind} ID in incremental cache dependency resolution: ${id}`)
    }
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
