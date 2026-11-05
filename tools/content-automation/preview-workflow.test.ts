import assert from 'node:assert/strict'
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse } from 'yaml'

const workflow = await readFile('.github/workflows/pr-preview-build.yml', 'utf8')
const previewEvents = parse(workflow).on.pull_request.types
const gateWorkflow = parse(await readFile('.github/workflows/scheduled-daily-gate.yml', 'utf8'))

assert.ok(
  gateWorkflow.on.pull_request_target.types.includes('ready_for_review'),
  'Daily gate must reconsider a draft candidate when it becomes ready for review',
)
assert.deepEqual(
  previewEvents,
  ['opened', 'reopened', 'synchronize', 'ready_for_review', 'edited'],
  'PR Preview Build must refresh trusted preview after ready_for_review or edited resets the Daily gate',
)

assert.match(
  workflow,
  /startsWith\(github\.head_ref, 'automation\/daily\/'\)/,
  'PR Preview Build must activate the Scheduled Daily guard for automation/daily/* branches',
)
assert.match(workflow, /target_date="\$\{HEAD_REF#automation\/daily\/\}"/)
assert.match(workflow, /automation:daily:guard/)

assert.match(
  workflow,
  /startsWith\(github\.head_ref, 'correction\/daily\/'\)/,
  'PR Preview Build must activate the published correction guard for correction/daily/* branches',
)
assert.match(workflow, /name:\s*Guard published Daily correction/)
assert.match(workflow, /evidence:daily:correction:guard --base "\$ORBIS_PR_BASE_SHA" --branch "\$HEAD_REF"/)

assert.match(workflow, /HEAD_REF:\s*\$\{\{ github\.head_ref \}\}/)
assert.match(workflow, /name:\s*Resolve PR integration base/)
assert.match(
  workflow,
  /git rev-parse HEAD\^1/,
  'PR Preview Build must derive the integration base from the checked-out merge commit first parent',
)
assert.match(workflow, /ORBIS_PR_BASE_SHA=\$base_sha/)
assert.match(workflow, /path:guard --mode pr --base "\$ORBIS_PR_BASE_SHA"/)
assert.match(workflow, /automation:daily:guard --base "\$ORBIS_PR_BASE_SHA"/)
assert.doesNotMatch(
  workflow,
  /github\.event\.pull_request\.base\.sha/,
  'PR Preview guards must not use the stale pull_request.base.sha event payload',
)
assert.match(workflow, /--target-date "\$target_date"/)
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/)
assert.doesNotMatch(workflow, /pages:\s*write/)
assert.doesNotMatch(workflow, /id-token:\s*write/)

// Keep dependency-free trusted gate regressions in the existing validate/build chain.
execFileSync(process.execPath, ['--test', 'tools/content-automation/daily-automation-contract.test.mjs', 'tools/content-automation/daily-auto-merge.test.mjs'], { stdio: 'inherit' })


// Exercise the trusted publisher's bounded cache-propagation wait with fake time.
await import('./preview-smoke.test.ts')

console.log('Scheduled Daily and correction PR Preview workflow contract passed')

// Test each actual sparse checkout as an isolated, dependency-free Node runtime.
// A full checkout can hide a missing transitive import in a privileged job.
const publishWorkflow = parse(await readFile('.github/workflows/pr-preview-publish.yml', 'utf8'))
for (const job of [gateWorkflow.jobs['initialize-gate'], publishWorkflow.jobs['verify-daily-gate'], publishWorkflow.jobs['auto-merge-daily']]) {
  const checkout = job.steps.find((step: { uses?: string }) => step.uses?.startsWith('actions/checkout@'))
  assert.equal(checkout.with.ref, 'refs/heads/main')
  assert.equal(checkout.with['persist-credentials'], false)
  const sparsePaths: string[] = checkout.with['sparse-checkout'].trim().split(/\r?\n/)
  assert.ok(sparsePaths.includes('tools/content-automation/daily-automation-contract.mjs'))
  const directory = await mkdtemp(join(tmpdir(), 'orbis-trusted-gate-'))
  try {
    for (const path of sparsePaths) {
      const target = join(directory, path)
      await mkdir(dirname(target), { recursive: true }); await copyFile(path, target)
    }
    execFileSync(process.execPath, ['--input-type=module', '-e',
      "const { eligibility } = await import('./tools/content-automation/daily-auto-merge.mjs'); if (typeof eligibility !== 'function') process.exit(1)"],
    { cwd: directory, stdio: 'inherit' })
  } finally { await rm(directory, { recursive: true, force: true }) }
}
