import { execFileSync } from 'node:child_process'
import { appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { classifyBuildScope } from './build-scope-policy.mjs'

const root = resolve(import.meta.dirname, '../..')

function argumentValue(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function requireToken(tokens, index, label) {
  const value = tokens[index]
  if (!value) throw new Error(`Malformed git name-status record: missing ${label}`)
  return value
}

function parseNameStatusZ(output) {
  if (!output) return []
  const tokens = output.split('\0')
  if (tokens.at(-1) === '') tokens.pop()

  const entries = []
  let index = 0
  while (index < tokens.length) {
    const status = requireToken(tokens, index++, 'status')
    if (/^[RC]\d*$/.test(status)) {
      const oldPath = requireToken(tokens, index++, 'rename/copy source path')
      const path = requireToken(tokens, index++, 'rename/copy destination path')
      entries.push({ status, oldPath, path })
      continue
    }
    entries.push({ status, path: requireToken(tokens, index++, 'path') })
  }
  return entries
}

async function writeOutput(name, value) {
  const output = process.env.GITHUB_OUTPUT
  if (!output) return
  await appendFile(output, `${name}=${value}\n`, 'utf8')
}

const base = argumentValue('--base')
let mode = 'full'
let entries = []

if (base && !/^0+$/.test(base)) {
  const output = execFileSync(
    'git',
    ['diff', '--name-status', '-z', '--find-renames', `${base}...HEAD`],
    { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 },
  )
  entries = parseNameStatusZ(output)
  mode = classifyBuildScope(entries)
}

console.log(`Build scope: ${mode}`)
for (const entry of entries) {
  console.log(`  ${entry.status} ${entry.oldPath ? `${entry.oldPath} -> ` : ''}${entry.path}`)
}
await writeOutput('mode', mode)
