import assert from 'node:assert/strict'
import { access, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { stringify } from 'yaml'
import { loadSiteConfig } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const sourceDir = resolve(root, config.content.presentationsDir)
const slug = 'zz-orbis-invalid-presentation-check'
const path = resolve(sourceDir, `${slug}.yaml`)
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

async function assertMissing(target: string) {
  try {
    await access(target)
    assert.fail(`Refusing to overwrite existing invalid-source fixture: ${target}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

async function runExpectFailure(script: string): Promise<string> {
  return await new Promise<string>((resolvePromise, reject) => {
    const child = spawn(pnpm, [script], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let output = ''
    child.stdout?.on('data', (chunk) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk) => { output += chunk.toString() })
    child.once('error', reject)
    child.once('exit', (code) => code === 0
      ? reject(new Error(`Expected command to fail: pnpm ${script}`))
      : resolvePromise(output))
  })
}

const invalid = {
  kind: 'presentation',
  title: 'Invalid standalone presentation fixture',
  summary: 'This fixture deliberately uses a template that the standalone Presentation schema does not permit.',
  publishedAt: '2026-08-31',
  status: 'published',
  topics: ['agent-harness'],
  template: 'daily-v1',
  sections: [{
    id: 'invalid',
    layout: 'content',
    title: 'Invalid source contract',
    conclusion: 'The validator must reject this standalone source before presentation generation begins.',
    facts: ['Standalone Presentation content is restricted to implemented standalone template contracts.'],
    limitations: [],
    references: [],
  }],
  references: [{
    title: 'Orbis repository',
    url: 'https://github.com/XiaoDaoJiang/Orbis',
    supports: 'Provides the content schema implementation used by this validation test.',
  }],
}

await assertMissing(path)
await writeFile(path, stringify(invalid), 'utf8')
try {
  const output = await runExpectFailure('content:validate')
  assert.match(output, new RegExp(`Invalid content: content/presentations/${slug}\\.yaml`))
  assert.match(output, /template/)
  console.log(`Invalid standalone Presentation validation gate passed: ${slug}`)
} finally {
  await rm(path, { force: true })
}
