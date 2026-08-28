import assert from 'node:assert/strict'
import { briefSchema } from '../src/index.ts'

const valid = {
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-08-28',
  status: 'published',
  title: 'A valid prototype brief',
  summary: 'A sufficiently descriptive prototype summary.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive signal summary.',
    impact: 'high',
  })),
  sections: Array.from({ length: 3 }, (_, index) => ({
    id: `section-${index + 1}`,
    layout: 'architecture',
    title: `Section ${index + 1}`,
    conclusion: 'A sufficiently descriptive conclusion.',
    facts: ['A concrete and testable fact.'],
    limitations: [],
    references: [{
      title: 'Primary source',
      url: 'https://example.com/source',
      supports: 'Supports the test conclusion.',
    }],
  })),
  projects: [],
  radar: [],
  actions: Array.from({ length: 3 }, (_, index) => ({
    title: `Action ${index + 1}`,
    description: 'A concrete prototype action item.',
  })),
  references: [{
    title: 'Primary source',
    url: 'https://example.com/source',
    supports: 'Supports the prototype.',
  }],
  archivePicks: [],
  presentation: { enabled: true, template: 'daily-v1' },
}

assert.equal(briefSchema.parse(valid).signals.length, 4)
assert.throws(() => briefSchema.parse({ ...valid, signals: valid.signals.slice(0, 3) }))
console.log('content-schema tests passed')
