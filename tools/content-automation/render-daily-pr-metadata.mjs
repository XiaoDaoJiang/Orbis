import { deepStrictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import {
  assertDailyAutomationReport,
  assertTargetDate,
  parseDailyAutomationReport,
  renderDailyAutomationPrMetadata,
} from './daily-automation-contract.mjs'

// Emit only validated transport data. This command never writes files or calls GitHub.
try {
  const [targetDate, input, ...extra] = process.argv.slice(2)
  if (!targetDate || !input || extra.length) {
    throw new Error('Usage: node tools/content-automation/render-daily-pr-metadata.mjs YYYY-MM-DD /tmp/daily-report.json')
  }
  assertTargetDate(targetDate)
  const report = assertDailyAutomationReport(JSON.parse(readFileSync(input, 'utf8')))
  if (report.targetDate !== targetDate) throw new Error('DailyAutomationReport targetDate must equal the explicit run targetDate')
  const metadata = renderDailyAutomationPrMetadata(report)
  deepStrictEqual(parseDailyAutomationReport(metadata.body), report)
  process.stdout.write(`${JSON.stringify(metadata)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
