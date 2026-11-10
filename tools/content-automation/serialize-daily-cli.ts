import { readFile } from 'node:fs/promises'
import { serializeDailyCandidate } from './daily-serialization.ts'
import { classifyDailyCandidate, loadTopicRegistry } from './daily-classification.ts'

// Emit only fully validated YAML. The caller owns the candidate path and write.
try {
  const [targetDate, input, ...extra] = process.argv.slice(2)
  if (!targetDate || !input || extra.length) {
    throw new Error('Usage: pnpm automation:daily:serialize YYYY-MM-DD <candidate.json>')
  }
  const source: unknown = JSON.parse(await readFile(input, 'utf8'))
  const { candidate, diagnostics } = classifyDailyCandidate(source, await loadTopicRegistry())
  // Only classification metadata changes; the serializer verifies exact final values.
  const output = serializeDailyCandidate(targetDate, candidate)
  for (const diagnostic of diagnostics) console.error(JSON.stringify(diagnostic))
  process.stdout.write(output)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
