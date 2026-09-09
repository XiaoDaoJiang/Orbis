import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workflow = await readFile('.github/workflows/pages-promote.yml', 'utf8')

assert.match(workflow, /name:\s*Orbis Pages Promote/)
assert.match(workflow, /workflow_run:/)
assert.match(workflow, /workflows:\s*\[['"]Orbis Site Build['"]\]/)
assert.match(workflow, /types:\s*\[completed\]/)
assert.doesNotMatch(workflow, /pull_request_target:/)
assert.doesNotMatch(workflow, /pull_request:/)

assert.match(workflow, /github\.event\.workflow_run\.conclusion\s*==\s*['"]success['"]/)
assert.match(workflow, /github\.event\.workflow_run\.event\s*==\s*['"]push['"]/)
assert.match(workflow, /github\.event\.workflow_run\.head_branch\s*==\s*['"]main['"]/)

assert.match(workflow, /github\.event\.workflow_run\.head_sha/)
assert.match(workflow, /git\/ref\/heads\/main/)
assert.match(workflow, /commits\/\$SHA\/pulls/)
assert.match(workflow, /merge_commit_sha/)
assert.match(workflow, /merged_at/)
assert.match(workflow, /base\.ref/)

assert.match(workflow, /uses:\s*actions\/download-artifact@v7/)
assert.match(workflow, /name:\s*orbis-site/)
assert.match(workflow, /run-id:\s*\$\{\{\s*github\.event\.workflow_run\.id\s*\}\}/)
assert.match(workflow, /github-token:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/)
assert.doesNotMatch(
  workflow,
  /download-artifact@[\s\S]*?(?:latest|workflow_conclusion|branch:)/,
  'Promotion must never discover a moving latest artifact',
)

assert.match(workflow, /uses:\s*actions\/upload-pages-artifact@v4/)
assert.match(workflow, /uses:\s*actions\/deploy-pages@v4/)

const pagesWriteMatches = workflow.match(/pages:\s*write/g) ?? []
const idTokenWriteMatches = workflow.match(/id-token:\s*write/g) ?? []
assert.equal(pagesWriteMatches.length, 1, 'Pages write authority must exist in exactly one job')
assert.equal(idTokenWriteMatches.length, 1, 'OIDC write authority must exist in exactly one job')

const deployJob = workflow.match(/\n  deploy:[\s\S]*$/)?.[0] ?? ''
assert.match(deployJob, /pages:\s*write/)
assert.match(deployJob, /id-token:\s*write/)
assert.doesNotMatch(deployJob, /actions\/checkout/)
assert.doesNotMatch(deployJob, /pnpm\s+(?:install|build)/)

assert.match(workflow, /Smoke test deployed routes/)
assert.match(workflow, /'\/latest\/'/)
assert.match(workflow, /'\/archive\.json'/)
assert.match(workflow, /'\/rss\.xml'/)
assert.match(workflow, /latest_path=/)
assert.match(workflow, /Production Pages promotion smoke checks passed/)

console.log('Merge-gated Production promotion workflow contract passed')
