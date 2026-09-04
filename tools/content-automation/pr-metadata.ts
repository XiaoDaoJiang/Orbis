import type {
  AutomationCheckResult,
  AutomationFailureStage,
  DailyAutomationOutcome,
  DailyAutomationReport,
} from './contracts.ts'
import { resolveDailyTarget } from './daily-target.ts'

const OUTCOMES = new Set<DailyAutomationOutcome>([
  'candidate-created',
  'candidate-updated',
  'already-published',
  'blocked',
  'failed',
])
const CHECK_RESULTS = new Set<AutomationCheckResult>(['passed', 'failed', 'not-run'])
const FAILURE_STAGES = new Set<AutomationFailureStage>([
  'discovery',
  'verification',
  'generation',
  'schema',
  'guard',
  'git',
  'pr',
  'preview',
])
const REPORT_FIELDS = new Set([
  'version',
  'kind',
  'targetDate',
  'branch',
  'contentPath',
  'outcome',
  'sourceCount',
  'primarySourceCount',
  'validation',
  'fullBuild',
  'unverified',
  'failureStage',
])

function asRecord(source: unknown): Record<string, unknown> {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('DailyAutomationReport must be an object')
  }
  return source as Record<string, unknown>
}

function requireNonNegativeInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
  return value as number
}

export function assertDailyAutomationReport(source: unknown): DailyAutomationReport {
  const value = asRecord(source)
  const unknownFields = Object.keys(value).filter((field) => !REPORT_FIELDS.has(field))
  if (unknownFields.length) {
    throw new Error(`Unknown DailyAutomationReport field(s): ${unknownFields.join(', ')}`)
  }

  if (value.version !== 1) throw new Error('DailyAutomationReport version must be 1')
  if (value.kind !== 'daily') throw new Error('DailyAutomationReport kind must be daily')
  if (typeof value.targetDate !== 'string') throw new Error('DailyAutomationReport targetDate must be a string')

  const target = resolveDailyTarget(value.targetDate)
  if (value.branch !== target.branch) {
    throw new Error(`DailyAutomationReport branch must equal canonical target branch ${target.branch}`)
  }
  if (value.contentPath !== target.contentPath) {
    throw new Error(`DailyAutomationReport contentPath must equal canonical target path ${target.contentPath}`)
  }
  if (typeof value.outcome !== 'string' || !OUTCOMES.has(value.outcome as DailyAutomationOutcome)) {
    throw new Error(`Invalid DailyAutomationReport outcome: ${String(value.outcome)}`)
  }

  const sourceCount = requireNonNegativeInteger(value.sourceCount, 'sourceCount')
  const primarySourceCount = requireNonNegativeInteger(value.primarySourceCount, 'primarySourceCount')
  if (primarySourceCount > sourceCount) {
    throw new Error('primarySourceCount cannot exceed sourceCount')
  }

  if (typeof value.validation !== 'string' || !CHECK_RESULTS.has(value.validation as AutomationCheckResult)) {
    throw new Error(`Invalid DailyAutomationReport validation result: ${String(value.validation)}`)
  }
  if (typeof value.fullBuild !== 'string' || !CHECK_RESULTS.has(value.fullBuild as AutomationCheckResult)) {
    throw new Error(`Invalid DailyAutomationReport fullBuild result: ${String(value.fullBuild)}`)
  }
  if (!Array.isArray(value.unverified) || !value.unverified.every((item) => typeof item === 'string')) {
    throw new Error('DailyAutomationReport unverified must be a string array')
  }
  if (
    value.failureStage !== undefined
    && (typeof value.failureStage !== 'string' || !FAILURE_STAGES.has(value.failureStage as AutomationFailureStage))
  ) {
    throw new Error(`Invalid DailyAutomationReport failureStage: ${String(value.failureStage)}`)
  }

  return {
    version: 1,
    kind: 'daily',
    targetDate: target.targetDate,
    branch: target.branch,
    contentPath: target.contentPath,
    outcome: value.outcome as DailyAutomationOutcome,
    sourceCount,
    primarySourceCount,
    validation: value.validation as AutomationCheckResult,
    fullBuild: value.fullBuild as AutomationCheckResult,
    unverified: [...value.unverified] as string[],
    ...(value.failureStage === undefined
      ? {}
      : { failureStage: value.failureStage as AutomationFailureStage }),
  }
}

export function renderDailyAutomationPrMetadata(source: unknown): { title: string; body: string } {
  const report = assertDailyAutomationReport(source)
  const unverified = report.unverified.length
    ? report.unverified.map((item) => `- ${item}`).join('\n')
    : '- None reported.'

  return {
    title: `content: daily brief ${report.targetDate}`,
    body: [
      `## AI FRONTIER · ${report.targetDate}`,
      '',
      `- Branch: \`${report.branch}\``,
      `- Content path: \`${report.contentPath}\``,
      `- Outcome: ${report.outcome}`,
      `- Sources: ${report.sourceCount} (primary: ${report.primarySourceCount})`,
      `- Validation: ${report.validation}`,
      `- Full build: ${report.fullBuild}`,
      '',
      '### Unverified',
      unverified,
      '',
      '<!-- orbis-content-automation:v1',
      JSON.stringify(report, null, 2),
      '-->',
    ].join('\n'),
  }
}
