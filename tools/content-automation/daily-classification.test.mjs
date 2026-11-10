import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyDailyCandidate, validateTopicRegistry } from './daily-classification.mjs'
const entry = (id, aliases = [], status = 'active') => ({ id, data: { name: id, description: 'A valid topic description.', aliases, status } })
const registry = [entry('agent-harness', ['harness']), entry('coding-agent', ['software-agent']), entry('old-topic', ['old'], 'archived'), entry('future-topic', ['future'], 'watch')]
const daily = (topics, tags) => ({ kind: 'brief', cadence: 'daily', evidenceVersion: 1, topics, ...(tags === undefined ? {} : { tags }), title: 'Unchanged title', sections: [{ facts: [{ text: 'Exact text: <x>\n数字', evidence: ['ref-1'] }] }], references: [{ id: 'ref-1' }], corrections: [{ summary: 'Do not change' }] })
test('#80 unknown agent-security remains visible without inventing a Registry entry', () => {
  const source = daily(['agent-harness', 'agent-security'])
  const before = structuredClone(source)
  const { candidate, diagnostics } = classifyDailyCandidate(source, registry)
  assert.deepEqual(candidate.topics, ['agent-harness'])
  assert.deepEqual(candidate.tags, ['agent-security'])
  assert.deepEqual(diagnostics, [{ code: 'unknown-label', label: 'agent-security', topicIds: [] }])
  assert.deepEqual(source, before)
  const { topics, tags, ...body } = candidate
  const { topics: ignored, ...originalBody } = source
  assert.deepEqual(body, originalBody)
})
test('NFKC, spaces and case dedup preserve first display spelling and input order', () => {
  const { candidate } = classifyDailyCandidate(daily([' ＨＡＲＮＥＳＳ ', 'agent-harness', 'Agent   Security'], ['agent security', '新话题']), registry)
  assert.deepEqual(candidate.topics, ['agent-harness'])
  assert.deepEqual(candidate.tags, ['Agent Security', '新话题'])
  assert.deepEqual(classifyDailyCandidate(candidate, registry).candidate, candidate)
})
test('no known topics is allowed, but no labels is not', () => {
  assert.deepEqual(classifyDailyCandidate(daily(['agent-security']), registry).candidate.topics, [])
  assert.deepEqual(classifyDailyCandidate(daily([], ['agent-security']), registry).candidate.tags, ['agent-security'])
  assert.throws(() => classifyDailyCandidate(daily([]), registry))
})
test('explicit aliases only; names never classify; canonical wins over conflicting alias', () => {
  const conflict = [...registry, entry('other', ['agent-harness', 'harness'])]
  assert.deepEqual(classifyDailyCandidate(daily(['agent-harness']), conflict).candidate.topics, ['agent-harness'])
  const result = classifyDailyCandidate(daily(['harness']), conflict)
  assert.deepEqual(result.candidate.tags, ['harness'])
  assert.equal(result.diagnostics[0].code, 'ambiguous-alias')
  assert.deepEqual(classifyDailyCandidate(daily(['Agent Harness']), registry).candidate.tags, ['Agent Harness'])
})
test('inactive canonical and alias entries never reactivate, including collisions', () => {
  const result = classifyDailyCandidate(daily(['old-topic', 'old', 'future-topic', 'future']), registry)
  assert.deepEqual(result.candidate.topics, [])
  assert.ok(result.diagnostics.every((d) => d.code === 'inactive-topic'))
  const conflict = [...registry, entry('new-topic', ['old-topic', 'old'])]
  const blocked = classifyDailyCandidate(daily(['old-topic', 'old']), conflict)
  assert.deepEqual(blocked.candidate.topics, [])
  assert.deepEqual(blocked.diagnostics.map((d) => d.code), ['inactive-topic', 'ambiguous-alias'])
})
test('unavailable or malformed entire registry fails closed', () => {
  for (const invalid of [null, [], {}, [...registry, registry[0]], [...registry, entry('bad_ID')], [...registry, entry('bad', ['Same', 'same'])], [...registry, { id: 'bad', data: {} }], [...registry, { ...entry('bad'), unexpected: true }]]) {
    assert.throws(() => classifyDailyCandidate(daily(['agent-security']), invalid))
  }
  assert.equal(validateTopicRegistry(registry), registry)
})
test('unsafe, unbounded and wrongly typed labels fail without truncation', () => {
  for (const label of ['', ' ', 'x'.repeat(65), '<script>', 'bad\u202ename', 'bad\nname', null, 5]) {
    assert.throws(() => classifyDailyCandidate(daily([label]), registry))
  }
  assert.throws(() => classifyDailyCandidate(daily(Array.from({ length: 33 }, (_, i) => `tag-${i}`)), registry))
  assert.throws(() => classifyDailyCandidate({ ...daily(['x']), evidenceVersion: undefined }, registry))
})
test('canonical legacy-shape Evidence V1 input keeps absent tags and all other values', () => {
  const source = daily(['agent-harness'])
  assert.deepEqual(classifyDailyCandidate(source, registry).candidate, source)
  assert.equal('tags' in classifyDailyCandidate(source, registry).candidate, false)
  assert.deepEqual(classifyDailyCandidate(daily(['agent-harness'], []), registry).candidate.tags, [])
})
test('classification does not erase unexpected transport fields before strict schema validation', () => {
  const source = { ...daily(['agent-security']), classificationLabels: ['temporary'] }
  assert.deepEqual(classifyDailyCandidate(source, registry).candidate.classificationLabels, ['temporary'])
})

test('full snapshot data validates Topic schema fields even for unused entries', () => {
  for (const malformed of [
    { name: 'x' }, { description: 'short' }, { status: 'published' },
    { aliases: null }, { aliases: ['x'] }, { related: null }, { related: [42] },
    { unexpected: 'field' },
  ]) {
    const bad = entry('unused-topic')
    bad.data = { ...bad.data, ...malformed }
    assert.throws(() => classifyDailyCandidate(daily(['agent-security']), [...registry, bad]))
  }
  const defaults = entry('default-topic')
  delete defaults.data.aliases
  assert.deepEqual(classifyDailyCandidate(daily(['default-topic']), [defaults]).candidate.topics, ['default-topic'])
})
