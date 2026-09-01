import { extname, relative, resolve } from 'node:path'
import {
  registryIdPattern,
  type Author,
  type Brief,
  type Essay,
  type Knowledge,
  type PresentationContent,
  type Source,
  type Topic,
} from '@orbis/content-schema'
import { normalizePath, repoRelative } from '../shared/content.ts'

export type ParsedContentEntry =
  | { kind: 'brief'; path: string; value: Brief }
  | { kind: 'presentation'; path: string; value: PresentationContent }
  | { kind: 'essay'; path: string; value: Essay }
  | { kind: 'topic'; path: string; value: Topic }
  | { kind: 'knowledge'; path: string; value: Knowledge }
  | { kind: 'source'; path: string; value: Source }
  | { kind: 'author'; path: string; value: Author }

export type ParsedContentKind = ParsedContentEntry['kind']

type RegistryKind = 'source' | 'author'
type ReferenceSource = { fieldPath: string; source: string }

function removeYamlExtension(path: string) {
  const extension = extname(path)
  return extension ? path.slice(0, -extension.length) : path
}

function registryDirectory(root: string, kind: RegistryKind) {
  return resolve(root, kind === 'source' ? 'content/sources' : 'content/authors')
}

function deriveRegistryId(
  root: string,
  entry: Extract<ParsedContentEntry, { kind: RegistryKind }>,
  errors: string[],
): string | undefined {
  const relativePath = normalizePath(relative(registryDirectory(root, entry.kind), entry.path))
  const displayPath = repoRelative(root, entry.path)

  if (relativePath.includes('/')) {
    errors.push(`Invalid registry path: ${displayPath} -> nested ${entry.kind} entries are not supported`)
    return undefined
  }

  const id = removeYamlExtension(relativePath)
  if (!registryIdPattern.test(id)) {
    errors.push(`Invalid registry ID: ${displayPath} -> "${id}" must match ${registryIdPattern.source}`)
    return undefined
  }

  return id
}

function deriveTopicId(root: string, entry: Extract<ParsedContentEntry, { kind: 'topic' }>) {
  const relativePath = normalizePath(relative(resolve(root, 'content/topics'), entry.path))
  return removeYamlExtension(relativePath)
}

function buildRegistryIndex(
  root: string,
  kind: RegistryKind,
  entries: ParsedContentEntry[],
  errors: string[],
) {
  const index = new Map<string, Extract<ParsedContentEntry, { kind: RegistryKind }>>()

  for (const entry of entries) {
    if (entry.kind !== kind) continue
    const typedEntry = entry as Extract<ParsedContentEntry, { kind: RegistryKind }>
    const id = deriveRegistryId(root, typedEntry, errors)
    if (!id) continue

    if (index.has(id)) {
      errors.push(`Duplicate registry ID: ${kind} "${id}"`)
      continue
    }
    index.set(id, typedEntry)
  }

  return index
}

function buildTopicIndex(root: string, entries: ParsedContentEntry[], errors: string[]) {
  const index = new Map<string, Extract<ParsedContentEntry, { kind: 'topic' }>>()

  for (const entry of entries) {
    if (entry.kind !== 'topic') continue
    const id = deriveTopicId(root, entry)
    if (index.has(id)) {
      errors.push(`Duplicate registry ID: topic "${id}"`)
      continue
    }
    index.set(id, entry)
  }

  return index
}

function collectReferenceSources(entry: ParsedContentEntry): ReferenceSource[] {
  if (!['brief', 'presentation', 'essay', 'knowledge'].includes(entry.kind)) return []

  const value = entry.value as Brief | PresentationContent | Essay | Knowledge
  const sources: ReferenceSource[] = []

  value.references.forEach((reference, index) => {
    if (reference.source) {
      sources.push({ fieldPath: `references[${index}].source`, source: reference.source })
    }
  })

  if ('sections' in value) {
    value.sections.forEach((section, sectionIndex) => {
      section.references.forEach((reference, referenceIndex) => {
        if (reference.source) {
          sources.push({
            fieldPath: `sections[${sectionIndex}].references[${referenceIndex}].source`,
            source: reference.source,
          })
        }
      })
    })
  }

  if ('archivePicks' in value) {
    value.archivePicks.forEach((reference, index) => {
      if (reference.source) {
        sources.push({ fieldPath: `archivePicks[${index}].source`, source: reference.source })
      }
    })
  }

  return sources
}

function validateContentTopics(
  root: string,
  entry: ParsedContentEntry,
  topicIndex: ReadonlyMap<string, unknown>,
  errors: string[],
) {
  const displayPath = repoRelative(root, entry.path)

  if (entry.kind === 'brief' || entry.kind === 'presentation' || entry.kind === 'essay' || entry.kind === 'knowledge') {
    entry.value.topics.forEach((topic, index) => {
      if (!topicIndex.has(topic)) {
        errors.push(`Invalid relation: ${displayPath}: topics[${index}] -> missing topic "${topic}"`)
      }
    })
  }

  if (entry.kind === 'brief' && entry.value.cadence === 'weekly') {
    entry.value.trendMovements.forEach((movement, index) => {
      if (!topicIndex.has(movement.topic)) {
        errors.push(`Invalid relation: ${displayPath}: trendMovements[${index}].topic -> missing topic "${movement.topic}"`)
      }
    })
  }
}

function validateTopicRelations(
  root: string,
  entry: Extract<ParsedContentEntry, { kind: 'topic' }>,
  topicIndex: ReadonlyMap<string, unknown>,
  errors: string[],
) {
  const displayPath = repoRelative(root, entry.path)
  const currentId = deriveTopicId(root, entry)

  entry.value.related.forEach((related, index) => {
    if (related === currentId) {
      errors.push(`Invalid relation: ${displayPath}: related[${index}] -> topic "${currentId}" cannot reference itself`)
      return
    }
    if (!topicIndex.has(related)) {
      errors.push(`Invalid relation: ${displayPath}: related[${index}] -> missing topic "${related}"`)
    }
  })
}

export function validateReferentialIntegrity(root: string, entries: ParsedContentEntry[]): string[] {
  const errors: string[] = []
  const sourceIndex = buildRegistryIndex(root, 'source', entries, errors)
  const authorIndex = buildRegistryIndex(root, 'author', entries, errors)
  const topicIndex = buildTopicIndex(root, entries, errors)

  for (const entry of entries) {
    validateContentTopics(root, entry, topicIndex, errors)

    if (entry.kind === 'topic') {
      validateTopicRelations(root, entry, topicIndex, errors)
    }

    if (entry.kind === 'essay') {
      const displayPath = repoRelative(root, entry.path)
      entry.value.authors.forEach((author, index) => {
        if (!authorIndex.has(author)) {
          errors.push(`Invalid relation: ${displayPath}: authors[${index}] -> missing author "${author}"`)
        }
      })
    }

    if (entry.kind === 'brief' || entry.kind === 'presentation' || entry.kind === 'essay' || entry.kind === 'knowledge') {
      const displayPath = repoRelative(root, entry.path)
      for (const relation of collectReferenceSources(entry)) {
        if (!sourceIndex.has(relation.source)) {
          errors.push(`Invalid relation: ${displayPath}: ${relation.fieldPath} -> missing source "${relation.source}"`)
        }
      }
    }
  }

  return [...new Set(errors)].sort((left, right) => left.localeCompare(right))
}
