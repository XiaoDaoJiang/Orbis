import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')

async function workflow(path: string): Promise<string> {
  return await readFile(resolve(root, path), 'utf8')
}

function requireFragments(name: string, content: string, fragments: readonly string[]): void {
  for (const fragment of fragments) {
    assert.ok(content.includes(fragment), `${name} must preserve workflow contract fragment: ${fragment}`)
  }
}

const preview = await workflow('.github/workflows/pr-preview-build.yml')
requireFragments('PR Preview', preview, [
  'Resolve build scope',
  "node tools/incremental-build/build-scope.mjs --base \"$ORBIS_PR_BASE_SHA\"",
  "steps.build-scope.outputs.mode == 'full'",
  'run: pnpm build',
  "steps.build-scope.outputs.mode == 'content'",
  'run: pnpm validate',
  'Restore Slidev deck cache',
  'pnpm build:presentation-impact',
  'SLIDES_IDS:',
  'run: pnpm build:web-artifacts',
  'run: pnpm build:site-artifacts',
])

const site = await workflow('.github/workflows/site-build.yml')
requireFragments('Site Build', site, [
  'Resolve build scope',
  "node tools/incremental-build/build-scope.mjs --base \"$ORBIS_BUILD_BASE\"",
  'Prepare Slidev cache for full build',
  "steps.build-scope.outputs.mode == 'full'",
  'run: pnpm build',
  "steps.build-scope.outputs.mode == 'content'",
  'Restore Slidev deck cache',
  'pnpm build:presentation-impact',
  'SLIDES_IDS:',
  'run: pnpm build:web-artifacts',
  'run: pnpm build:site-artifacts',
])

const portability = await workflow('.github/workflows/build-portability.yml')
requireFragments('Build Portability', portability, [
  'workflow_dispatch:',
  'schedule:',
  "cron: '17 3 * * 0'",
  'scope:',
  'Resolve portability scope',
  'needs: scope',
  "needs.scope.outputs.mode == 'full'",
  'run: pnpm build',
  'git diff --exit-code',
])

console.log('Incremental workflow wiring contracts passed')
