import type { ChangedEntry } from './change-set.ts'
import { entryPaths } from './change-set.ts'

export type GuardMode = {
  allowPrefixes?: string[]
  denyPrefixes?: string[]
}

export function matchesPrefix(path: string, prefix: string): boolean {
  const normalized = prefix.replace(/^\.\//, '')
  const directory = normalized.endsWith('/') ? normalized : `${normalized}/`
  return path === normalized.replace(/\/$/, '') || path.startsWith(directory)
}

export function evaluateGuardPolicy(changes: ChangedEntry[], mode: GuardMode): string[] {
  const violations: string[] = []

  for (const change of changes) {
    for (const path of entryPaths(change)) {
      if (mode.allowPrefixes?.length && !mode.allowPrefixes.some((prefix) => matchesPrefix(path, prefix))) {
        violations.push(`${path} is outside the allowlist`)
      }
      if (mode.denyPrefixes?.some((prefix) => matchesPrefix(path, prefix))) {
        violations.push(`${path} is generated/protected and must not be committed`)
      }
    }
  }

  return violations
}
