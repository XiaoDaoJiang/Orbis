import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { collectChangedEntries, entryPaths } from './change-set.ts'
import { evaluateGuardPolicy, type GuardMode } from './policy.ts'

const root = resolve(import.meta.dirname, '../..')

type GuardConfig = {
  version: number
  modes: Record<string, GuardMode>
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const modeName = option('--mode') ?? 'pr'
const base = option('--base') ?? process.env.PATH_GUARD_BASE
if (!base) throw new Error('Path Guard requires --base <git-ref> or PATH_GUARD_BASE')

const config = parse(await readFile(resolve(root, 'config/path-guard.yaml'), 'utf8')) as GuardConfig
if (config.version !== 1) throw new Error('Unsupported Path Guard config version')
const mode = config.modes[modeName]
if (!mode) throw new Error(`Unknown Path Guard mode: ${modeName}`)

const changed = await collectChangedEntries(root, base)
const violations = evaluateGuardPolicy(changed, mode)

console.log(`Path Guard mode=${modeName} base=${base} changed=${changed.length}`)
for (const entry of changed) {
  const paths = entryPaths(entry)
  console.log(paths.length === 2
    ? `  ${entry.status} ${paths[0]} -> ${paths[1]}`
    : `  ${entry.status} ${paths[0]}`)
}

if (violations.length) {
  console.error('\nPath Guard rejected the change set:')
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log('Path Guard passed')
