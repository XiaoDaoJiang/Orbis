import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const execFileAsync = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')

type GuardMode = {
  allowPrefixes?: string[]
  denyPrefixes?: string[]
}

type GuardConfig = {
  version: number
  modes: Record<string, GuardMode>
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function matchesPrefix(path: string, prefix: string): boolean {
  const normalized = prefix.replace(/^\.\//, '')
  const directory = normalized.endsWith('/') ? normalized : `${normalized}/`
  return path === normalized.replace(/\/$/, '') || path.startsWith(directory)
}

const modeName = option('--mode') ?? 'pr'
const base = option('--base') ?? process.env.PATH_GUARD_BASE
if (!base) throw new Error('Path Guard requires --base <git-ref> or PATH_GUARD_BASE')

const config = parse(await readFile(resolve(root, 'config/path-guard.yaml'), 'utf8')) as GuardConfig
if (config.version !== 1) throw new Error('Unsupported Path Guard config version')
const mode = config.modes[modeName]
if (!mode) throw new Error(`Unknown Path Guard mode: ${modeName}`)

const { stdout } = await execFileAsync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMRTUXB', `${base}...HEAD`],
  { cwd: root, maxBuffer: 1024 * 1024 },
)
const changed = stdout.split(/\r?\n/).map((path) => path.trim()).filter(Boolean)

const violations: string[] = []
for (const path of changed) {
  if (mode.allowPrefixes?.length && !mode.allowPrefixes.some((prefix) => matchesPrefix(path, prefix))) {
    violations.push(`${path} is outside the allowlist`)
  }
  if (mode.denyPrefixes?.some((prefix) => matchesPrefix(path, prefix))) {
    violations.push(`${path} is generated/protected and must not be committed`)
  }
}

console.log(`Path Guard mode=${modeName} base=${base} changed=${changed.length}`)
for (const path of changed) console.log(`  ${path}`)

if (violations.length) {
  console.error('\nPath Guard rejected the change set:')
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log('Path Guard passed')
