// Shared producer/consumer contract. No dependencies: privileged workflows load only trusted main.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function assertTargetDate(targetDate) {
  if (!DATE_PATTERN.test(targetDate)) {
    throw new Error(`Invalid targetDate: expected YYYY-MM-DD, got ${targetDate || '<empty>'}`)
  }

  const [year, month, day] = targetDate.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day))
  if (
    value.getUTCFullYear() !== year
    || value.getUTCMonth() !== month - 1
    || value.getUTCDate() !== day
  ) {
    throw new Error(`Invalid targetDate calendar date: ${targetDate}`)
  }

  return targetDate
}

export function resolveDailyTarget(targetDate) {
  const date = assertTargetDate(targetDate)
  return {
    targetDate: date,
    contentPath: `content/briefs/${date}.yaml`,
    branch: `automation/daily/${date}`,
  }
}


const OUTCOMES = new Set([
  'candidate-created',
  'candidate-updated',
  'already-published',
  'blocked',
  'failed',
])
const CHECK_RESULTS = new Set(['passed', 'failed', 'not-run'])
const FAILURE_STAGES = new Set([
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

function asRecord(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('DailyAutomationReport must be an object')
  }
  return source
}

function requireNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
  return value
}

export function assertDailyAutomationReport(source) {
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
  if (typeof value.outcome !== 'string' || !OUTCOMES.has(value.outcome)) {
    throw new Error(`Invalid DailyAutomationReport outcome: ${String(value.outcome)}`)
  }

  const sourceCount = requireNonNegativeInteger(value.sourceCount, 'sourceCount')
  const primarySourceCount = requireNonNegativeInteger(value.primarySourceCount, 'primarySourceCount')
  if (primarySourceCount > sourceCount) {
    throw new Error('primarySourceCount cannot exceed sourceCount')
  }

  if (typeof value.validation !== 'string' || !CHECK_RESULTS.has(value.validation)) {
    throw new Error(`Invalid DailyAutomationReport validation result: ${String(value.validation)}`)
  }
  if (typeof value.fullBuild !== 'string' || !CHECK_RESULTS.has(value.fullBuild)) {
    throw new Error(`Invalid DailyAutomationReport fullBuild result: ${String(value.fullBuild)}`)
  }
  if (!Array.isArray(value.unverified) || !value.unverified.every((item) => typeof item === 'string')) {
    throw new Error('DailyAutomationReport unverified must be a string array')
  }
  if (
    value.failureStage !== undefined
    && (typeof value.failureStage !== 'string' || !FAILURE_STAGES.has(value.failureStage))
  ) {
    throw new Error(`Invalid DailyAutomationReport failureStage: ${String(value.failureStage)}`)
  }

  return {
    version: 1,
    kind: 'daily',
    targetDate: target.targetDate,
    branch: target.branch,
    contentPath: target.contentPath,
    outcome: value.outcome,
    sourceCount,
    primarySourceCount,
    validation: value.validation,
    fullBuild: value.fullBuild,
    unverified: [...value.unverified],
    ...(value.failureStage === undefined
      ? {}
      : { failureStage: value.failureStage }),
  }
}

export function renderDailyAutomationPrMetadata(source) {
  const report = assertDailyAutomationReport(source)
  const unverified = report.unverified.length
    ? report.unverified.map((item) => `- ${item.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}`).join('\n')
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
      // Keep arbitrary diagnostic strings inside the HTML comment.
      JSON.stringify(report, null, 2).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e'),
      '-->',
    ].join('\n'),
  }
}

/** Read exactly one canonical report. Metadata is data, never executable input. */
export function parseDailyAutomationReport(body) {
  if (typeof body !== 'string') return null
  const markers = body.match(/<!--\s*orbis-content-automation(?=[:\s>])/g) ?? []
  if (markers.length === 0) return null
  if (markers.length !== 1) throw new Error('Ambiguous DailyAutomationReport blocks')
  const blocks = [...body.matchAll(/^<!-- orbis-content-automation:v1\r?\n([\s\S]*?)\r?\n-->[ \t]*$/gm)]
  if (blocks.length !== 1) throw new Error('Invalid DailyAutomationReport block')
  return assertDailyAutomationReport(JSON.parse(blocks[0][1]))
}
