import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { eligibility, policy } from './daily-auto-merge.mjs'
import { assertDailyAutomationReport, parseDailyAutomationReport } from './daily-automation-contract.mjs'

const root = resolve(import.meta.dirname, '../..')
const adapter = readFileSync(join(root, 'config/adapters/chatgpt-scheduled-daily.md'), 'utf8')
const runtimePaths = [
  'tools/content-automation/daily-automation-contract.mjs',
  'tools/content-automation/render-daily-pr-metadata.mjs',
]
const command = adapter.match(/```bash\r?\n(node tools\/content-automation\/render-daily-pr-metadata\.mjs[^\r\n]*)\r?\n```/)?.[1]
const report = {
  version: 1, kind: 'daily', targetDate: '2026-11-06', branch: 'automation/daily/2026-11-06',
  contentPath: 'content/briefs/2026-11-06.yaml', outcome: 'candidate-created',
  sourceCount: 8, primarySourceCount: 8, validation: 'not-run', fullBuild: 'not-run',
  unverified: ['No full checkout; repository validation and build remain unverified.'],
}
const pr = {
  number: 75, state: 'open', draft: false, merged: false, changed_files: 1,
  user: { id: policy.producerIds[0] },
  base: { ref: policy.baseBranch, repo: { id: policy.repositoryId } },
  head: { ref: report.branch, sha: 'a'.repeat(40), repo: { id: policy.repositoryId } },
}
const files = [{ filename: report.contentPath, status: 'added' }]

// Reproduce the actual connector-only producer handoff without a checkout or dependencies.
// Only the two trusted runtime files and input report are copied into an empty directory.
function withRuntime(run) {
  const cwd = mkdtempSync(join(tmpdir(), 'orbis-metadata-handoff-'))
  try {
    for (const path of runtimePaths) {
      mkdirSync(dirname(join(cwd, path)), { recursive: true })
      copyFileSync(join(root, path), join(cwd, path))
    }
    const input = join(cwd, 'daily-report.json')
    const invoke = (value = report, args) => {
      writeFileSync(input, typeof value === 'string' ? value : JSON.stringify(value))
      assert.ok(command, 'Adapter must provide an executable metadata command')
      const actualArgs = args ?? command.split(' ').slice(1).map(arg =>
        arg === 'YYYY-MM-DD' ? report.targetDate : arg === '/tmp/daily-report.json' ? input : arg)
      return spawnSync(process.execPath, actualArgs, { cwd, encoding: 'utf8' })
    }
    return run({ cwd, input, invoke })
  } finally { rmSync(cwd, { recursive: true, force: true }) }
}

test('documented checkout-free command produces exact transport values accepted by the real gate', () => withRuntime(({ cwd, invoke }) => {
  assert.equal(existsSync(join(cwd, 'node_modules')), false)
  assert.equal(existsSync(join(cwd, 'package.json')), false)
  const result = invoke()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  const metadata = JSON.parse(result.stdout)
  assert.deepEqual(Object.keys(metadata).sort(), ['body', 'title'])
  assert.equal(metadata.title, 'content: daily brief 2026-11-06')
  assert.deepEqual(parseDailyAutomationReport(metadata.body), report)
  assert.equal(eligibility({ ...pr, body: metadata.body }, files).eligible, true)

  // Simulate the connector's JSON transport and a readback of the saved exact body.
  const saved = JSON.parse(JSON.stringify({ ...metadata, head: pr.head.sha }))
  assert.equal(saved.head, pr.head.sha)
  assert.deepEqual(parseDailyAutomationReport(saved.body), report)
}))

