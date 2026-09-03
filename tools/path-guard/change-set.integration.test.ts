import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { collectChangedEntries } from './change-set.ts'

const execFileAsync = promisify(execFile)
const root = await mkdtemp(join(tmpdir(), 'orbis-path-guard-'))

try {
  await execFileAsync('git', ['init'], { cwd: root })
  await execFileAsync('git', ['config', 'user.name', 'Orbis Contract'], { cwd: root })
  await execFileAsync('git', ['config', 'user.email', 'contract@example.invalid'], { cwd: root })

  await mkdir(join(root, 'dist'), { recursive: true })
  await mkdir(join(root, 'content/briefs'), { recursive: true })
  await writeFile(join(root, 'dist/old.txt'), 'generated\n')
  await writeFile(join(root, 'content/briefs/source.yaml'), 'kind: brief\n')
  await execFileAsync('git', ['add', '.'], { cwd: root })
  await execFileAsync('git', ['commit', '-m', 'base'], { cwd: root })
  const { stdout: baseOut } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })
  const base = baseOut.trim()

  await execFileAsync('git', ['mv', 'content/briefs/source.yaml', 'content/briefs/moved.yaml'], { cwd: root })
  await rm(join(root, 'dist/old.txt'))

  const changes = await collectChangedEntries(root, base)
  const deleted = changes.find((entry) => entry.status === 'D' && entry.path === 'dist/old.txt')
  const renamed = changes.find((entry) => entry.status.startsWith('R'))

  assert.ok(deleted, 'Real Git change collection must include deleted paths')
  assert.ok(renamed, 'Real Git change collection must include rename records')
  assert.equal(renamed.oldPath, 'content/briefs/source.yaml')
  assert.equal(renamed.path, 'content/briefs/moved.yaml')

  console.log('Path Guard real Git change-set contract passed')
} finally {
  await rm(root, { recursive: true, force: true })
}
