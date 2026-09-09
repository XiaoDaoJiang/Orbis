import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { runPnpm } from '../shared/process.ts'
import { loadSiteConfig, runtimeSiteBase, runtimeSiteOrigin } from '../shared/site-config.ts'
import { validateToolchain } from '../shared/toolchain.ts'

const root = resolve(import.meta.dirname, '../..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const version = (await runPnpm(['--version'], { cwd: root, capture: true })).stdout.trim()
validateToolchain(manifest, process.versions.node, version)
const config = await loadSiteConfig()
const origin = runtimeSiteOrigin(config)
const base = runtimeSiteBase(config)
for (const directory of [config.content.briefsDir, config.content.presentationsDir, 'apps/web', 'apps/slides', 'packages/content-schema']) {
  if (!(await stat(resolve(root, directory))).isDirectory()) throw new Error(`Required repository directory is missing: ${directory}`)
}
console.log(`Build preflight passed: ${process.platform}/${process.arch}, Node ${process.versions.node}, pnpm ${version}`)
console.log(`Repository: ${root}`)
console.log(`Runtime site: ${origin}${base}/`)
