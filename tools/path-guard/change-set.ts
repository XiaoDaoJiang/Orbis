import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type ChangedEntry = {
  status: string
  path: string
  oldPath?: string
}

function requireToken(tokens: string[], index: number, label: string): string {
  const value = tokens[index]
  if (!value) throw new Error(`Malformed git name-status record: missing ${label}`)
  return value
}

export function parseNameStatusZ(output: string): ChangedEntry[] {
  if (!output) return []

  const tokens = output.split('\0')
  if (tokens.at(-1) === '') tokens.pop()

  const entries: ChangedEntry[] = []
  let index = 0

  while (index < tokens.length) {
    const status = requireToken(tokens, index++, 'status')

    if (/^[RC]\d*$/.test(status)) {
      const oldPath = requireToken(tokens, index++, 'rename/copy source path')
      const path = requireToken(tokens, index++, 'rename/copy destination path')
      entries.push({ status, oldPath, path })
      continue
    }

    const path = requireToken(tokens, index++, 'path')
    entries.push({ status, path })
  }

  return entries
}

export async function collectChangedEntries(root: string, base: string): Promise<ChangedEntry[]> {
  const { stdout } = await execFileAsync(
    'git',
    ['diff', '--name-status', '-z', '--find-renames', `${base}...HEAD`],
    { cwd: root, maxBuffer: 1024 * 1024, encoding: 'utf8' },
  )

  return parseNameStatusZ(stdout)
}

export function entryPaths(entry: ChangedEntry): string[] {
  return entry.oldPath && entry.oldPath !== entry.path
    ? [entry.oldPath, entry.path]
    : [entry.path]
}
