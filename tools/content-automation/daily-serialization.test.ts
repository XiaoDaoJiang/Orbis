import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'
import { serializeDailyCandidate } from './daily-serialization.ts'

const fixture = parse(await readFile('content/briefs/2026-09-24.yaml', 'utf8'))
const regressionTitle = 'Know Who Spoke When: Build Real-Time, Multi-Speaker AI with NVIDIA Nemotron 3 Diarization'
assert.throws(() => parse(`title: ${regressionTitle}\n`), /Nested mappings/)
const tricky = [regressionTitle, 'Title # keep this text', '"double" and \'single\' quotes',
  '第一行\nsecond line: details\r\nthird line', 'path \\ folder\twith tab',
  '*alias', '&anchor', '!tag', '[array]', '{object}', 'true', 'null', '00123', '2026-09-25', '---']
for (const title of tricky) {
  const source = structuredClone(fixture)
  // Free-text fields at every level share the same safe serialization boundary.
  source.references[0].title = title
  source.sections[0].limitations = [`Limitation: ${title}`]
  const before = structuredClone(source)
  const yaml = serializeDailyCandidate(source.publishedAt, source)
  assert.deepEqual(parse(yaml), source)
  assert.deepEqual(source, before, 'Serialization must not mutate input')
  assert.equal(serializeDailyCandidate(source.publishedAt, source), yaml, 'Output must be deterministic')
}
assert.throws(() => serializeDailyCandidate('2026-09-25', fixture), /publishedAt/)
assert.throws(() => serializeDailyCandidate(fixture.publishedAt, { ...fixture, evidenceVersion: 0 }), /Evidence V1/)

const directory = await mkdtemp(join(tmpdir(), 'orbis-yaml-'))
const cli = resolve('tools/content-automation/serialize-daily-cli.ts')
try {
  const input = join(directory, 'candidate.json')
  await writeFile(input, JSON.stringify(fixture))
  const output = execFileSync(process.execPath, ['--import', 'tsx', cli, fixture.publishedAt, input], { encoding: 'utf8' })
  assert.deepEqual(parse(output), fixture)
  for (const args of [[], ['2026-09-25', input], [fixture.publishedAt, input, 'extra']]) {
    const failed = spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], { encoding: 'utf8' })
    assert.equal(failed.status, 1)
    assert.equal(failed.stdout, '', 'Invalid input must not emit partial YAML')
  }
  await writeFile(input, '{bad json')
  const invalid = spawnSync(process.execPath, ['--import', 'tsx', cli, fixture.publishedAt, input], { encoding: 'utf8' })
  assert.equal(invalid.status, 1)
  assert.equal(invalid.stdout, '')
} finally {
  await rm(directory, { recursive: true, force: true })
}
console.log(`Daily serialization passed: ${tricky.length} punctuation/type cases, round-trip preservation and CLI fail-closed checks`)
