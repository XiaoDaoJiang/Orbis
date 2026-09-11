import { resolve } from 'node:path'
import { discoverFeeds, loadFeedsConfig } from './core.ts'

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

if (hasFlag('--help')) {
  console.log(`Orbis Native Feed Discovery

Usage:
  pnpm discovery:feeds
  pnpm discovery:feeds -- --config config/feeds.yaml --now 2026-09-11T02:00:00Z --pretty

Options:
  --config <path>  Feed configuration path (default: config/feeds.yaml)
  --now <iso>      Override current time for deterministic replay/testing
  --pretty         Pretty-print normalized JSON output
  --help           Show this help
`)
  process.exit(0)
}

const configPath = resolve(argumentValue('--config') ?? 'config/feeds.yaml')
const nowValue = argumentValue('--now')
const now = nowValue ? new Date(nowValue) : new Date()

if (Number.isNaN(now.getTime())) {
  throw new Error(`Invalid --now value: ${nowValue}`)
}

const config = await loadFeedsConfig(configPath)
const report = await discoverFeeds(config, { now })
const spacing = hasFlag('--pretty') ? 2 : 0
process.stdout.write(`${JSON.stringify(report, null, spacing)}\n`)
