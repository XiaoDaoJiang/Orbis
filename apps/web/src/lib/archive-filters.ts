export interface ArchiveFilters {
  query: string
  kind: string
  cadence: string
  topic: string
}

export interface ArchiveCandidate {
  kind: string
  cadence: string
  topics: string[]
  text: string
}

export const emptyArchiveFilters: ArchiveFilters = { query: '', kind: 'all', cadence: 'all', topic: 'all' }

export function normalizeArchiveFilters(filters: ArchiveFilters, topics: string[]): ArchiveFilters {
  const kind = ['all', 'brief', 'essay', 'knowledge'].includes(filters.kind) ? filters.kind : 'all'
  return {
    query: filters.query.trim(),
    kind,
    cadence: kind !== 'all' && kind !== 'brief' ? 'all'
      : ['all', 'daily', 'weekly', 'ad-hoc'].includes(filters.cadence) ? filters.cadence : 'all',
    topic: topics.includes(filters.topic) ? filters.topic : 'all',
  }
}

export function readArchiveFilters(params: URLSearchParams, topics: string[]): ArchiveFilters {
  return normalizeArchiveFilters({
    query: params.get('q') ?? '',
    kind: params.get('type') ?? 'all',
    cadence: params.get('cadence') ?? 'all',
    topic: params.get('topic') ?? 'all',
  }, topics)
}

export function writeArchiveFilters(params: URLSearchParams, filters: ArchiveFilters): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries({ q: filters.query, type: filters.kind, cadence: filters.cadence, topic: filters.topic })) {
    if (!value || (key !== 'q' && value === 'all')) next.delete(key)
    else next.set(key, value)
  }
  return next
}

export function matchesArchiveFilters(candidate: ArchiveCandidate, filters: ArchiveFilters): boolean {
  const text = candidate.text.normalize('NFKC').toLocaleLowerCase()
  const terms = filters.query.normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return (filters.kind === 'all' || candidate.kind === filters.kind)
    && (filters.cadence === 'all' || candidate.cadence === filters.cadence)
    && (filters.topic === 'all' || candidate.topics.includes(filters.topic))
    && terms.every((term) => text.includes(term))
}
