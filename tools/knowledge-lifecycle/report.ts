import { extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { knowledgeSchema } from '@orbis/content-schema'
import { listFiles, readMarkdownFrontmatter } from '../shared/content.ts'
import {
  evaluateReviewHealth,
  type KnowledgeEditorialStatus,
  type ReviewHealth,
} from './lifecycle.ts'

export type KnowledgeReviewInput = {
  id: string
  status: KnowledgeEditorialStatus
  reviewAt?: string
}

export type KnowledgeReviewSeverity = 'OK' | 'INFO' | 'WARN'

export type KnowledgeReviewEntry = KnowledgeReviewInput & {
  reviewHealth: ReviewHealth
  daysUntilReview: number | null
  severity: KnowledgeReviewSeverity
}

export type KnowledgeReviewReport = {
  evaluationDate: string
  summary: {
    current: number
    dueSoon: number
    overdue: number
    needsReview: number
  }
  entries: KnowledgeReviewEntry[]
}

function severityFor(health: ReviewHealth): KnowledgeReviewSeverity {
  if (health === 'overdue') return 'WARN'
  if (health === 'due-soon') return 'INFO'
  return 'OK'
}

export function buildKnowledgeReviewReport(
  entries: KnowledgeReviewInput[],
  evaluationDate: string,
): KnowledgeReviewReport {
  const evaluated = entries
    .map((entry): KnowledgeReviewEntry => {
      const result = evaluateReviewHealth({
        status: entry.status,
        reviewAt: entry.reviewAt,
        today: evaluationDate,
      })
      return {
        ...entry,
        reviewHealth: result.reviewHealth,
        daysUntilReview: result.daysUntilReview,
        severity: severityFor(result.reviewHealth),
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id))

  return {
    evaluationDate,
    summary: {
      current: evaluated.filter((entry) => entry.reviewHealth === 'current').length,
      dueSoon: evaluated.filter((entry) => entry.reviewHealth === 'due-soon').length,
      overdue: evaluated.filter((entry) => entry.reviewHealth === 'overdue').length,
      needsReview: evaluated.filter((entry) => entry.status === 'needs-review').length,
    },
    entries: evaluated,
  }
}

export function assertReportIsPublishable(_report: KnowledgeReviewReport): void {
  // Review health is advisory. Structural/referential errors remain fatal in content:validate.
}

function parseArgs(argv: string[]) {
  let evaluationDate = new Date().toISOString().slice(0, 10)
  let json = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') {
      json = true
      continue
    }
    if (arg === '--date') {
      const value = argv[index + 1]
      if (!value) throw new Error('--date requires YYYY-MM-DD')
      evaluationDate = value
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return { evaluationDate, json }
}

function knowledgeId(root: string, path: string) {
  const relativePath = relative(resolve(root, 'content/knowledge'), path).replaceAll('\\', '/')
  const extension = extname(relativePath)
  return extension ? relativePath.slice(0, -extension.length) : relativePath
}

async function readRepositoryKnowledge(root: string): Promise<KnowledgeReviewInput[]> {
  const files = await listFiles(resolve(root, 'content/knowledge'), ['.md'])
  const entries: KnowledgeReviewInput[] = []

  for (const file of files) {
    const frontmatter = (await readMarkdownFrontmatter(file)).data
    const parsed = knowledgeSchema.parse(frontmatter)
    entries.push({
      id: knowledgeId(root, file),
      status: parsed.status,
      reviewAt: parsed.reviewAt,
    })
  }

  return entries
}

function printHuman(report: KnowledgeReviewReport) {
  const { summary } = report
  console.log(`Knowledge review report · ${report.evaluationDate}`)
  console.log(`current=${summary.current} due-soon=${summary.dueSoon} overdue=${summary.overdue} needs-review=${summary.needsReview}`)

  for (const entry of report.entries) {
    const review = entry.reviewAt ?? 'unscheduled'
    const delta = entry.daysUntilReview === null ? '' : ` (${entry.daysUntilReview}d)`
    console.log(`${entry.severity} ${entry.id} · status=${entry.status} · review=${review} · ${entry.reviewHealth}${delta}`)
  }
}

async function main() {
  const { evaluationDate, json } = parseArgs(process.argv.slice(2))
  const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const entries = await readRepositoryKnowledge(root)
  const report = buildKnowledgeReviewReport(entries, evaluationDate)
  assertReportIsPublishable(report)

  if (json) console.log(JSON.stringify(report, null, 2))
  else printHuman(report)
}

const directInvocation = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (directInvocation) {
  await main()
}
