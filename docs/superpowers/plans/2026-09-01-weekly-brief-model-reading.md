# Weekly Brief Model + Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class Weekly Brief schema and cadence-aware reading experience while preserving Daily presentation and Daily-only `/latest/` semantics.

**Architecture:** Split the Brief schema by cadence so `weekly` owns period/thesis/trend/watch semantics instead of inheriting Daily-style signals/actions. Keep `/briefs/<id>/` as the shared route shell and delegate body rendering to cadence-specific components. Reuse existing Brief discovery, Archive, RSS and Topic aggregation and prove their Weekly behavior through artifact tests rather than duplicating product logic.

**Tech Stack:** TypeScript, Zod, Astro Content Collections, Astro static rendering, pnpm, tsx, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-weekly-brief-model-reading-design.md`

## Global Constraints

- Baseline is `main@087bdd18a4094ac4eedc532463d2c66a12cc350b`.
- Plan 30A must not implement or register a `weekly-v1` renderer; that is Plan 30B.
- Daily schema/output semantics remain unchanged: 4 signals, 5 sections, 3..5 actions, `daily-v1`.
- Ad-hoc Brief keeps its current non-Daily body contract; do not redesign it.
- Weekly uses exactly seven calendar dates inclusive: `to - from === 6 days` in UTC date-only arithmetic.
- Weekly requires `publishedAt === period.to`.
- Weekly requires 2..8 trend movements, 2..6 sections and 1..5 next-period watch items.
- Weekly `presentation.template` is `weekly-v1`, but the first real Weekly has `presentation.enabled: false`.
- Weekly must reject Daily-only `signals`, `projects`, `radar`, `actions` and `archivePicks` rather than silently stripping them.
- Homepage Latest Brief may become Weekly; `/latest/`, `/YYYY/MM/DD/` and `archive.json.latest/issues` remain Daily-only.
- Weekly participates in `/briefs/`, `/briefs/weekly/`, `/archive/`, `/rss.xml`, Topic aggregation and Related Content.
- Weekly does not appear in `/slides/` in Plan 30A.
- Do not commit `apps/slides/generated/**` or `dist/**`.

---

## File Structure

**Create**
- `tools/weekly-brief/weekly-schema.test.ts` — executable RED/GREEN contract for Weekly cadence semantics and Daily/Ad-hoc compatibility.
- `apps/web/src/components/briefs/DailyBriefBody.astro` — extracted Daily body preserving current reading output.
- `apps/web/src/components/briefs/WeeklyBriefBody.astro` — Weekly-specific reading semantics.
- `content/briefs/2026-09-01-weekly.yaml` — first real published Weekly with Presentation disabled.
- `tools/weekly-brief/weekly-artifact-check.ts` — artifact-level Weekly discovery, reading and Daily-isolation assertions.

**Modify**
- `packages/content-schema/src/index.ts` — define Weekly field schemas, `weeklyBriefSchema`, explicit `adHocBriefSchema`, cadence union and public types.
- `packages/content-schema/test/schema.test.ts` — keep existing Daily contract and add representative Ad-hoc regression coverage.
- `apps/web/src/pages/briefs/[id].astro` — keep shared shell, delegate Daily/Weekly bodies by cadence.
- `apps/web/src/pages/briefs/weekly/index.astro` — replace placeholder copy with real Weekly discovery copy.
- `tools/site-check/index.ts` — make existing site gate understand Weekly reading semantics and verify Daily-only latest/archive behavior with a newer Weekly.
- `package.json` — add Weekly contract/artifact scripts to top-level validation/build.

**Intentionally unchanged**
- `tools/assemble-site/index.ts` — already filters `brief.cadence !== 'daily'` for stable/latest routes.
- `apps/web/src/pages/rss.xml.ts` — already includes every published Brief.
- `apps/web/src/pages/archive/index.astro` — already includes every public Brief and supports `cadence=weekly`.
- `apps/web/src/pages/topics/[id].astro` — already aggregates public Briefs by Topic.
- `apps/web/src/lib/content-discovery.ts` — already treats cadence generically while keeping Daily adjacency explicitly Daily-only.
- `apps/slides/templates/**` and `tools/build-slides/**` — Weekly rendering is Plan 30B.

---

### Task 1: Establish the Weekly Schema RED Contract

**Files:**
- Create: `tools/weekly-brief/weekly-schema.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: current `@orbis/content-schema` exports.
- Produces: executable contract expecting `weeklyBriefSchema`, `WeeklyBrief` semantics and cadence-exclusive validation.

- [ ] **Step 1: Create the failing Weekly schema contract**

Use a valid Weekly fixture with:

```ts
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
    { topic: 'agent-harness', direction: 'rising', summary: 'Presentation generation now converges through source-neutral descriptors.' },
    { topic: 'coding-agent', direction: 'new-variable', summary: 'Standalone presentation publishing introduces another structured source without duplicating renderer plumbing.' },
  ],
  sections: [
    {
      id: 'platform-boundary',
      layout: 'architecture',
      title: 'Presentation becomes a platform boundary',
      conclusion: 'Brief-derived and standalone sources now converge before rendering.',
      facts: ['The registry dispatches daily-v1 and talk-v1 through one PresentationDescriptor pipeline.'],
      limitations: [],
      references: [{
        title: 'Plan 20 Presentation Platform',
        url: 'https://github.com/XiaoDaoJiang/Orbis/blob/planning/product-capability-roadmap/docs/plan/20-presentation-platform.md',
        supports: 'Defines the source-neutral Presentation Platform target.',
      }],
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
    { title: 'Weekly semantics', reason: 'The next platform test is whether cadence-specific content can reuse discovery without reusing Daily body semantics.' },
  ],
  references: [{
    title: 'Orbis repository',
    url: 'https://github.com/XiaoDaoJiang/Orbis',
    supports: 'Provides the implementation evidence summarized by this Weekly.',
  }],
  presentation: { enabled: false, template: 'weekly-v1' },
} as const
```

The test must dynamically inspect the module first so the initial RED is an assertion rather than a TypeScript import error:

```ts
const schemaModule = await import('@orbis/content-schema') as Record<string, unknown>
assert.equal(typeof schemaModule.weeklyBriefSchema, 'object', 'weeklyBriefSchema must exist before Weekly Briefs can be validated')
```

After resolving the schema export, assert:

```ts
const weeklyBriefSchema = schemaModule.weeklyBriefSchema as { parse(value: unknown): unknown }
const parsed = weeklyBriefSchema.parse(validWeekly) as typeof validWeekly
assert.equal(parsed.cadence, 'weekly')
assert.deepEqual(parsed.period, validWeekly.period)
assert.equal(parsed.presentation.template, 'weekly-v1')
```

Then add negative assertions for:

```ts
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, period: undefined }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, weeklyThesis: undefined }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, trendMovements: validWeekly.trendMovements.slice(0, 1) }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, trendMovements: [{ ...validWeekly.trendMovements[0], direction: 'unknown' }, validWeekly.trendMovements[1]] }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, sections: validWeekly.sections.slice(0, 1) }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, nextPeriodWatch: [] }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, period: { from: '2026-08-25', to: '2026-09-01' } }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, publishedAt: '2026-08-31' }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, presentation: { enabled: false, template: 'daily-v1' } }))
assert.throws(() => weeklyBriefSchema.parse({ ...validWeekly, signals: [{ title: 'Hybrid field', summary: 'This Daily-only field must make Weekly invalid.', impact: 'high' }] }))
```

Finally prove the generic `briefSchema` rejects hybrid Weekly content as well once implemented.

- [ ] **Step 2: Wire the contract into validation before implementing the schema**

Add:

```json
"test:weekly-brief": "tsx tools/weekly-brief/weekly-schema.test.ts"
```

and change `validate` to:

```json
"validate": "pnpm --filter @orbis/content-schema test && pnpm test:presentation-platform && pnpm test:weekly-brief && pnpm content:validate"
```

- [ ] **Step 3: Open a Draft PR and run the read-only PR build**

Expected first failure:

```text
weeklyBriefSchema must exist before Weekly Briefs can be validated
```

Existing content-schema tests and Plan 20 Presentation Platform contracts must pass before this failure.

- [ ] **Step 4: Commit the RED contract**

Commit message:

```text
test: define weekly brief schema contract
```

---

### Task 2: Implement Cadence-Specific Brief Schemas

**Files:**
- Modify: `packages/content-schema/src/index.ts`
- Modify: `packages/content-schema/test/schema.test.ts`
- Test: `tools/weekly-brief/weekly-schema.test.ts`

**Interfaces:**
- Consumes: existing `dateStringSchema`, `briefSectionSchema`, Daily field schemas and `presentationSchema` concepts.
- Produces: `weeklyBriefSchema`, `adHocBriefSchema`, `Brief`, `WeeklyBrief`, `AdHocBrief`.

- [ ] **Step 1: Add focused Weekly field schemas**

Define:

```ts
export const trendMovementSchema = z.object({
  topic: z.string().min(2),
  direction: z.enum(['rising', 'stable', 'cooling', 'new-variable']),
  summary: z.string().min(12),
}).strict()

export const nextPeriodWatchSchema = z.object({
  title: z.string().min(3),
  reason: z.string().min(12),
}).strict()

export const weeklyPeriodSchema = z.object({
  from: dateStringSchema,
  to: dateStringSchema,
}).strict().superRefine((period, ctx) => {
  const from = Date.parse(`${period.from}T00:00:00Z`)
  const to = Date.parse(`${period.to}T00:00:00Z`)
  if (to - from !== 6 * 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: 'custom', message: 'Weekly period must contain exactly seven calendar dates' })
  }
})
```

- [ ] **Step 2: Refactor only the cadence boundary**

Create a shared metadata schema containing:

```ts
kind
publishedAt
status
title
summary
topics
references
```

Keep Daily body fields exactly as today. Define `adHocBriefSchema` with the current generic non-Daily fields exactly as today. Do not change Daily quantity limits or Ad-hoc quantity limits.

Weekly must be `.strict()` and contain:

```ts
cadence: z.literal('weekly')
period: weeklyPeriodSchema
weeklyThesis: z.string().min(24)
trendMovements: z.array(trendMovementSchema).min(2).max(8)
sections: z.array(briefSectionSchema).min(2).max(6)
nextPeriodWatch: z.array(nextPeriodWatchSchema).min(1).max(5)
presentation: z.object({ enabled: z.boolean(), template: z.literal('weekly-v1') }).strict()
```

Add a schema-level refinement:

```ts
if (brief.publishedAt !== brief.period.to) {
  ctx.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Weekly publishedAt must equal period.to' })
}
```

Define:

```ts
export const briefSchema = z.union([dailyBriefSchema, weeklyBriefSchema, adHocBriefSchema])
export type WeeklyBrief = z.infer<typeof weeklyBriefSchema>
export type AdHocBrief = z.infer<typeof adHocBriefSchema>
```

- [ ] **Step 3: Add Daily and Ad-hoc regression assertions**

Keep the current Daily fixture and assertions unchanged. Add a representative Ad-hoc fixture with 1 signal, 1 section, 1 action, references and a supported existing presentation template, and assert `adHocBriefSchema.parse()` plus `briefSchema.parse()` both succeed.

Also assert:

```ts
assert.throws(() => briefSchema.parse({ ...validWeekly, cadence: 'weekly', signals: [...] }))
```

so generic parsing cannot silently normalize a hybrid Weekly.

- [ ] **Step 4: Run schema/Weekly contracts**

Run:

```text
pnpm --filter @orbis/content-schema test
pnpm test:weekly-brief
```

Expected: PASS.

- [ ] **Step 5: Commit**

```text
feat: add weekly brief schema
```

---

### Task 3: Add a Real Weekly and Cadence-Aware Reading Bodies

**Files:**
- Create: `apps/web/src/components/briefs/DailyBriefBody.astro`
- Create: `apps/web/src/components/briefs/WeeklyBriefBody.astro`
- Create: `content/briefs/2026-09-01-weekly.yaml`
- Modify: `apps/web/src/pages/briefs/[id].astro`
- Modify: `apps/web/src/pages/briefs/weekly/index.astro`

**Interfaces:**
- Consumes: `CollectionEntry<'briefs'>['data']` narrowed by `cadence` and existing BaseLayout/RelatedContent/AdjacentContentNav.
- Produces: unchanged Daily reading semantics plus Weekly period/thesis/trends/sections/watch/references reading output at `/briefs/2026-09-01-weekly/`.

- [ ] **Step 1: Extract the current Daily body without changing copy or order**

`DailyBriefBody.astro` receives a Daily-narrowed `brief` prop and renders exactly the current body:

```text
Four signals
<signals>
<section blocks>
From signals to action
<actions>
References
```

Use the exact current markup from `apps/web/src/pages/briefs/[id].astro` so this extraction is behavior-preserving.

- [ ] **Step 2: Implement Weekly body markup**

`WeeklyBriefBody.astro` receives a Weekly-narrowed `brief` prop and renders headings/markers:

```astro
<section data-weekly-section="period">
  <h2>Period</h2>
  <p>{brief.period.from} → {brief.period.to}</p>
</section>
<section data-weekly-section="thesis">
  <h2>Weekly Thesis</h2>
  <p><strong>{brief.weeklyThesis}</strong></p>
</section>
<section data-weekly-section="trends">
  <h2>Trend Movements</h2>
  ...
</section>
<section data-weekly-section="sections">
  <h2>Key Sections</h2>
  ... existing section semantics ...
</section>
<section data-weekly-section="watch">
  <h2>Next Period Watch</h2>
  ...
</section>
<section data-weekly-section="references">
  <h2>References</h2>
  ...
</section>
```

Each movement should expose:

```astro
data-trend-direction={movement.direction}
data-trend-topic={movement.topic}
```

so artifact tests can verify semantic output without depending on CSS.

- [ ] **Step 3: Make the shared route cadence-aware**

Keep the existing shared page header and Presentation link. Narrow by cadence:

```astro
{entry.data.cadence === 'daily' && <DailyBriefBody brief={entry.data} />}
{entry.data.cadence === 'weekly' && <WeeklyBriefBody brief={entry.data} />}
```

Preserve:

```ts
adjacent: entry.data.cadence === 'daily' ? getDailyAdjacency(...) : {}
```

For `ad-hoc`, retain the existing generic body semantics rather than dropping rendering; either render the old body inline in an explicit `ad-hoc` branch or introduce a small compatibility component using its existing fields.

- [ ] **Step 4: Commit the real Weekly source**

Create `content/briefs/2026-09-01-weekly.yaml` with:

```yaml
kind: brief
cadence: weekly
publishedAt: 2026-09-01
status: published
period:
  from: 2026-08-26
  to: 2026-09-01
presentation:
  enabled: false
  template: weekly-v1
```

Use topics `agent-harness` and `coding-agent`. The thesis/trends/sections/watch must summarize repository-observable changes around Presentation Platform / discovery / verification, and references must point to public Orbis plan files, PR #11/#12 or repository URLs. Do not fabricate external claims.

- [ ] **Step 5: Update Weekly index copy**

Replace future-looking placeholder language with copy describing published Weekly intelligence. Preserve empty-state behavior for repositories where no Weekly is public.

- [ ] **Step 6: Run content validation and Astro build**

Run:

```text
pnpm content:validate
pnpm build:web
```

Expected: Weekly YAML validates and `/briefs/2026-09-01-weekly/` plus `/briefs/weekly/` build.

- [ ] **Step 7: Commit**

```text
feat: add weekly brief reading experience
```

---

### Task 4: Lock Weekly Discovery and Daily Isolation at Artifact Level

**Files:**
- Create: `tools/weekly-brief/weekly-artifact-check.ts`
- Modify: `tools/site-check/index.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: assembled `dist/site`, real Weekly source and existing Daily archive/latest artifacts.
- Produces: executable acceptance for Weekly discovery and Daily-only stable route semantics.

- [ ] **Step 1: Extend `site-check` to assert Weekly semantic reading output**

For each published Weekly, assert its reading page contains:

```text
data-weekly-section="period"
data-weekly-section="thesis"
data-weekly-section="trends"
data-weekly-section="sections"
data-weekly-section="watch"
data-weekly-section="references"
```

and assert it does **not** contain Daily-only headings:

```text
Four signals
From signals to action
```

For the real Weekly with Presentation disabled, assert no generated source/deck exists and `/slides/` does not list its title.

- [ ] **Step 2: Add an explicit Weekly artifact acceptance script**

`weekly-artifact-check.ts` loads the newest published Weekly from `content/briefs`, then reads:

```text
dist/site/index.html
dist/site/briefs/index.html
dist/site/briefs/weekly/index.html
dist/site/archive/index.html
dist/site/rss.xml
dist/site/topics/<topic>/index.html
dist/site/latest/index.html
dist/site/archive.json
dist/site/slides/index.html
```

Assert:

```ts
home.includes(`data-home-id="brief:${weeklySlug}"`)
briefsIndex.includes(weekly.title)
weeklyIndex.includes(weekly.title)
archive.includes(weekly.title)
rss.includes(`/briefs/${weeklySlug}/`)
for (const topic of weekly.topics) topicHtml.includes(weekly.title)
!slides.includes(weekly.title)
```

Then load the newest published Daily and assert:

```ts
archiveJson.latest === latestDaily.publishedAt
latestHtml.includes(`/${latestDaily.publishedAt.replaceAll('-', '/')}/`)
```

and explicitly assert the Weekly's `publishedAt` is newer than the Daily fixture so this is a meaningful isolation test.

- [ ] **Step 3: Prove archive.json contains Daily only**

Assert every `archiveJson.issues` entry maps to a published Daily date/title and that the Weekly title/date does not appear in `issues`.

- [ ] **Step 4: Wire the artifact check into top-level build**

Add:

```json
"test:weekly-artifact": "tsx tools/weekly-brief/weekly-artifact-check.ts"
```

and append it after `test:site` / `test:presentation-scope` once `dist/site` exists:

```json
"build": "pnpm validate && pnpm test:multi-presentation && pnpm generate:slides && pnpm build:web && pnpm build:slides && pnpm assemble && pnpm test:site && pnpm test:presentation-scope && pnpm test:weekly-artifact"
```

- [ ] **Step 5: Run full build**

Run:

```text
pnpm build
```

Expected final real-content state:

```text
1 published Daily
1 published Weekly
1 standalone Talk
2 presentation decks (Daily + Talk)
Homepage Latest Brief = Weekly
Homepage Latest Presentation = standalone Talk
/latest/ = Daily stable route
archive.json.latest = Daily date
Weekly present in Briefs/Weekly/Archive/RSS/Topic
Weekly absent from Slides
```

- [ ] **Step 6: Commit**

```text
test: verify weekly discovery and daily isolation
```

---

### Task 5: PR Verification, Trusted Preview and Scope Review

**Files:**
- Modify: PR body only; no production file required.

**Interfaces:**
- Consumes: latest branch head and GitHub Actions read-only PR build.
- Produces: merge-ready 30A PR evidence and a public Preview containing the real Weekly reading page.

- [ ] **Step 1: Verify latest read-only PR build**

Require fresh success for:

```text
pnpm install --frozen-lockfile
Path Guard
pnpm build
artifact upload
```

Read job logs and record the exact Weekly schema/artifact/Daily-isolation success lines.

- [ ] **Step 2: Verify trusted Preview publication**

Require the trusted publisher comment generated from the latest successful artifact after its public availability smoke.

Inspect `preview-pr-<N>` branch files and confirm:

```text
briefs/2026-09-01-weekly/index.html exists
briefs/weekly/index.html contains the Weekly
archive/index.html contains the Weekly with cadence weekly
rss.xml contains the Weekly reading URL
topics/agent-harness/index.html contains the Weekly
slides/index.html does not contain the Weekly
latest/index.html still points at the latest Daily stable date route
```

- [ ] **Step 3: Review final diff against baseline**

Confirm no changes under:

```text
apps/slides/templates/weekly-v1.ts
tools/build-slides/**
tools/assemble-site/index.ts
apps/web/src/pages/rss.xml.ts
apps/web/src/pages/archive/index.astro
apps/web/src/pages/topics/[id].astro
apps/slides/generated/**
dist/**
```

except files explicitly required by this plan. In particular there must be no `weekly-v1` renderer in 30A.

- [ ] **Step 4: Update PR body with evidence**

Document:

```text
RED run and exact missing Weekly schema failure
GREEN run and artifact digest
Weekly reading/discovery evidence
Homepage Latest Brief = Weekly
Daily /latest/ + archive.json isolation evidence
Trusted Preview URL
30B deferred scope
```

- [ ] **Step 5: Stop at merge gate**

Do not merge. Report the PR as ready for the user to merge. If the connector cannot transition Draft → Ready because of the known GitHub GraphQL `fullDatabaseId` compatibility issue, record that as a connector limitation rather than a repository failure.
