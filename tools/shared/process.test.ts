import assert from 'node:assert/strict'
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mergeEnvironment, pnpmInvocation, runPnpm, runProcess } from './process.ts'

const directory = await realpath(await mkdtemp(join(tmpdir(), 'orbis process 中文 & space ')))
const capture = { cwd: directory, capture: true } as const
try {
  const probe = join(directory, 'argument probe.mjs')
  await writeFile(probe, 'console.log(JSON.stringify({args: process.argv.slice(2), cwd: process.cwd(), value: process.env.ORBIS_PROBE}))\n')
  const args = ['with space', '中文', '', 'a&b', 'a|b', '$(echo forbidden)', '%PATH%', '"quote"', 'C:\\path with spaces\\']
  const result = await runProcess(process.execPath, [probe, ...args], { ...capture, env: { ORBIS_PROBE: 'inherited ✓' } })
  assert.deepEqual(JSON.parse(result.stdout), { args, cwd: directory, value: 'inherited ✓' })
  assert.equal(result.code, 0)

  const normalFailure = await runProcess(process.execPath, ['-e', 'console.error("intentional failure"); process.exitCode = 7'], { ...capture, expectedExit: 'nonzero' })
  assert.equal(normalFailure.code, 7)
  assert.match(normalFailure.stderr, /intentional failure/)
  await assert.rejects(runProcess(process.execPath, ['-e', 'process.exitCode = 7'], capture), /received 7/)
  await assert.rejects(runProcess(process.execPath, ['-e', ''], { ...capture, expectedExit: 'nonzero' }), /received 0/)
  await assert.rejects(runProcess(join(directory, 'missing-executable'), [], { ...capture, expectedExit: 'nonzero' }), /Unable to run/)
  await assert.rejects(runProcess(process.execPath, [], { ...capture, cwd: join(directory, 'missing-directory') }), /Unable to run/)
  await assert.rejects(runProcess('pnpm.cmd', [], capture), /Shell shims/)
  await assert.rejects(runProcess(process.execPath, [], { ...capture, cwd: '.' }), /absolute path/)

  const tail = await runProcess(process.execPath, ['-e', 'process.stdout.write("x".repeat(256 * 1024) + "END✓"); process.stderr.write("FINAL✓")'], capture)
  assert.equal(tail.stdout, 'x'.repeat(256 * 1024) + 'END✓')
  assert.equal(tail.stderr, 'FINAL✓')
  const unicode = await runProcess(process.execPath, ['-e', 'const b = Buffer.from("中文✓"); let i = 0; const t = setInterval(() => { if (i === b.length) clearInterval(t); else process.stdout.write(b.subarray(i, ++i)); }, 5)'], capture)
  assert.equal(unicode.stdout, '中文✓')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 200)
  try {
    await assert.rejects(runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { ...capture, expectedExit: 'nonzero', signal: controller.signal }), /Unable to run|terminated without a normal exit/)
  } finally {
    clearTimeout(timer)
  }
  if (process.platform !== 'win32') {
    await assert.rejects(runProcess(process.execPath, ['-e', 'process.kill(process.pid, "SIGTERM")'], { ...capture, expectedExit: 'nonzero' }), /terminated without a normal exit/)
  }

  assert.deepEqual(mergeEnvironment({ Path: 'base', HOME: 'home' }, { PATH: 'override' }, 'win32'), { HOME: 'home', PATH: 'override' })
  assert.deepEqual(mergeEnvironment({ PATH: 'base' }, { Path: 'different' }, 'linux'), { PATH: 'base', Path: 'different' })
  assert.deepEqual(mergeEnvironment({ PATH: 'base', REMOVE: 'x' }, { REMOVE: undefined }), { PATH: 'base' })

  // A real temporary JS CLI tests the no-shell pnpm transport without installing another package manager.
  const cli = join(directory, 'fake pnpm entrypoint.mjs')
  await writeFile(cli, 'console.log(JSON.stringify(process.argv.slice(2)))\n')
  const env = { npm_execpath: cli, npm_config_user_agent: 'pnpm/11.24.0 test' }
  assert.deepEqual(await pnpmInvocation(env), { command: process.execPath, prefix: [cli] })
  const viaPnpm = await runPnpm(args, { ...capture, env })
  assert.deepEqual(JSON.parse(viaPnpm.stdout), args)
  const native = await runPnpm(['-e', 'process.stdout.write("native transport")'], { ...capture, env: { ...env, npm_execpath: process.execPath } })
  assert.equal(native.stdout, 'native transport')
  const oldValue = process.env.ORBIS_DELETE_TEST
  try {
    process.env.ORBIS_DELETE_TEST = 'parent value'
    const removed = await runPnpm(['-e', 'process.stdout.write(process.env.ORBIS_DELETE_TEST ?? "absent")'], { ...capture, env: { ...env, npm_execpath: process.execPath, ORBIS_DELETE_TEST: undefined } })
    assert.equal(removed.stdout, 'absent')
  } finally {
    if (oldValue === undefined) delete process.env.ORBIS_DELETE_TEST
    else process.env.ORBIS_DELETE_TEST = oldValue
  }
  await assert.rejects(pnpmInvocation({}), /pnpm package script/)
  await assert.rejects(pnpmInvocation({ ...env, npm_config_user_agent: 'npm/10.0.0' }), /pnpm package script/)
  const shim = join(directory, 'pnpm.cmd')
  await writeFile(shim, '@echo off\r\n')
  await assert.rejects(pnpmInvocation({ ...env, npm_execpath: shim }), /Unsupported pnpm entrypoint/)
  await mkdir(join(directory, 'not-a-file'))
  await assert.rejects(pnpmInvocation({ ...env, npm_execpath: join(directory, 'not-a-file') }), /not a file/)
  console.log('Process runner contracts passed: argv, Unicode, cwd, env, output drain, exit, spawn errors, abort and pnpm transport')
} finally {
  await rm(directory, { recursive: true, force: true })
}
