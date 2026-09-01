import assert from 'node:assert/strict'
import {
  adHocBriefSchema,
  authorSchema,
  briefSchema,
  dailyBriefSchema,
  presentationContentSchema,
  sourceSchema,
} from '../src/index.ts'

const valid = {
  kind: 'brief',
  cadence: 'daily',
  publishedAt: '2026-01-01',
  status: 'published',
  title: 'A valid daily brief schema fixture',
  summary: 'A sufficiently descriptive prototype summary.',
  topics: ['agent-harness'],
  signals: Array.from({ length: 4 }, (_, index) => ({
    title: `Signal ${index + 1}`,
    summary: 'A sufficiently descriptive signal summary.',
    impact: 'high',
  })),
  sections: Array.from({ length: 5 }, (_, index) => ({
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
} as const

assert.equal(dailyBriefSchema.parse(valid).signals.length, 4)
assert.equal(briefSchema.parse(valid).sections.length, 5)
assert.throws(() => briefSchema.parse({ ...valid, signals: valid.signals.slice(0, 3) }))
assert.throws(() => briefSchema.parse({ ...valid, sections: valid.sections.slice(0, 4) }))
assert.throws(() => briefSchema.parse({ ...valid, presentation: { enabled: true, template: 'weekly-v1' } }))

const validAdHoc = {
  ...valid,
  cadence: 'ad-hoc',
  title: 'A valid ad-hoc brief schema fixture',
  signals: valid.signals.slice(0, 1),
  sections: valid.sections.slice(0, 1),
  actions: valid.actions.slice(0, 1),
  presentation: { enabled: false, template: 'talk-v1' },
} as const

assert.equal(adHocBriefSchema.parse(validAdHoc).cadence, 'ad-hoc')
assert.equal(adHocBriefSchema.parse(validAdHoc).signals.length, 1)
assert.equal(briefSchema.parse(validAdHoc).actions.length, 1)

const validPresentation = {
  kind: 'presentation',
  title: 'A valid standalone presentation fixture',
  summary: 'A sufficiently descriptive standalone presentation summary.',
  publishedAt: '2026-08-31',
  status: 'published',
  topics: ['agent-harness'],
  template: 'talk-v1',
  sections: [{
    id: 'architecture',
    layout: 'architecture',
    title: 'Presentation architecture',
    conclusion: 'Standalone presentations converge on the shared descriptor pipeline.',
    facts: ['Structured Presentation content is validated before Slidev generation.'],
    limitations: [],
    references: [],
  }],
  references: [{
    title: 'Orbis repository',
    url: 'https://github.com/XiaoDaoJiang/Orbis',
    supports: 'Provides the implementation source for the fixture.',
  }],
} as const

assert.equal(presentationContentSchema.parse(validPresentation).template, 'talk-v1')
assert.throws(() => presentationContentSchema.parse({ ...validPresentation, kind: 'brief' }))
assert.throws(() => presentationContentSchema.parse({ ...validPresentation, template: 'daily-v1' }))
assert.throws(() => presentationContentSchema.parse({ ...validPresentation, sections: [] }))
assert.throws(() => presentationContentSchema.parse({
  ...validPresentation,
  sections: [{ ...validPresentation.sections[0], layout: 'raw-html' }],
}))

const validSource = {
  name: 'Astro',
  homepage: 'https://astro.build/',
  type: 'official',
  trustTier: 'primary',
  status: 'active',
  aliases: ['withastro'],
  description: 'Astro official project and documentation source.',
} as const

const validAuthor = {
  name: 'XiaoDaoJiang',
  status: 'active',
  url: 'https://github.com/XiaoDaoJiang',
  bio: 'Orbis author and maintainer.',
} as const

assert.equal(sourceSchema.parse(validSource).aliases.length, 1)
assert.equal(sourceSchema.parse({ ...validSource, status: 'archived' }).status, 'archived')
assert.equal(authorSchema.parse(validAuthor).status, 'active')
assert.equal(authorSchema.parse({ ...validAuthor, status: 'archived' }).status, 'archived')
assert.throws(() => sourceSchema.parse({ ...validSource, id: 'astro' }))
assert.throws(() => sourceSchema.parse({ ...validSource, type: 'blog' }))
assert.throws(() => sourceSchema.parse({ ...validSource, trustTier: 'trusted' }))
assert.throws(() => sourceSchema.parse({ ...validSource, homepage: 'not-a-url' }))
assert.throws(() => sourceSchema.parse({ ...validSource, aliases: ['Astro'] }))
assert.throws(() => sourceSchema.parse({ ...validSource, aliases: ['withastro', 'withastro'] }))
assert.throws(() => authorSchema.parse({ ...validAuthor, id: 'xiaodaojiang' }))
assert.throws(() => authorSchema.parse({ ...validAuthor, url: 'not-a-url' }))
assert.throws(() => authorSchema.parse({ ...validAuthor, bio: 'too short' }))

console.log('content-schema tests passed')
