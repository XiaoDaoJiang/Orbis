import { mkdir, readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { loadSiteConfig, joinBasePath, runtimeSiteBase } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const slidesRoot = resolve(root, 'apps/slides')
const generatedRoot = resolve(root, config.presentation.generatedDir)
const outputRoot = resolve(root, config.presentation.outputDir)
const siteBase = runtimeSiteBase(config)
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

async function run(args: string[]) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(pnpm, args, { cwd: slidesRoot, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`Command failed with exit code ${code}: pnpm ${args.join(' ')}`)))
  })
}

const entries = (await readdir(generatedRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

if (entries.length === 0) throw new Error('No generated presentations found. Run pnpm generate:slides first.')

if (process.argv.includes('--dev')) {
  const requested = process.env.SLIDES_ID
  const slug = requested ?? entries.at(-1)!
  if (!entries.includes(slug)) throw new Error(`Unknown SLIDES_ID: ${slug}`)
  await run(['exec', 'slidev', `generated/${slug}/slides.md`, '--open'])
  process.exit(0)
}

await rm(outputRoot, { recursive: true, force: true })
await mkdir(outputRoot, { recursive: true })

for (const slug of entries) {
  const base = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
  const out = resolve(outputRoot, slug)
  await run([
    'exec',
    'slidev',
    'build',
    `generated/${slug}/slides.md`,
    '--base',
    base,
    '--out',
    out,
    '--without-notes',
  ])
  console.log(`Built Slidev deck: ${slug} -> ${base}`)
}

console.log(`Built ${entries.length} presentation(s)`)
