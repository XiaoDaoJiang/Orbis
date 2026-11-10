import { MAX_OPEN_TAGS, normalizeContentLabel, contentLabelKey } from '../../packages/content-schema/src/open-tags.mjs'

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/** Validate the complete parsed snapshot, including entries not used by this Daily.
 * Connector callers must read these entries and the policy from the same commit SHA.
 * An unavailable/incomplete snapshot must never be replaced with an empty array.
 */
export function validateTopicRegistry(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('Topic Registry snapshot must be a non-empty array')
  const ids = new Set()
  for (const entry of entries) {
    if (!isObject(entry) || Object.keys(entry).some((key) => !['id', 'data'].includes(key)) ||
        typeof entry.id !== 'string' || !idPattern.test(entry.id) || entry.id.length > 64 || ids.has(entry.id)) {
      throw new Error('Topic Registry has malformed or duplicate identity')
    }
    ids.add(entry.id)
    const data = entry.data
    if (!isObject(data) || Object.keys(data).some((key) => !['name', 'description', 'aliases', 'status', 'related'].includes(key)) ||
        typeof data.name !== 'string' || data.name.length < 2 ||
        typeof data.description !== 'string' || data.description.length < 10 ||
        !['active', 'watch', 'archived'].includes(data.status) ||
        (data.related !== undefined && (!Array.isArray(data.related) || data.related.some((id) => typeof id !== 'string' || id.length < 2))) ||
        (data.aliases !== undefined && (!Array.isArray(data.aliases) || data.aliases.length > MAX_OPEN_TAGS))) {
      throw new Error(`Malformed Topic Registry entry: ${entry.id}`)
    }
    const aliases = new Set()
    for (const alias of data.aliases ?? []) {
      if (typeof alias !== 'string' || alias.length < 2) throw new Error(`Malformed alias for ${entry.id}`)
      const key = contentLabelKey(alias)
      if (aliases.has(key)) throw new Error(`Duplicate alias in Topic Registry entry: ${entry.id}`)
      aliases.add(key)
    }
  }
  return entries
}

/** Classification alone changes only topics/tags. No inference from names or prose. */
export function classifyDailyCandidate(source, entries) {
  validateTopicRegistry(entries)
  if (!isObject(source) || source.kind !== 'brief' || source.cadence !== 'daily' || source.evidenceVersion !== 1) {
    throw new Error('Open classification requires an Evidence V1 Daily')
  }
  if (!Array.isArray(source.topics) || source.topics.length > MAX_OPEN_TAGS ||
      (source.tags !== undefined && (!Array.isArray(source.tags) || source.tags.length > MAX_OPEN_TAGS))) {
    throw new Error(`Daily topics and tags must be arrays of at most ${MAX_OPEN_TAGS} labels`)
  }
  const canonical = new Map(entries.map((entry) => [entry.id, entry]))
  const aliases = new Map()
  for (const entry of entries) {
    for (const alias of entry.data.aliases ?? []) {
      const key = contentLabelKey(alias)
      if (!aliases.has(key)) aliases.set(key, [])
      aliases.get(key).push(entry)
    }
  }
  const topics = [], tags = [], diagnostics = []
  const seenLabels = new Set(), seenTopics = new Set()
  for (const raw of [...source.topics, ...(source.tags ?? [])]) {
    const label = normalizeContentLabel(raw)
    const key = contentLabelKey(label)
    if (seenLabels.has(key)) continue
    seenLabels.add(key)
    const exact = canonical.get(key)
    const matches = exact ? [exact] : aliases.get(key) ?? []
    if (matches.length === 1 && matches[0].data.status === 'active') {
      const id = matches[0].id
      if (!seenTopics.has(id)) { topics.push(id); seenTopics.add(id) }
    } else {
      tags.push(label)
      const code = matches.length > 1 ? 'ambiguous-alias' : matches.length === 1 ? 'inactive-topic' : 'unknown-label'
      diagnostics.push({ code, label, topicIds: matches.map((entry) => entry.id).sort() })
    }
  }
  if (!topics.length && !tags.length) throw new Error('Daily requires at least one topic or tag')
  if (topics.length > MAX_OPEN_TAGS || tags.length > MAX_OPEN_TAGS) throw new Error('Classified topics or tags exceed their count limit')
  return { candidate: { ...source, topics, ...(source.tags !== undefined || tags.length ? { tags } : {}) }, diagnostics }
}
