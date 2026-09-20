import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { eligibility, policy, previewMatches, requiredGateConfigured, runGate } from './daily-auto-merge.mjs'

const sha = 'a'.repeat(40)
const mainSha = 'b'.repeat(40)
const pr = {
  number: 60, state: 'open', draft: false, merged: false, changed_files: 1,
  body: '<!-- orbis-content-automation:v1 -->', user: { id: 38294800 },
  base: { ref: 'main', repo: { id: policy.repositoryId } },
  head: { ref: 'automation/daily/2026-09-21', sha, repo: { id: policy.repositoryId } },
}
const files = [{ filename: 'content/briefs/2026-09-21.yaml', status: 'added' }]
const run = {
  id: 10, run_attempt: 1, event: 'pull_request', status: 'completed', conclusion: 'success',
  path: policy.previewWorkflowPath, repository: { id: policy.repositoryId }, head_repository: { id: policy.repositoryId },
  head_sha: sha, head_branch: pr.head.ref, pull_requests: [{ number: pr.number }],
}
const rules = [{ type: 'pull_request' }, { type: 'required_status_checks', parameters: {
  required_status_checks: policy.requiredChecks.map(context => ({ context, integration_id: policy.checksIntegrationId })),
} }]
const proof = { context: policy.statusContext, state: 'success', creator: { login: 'github-actions[bot]' },
  description: 'daily-preview-ok:pr-60:run-10:attempt-1' }
const copy = value => structuredClone(value)

function fixture(mode = 'verify') {
  const state = { pr: copy(pr), files: copy(files), run: copy(run), rules: copy(rules), existing: null,
    mainSha, siblings: [copy(pr)], statuses: [], writes: [], merges: [], reads: [],
    repository: { allow_auto_merge: true, allow_squash_merge: true } }
  const env = { GITHUB_REPOSITORY: policy.repository, GITHUB_EVENT_NAME: mode === 'initialize' ? 'pull_request_target' : 'workflow_run',
    GITHUB_RUN_ID: '20', PREVIEW_VERIFIED: 'true', ORBIS_DAILY_AUTO_MERGE: 'true', ORBIS_AUTO_MERGE_TOKEN: 'test-only-token' }
  const event = { repository: { id: policy.repositoryId }, pull_request: copy(pr), workflow_run: copy(run) }
  const api = async (path, options = {}) => {
    state.reads.push(path)
    if (options.method === 'POST') { state.writes.push({ path, ...options.body }); return {} }
    if (path === `/pulls/${pr.number}`) return copy(state.pr)
    if (path.startsWith(`/commits/${sha}/pulls?`)) return copy(state.siblings)
    if (path.startsWith(`/pulls/${pr.number}/files?`)) return copy(state.files)
    if (path === '/git/ref/heads/main') return { object: { sha: state.mainSha } }
    if (path.startsWith('/contents/')) { assert.equal(options.missing, true); return state.existing }
    if (path === '/actions/runs/10') return copy(state.run)
    if (path.startsWith(`/commits/${sha}/statuses?`)) return copy(state.statuses)
    if (path === '') return state.repository
    if (path === '/rules/branches/main') return state.rules
    throw new Error(`unexpected-test-api: ${path}`)
  }
  const merge = async (number, head) => { state.merges.push({ number, head }); state.pr.auto_merge = { merge_method: 'squash' } }
  const options = { mode, event, env, api, merge }
  return { state, options, execute: () => runGate(options) }
}

