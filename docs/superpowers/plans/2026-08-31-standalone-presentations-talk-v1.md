# Standalone Presentations + talk-v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Plan 20 by adding first-class standalone Presentation content, `talk-v1`, unified Daily + Talk generation/discovery, and negative validation without expanding Presentation into Archive/Related/Topic/RSS semantics.

**Architecture:** Preserve the Plan 20A `PresentationDescriptor` + Template Registry seam. Briefs and standalone Presentation YAML are independently parsed and adapted into descriptors, all descriptors are duplicate-checked before any generated source is written, then the unchanged generated-directory/build-slides pipeline renders every deck. Web presentation discovery gets its own projection over public Brief presentations plus public standalone Presentations rather than widening the generic Brief/Essay/Knowledge discovery model.

**Tech Stack:** TypeScript 5.9, Zod, YAML, Astro 5 Content Collections, Slidev 52, pnpm, Node assert-based tests and artifact checks, GitHub Actions trusted PR Preview.

**Spec:** `docs/superpowers/specs/2026-08-31-standalone-presentations-talk-v1-design.md`

## Global Constraints

- `content/**` remains the only publishable Source of Truth; generated Slidev Markdown is output only.
- Standalone Presentations use YAML under `content/presentations/**`; do not add Markdown/MDX body injection, arbitrary HTML or Vue.
- `weekly-v1` and Weekly product semantics remain Plan 30 work.
- Do not add standalone Presentations to Archive, Related Content, Topic detail aggregation or RSS in this PR.
- `apps/slides/templates/daily-v1.ts` must remain unchanged and Daily must remain exactly 11 slides.
- `tools/build-slides` must remain template-agnostic and unchanged.
- Duplicate slugs across all presentation sources must fail before any `apps/slides/generated/<slug>/` directory is written.
- Unknown templates must fail through Template Registry dispatch.
- Non-public standalone Presentations must not generate decks or appear in `/slides/` or Homepage Latest Presentation.
- No generated Slidev source, generated HTML or `dist/**` may be committed.
- Final acceptance requires the full existing `pnpm build`, a mixed Daily + Talk public artifact, and trusted Preview smoke.

---

### Task 1: Establish the RED contract for standalone Presentation capability

**Files:**
- Create: `tools/generate-slides/standalone-presentation.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: current Plan 20A modules plus `@orbis/content-schema`.
- Produces: a test contract requiring `presentationContentSchema`, `toStandalonePresentationDescriptor`, `talk-v1`, and duplicate descriptor validation before production implementations exist.

- [ ] **Step 1: Create a dynamic-import RED contract**

Create `tools/generate-slides/standalone-presentation.test.ts` with a valid standalone fixture and runtime assertions. Use dynamic module access so the test fails with a clear capability message instead of a TypeScript import-resolution error.

The fixture shape is:

```ts
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
```

Assert the desired interfaces:

```ts
const schemaModule = await import('@orbis/content-schema') as Record<string, unknown>
assert.equal(typeof schemaModule.presentationContentSchema, 'object', 'presentationContentSchema must exist')

const sourceModule = await import('./standalone-source.ts')
assert.equal(typeof sourceModule.toStandalonePresentationDescriptor, 'function')

const descriptorModule = await import('./discover-presentations.ts')
assert.equal(typeof descriptorModule.assertUniquePresentationSlugs, 'function')

