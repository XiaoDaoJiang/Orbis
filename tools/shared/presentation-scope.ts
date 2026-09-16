import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

export type PresentationScope =
  | { mode: 'all'; ids: [] }
  | { mode: 'ids'; ids: string[] }

const SAFE_PRESENTATION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

function parseIds(value: string): string[] {
  const ids = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
  for (const id of ids) {
    if (!SAFE_PRESENTATION_ID.test(id)) throw new Error(`Unsafe presentation ID: ${id}`)
  }
  return ids
}

export function parsePresentationScope(
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): PresentationScope {
  let cliValue: string | undefined
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--ids') {
      const next = args[index + 1]
      if (!next || next.startsWith('--')) throw new Error('--ids requires a comma-separated value')
      if (cliValue !== undefined) throw new Error('--ids may only be provided once')
      cliValue = next
      index += 1
      continue
    }
    if (arg.startsWith('--ids=')) {
      if (cliValue !== undefined) throw new Error('--ids may only be provided once')
      cliValue = arg.slice('--ids='.length)
    }
  }

  const value = cliValue ?? env.SLIDES_IDS
  if (value === undefined || value.trim() === '') return { mode: 'all', ids: [] }

  const ids = parseIds(value)
  if (ids.length === 0) return { mode: 'all', ids: [] }
  return { mode: 'ids', ids }
}

export function selectPresentationIds(
  availableIds: readonly string[],
  scope: PresentationScope,
): string[] {
  const available = new Set(availableIds)
  if (scope.mode === 'all') return [...availableIds]

  const unknown = scope.ids.filter((id) => !available.has(id))
  if (unknown.length > 0) throw new Error(`Unknown presentation ID(s): ${unknown.join(', ')}`)
  return scope.ids
}

export async function preparePresentationOutput(
  outputRoot: string,
  selectedIds: readonly string[],
  scope: PresentationScope,
): Promise<void> {
  if (scope.mode === 'all') {
    await rm(outputRoot, { recursive: true, force: true })
    await mkdir(outputRoot, { recursive: true })
    return
  }

  await mkdir(outputRoot, { recursive: true })
  for (const id of selectedIds) {
    await rm(resolve(outputRoot, id), { recursive: true, force: true })
  }
}
