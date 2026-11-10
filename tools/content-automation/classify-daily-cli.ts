import { readFile } from 'node:fs/promises'
import { classifyDailyCandidate, loadTopicRegistry } from './daily-classification.ts'

try {
  const [input, registryDirectory, ...extra] = process.argv.slice(2)
  if (!input || extra.length) throw new Error('Usage: classify-daily-cli.ts <candidate.json> [topics-directory]')
  const source: unknown = JSON.parse(await readFile(input, 'utf8'))
  const { candidate, diagnostics } = classifyDailyCandidate(source, await loadTopicRegistry(registryDirectory))
  for (const diagnostic of diagnostics) process.stderr.write(`${JSON.stringify(diagnostic)}\n`)
  process.stdout.write(`${JSON.stringify(candidate, null, 2)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
