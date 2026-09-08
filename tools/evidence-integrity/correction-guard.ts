import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { dailyBriefSchema, type DailyBrief } from '@orbis/content-schema'
import { parse } from 'yaml'
import { collectChangedEntries } from '../path-guard/change-set.ts'
import { loadEvidenceIntegrityConfig } from './config.ts'
import { evaluateCorrectionPolicy, resolveCorrectionBranch } from './correction-policy.ts'
import { evaluateDailyEvidence, isEvidenceDailyBrief } from './daily-evidence.ts'

const execFileAsync = promisify(execFile)

export type CorrectionGuardIssue = {
  code: string
  address: string
  message: string
}

export type CorrectionGuardResult = {
  base: string
  branch: string
  targetDate: string
  contentPath: string
  changedPaths: string[]
  issues: CorrectionGuardIssue[]
}

function parseBrief(source: string, label: string): DailyBrief {
  const parsed = dailyBriefSchema.safeParse(parse(source))
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`${label} is not a valid Daily Brief: ${detail}`)
  }
  if (parsed.data.cadence !== 'daily') throw new Error(`${label} must be a Daily Brief`)
  return parsed.data
}

async function readBaseBrief(root: string, base: string, contentPath: string): Promise<DailyBrief | null> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['show', `${base}:${contentPath}`],
      { cwd: root, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8' },
    )
    return parseBrief(stdout, `Base target ${contentPath}`)
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? ''
    if (/does not exist|exists on disk, but not in|Path .* does not exist/.test(stderr)) return null
    throw error
  }
}

async function readCandidateBrief(root: string, contentPath: string): Promise<DailyBrief | null> {
  try {
    return parseBrief(await readFile(resolve(root, contentPath), 'utf8'), `Correction candidate ${contentPath}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function runCorrectionGuard(root: string, base: string, branch: string): Promise<CorrectionGuardResult> {
  const target = resolveCorrectionBranch(branch)
  const changes = await collectChangedEntries(root, base)
  const baseBrief = await readBaseBrief(root, base, target.contentPath)
  const candidateBrief = await readCandidateBrief(root, target.contentPath)
  const issues: CorrectionGuardIssue[] = evaluateCorrectionPolicy({
    branch,
    changes,
    baseBrief,
    candidateBrief,
  })

  if (candidateBrief && isEvidenceDailyBrief(candidateBrief)) {
    const config = await loadEvidenceIntegrityConfig(root)
    const report = evaluateDailyEvidence(candidateBrief, target.contentPath, config.legacyDailyPaths)
    for (const error of report.errors) issues.push(error)
  }

  return {
    base,
    branch,
    targetDate: target.targetDate,
    contentPath: target.contentPath,
    changedPaths: changes.flatMap((change) => change.oldPath ? [change.oldPath, change.path] : [change.path]),
    issues,
  }
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main() {
  const root = resolve(import.meta.dirname, '../..')
  const base = option('--base') ?? process.env.PATH_GUARD_BASE
  const branch = option('--branch') ?? process.env.HEAD_REF ?? process.env.GITHUB_HEAD_REF
  if (!base) throw new Error('Published Daily correction guard requires --base <git-ref> or PATH_GUARD_BASE')
  if (!branch) throw new Error('Published Daily correction guard requires --branch <correction-branch> or HEAD_REF/GITHUB_HEAD_REF')

  const result = await runCorrectionGuard(root, base, branch)
  console.log(`Published Daily correction guard branch=${result.branch} target=${result.targetDate} base=${result.base}`)
  for (const path of result.changedPaths) console.log(`  changed ${path}`)

  if (result.issues.length) {
    console.error('\nPublished Daily correction guard rejected the change set:')
    for (const issue of result.issues) {
      console.error(`  - ${issue.code} ${issue.address}: ${issue.message}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Published Daily correction guard passed: ${result.contentPath}`)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main()
}
