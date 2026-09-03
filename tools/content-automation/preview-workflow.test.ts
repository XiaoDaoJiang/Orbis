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
assert.match(workflow, /github\.event\.pull_request\.base\.sha/)
assert.match(workflow, /--target-date "\$target_date"/)
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/)
assert.doesNotMatch(workflow, /pages:\s*write/)
assert.doesNotMatch(workflow, /id-token:\s*write/)

console.log('Scheduled Daily PR Preview workflow contract passed')
