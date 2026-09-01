import assert from 'node:assert/strict'

const reference = {
  title: 'Plan 20 Presentation Platform',
  url: 'https://github.com/XiaoDaoJiang/Orbis/blob/planning/product-capability-roadmap/docs/plan/20-presentation-platform.md',
  supports: 'Defines the source-neutral Presentation Platform target.',
} as const

const validWeekly = {
  kind: 'brief',
  cadence: 'weekly',
  publishedAt: '2026-09-01',
  status: 'published',
  title: 'Orbis Weekly — Presentation Platform Becomes a Reusable Boundary',
  summary: 'A weekly judgment about how Orbis moved from a Daily-only slide flow toward a reusable structured publishing platform.',
  topics: ['agent-harness', 'coding-agent'],
  period: { from: '2026-08-26', to: '2026-09-01' },
  weeklyThesis: 'The most important change this period is the separation of content semantics from presentation rendering and discovery.',
  trendMovements: [
    {
      topic: 'agent-harness',
      direction: 'rising',
      summary: 'Presentation generation now converges through source-neutral descriptors.',
    },
    {
      topic: 'coding-agent',
      direction: 'new-variable',
      summary: 'Standalone presentation publishing introduces another structured source without duplicating renderer plumbing.',
    },
  ],
  sections: [
    {
      id: 'platform-boundary',
      layout: 'architecture',
      title: 'Presentation becomes a platform boundary',
      conclusion: 'Brief-derived and standalone sources now converge before rendering.',
      facts: ['The registry dispatches daily-v1 and talk-v1 through one PresentationDescriptor pipeline.'],
      limitations: [],
      references: [reference],
    },
    {
      id: 'discovery-boundary',
      layout: 'system-map',
      title: 'Discovery stays product-specific',
      conclusion: 'Presentation discovery expands without forcing standalone Talks into generic content archive semantics.',
      facts: ['The Slides index and Homepage Presentation surface now discover Brief and standalone Presentation sources together.'],
      limitations: [],
      references: [{
        title: 'Standalone Presentation PR',
        url: 'https://github.com/XiaoDaoJiang/Orbis/pull/12',
        supports: 'Implements standalone Presentation discovery and talk-v1.',
      }],
    },
  ],
  nextPeriodWatch: [
    {
      title: 'Weekly semantics',
      reason: 'The next platform test is whether cadence-specific content can reuse discovery without reusing Daily body semantics.',
    },
  ],
  references: [{
    title: 'Orbis repository',
    url: 'https://github.com/XiaoDaoJiang/Orbis',
    supports: 'Provides the implementation evidence summarized by this Weekly.',
  }],
  presentation: { enabled: false, template: 'weekly-v1' },
} as const

const schemaModule = await import('@orbis/content-schema') as Record<string, unknown>
assert.equal(
  typeof schemaModule.weeklyBriefSchema,
  'object',
  'weeklyBriefSchema must exist before Weekly Briefs can be validated',
)

const weeklyBriefSchema = schemaModule.weeklyBriefSchema as { parse(value: unknown): Record<string, unknown> }
const briefSchema = schemaModule.briefSchema as { parse(value: unknown): Record<string, unknown> }

const parsed = weeklyBriefSchema.parse(validWeekly)
assert.equal(parsed.cadence, 'weekly')
assert.deepEqual(parsed.period, validWeekly.period)
assert.deepEqual(parsed.presentation, validWeekly.presentation)

assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, period: undefined }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, weeklyThesis: undefined }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, trendMovements: validWeekly.trendMovements.slice(0, 1) }))
assert.throws(() => weeklyBriefSchema.parse({
  ...validWeekly,
  trendMovements: [
    { ...validWeekly.trendMovements[0], direction: 'unknown' },
    validWeekly.trendMovements[1],
  ],
}))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, sections: validWeekly.sections.slice(0, 1) }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, nextPeriodWatch: [] }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, period: { from: '2026-08-25', to: '2026-09-01' } }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, publishedAt: '2026-08-31' }))
assert.throws(() => weeklyBriefSchema.parse({
  ...validWeekly,
  presentation: { enabled: false, template: 'daily-v1' },
}))

const hybridWeekly = {
  ...validWeekly,
  signals: [{
    title: 'Hybrid field',
    summary: 'This Daily-only field must make Weekly invalid.',
    impact: 'high',
  }],
}
assert.throws(() => weeklyBriefSchema.parse(hybridWeekly))
assert.throws(() => briefSchema.parse(hybridWeekly))

console.log('Weekly Brief schema contract passed')
