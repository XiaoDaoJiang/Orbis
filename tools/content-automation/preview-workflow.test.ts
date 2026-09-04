import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workflow = await readFile('.github/workflows/pr-preview-build.yml', 'utf8')

assert.match(
  workflow,
  /startsWith\(github\.head_ref, 'automation\/daily\/'\)/,
  'PR Preview Build must activate the Scheduled Daily guard for automation/daily/* branches',
)
assert.match(workflow, /HEAD_REF:\s*\$\{\{ github\.head_ref \}\}/)
assert.match(workflow, /target_date="\$\{HEAD_REF#automation\/daily\/\}"/)
assert.match(workflow, /automation:daily:guard/)
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

console.log('Scheduled Daily PR Preview workflow contract passed')