test('only exact, added, owned Daily candidates qualify', () => assert.equal(eligibility(pr, files).eligible, true))
for (const [name, mutate, expected] of [
  ['ordinary PR', p => { p.head.ref = 'feat/example' }, 'manual-only'],
  ['correction', p => { p.head.ref = 'correction/daily/2026-09-21/fix' }, 'manual-only'],
  ['invalid date', p => { p.head.ref = 'automation/daily/2026-02-30' }, 'invalid-date'],
  ['nested branch', p => { p.head.ref += '/extra' }, 'invalid-date'],
  ['fork', p => { p.head.repo.id = 7 }, 'foreign-repository'],
  ['foreign base', p => { p.base.repo.id = 7 }, 'foreign-repository'],
  ['other base', p => { p.base.ref = 'release' }, 'unexpected-base'],
  ['untrusted author', p => { p.user.id = 7 }, 'untrusted-producer'],
  ['draft', p => { p.draft = true }, 'pr-is-draft'],
  ['closed', p => { p.state = 'closed' }, 'pr-not-open'],
  ['missing marker', p => { p.body = null }, 'missing-automation-marker'],
  ['invalid SHA', p => { p.head.sha = 'main' }, 'invalid-head'],
  ['extra file count', p => { p.changed_files = 2 }, 'unexpected-file-count'],
]) test(name, () => { const p = copy(pr); mutate(p); assert.equal(eligibility(p, files).reason, expected) })
for (const status of ['modified', 'removed', 'renamed', 'copied']) test(`reject ${status}`, () => {
  assert.equal(eligibility(pr, [{ ...files[0], status }]).reason, 'not-new-daily')
})
test('rename cannot masquerade as addition', () => assert.equal(eligibility(pr, [{ ...files[0], previous_filename: 'old.yaml' }]).eligible, false))
test('wrong date file', () => assert.equal(eligibility(pr, [{ ...files[0], filename: 'content/briefs/2026-09-20.yaml' }]).reason, 'unexpected-file'))
test('truncated or extra file response fails closed', () => {
  assert.equal(eligibility(pr, []).eligible, false)
  assert.equal(eligibility(pr, [...files, ...files]).eligible, false)
})
test('gate configuration requires source-bound checks and PR protection', () => {
  assert.equal(requiredGateConfigured(rules), true)
  assert.equal(requiredGateConfigured([]), false)
  const missing = copy(rules); missing[1].parameters.required_status_checks.pop()
  assert.equal(requiredGateConfigured(missing), false)
  const unbound = copy(rules); unbound[1].parameters.required_status_checks[1].integration_id = null
  assert.equal(requiredGateConfigured(unbound), false)
})
test('preview must bind exact source, attempt, branch, workflow and PR', () => {
  assert.equal(previewMatches(run, pr, 1), true)
  for (const patch of [{ head_sha: mainSha }, { run_attempt: 2 }, { path: '.github/workflows/other.yml' },
    { conclusion: 'failure' }, { head_branch: 'other' }, { event: 'push' }, { pull_requests: [] },
    { head_repository: { id: 7 } }, { pull_requests: [{ number: 61 }] }]) assert.equal(previewMatches({ ...run, ...patch }, pr, 1), false)
})
test('initializer waits; it never merges', async () => {
  const f = fixture('initialize'); assert.equal((await f.execute()).reason, 'waiting-for-current-trusted-preview')
  assert.equal(f.state.writes.at(-1).state, 'pending'); assert.equal(f.state.merges.length, 0)
})
test('late initializer does not overwrite this PR verified status', async () => {
  const f = fixture('initialize'); f.state.statuses = [copy(proof)]
  assert.equal((await f.execute()).reason, 'preview-already-verified'); assert.equal(f.state.writes.length, 0)
})
test('ordinary PR passes manual gate without merge authority', async () => {
  const f = fixture('initialize'); f.state.pr.head.ref = 'feat/change'; f.state.siblings = []
  assert.equal((await f.execute()).reason, 'manual-only'); assert.equal(f.state.writes.at(-1).state, 'success')
  assert.equal(f.state.merges.length, 0)
})
test('ordinary PR cannot clear sibling Daily gate sharing its SHA', async () => {
  const f = fixture('initialize'); f.state.pr.head.ref = 'feat/alias'
  assert.equal((await f.execute()).reason, 'shared-daily-sha'); assert.equal(f.state.writes.length, 0)
})
test('duplicate Daily candidate fails closed', async () => {
  const f = fixture(); f.state.siblings.push({ ...copy(pr), number: 61 })
  assert.equal((await f.execute()).reason, 'ambiguous-daily-candidate'); assert.equal(f.state.writes.at(-1).state, 'failure')
})
test('old preview never writes current-head status', async () => {
  const f = fixture(); f.options.event.workflow_run.head_sha = mainSha
  assert.equal((await f.execute()).reason, 'stale-preview'); assert.equal(f.state.writes.length, 0)
})
test('Daily already on current main cannot be auto-corrected', async () => {
  const f = fixture(); f.state.existing = { type: 'file' }
  assert.equal((await f.execute()).reason, 'daily-already-on-main'); assert.equal(f.state.writes.at(-1).state, 'failure')
})
test('missing or failed public smoke cannot pass gate', async () => {
  const f = fixture(); f.options.env.PREVIEW_VERIFIED = 'false'
  assert.equal((await f.execute()).reason, 'preview-not-verified'); assert.equal(f.state.writes.at(-1).state, 'failure')
})
test('old source attempt cannot clobber newer result', async () => {
  const f = fixture(); f.state.run.run_attempt = 2
  assert.equal((await f.execute()).reason, 'stale-run-attempt'); assert.equal(f.state.writes.length, 0)
})
test('verified gate is written to exact head, not default branch SHA', async () => {
  const f = fixture(); assert.equal((await f.execute()).eligible, true)
  assert.equal(f.state.writes.at(-1).path, `/statuses/${sha}`)
  assert.equal(f.state.writes.at(-1).description, proof.description); assert.equal(f.state.merges.length, 0)
})
test('head changed during verification cannot be authorized', async () => {
  const f = fixture(); const api = f.options.api; let reads = 0
  f.options.api = async (...args) => { if (args[0] === '/pulls/60' && ++reads === 2) f.state.pr.head.sha = mainSha; return api(...args) }
  assert.equal((await f.execute()).reason, 'head-moved'); assert.equal(f.state.writes.length, 0)
})
test('main movement during verification fails closed', async () => {
  const f = fixture(); const api = f.options.api; let reads = 0
  f.options.api = async (...args) => { if (args[0] === '/git/ref/heads/main' && ++reads === 2) f.state.mainSha = 'c'.repeat(40); return api(...args) }
  assert.equal((await f.execute()).reason, 'main-moved'); assert.equal(f.state.merges.length, 0)
})
test('API error is not treated as missing content or success', async () => {
  const f = fixture(); const api = f.options.api
  f.options.api = async (...args) => { if (args[0].startsWith('/contents/')) throw new Error('github-api-403'); return api(...args) }
  await assert.rejects(f.execute(), /github-api-403/); assert.equal(f.state.writes.at(-1).state, 'error')
})
for (const [name, mutate, expected] of [
  ['disabled switch', f => { f.options.env.ORBIS_DAILY_AUTO_MERGE = '' }, 'auto-merge-disabled'],
  ['missing token', f => { delete f.options.env.ORBIS_AUTO_MERGE_TOKEN }, 'missing-merge-token'],
  ['repository switch off', f => { f.state.repository.allow_auto_merge = false }, 'repository-auto-merge-unavailable'],
  ['squash off', f => { f.state.repository.allow_squash_merge = false }, 'repository-auto-merge-unavailable'],
  ['missing required gate', f => { f.state.rules = [] }, 'required-gates-not-configured'],
  ['missing current proof', f => { f.state.statuses = [] }, 'missing-current-preview-gate'],
]) test(`merge refuses ${name}`, async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]; mutate(f)
  assert.equal((await f.execute()).reason, expected); assert.equal(f.state.merges.length, 0)
})
test('native merge request uses exact validated SHA and confirms waiting state', async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]
  assert.equal((await f.execute()).reason, 'auto-merge-enabled'); assert.deepEqual(f.state.merges, [{ number: 60, head: sha }])
})
test('immediately merged result is not reported as merely armed', async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]
  f.options.merge = async () => { f.state.pr.merged = true; f.state.pr.merge_commit_sha = mainSha }
  assert.equal((await f.execute()).reason, 'merged')
})
test('invalid execution context fails before any mutation', async () => {
  const f = fixture(); f.options.env.GITHUB_EVENT_NAME = 'pull_request'
  await assert.rejects(f.execute(), /unexpected-preview-event/); assert.equal(f.state.writes.length, 0)
})
test('privileged workflows only checkout trusted main and isolate merge token', () => {
  const publish = readFileSync('.github/workflows/pr-preview-publish.yml', 'utf8')
  const init = readFileSync('.github/workflows/scheduled-daily-gate.yml', 'utf8')
  for (const workflow of [publish, init]) {
    assert.match(workflow, /ref: refs\/heads\/main/)
    assert.match(workflow, /persist-credentials: false/)
    assert.doesNotMatch(workflow, /ref:.*(?:head\.sha|head_sha|github\.sha)/)
    assert.doesNotMatch(workflow, /pnpm install|npm install|pages: write|id-token: write/)
  }
  assert.match(init, /pull_request_target:/); assert.doesNotMatch(init, /ORBIS_AUTO_MERGE_TOKEN/)
  assert.match(publish, /environment: daily-auto-merge/)
  assert.match(publish, /statuses: write/)
  assert.match(publish, /orbis-preview-provenance\.json/)
  assert.match(publish, /\. == \$expected\[0\]/)
  assert.match(publish, /needs\.verify-daily-gate\.outputs\.eligible == 'true'/)
  const implementation = readFileSync('tools/content-automation/daily-auto-merge.mjs', 'utf8')
  assert.match(implementation, /GH_TOKEN: env\.ORBIS_AUTO_MERGE_TOKEN/)
  assert.doesNotMatch(implementation, /'--admin'/)
})

