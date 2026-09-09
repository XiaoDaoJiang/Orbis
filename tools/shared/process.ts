import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { extname, isAbsolute } from 'node:path'

export type ProcessOptions = {
  cwd: string
  /** Overrides are merged with the parent environment, including PATH. */
  env?: NodeJS.ProcessEnv
  capture?: boolean
  expectedExit?: 'zero' | 'nonzero' | 'any'
  signal?: AbortSignal
}

export type ProcessResult = {
  code: number
  stdout: string
  stderr: string
  output: string
}

export function mergeEnvironment(
  base: NodeJS.ProcessEnv,
  overrides: NodeJS.ProcessEnv = {},
  platform: NodeJS.Platform = process.platform,
): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {}
  const keys = new Map<string, string>()
  for (const source of [base, overrides]) {
    for (const [key, value] of Object.entries(source)) {
      const identity = platform === 'win32' ? key.toUpperCase() : key
      const previous = keys.get(identity)
      if (previous !== undefined) delete result[previous]
      keys.set(identity, key)
      if (value !== undefined) result[key] = value
    }
  }
  return result
}

/** Only native executables and Node CLI entrypoints cross this boundary. No shell. */
export async function runProcess(
  command: string,
  args: readonly string[],
  options: ProcessOptions,
): Promise<ProcessResult> {
  if (!isAbsolute(options.cwd)) throw new Error('Process cwd must be an absolute path')
  if (/\.(cmd|bat|ps1)$/i.test(command)) {
    throw new Error('Shell shims are not executable entrypoints; use runPnpm for pnpm commands')
  }
  const expected = options.expectedExit ?? 'zero'
  if (!['zero', 'nonzero', 'any'].includes(expected)) throw new Error('Invalid expectedExit')
  const label = `${command} ${args.map((arg) => JSON.stringify(arg)).join(' ')} (cwd: ${options.cwd})`
  return await new Promise<ProcessResult>((resolvePromise, reject) => {
    let child: ReturnType<typeof spawn>
    try {
      child = spawn(command, [...args], {
        cwd: options.cwd,
        env: mergeEnvironment(process.env, options.env),
        stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        shell: false,
        windowsHide: true,
        signal: options.signal,
      })
    } catch (cause) {
      reject(new Error(`Unable to start ${label}`, { cause }))
      return
    }
    let failure: Error | undefined
    let stdout = ''
    let stderr = ''
    let output = ''
    let outputBytes = 0
    const collect = (stream: 'stdout' | 'stderr', chunk: string) => {
      if (failure) return
      // Bound captured diagnostics; inherited build output is streamed without buffering.
      outputBytes += Buffer.byteLength(chunk)
      if (outputBytes > 16 * 1024 * 1024) {
        failure = new Error(`Captured output exceeded 16 MiB: ${label}`)
        child.kill()
        return
      }
      if (stream === 'stdout') stdout += chunk
      else stderr += chunk
      output += chunk
    }
    // Stream decoders preserve UTF-8 characters split across OS pipe reads.
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => collect('stdout', chunk))
    child.stderr?.setEncoding('utf8').on('data', (chunk: string) => collect('stderr', chunk))
    child.once('error', (cause) => {
      failure = new Error(`Unable to run ${label}: ${cause.message}`, { cause })
    })
    // 'exit' can precede the final stdout/stderr data. Fixtures may be cleaned only after close.
    child.once('close', (code, signal) => {
      if (failure) return reject(failure)
      if (signal !== null || code === null) {
        return reject(new Error(`Process terminated without a normal exit (${signal ?? 'unknown'}): ${label}`))
      }
      if ((expected === 'zero' && code !== 0) || (expected === 'nonzero' && code === 0)) {
        return reject(new Error(`Expected ${expected} exit, received ${code}: ${label}\n${output.slice(-16384)}`))
      }
      resolvePromise({ code, stdout, stderr, output })
    })
  })
}

export async function pnpmInvocation(env: NodeJS.ProcessEnv = process.env): Promise<{ command: string; prefix: string[] }> {
  const cli = env.npm_execpath
  if (!env.npm_config_user_agent?.startsWith('pnpm/') || !cli || !isAbsolute(cli)) {
    throw new Error('Run this tool through a pnpm package script: a pnpm npm_execpath and user agent are required')
  }
  if (!(await stat(cli)).isFile()) throw new Error(`pnpm CLI is not a file: ${cli}`)
  const extension = extname(cli).toLowerCase()
  if (['.js', '.cjs', '.mjs'].includes(extension)) {
    return { command: process.execPath, prefix: [cli] }
  }
  if (extension === '.exe' || (process.platform !== 'win32' && extension === '')) {
    return { command: cli, prefix: [] }
  }
  throw new Error(`Unsupported pnpm entrypoint: ${cli}. Use the pnpm Node CLI or standalone executable, not a shell shim`)
}

/** Preserve package-script/CLI contracts without ever spawning pnpm.cmd or resolving another pnpm from PATH. */
export async function runPnpm(args: readonly string[], options: ProcessOptions): Promise<ProcessResult> {
  const env = mergeEnvironment(process.env, options.env)
  const invocation = await pnpmInvocation(env)
  return await runProcess(invocation.command, [...invocation.prefix, ...args], { ...options, env })
}
