import assert from 'node:assert/strict'

const fixture = {
  kind: 'presentation',
  title: 'Orbis Presentation Platform Architecture',
  summary: 'A structured standalone technical talk proving the Presentation Platform can publish independently from Briefs.',
  publishedAt: '2026-08-31',
  status: 'published',
  topics: ['agent-harness', 'coding-agent'],
  template: 'talk-v1',
  sections: [
    {
      id: 'architecture',
      layout: 'architecture',
      title: 'One descriptor pipeline',
      conclusion: 'Brief and standalone Presentation sources converge before template rendering.',
      facts: ['Both source kinds produce PresentationDescriptor values before rendering.'],
      limitations: [],
      references: [{
        title: 'Plan 20 Presentation Platform',
        url: 'https://github.com/XiaoDaoJiang/Orbis/blob/planning/product-capability-roadmap/docs/plan/20-presentation-platform.md',
        supports: 'Defines the target Presentation Platform architecture.',
      }],
    },
  ],
  references: [{
    title: 'Orbis repository',
    url: 'https://github.com/XiaoDaoJiang/Orbis',
    supports: 'Provides the implementation source referenced by this talk.',
  }],
} as const

const schemaModule = await import('@orbis/content-schema') as Record<string, unknown>
assert.equal(
  typeof schemaModule.presentationContentSchema,
  'object',
  'presentationContentSchema must exist before standalone Presentations can be parsed',
)

let sourceModule: typeof import('./standalone-source.ts')
try {
  sourceModule = await import('./standalone-source.ts')
} catch (error) {
  assert.fail(`Expected standalone Presentation source adapter to exist: ${String(error)}`)
}

let discoveryModule: typeof import('./discover-presentations.ts')
try {
  discoveryModule = await import('./discover-presentations.ts')
} catch (error) {
  assert.fail(`Expected Presentation descriptor discovery module to exist: ${String(error)}`)
}

const registry = await import('../../apps/slides/templates/registry.ts')
assert.equal(typeof sourceModule.toStandalonePresentationDescriptor, 'function')
assert.equal(typeof discoveryModule.assertUniquePresentationSlugs, 'function')
assert.equal(typeof registry.renderPresentation, 'function')

const presentationContentSchema = schemaModule.presentationContentSchema as { parse(value: unknown): unknown }
const presentation = presentationContentSchema.parse(fixture)
const descriptor = sourceModule.toStandalonePresentationDescriptor(presentation as never, { slug: 'orbis-presentation-platform' })

assert.equal(descriptor.id, 'orbis-presentation-platform')
assert.equal(descriptor.slug, 'orbis-presentation-platform')
assert.equal(descriptor.title, fixture.title)
assert.equal(descriptor.publishedAt, fixture.publishedAt)
assert.deepEqual(descriptor.topics, fixture.topics)
assert.equal(descriptor.template, 'talk-v1')
assert.equal(descriptor.sourceKind, 'presentation')
assert.equal(descriptor.readingUrl, undefined)
assert.equal(descriptor.payload, presentation)

const markdown = registry.renderPresentation(descriptor, { siteBase: '/Orbis' })
assert.match(markdown, /Orbis Presentation Platform Architecture/)
assert.match(markdown, /One descriptor pipeline/)
assert.match(markdown, /ARCHITECTURE/)
assert.match(markdown, /REFERENCES/)
const markers = markdown.match(/^---$/gm) ?? []
assert.equal(markers.length, 6, 'A one-section talk-v1 must contain exactly 3 slides')

assert.throws(
  () => discoveryModule.assertUniquePresentationSlugs([
    descriptor,
    { ...descriptor, sourceKind: 'brief' },
  ]),
  /Duplicate presentation slug: orbis-presentation-platform/,
)

assert.throws(
  () => registry.renderPresentation({ ...descriptor, template: 'unsupported-v1' }, { siteBase: '/Orbis' }),
  /Unsupported presentation template: unsupported-v1/,
)

console.log('Standalone Presentation contract passed')