test('metadata edited before merge cannot reuse earlier eligibility', async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]; const api = f.options.api; let reads = 0
  f.options.api = async (...args) => { if (args[0] === '/pulls/60' && ++reads === 3) f.state.pr.body = ''; return api(...args) }
  assert.equal((await f.execute()).reason, 'missing-automation-marker'); assert.equal(f.state.merges.length, 0)
})
test('final head race refuses merge invocation', async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]; const api = f.options.api; let reads = 0
  f.options.api = async (...args) => { if (args[0] === '/pulls/60' && ++reads === 3) f.state.pr.head.sha = mainSha; return api(...args) }
  assert.equal((await f.execute()).reason, 'head-moved'); assert.equal(f.state.merges.length, 0)
})
test('forged status source cannot satisfy initializer proof', async () => {
  const f = fixture('initialize'); f.state.statuses = [{ ...copy(proof), creator: { login: 'other-bot' } }]
  assert.equal((await f.execute()).reason, 'waiting-for-current-trusted-preview')
})
test('other PR status cannot satisfy initializer proof', async () => {
  const f = fixture('initialize'); f.state.statuses = [{ ...copy(proof), description: 'daily-preview-ok:pr-61:run-10:attempt-1' }]
  assert.equal((await f.execute()).reason, 'waiting-for-current-trusted-preview')
})
test('pagination cannot hide extra changed files', async () => {
  const f = fixture(); const api = f.options.api
  f.options.api = async (...args) => {
    if (args[0] === '/pulls/60/files?per_page=100&page=1') return Array.from({ length: 100 }, () => copy(files[0]))
    if (args[0] === '/pulls/60/files?per_page=100&page=2') return []
    return api(...args)
  }
  assert.equal((await f.execute()).reason, 'unexpected-file-count'); assert.equal(f.state.merges.length, 0)
})
test('native merge error is not reported as success', async () => {
  const f = fixture('merge'); f.state.statuses = [copy(proof)]
  f.options.merge = async () => { throw new Error('permission-denied') }
  await assert.rejects(f.execute(), /permission-denied/); assert.equal(f.state.writes.at(-1).state, 'error')
})