const registry = await import('../../apps/slides/templates/registry.ts')
assert.equal(typeof registry.renderPresentation, 'function')
```

Then parse/adapt/render the fixture and require the Markdown to contain its title, section title, `ARCHITECTURE`, and `REFERENCES`. Also assert:

```ts
assert.equal(descriptor.sourceKind, 'presentation')
assert.equal(descriptor.template, 'talk-v1')
assert.equal(descriptor.readingUrl, undefined)
assert.throws(
  () => descriptorModule.assertUniquePresentationSlugs([descriptor, { ...descriptor, sourceKind: 'brief' }]),
  /Duplicate presentation slug:/,
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, template: 'unsupported-v1' }, { siteBase: '/Orbis' }),
  /Unsupported presentation template: unsupported-v1/,
)
```

- [ ] **Step 2: Add the test to validation before production code exists**

Change root scripts to:

```json
"test:presentation-platform": "tsx tools/generate-slides/presentation-platform.test.ts && tsx tools/generate-slides/standalone-presentation.test.ts"
```

Keep `validate` calling `test:presentation-platform`.

- [ ] **Step 3: Open a Draft PR and observe RED in GitHub Actions**

Expected read-only PR build sequence:

```text
locked install -> PASS
Path Guard -> PASS
content-schema existing test -> PASS
Plan 20A presentation-platform.test -> PASS
standalone-presentation.test -> FAIL
```

The expected RED reason is the missing `presentationContentSchema` and/or standalone source module. Do not add production implementation until the failure is observed.

---

### Task 2: Add standalone Presentation Schema, config and contribution governance

**Files:**
- Modify: `packages/content-schema/src/index.ts`
- Modify: `packages/content-schema/test/schema.test.ts`
- Modify: `config/site.yaml`
- Modify: `tools/shared/site-config.ts`
- Modify: `tools/validate-content/index.ts`
- Modify: `apps/web/src/content.config.ts`
- Modify: `config/path-guard.yaml`
- Modify: `AGENTS.md`

**Interfaces:**
- Produces: `presentationContentSchema`, `PresentationContent`, `content.presentationsDir`, Astro collection `presentations`, validation of `content/presentations/**`, and content-agent governance for the new structured source.

- [ ] **Step 1: Define a standalone-only section schema**

In `packages/content-schema/src/index.ts`, add:

```ts
export const presentationSectionSchema = z.object({
  id: z.string().min(2),
  layout: z.enum(['content', 'architecture', 'comparison', 'timeline', 'metrics', 'system-map']),
  title: z.string().min(3),
  conclusion: z.string().min(12),
  facts: z.array(z.string().min(5)).min(1).max(6),
  limitations: z.array(z.string().min(5)).max(3).default([]),
  references: z.array(referenceSchema).default([]),
})
```

Do not modify `briefSectionSchema`.

- [ ] **Step 2: Define the standalone content schema**

```ts
export const presentationContentSchema = z.object({
  kind: z.literal('presentation'),
  title: z.string().min(5),
  summary: z.string().min(12),
  publishedAt: dateStringSchema,
  status: publicationStatusSchema,
  topics: z.array(z.string().min(2)).min(1),
  template: z.literal('talk-v1'),
  sections: z.array(presentationSectionSchema).min(1).max(12),
  references: z.array(referenceSchema).min(1),
})

export type PresentationContent = z.infer<typeof presentationContentSchema>
```

Standalone schema intentionally accepts only `talk-v1`; future standalone templates widen this schema explicitly when implemented.

- [ ] **Step 3: Add schema unit coverage**

Extend `packages/content-schema/test/schema.test.ts` with a valid `presentation` fixture. Assert valid parse and failures for:

```ts
kind: 'brief'
template: 'daily-v1'
sections: []
layout: 'raw-html'
```

- [ ] **Step 4: Add presentationsDir to site config contract**

Change `config/site.yaml`:

```yaml
content:
  briefsDir: content/briefs
  presentationsDir: content/presentations
```

Change `SiteConfig.content` and `loadSiteConfig()` so both directories are required.

- [ ] **Step 5: Register content validation and Astro collection**

`tools/validate-content/index.ts` gains:

```ts
{ directory: 'content/presentations', extensions: ['.yaml', '.yml'], schema: presentationContentSchema, markdown: false }
```

`apps/web/src/content.config.ts` gains:

```ts
const presentations = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/presentations' }),
  schema: presentationContentSchema,
})
```

and exports it in `collections`.

- [ ] **Step 6: Align content-agent governance**

Add `content/presentations/` to `config/path-guard.yaml -> modes.content-agent.allowPrefixes` and `AGENTS.md -> Allowed by default`.

Replace the obsolete AGENTS statement saying all Presentation sources are derived from Briefs with:

```text
Presentation decks are generated from structured Briefs or standalone `content/presentations/**`; scheduled agents must never commit generated Slidev files.
```

CODEOWNERS already owns `/content/` globally and does not need a new entry.

---

### Task 3: Adapt standalone sources and centralize descriptor discovery/slug validation

**Files:**
- Create: `tools/generate-slides/standalone-source.ts`
- Create: `tools/generate-slides/discover-presentations.ts`
- Modify: `tools/generate-slides/index.ts`

**Interfaces:**
- Consumes: `Brief`, `PresentationContent`, site config paths, current `toBriefPresentationDescriptor`.
- Produces:
  - `toStandalonePresentationDescriptor(presentation, { slug }): PresentationDescriptor`
  - `assertUniquePresentationSlugs(descriptors): void`
  - `discoverPresentationDescriptors({ root, siteBase, config }): Promise<PresentationDescriptor[]>`

- [ ] **Step 1: Implement standalone adaptation**

`standalone-source.ts`:

```ts
export function toStandalonePresentationDescriptor(
  presentation: PresentationContent,
  input: { slug: string },
): PresentationDescriptor {
  return {
    id: input.slug,
    slug: input.slug,
    title: presentation.title,
    publishedAt: presentation.publishedAt,
    topics: presentation.topics,
    template: presentation.template,
    sourceKind: 'presentation',
    payload: presentation,
  }
}
```

Do not synthesize a reading URL.

- [ ] **Step 2: Implement duplicate validation before output mutation**

```ts
export function assertUniquePresentationSlugs(descriptors: PresentationDescriptor[]): void {
  const seen = new Map<string, PresentationDescriptor>()
  for (const descriptor of descriptors) {
    const existing = seen.get(descriptor.slug)
    if (existing) {
      throw new Error(
        `Duplicate presentation slug: ${descriptor.slug} (${existing.sourceKind}:${existing.id} vs ${descriptor.sourceKind}:${descriptor.id})`,
      )
    }
    seen.set(descriptor.slug, descriptor)
  }
}
```

- [ ] **Step 3: Discover public descriptors from both structured sources**

`discoverPresentationDescriptors` scans configured Brief YAML and Presentation YAML. Rules:

```ts
Brief -> include only status === 'published' && presentation.enabled
Standalone -> include only status === 'published'
```

For Briefs, reading URL remains `${joinBasePath(siteBase, 'briefs', slug)}/`.

After all adapters run:

```ts
assertUniquePresentationSlugs(descriptors)
return descriptors.sort((a, b) => a.slug.localeCompare(b.slug))
```

- [ ] **Step 4: Make generator descriptor-driven**

In `tools/generate-slides/index.ts`:

```ts
const descriptors = await discoverPresentationDescriptors({ root, siteBase, config })
if (descriptors.length === 0) throw new Error('No published Slidev deck generated')

await rm(outputRoot, { recursive: true, force: true })
for (const descriptor of descriptors) {
  // existing common directory/style/layout copy + Registry render
}
```

Important ordering: descriptor discovery and duplicate validation happen before `rm(outputRoot)` and before `mkdir`/`writeFile`.

---

### Task 4: Implement and register `talk-v1`

**Files:**
- Create: `apps/slides/templates/talk-v1.ts`
- Modify: `apps/slides/templates/registry.ts`
- Test: `tools/generate-slides/standalone-presentation.test.ts`

**Interfaces:**
- Consumes: `PresentationContent`, `PresentationRenderContext`.
- Produces: deterministic Slidev Markdown with `sections.length + 2` slides.

- [ ] **Step 1: Implement a safe renderer**

Use the same HTML escaping discipline as `daily-v1`. The renderer produces:

1. Cover using `orbis-cover`.
2. One `orbis-default` slide per section.
3. Final References slide.

Cover includes:

```text
ORBIS · TALK · <publishedAt>
<title>
<summary>
```

Each section includes:

```text
<section.layout.toUpperCase()>
<section.title>
<section.conclusion>
section.facts as escaped <li>
optional limitations
references as links when present
```

References slide contains all top-level references. If `descriptor.readingUrl` exists, append `Reading ↗`; normally standalone Talk has none.

- [ ] **Step 2: Register through Template Registry only**

Add to `apps/slides/templates/registry.ts`:

```ts
import { presentationContentSchema } from '@orbis/content-schema'
import { renderTalkV1 } from './talk-v1.ts'

const renderers = {
  'daily-v1': ...,
  'talk-v1': (descriptor, context) => {
    const talk = presentationContentSchema.parse(descriptor.payload)
    return renderTalkV1(talk, descriptor, context)
  },
}
```

Do not change `tools/build-slides`.

- [ ] **Step 3: Verify variable page count in the contract**

For a one-section fixture, assert exactly 3 slides using frontmatter marker count:

```ts
const markers = markdown.match(/^---$/gm) ?? []
assert.equal(markers.length, 6)
```

Also assert the source contains no raw `<script` or `<iframe` strings originating from content fields.

---

### Task 5: Commit one real standalone Talk

**Files:**
- Create: `content/presentations/orbis-presentation-platform.yaml`

**Interfaces:**
- Consumes: the new standalone schema.
- Produces: a durable published `talk-v1` example visible in final repository builds and Preview.

- [ ] **Step 1: Author the real structured talk**

Use:

```yaml
kind: presentation
title: Orbis Presentation Platform
summary: How Orbis converges Brief-derived and standalone structured sources into one validated Slidev presentation pipeline.
publishedAt: 2026-08-31
status: published
topics:
  - agent-harness
  - coding-agent
template: talk-v1
```

Include four sections using `architecture`, `comparison`, `timeline`, and `metrics`. Facts must describe repository architecture that is directly supported by repository references, not external trend claims.

References should include canonical GitHub URLs for:

```text
docs/plan/20-presentation-platform.md
apps/slides/presentation.ts
apps/slides/templates/registry.ts
tools/generate-slides/index.ts
```

No generated output accompanies the YAML.

---

### Task 6: Add a dedicated Presentation Discovery projection

**Files:**
- Create: `apps/web/src/lib/presentation-discovery.ts`
- Modify: `apps/web/src/pages/slides/index.astro`
- Modify: `apps/web/src/pages/index.astro`

**Interfaces:**
- Produces:
  - `PresentationDiscoveryItem`
  - `buildPublicPresentations(briefs, presentations, base)`
  - `sortPresentationsNewestFirst(items)`

- [ ] **Step 1: Define presentation-only discovery shape**

```ts
export type PresentationDiscoveryItem = {
  id: string
  title: string
  summary: string
  publishedAt: string
  topics: string[]
  sourceKind: 'brief' | 'presentation'
  presentationHref: string
  readingHref?: string
  cadence?: 'daily' | 'weekly' | 'ad-hoc'
}
```

Do not add `presentation` to generic `DiscoveryKind`.

- [ ] **Step 2: Project both public sources**

For Briefs:

```ts
status === 'published' && presentation.enabled === true
sourceKind = 'brief'
readingHref = /briefs/<id>/
presentationHref = /slides/<id>/
```

For standalone:

```ts
status === 'published'
sourceKind = 'presentation'
readingHref = undefined
presentationHref = /slides/<id>/
```

Sort newest first, then title, then id for deterministic ties.

- [ ] **Step 3: Update `/slides/`**

Load both Astro collections and render the unified list. Replace the obsolete lead copy with wording that says Presentations may come from structured Briefs or standalone Talks.

Cards show source/date/title/summary/topics and always `Open presentation`. Render `Read brief` only when `readingHref` exists.

- [ ] **Step 4: Update Homepage Latest Presentation**

Load `presentations` alongside existing collections and compute Latest Presentation with `buildPublicPresentations(...)`.

Homepage presentation metadata should distinguish:

```text
Brief presentation · daily · YYYY-MM-DD
Standalone presentation · YYYY-MM-DD
```

Always render Open Slides. Render Reading only when `readingHref` exists.

Do not modify Archive, Related, Topic pages or RSS.

---

### Task 7: Upgrade mixed integration and artifact validation

**Files:**
- Modify: `tools/multi-presentation-check/index.ts`
- Modify: `tools/site-check/index.ts`

**Interfaces:**
- Consumes: real Daily seed, real standalone Talk, ephemeral negative fixtures.
- Produces: mixed-source build proof, visibility proof, duplicate-slug proof, and public discovery proof.

- [ ] **Step 1: Change N>1 fixture from Daily + Daily to Daily + standalone Talk**

Use the real `content/presentations/orbis-presentation-platform.yaml` as the normal Talk seed and create an ephemeral second published Talk only when needed for boundary tests. The core assertion must prove at least one Daily and one standalone Talk are generated, built and assembled together.

- [ ] **Step 2: Add non-public standalone fixture**

Write an ephemeral standalone Presentation with `status: 'needs-review'` and assert after generation/build:

```text
no apps/slides/generated/<slug>/slides.md
no dist/site/slides/<slug>/index.html
not present in /slides/ HTML
not selected by Homepage Latest Presentation
```

- [ ] **Step 3: Add duplicate-slug negative execution**

Create an ephemeral standalone Presentation whose filename slug equals an existing published Brief slug. Invoke `pnpm generate:slides` expecting non-zero exit and output matching:

```text
Duplicate presentation slug: <slug>
```

Before invoking, ensure `apps/slides/generated` is absent. After failure, assert it remains absent, proving duplicate validation occurs before generated writes.

Remove the duplicate fixture before the normal mixed build.

- [ ] **Step 4: Preserve existing Daily-specific integration assertions**

Keep future Daily stable/archive/latest behavior and non-public Brief relation exclusion coverage. Do not weaken the existing Daily tests merely because the second positive deck is now a Talk.

- [ ] **Step 5: Extend site-check to standalone Presentations**

Load `presentationContentSchema` and scan `config.content.presentationsDir`.

For each published standalone Presentation assert:

```text
dist/site/slides/<slug>/index.html exists
apps/slides/generated/<slug>/slides.md exists
compiled deck contains <html
generated source contains title
source contains REFERENCES
```

For `talk-v1`, assert slide count equals `sections.length + 2` by frontmatter markers.

Keep the existing `daily-v1` exact 11-slide assertion unchanged.

- [ ] **Step 6: Validate `/slides/` and Homepage semantics**

Assert `/slides/` contains every public Brief presentation and public standalone Presentation, and excludes non-public standalone entries.

Expected Homepage Latest Presentation is the newest item from both source kinds using publication date/title/id ordering. If it is standalone, assert there is no fake Reading link associated with that card.

---

### Task 8: Verify GREEN, trusted Preview and Plan 20 completion

**Files:**
- Review all changed files against the spec.
- Update PR body with evidence; do not change roadmap Plan status on the planning branch from this feature PR unless that branch is separately reconciled.

**Interfaces:**
- Produces: review-ready Plan 20B PR with complete cloud and public-preview evidence.

- [ ] **Step 1: Run the complete read-only PR build**

Expected `pnpm build` includes:

```text
content-schema tests
Plan 20A contract
standalone Presentation contract
content validation including content/presentations
mixed Daily + Talk integration
normal slide generation
Astro build
Slidev build for Daily + Talk
assembly
site-check
artifact upload
```

All must exit successfully.

- [ ] **Step 2: Record artifact evidence**

Record artifact ID, SHA-256 and file count from `upload-artifact` logs.

- [ ] **Step 3: Scope-review the PR**

Confirm there are no changes to:

```text
apps/slides/templates/daily-v1.ts
tools/build-slides/**
Archive / Related / Topic / RSS product code
.github/workflows/**
apps/slides/generated/**
dist/**
```

Expected changes are confined to the standalone content/schema/config/governance, Presentation generator/template/discovery, tests, one real Talk, and design/implementation docs.

- [ ] **Step 4: Verify trusted Preview**

Require the trusted publisher to publish the read-only artifact and pass public availability smoke before commenting the Preview URL.

Public Preview must expose at minimum:

```text
/
/slides/
/slides/2026-08-28/
/slides/orbis-presentation-platform/
```

The `/slides/` page must visibly list both the Daily and standalone Talk.

- [ ] **Step 5: Final PR metadata**

Use title:

```text
feat: add standalone presentations and talk-v1
```

PR body must include RED/GREEN evidence, mixed-source validation, negative duplicate/non-public coverage, artifact digest, public Preview, exact scope boundaries, and note that Plan 30 still owns Weekly semantics.

Do not merge automatically. Merge remains a separate user decision.