test('the actual adapter wire example passes shared schema/parser/gate, not a retyped fixture', () => {
  const blocks = [...adapter.matchAll(/```html\r?\n([\s\S]*?)\r?\n```/g)]
  assert.equal(blocks.length, 1)
  const body = blocks[0][1].replaceAll('YYYY-MM-DD', report.targetDate)
  const value = parseDailyAutomationReport(body)
  assert.deepEqual(value, { ...report, sourceCount: 0, primarySourceCount: 0, unverified: [] })
  assert.deepEqual(assertDailyAutomationReport(value), value)
  assert.equal(eligibility({ ...pr, body }, files).eligible, true)
  assert.doesNotMatch(adapter, /<!-- orbis-content-automation:v1 -->/, 'Adapter must never teach the old bare marker')
})

test('all Scheduled Runtime entry points load the current shared handoff and actual status semantics', () => {
  for (const path of ['config/adapters/chatgpt-scheduled-daily.md', 'config/scheduled-task-prompt.md', 'config/daily-task-prompt.md']) {
    const text = readFileSync(join(root, path), 'utf8')
    for (const file of runtimePaths) assert.ok(text.includes(file), `${path} must name ${file}`)
    for (const term of ['scheduled-daily-merge-gate', 'eligible', 'reason', 'round-trip']) assert.ok(text.includes(term), `${path} must explain ${term}`)
  }
  assert.match(adapter, /same commit/)
  assert.match(adapter, /re-read the stored PR body and head/)
  assert.match(adapter, /green initializer job is not a passed merge gate/)
  assert.match(adapter, /stop and report `blocked`/)
  assert.match(adapter, /metadata alone is not ownership or merge authority/)
  assert.match(adapter, /may immediately merge and publish/)
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts
  assert.equal(scripts['automation:daily:metadata'], `node ${runtimePaths[1]}`)
  assert.match(scripts['test:content-automation'], /node --test tools\/content-automation\/producer-metadata-handoff\.test\.mjs/)
})

test('the #75 bare-marker/prose shape remains blocked even with green build evidence', () => {
  const body = '<!-- orbis-content-automation:v1 -->\n## Orbis DailyAutomationReport\n\n- targetDate: 2026-11-06\n- Build: success'
  assert.equal(eligibility({ ...pr, body }, files).reason, 'invalid-automation-report')
})

for (const patch of [
  { version: 2 }, { kind: 'weekly' }, { targetDate: '2026-02-30' },
  { branch: 'automation/daily/2026-11-07' }, { contentPath: 'content/briefs/2026-11-07.yaml' },
  { sourceCount: -1 }, { primarySourceCount: 9 }, { validation: 'success' }, { fullBuild: true },
  { unverified: [false] }, { extraField: 'not permitted' },
]) test(`CLI fails before emission for ${JSON.stringify(patch)}`, () => withRuntime(({ invoke }) => {
  const result = invoke({ ...report, ...patch })
  assert.notEqual(result.status, 0); assert.equal(result.stdout, ''); assert.notEqual(result.stderr, '')
}))

test('CLI rejects malformed JSON, incomplete reports and date mismatch without partial output', () => withRuntime(({ invoke, input }) => {
  for (const value of ['{broken', {}, { ...report, sourceCount: undefined }, null]) {
    const result = invoke(value)
    assert.notEqual(result.status, 0); assert.equal(result.stdout, '')
  }
  for (const args of [[], ['2026-11-06'], ['2026-11-07', input], ['2026-02-30', input], ['2026-11-06', input, 'extra']]) {
    const result = invoke(report, [runtimePaths[1], ...args])
    assert.notEqual(result.status, 0); assert.equal(result.stdout, '')
  }
}))

test('CLI preserves diagnostics, explicit failures and escaped delimiters without claiming merge eligibility', () => withRuntime(({ invoke }) => {
  const value = { ...report, outcome: 'failed', validation: 'failed', failureStage: 'schema',
    unverified: ['--> <script>literal</script> <!-- orbis-content-automation:v2', 'quoted "value"\nnext line'] }
  const result = invoke(value)
  assert.equal(result.status, 0, result.stderr)
  const { body } = JSON.parse(result.stdout)
  assert.deepEqual(parseDailyAutomationReport(body), value)
  assert.equal(eligibility({ ...pr, body }, files).reason, 'automation-report-not-ready')
}))
