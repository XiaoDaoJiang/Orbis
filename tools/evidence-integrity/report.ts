import { relative, resolve } from 'node:path'
import { dailyBriefSchema } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { loadEvidenceIntegrityConfig } from './config.ts'
import { evaluateDailyEvidence, type DailyEvidenceReport } from './daily-evidence.ts'

const root = resolve(import.meta.dirname, '../..')
const json = process.argv.includes('--json')

function displayPath(path: string) {
  return relative(root, path).replaceAll('\\', '/')
}

function humanReport(report: DailyEvidenceReport) {
  const lines = [
    `Daily ${report.publishedAt}`,
    `  path                    ${report.path}`,
    `  mode                    ${report.mode}`,
    `  claims                  ${report.claimCount}`,
    `  claims with evidence    ${report.boundClaimCount}`,
    `  references              ${report.referenceCount}`,
    `  unused references       ${report.unusedReferenceCount}`,
    `  corrections             ${report.correctionCount}`,
  ]
  if (report.lastCorrectedAt) lines.push(`  last corrected          ${report.lastCorrectedAt}`)
  for (const error of report.errors) {
    lines.push(`  ERROR ${error.code} ${error.address}: ${error.message}`)
  }
  return lines.join('\n')
}

const config = await loadEvidenceIntegrityConfig(root)
const files = await listFiles(resolve(root, 'content/briefs'), ['.yaml', '.yml'])
const reports: DailyEvidenceReport[] = []
let parseFailed = false

for (const file of files) {
  const source = await readYaml(file)
  const parsed = dailyBriefSchema.safeParse(source)
  if (!parsed.success) {
    if ((source as { cadence?: unknown })?.cadence === 'daily') {
      parseFailed = true
      console.error(`Invalid Daily for evidence report: ${displayPath(file)}`)
      if (!json) console.error(JSON.stringify(parsed.error.issues, null, 2))
    }
    continue
  }
  if (parsed.data.cadence !== 'daily') continue
  reports.push(evaluateDailyEvidence(parsed.data, displayPath(file), config.legacyDailyPaths))
}

reports.sort((left, right) => left.path.localeCompare(right.path))

if (json) {
  console.log(JSON.stringify({
    version: 1,
    truthClaim: false,
    note: 'Evidence coverage validates explicit structural bindings; it does not prove factual truth.',
    reports,
  }, null, 2))
} else {
  console.log(reports.map(humanReport).join('\n\n'))
  console.log('\nEvidence coverage validates explicit structural bindings; it does not prove factual truth.')
}

if (parseFailed || reports.some((report) => report.errors.length > 0)) process.exit(1)
