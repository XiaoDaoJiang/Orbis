export interface TopicRegistryEntry {
  id: string
  data: {
    name: string
    description: string
    status: 'active' | 'watch' | 'archived'
    aliases?: string[]
    related?: string[]
  }
}
export interface ClassificationDiagnostic {
  code: 'unknown-label' | 'ambiguous-alias' | 'inactive-topic'
  label: string
  topicIds: string[]
}
export function validateTopicRegistry(entries: unknown): TopicRegistryEntry[]
export function classifyDailyCandidate(source: unknown, entries: unknown): {
  candidate: Record<string, unknown> & { topics: string[]; tags?: string[] }
  diagnostics: ClassificationDiagnostic[]
}
