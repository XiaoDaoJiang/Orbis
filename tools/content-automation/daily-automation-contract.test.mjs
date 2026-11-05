import assert from 'node:assert/strict'
import test from 'node:test'
import { assertDailyAutomationReport, parseDailyAutomationReport, renderDailyAutomationPrMetadata } from './daily-automation-contract.mjs'

const report = {
  version: 1, kind: 'daily', targetDate: '2026-11-05', branch: 'automation/daily/2026-11-05',
  contentPath: 'content/briefs/2026-11-05.yaml', outcome: 'candidate-created',
  sourceCount: 8, primarySourceCount: 8, validation: 'not-run', fullBuild: 'not-run',
  unverified: ['Repository validation and build must run in trusted CI.'],
}
const body = renderDailyAutomationPrMetadata(report).body
const block = value => `<!-- orbis-content-automation:v1\n${JSON.stringify(value)}\n-->`

test('canonical producer report round trips with LF and CRLF', () => {
  assert.deepEqual(parseDailyAutomationReport(body), report)
  assert.deepEqual(parseDailyAutomationReport(body.replaceAll('\n', '\r\n')), report)
})
test('diagnostic HTML cannot terminate or create a machine comment', () => {
  const value = { ...report, unverified: ['--> <script>ignored</script> <!-- orbis-content-automation:v2'] }
  const rendered = renderDailyAutomationPrMetadata(value).body
  assert.deepEqual(parseDailyAutomationReport(rendered), value)
})
test('missing metadata returns no report', () => {
  for (const value of [undefined, null, 1, '', 'ordinary PR']) assert.equal(parseDailyAutomationReport(value), null)
})
for (const [name, value] of [
  ['bare marker', '<!-- orbis-content-automation:v1 -->'],
  ['malformed JSON', '<!-- orbis-content-automation:v1\n{broken}\n-->'],
  ['unterminated', body.replace(/\n-->$/, '')],
  ['unknown version', body.replace('automation:v1', 'automation:v2')],
  ['duplicate blocks', `${body}\n${body}`],
  ['valid plus unterminated', `${body}\n<!-- orbis-content-automation:v1`],
  ['valid plus unsupported', `${body}\n<!-- orbis-content-automation:v2 -->`],
  ['legacy separate report', '<!-- orbis-content-automation:v1 -->\n<!-- DailyAutomationReport:v1\n{}\n-->'],
  ['null payload', block(null)],
  ['array payload', block([report])],
  ['empty object', block({})],
]) test(`reject ${name}`, () => assert.throws(() => parseDailyAutomationReport(value)))

for (const field of Object.keys(report)) test(`reject missing ${field}`, () => {
  const value = { ...report }; delete value[field]
  assert.throws(() => parseDailyAutomationReport(block(value)))
})
for (const patch of [
  { version: 2 }, { kind: 'weekly' }, { targetDate: '2026-02-30' }, { targetDate: 20261105 },
  { branch: 'automation/daily/2026-11-06' }, { contentPath: 'content/briefs/2026-11-06.yaml' },
  { sourceCount: -1 }, { sourceCount: 1.5 }, { primarySourceCount: 9 },
  { validation: 'success' }, { fullBuild: true }, { outcome: 'ready' }, { unverified: [false] },
  { failureStage: 'unknown' }, { privateReasoning: 'not an operational field' },
]) test(`reject invalid schema ${JSON.stringify(patch)}`, () => {
  assert.throws(() => assertDailyAutomationReport({ ...report, ...patch }))
  assert.throws(() => parseDailyAutomationReport(block({ ...report, ...patch })))
})
