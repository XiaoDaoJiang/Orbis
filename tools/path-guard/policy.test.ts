import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const helperPath = resolve('tools/path-guard/policy.ts')
assert.equal(existsSync(helperPath), true, 'Path Guard policy helper must exist')

const policy = await import(pathToFileURL(helperPath).href)
assert.equal(typeof policy.evaluateGuardPolicy, 'function', 'evaluateGuardPolicy must exist')

const prMode = {
  denyPrefixes: ['dist/', 'apps/slides/generated/'],
}

const contentAgentMode = {
  allowPrefixes: ['content/briefs/', 'content/presentations/', 'content/essays/', 'content/knowledge/'],
}

assert.deepEqual(
  policy.evaluateGuardPolicy([
    { status: 'D', path: 'dist/old/index.html' },
  ], prMode),
  ['dist/old/index.html is generated/protected and must not be committed'],
  'Deleting a denied path must not bypass PR policy',
)

assert.deepEqual(
  policy.evaluateGuardPolicy([
    { status: 'R100', oldPath: 'dist/old/index.html', path: 'content/briefs/moved.yaml' },
  ], prMode),
  ['dist/old/index.html is generated/protected and must not be committed'],
  'Rename source paths must participate in policy evaluation',
)

assert.deepEqual(
  policy.evaluateGuardPolicy([
    { status: 'R100', oldPath: 'content/briefs/source.yaml', path: 'apps/slides/generated/moved.md' },
  ], prMode),
  ['apps/slides/generated/moved.md is generated/protected and must not be committed'],
  'Rename destination paths must participate in policy evaluation',
)

assert.deepEqual(
  policy.evaluateGuardPolicy([
    { status: 'R100', oldPath: 'config/site.yaml', path: 'content/briefs/moved.yaml' },
  ], contentAgentMode),
  ['config/site.yaml is outside the allowlist'],
  'A rename cannot hide a protected source outside the content-agent allowlist',
)

assert.deepEqual(
  policy.evaluateGuardPolicy([
    { status: 'D', path: 'content/briefs/old.yaml' },
  ], contentAgentMode),
  [],
  'Generic content-agent policy may evaluate an allowed deletion; Scheduled Daily will apply the stricter no-delete rule',
)

console.log('Path Guard policy contract passed')
