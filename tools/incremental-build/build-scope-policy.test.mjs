import assert from 'node:assert/strict'
import { classifyBuildScope, isContentOnlyPath } from './build-scope-policy.mjs'

for (const path of [
  'content/briefs/2026-09-11.yaml',
  'content/briefs/weekly/example.yml',
  'content/presentations/platform.yaml',
  'content/presentations/native-talk/slides.md',
  'content/essays/agent.md',
  'content/knowledge/runtime/note.md',
]) {
  assert.equal(isContentOnlyPath(path), true, `${path} should qualify for the content-only lane`)
}

for (const path of [
  'content/topics/agent.yaml',
  'content/sources/openai.yaml',
  'content/presentations/native-talk/local-asset.png',
  'apps/web/src/pages/index.astro',
  'tools/build-slides/index.ts',
  'config/site.yaml',
  'pnpm-lock.yaml',
  'docs/planning/plan.md',
]) {
  assert.equal(isContentOnlyPath(path), false, `${path} must retain the full regression lane`)
}

assert.equal(classifyBuildScope([]), 'full')
assert.equal(classifyBuildScope([
  { status: 'M', path: 'content/briefs/2026-09-11.yaml' },
  { status: 'A', path: 'content/essays/new.md' },
]), 'content')
assert.equal(classifyBuildScope([
  {
    status: 'R100',
    oldPath: 'content/presentations/old.yaml',
    path: 'content/presentations/new.yaml',
  },
]), 'content')
assert.equal(classifyBuildScope([
  { status: 'M', path: 'content/presentations/native-talk/slides.md' },
]), 'content')
assert.equal(classifyBuildScope([
  { status: 'M', path: 'content/briefs/2026-09-11.yaml' },
  { status: 'M', path: 'tools/build-slides/index.ts' },
]), 'full')

console.log('Build scope policy contracts passed')
