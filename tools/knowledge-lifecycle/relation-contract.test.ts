import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { knowledgeSchema } from '@orbis/content-schema'
import { validateReferentialIntegrity, type ParsedContentEntry } from '../validate-content/referential-integrity.ts'

const parsed = knowledgeSchema.parse({
  kind: 'knowledge',
  title: 'Old Knowledge',
  summary: 'A durable knowledge entry that has a replacement.',
  status: 'archived',
  publishedAt: '2026-01-01',
  topics: ['coding-agent'],
  references: [],
  supersededBy: 'new-knowledge',
})

assert.equal(
  (parsed as typeof parsed & { supersededBy?: string }).supersededBy,
  'new-knowledge',
  'Knowledge schema must preserve supersededBy',
)

const root = resolve('/tmp/orbis-knowledge-contract')
const topic: ParsedContentEntry = {
  kind: 'topic',
  path: resolve(root, 'content/topics/coding-agent.yaml'),
  value: {
    name: 'Coding Agent',
    description: 'Coding Agent topic for lifecycle contract testing.',
    aliases: [],
    status: 'active',
    related: [],
  },
}

function knowledge(id: string, supersededBy?: string): ParsedContentEntry {
  return {
    kind: 'knowledge',
    path: resolve(root, `content/knowledge/${id}.md`),
    value: {
      kind: 'knowledge',
      title: `Knowledge ${id}`,
      summary: `Durable knowledge entry ${id} used for lifecycle relation testing.`,
      status: id === 'old-knowledge' ? 'archived' : 'active',
      publishedAt: '2026-01-01',
      topics: ['coding-agent'],
      references: [],
      ...(supersededBy ? { supersededBy } : {}),
    } as never,
  }
}

const missingErrors = validateReferentialIntegrity(root, [topic, knowledge('old-knowledge', 'missing-knowledge')])
assert.ok(
  missingErrors.some((error) => error.includes('supersededBy') && error.includes('missing-knowledge')),
  'Missing Knowledge replacement must fail referential integrity',
)

const selfErrors = validateReferentialIntegrity(root, [topic, knowledge('old-knowledge', 'old-knowledge')])
assert.ok(
  selfErrors.some((error) => error.includes('supersededBy') && error.includes('cannot reference itself')),
  'Knowledge replacement must reject self-reference',
)

const lifecycle = await import('./lifecycle.ts')
assert.equal(typeof lifecycle.deriveSupersedes, 'function')
assert.deepEqual(
  lifecycle.deriveSupersedes([
    { id: 'old-a', supersededBy: 'new-knowledge' },
    { id: 'new-knowledge' },
    { id: 'old-b', supersededBy: 'new-knowledge' },
  ]),
  new Map([['new-knowledge', ['old-a', 'old-b']]]),
  'Inverse supersedes relation must be derived from canonical supersededBy edges',
)

console.log('Knowledge supersession relation contract passed')
