import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workflow = await readFile('.github/workflows/feed-discovery-snapshot.yml', 'utf8')

assert.match(workflow, /name:\s*Orbis Feed Discovery Snapshot/, 'snapshot workflow must keep a stable name')
assert.match(workflow, /schedule:[\s\S]*cron:\s*'17 \*\/2 \* \* \*'/, 'snapshot workflow must refresh every two hours')
assert.match(workflow, /workflow_dispatch:/, 'snapshot workflow must support manual recovery runs')
assert.match(workflow, /push:[\s\S]*branches:[\s\S]*- main/, 'snapshot workflow may refresh after relevant main changes')
assert.doesNotMatch(workflow, /pull_request:/, 'snapshot publishing must never run with write permission on pull_request')
assert.match(workflow, /permissions:[\s\S]*contents:\s*write/, 'snapshot workflow needs only repository content write access')
assert.match(workflow, /pnpm exec tsx tools\/feed-discovery\/index\.ts --pretty/, 'workflow must use Orbis Native Feed Discovery')
assert.match(workflow, /runtime\/feed-discovery/, 'workflow must publish only to the dedicated runtime snapshot branch')
assert.match(workflow, /latest\.json/, 'workflow must expose a stable machine-readable snapshot path')
assert.match(workflow, /git push --force origin/, 'runtime snapshot branch must remain a single-current-state branch')
assert.match(workflow, /sourceRef:\s*'main'/, 'snapshot metadata must identify main as its source ref')
assert.match(workflow, /sourceCommit:\s*process\.env\.GITHUB_SHA/, 'snapshot metadata must retain the producing main commit')
assert.doesNotMatch(workflow, /deploy-pages|pages-build-deployment|actions\/deploy-pages/, 'snapshot workflow must not deploy Production Pages')

console.log('Feed discovery runtime snapshot workflow contract passed')
