import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { briefSchema } from '@orbis/content-schema'
import { parse } from 'yaml'
import { collectChangedEntries } from '../path-guard/change-set.ts'
import { evaluateGuardPolicy, type GuardMode } from '../path-guard/policy.ts'
import { evaluateScheduledDailyChanges } from './daily-guard-policy.ts'
import { assertDailyCandidateIdentity, resolveDailyTarget } from './daily-target.ts'

const execFileAsync = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')

type GuardConfig = {
  version: number
  modes: Record<string, GuardMode>
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function readBaseStatus(base: string, contentPath: string): Promise<string | null> {
  const { stdout: listed } = await execFileAsync(
    'git',
    ['ls-tree', '-r', '--name-only', base, '--', contentPath],
    { cwd: root, maxBuffer: 1024 * 1024, encoding: 'utf8' },
  )

  if (!listed.trim()) return null
  if (listed.trim() !== contentPath) {
    throw new Error(`Unexpected base tree result for ${contentPath}: ${listed.trim()}`)
  }

  const { stdout } = await execFileAsync(
    'git',
    ['show', `${base}:${contentPath}`],
    { cwd: root, maxBuffer: 1024 * 1024, encoding: 'utf8' },
  )
  const parsed = briefSchema.safeParse(parse(stdout))
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Base target ${contentPath} is not a valid Brief: ${detail}`)
  }

  return parsed.data.status
}

const base = option('--base') ?? process.env.PATH_GUARD_BASE
const targetDate = option('--target-date')
if (!base) throw new Error('Scheduled Daily guard requires --base <git-ref> or PATH_GUARD_BASE')
if (!targetDate) throw new Error('Scheduled Daily guard requires explicit --target-date YYYY-MM-DD')

const target = resolveDailyTarget(targetDate)
const config = parse(await readFile(resolve(root, 'config/path-guard.yaml'), 'utf8')) as GuardConfig
if (config.version !== 1) throw new Error('Unsupported Path Guard config version')
const mode = config.modes['scheduled-daily']
if (!mode) throw new Error('Missing Path Guard mode: scheduled-daily')

const changes = await collectChangedEntries(root, base)
const baseStatus = await readBaseStatus(base, target.contentPath)
const violations = [
  ...evaluateGuardPolicy(changes, mode),
  ...evaluateScheduledDailyChanges({ targetDate, changes, baseStatus }),
]

if (!violations.length) {
  const candidateSource = parse(await readFile(resolve(root, target.contentPath), 'utf8'))
  assertDailyCandidateIdentity(targetDate, candidateSource)
}

console.log(`Scheduled Daily guard target=${targetDate} base=${base} changes=${changes.length} baseStatus=${baseStatus ?? 'missing'}`)
for (const change of changes) {
  console.log(change.oldPath
    ? `  ${change.status} ${change.oldPath} -> ${change.path}`
    : `  ${change.status} ${change.path}`)
}

if (violations.length) {
  console.error('\nScheduled Daily guard rejected the change set:')
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log(`Scheduled Daily guard passed: ${target.contentPath}`)
