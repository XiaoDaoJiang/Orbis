import { basename, extname } from 'node:path'
import { entryPaths, type ChangedEntry } from '../path-guard/change-set.ts'

export type PresentationImpact =
  | { mode: 'none'; ids: []; reasons: string[] }
  | { mode: 'ids'; ids: string[]; reasons: string[] }
  | { mode: 'all'; ids: []; reasons: string[] }

const presentationSourcePattern = /^content\/(briefs|presentations)\/[^/]+\.(yaml|yml)$/
const definitelyNonPresentationContent = [
  'content/essays/',
  'content/knowledge/',
]

function presentationIdFromPath(path: string): string | undefined {
  if (!presentationSourcePattern.test(path)) return undefined
  return basename(path, extname(path))
}

function requiresAllDecks(path: string): boolean {
  if (path.startsWith('docs/')) return false
  if (definitelyNonPresentationContent.some((prefix) => path.startsWith(prefix))) return false
  if (presentationSourcePattern.test(path)) return false

  if (path.startsWith('content/')) return true
  if (path.startsWith('apps/')) return true
  if (path.startsWith('packages/')) return true
  if (path.startsWith('tools/')) return true
  if (path.startsWith('config/')) return true
  if (path.startsWith('.github/')) return true
  if (['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'].includes(path)) return true

  return true
}

export function classifyPresentationImpact(entries: ChangedEntry[]): PresentationImpact {
  const ids = new Set<string>()
  const reasons: string[] = []

  for (const entry of entries) {
    for (const path of entryPaths(entry)) {
      const id = presentationIdFromPath(path)
      if (id) {
        ids.add(id)
        reasons.push(`${entry.status} ${path} -> ${id}`)
        continue
      }

      if (requiresAllDecks(path)) {
        return {
          mode: 'all',
          ids: [],
          reasons: [`${entry.status} ${path} may affect shared presentation output`],
        }
      }
    }
  }

  if (ids.size > 0) {
    return { mode: 'ids', ids: [...ids].sort(), reasons }
  }
  return { mode: 'none', ids: [], reasons: ['No presentation-affecting changes detected'] }
}
