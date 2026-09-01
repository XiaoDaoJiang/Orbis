# Plan 30B — Weekly v1 Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `weekly-v1` as a first-class Weekly Brief Presentation template and prove Daily + Weekly + Talk coexist through the existing Presentation Platform without changing Daily stable-route semantics.

**Architecture:** Keep the Plan 20 pipeline unchanged: Brief source -> `PresentationDescriptor` -> Template Registry -> dedicated renderer -> generated Slidev -> template-neutral `build-slides`. Add only a `weekly-v1` renderer/Registry contract, enable the real Weekly after a test-first integration RED, and migrate the Plan 30A Weekly artifact contract from “presentation absent” to “presentation present”.

**Tech Stack:** TypeScript 5.9, Node >=22.13, pnpm 11.24, Zod, YAML, Astro, Slidev, GitHub Actions read-only PR build + trusted Preview publish.

**Spec:** `docs/superpowers/specs/2026-09-01-weekly-v1-presentation-design.md`

## Global Constraints

- Baseline is `main@cde4f82de2f84ce6266e56008fe69c63d77bc725`; implementation branch is `feat/weekly-v1-presentation`.
- `weekly-v1` slide count is exactly `sections.length + 5`; Weekly Schema already limits sections to 2..6, therefore 7..11 slides.
- Current real Weekly has 3 sections and must render exactly 8 slides.
- Daily remains exactly 11 slides; Talk remains `sections.length + 2`.
- Registry owns `weekly-v1 -> weeklyBriefSchema.parse(payload)` and requires `descriptor.readingUrl`.
- Weekly uses Weekly semantics only: `ORBIS · WEEKLY`, `WEEKLY THESIS`, `TREND MOVEMENTS`, `NEXT PERIOD WATCH`, `REFERENCES`.
- Weekly must not emit Daily-only markers: `FOUR SIGNALS`, `OPEN SOURCE RADAR`, `IMPACT × ADOPTION HORIZON`, `FROM SIGNALS TO ACTION`.
- Escape content-derived markup in the same security posture as `talk-v1`; hostile `<script>` / `<iframe>` strings must not survive as raw markup.
- The real Weekly stays `presentation.enabled: false` until template/Registry RED -> GREEN is complete.
- For integration TDD, migrate tests to expect Weekly Presentation while it is still disabled, observe RED, then switch `presentation.enabled: true`.
- Normal real-content output after cleanup is exactly Daily + Weekly + Talk Presentations.
- Homepage Latest Brief and Latest Presentation are Weekly after enablement; `/latest/`, Daily date aliases and generated `dist/site/archive.json` remain Daily-only.
- Do not commit `apps/slides/generated/**` or `dist/**`.
- Do not change `packages/content-schema/**`, `tools/generate-slides/brief-source.ts`, `tools/generate-slides/discover-presentations.ts`, `tools/generate-slides/index.ts`, `tools/build-slides/**`, `tools/assemble-site/**`, `apps/web/src/lib/presentation-discovery.ts`, Archive/RSS/Topic product implementation, or workflows unless an executable failure proves a genuine gap.
- Do not merge the PR; stop at the user merge gate after final cloud and Trusted Preview evidence.

---

## File Structure

### New

- `apps/slides/templates/weekly-v1.ts` — pure renderer for one validated `WeeklyBrief`; owns Weekly slide structure and escaping.
- `tools/generate-slides/weekly-v1.test.ts` — focused Weekly renderer/Registry contract: real/min/max counts, semantics, escaping, wrong payloads, missing Reading URL.

### Modify

- `apps/slides/templates/registry.ts` — register `weekly-v1`, parse with `weeklyBriefSchema`, require Reading URL, dispatch to `renderWeeklyV1`.
- `apps/slides/style.css` — only narrow Weekly trend/period utilities if needed by renderer output.
- `package.json` — add Weekly template test to the existing `test:presentation-platform` chain; do not create a parallel validation pipeline.
- `tools/weekly-brief/weekly-artifact-check.ts` — migrate Plan 30A presentation-absent assertions to Plan 30B presentation-present/link/discovery assertions while preserving Daily isolation.
- `tools/multi-presentation-check/index.ts` — require a real enabled Weekly seed and assert Daily + Weekly + Talk + future Daily coexist in the ephemeral mixed build.
- `content/briefs/2026-09-01-weekly.yaml` — only after RED 2, switch `presentation.enabled: false -> true`.
- `docs/superpowers/plans/2026-09-01-weekly-v1-presentation.md` — this execution checklist.

---

### Task 1: RED 1 — Encode the Weekly renderer and Registry contract

**Files:**
- Create: `tools/generate-slides/weekly-v1.test.ts`
- Modify: `package.json`
- Read only: `content/briefs/2026-09-01-weekly.yaml`
- Read only: `tools/generate-slides/brief-source.ts`
- Read only: `apps/slides/templates/registry.ts`

**Interfaces:**
- Consumes: `weeklyBriefSchema`, `dailyBriefSchema`, `presentationContentSchema`, `toBriefPresentationDescriptor(brief, { slug, readingUrl })`, `renderPresentation(descriptor, { siteBase })`.
- Produces: an executable contract that requires `renderWeeklyV1(weekly, { siteBase, readingHref })` and Registry support for `template='weekly-v1'` without enabling the real Weekly.

- [ ] **Step 1: Add the focused failing test**

Create `tools/generate-slides/weekly-v1.test.ts` with these concrete stages:

```ts
import assert from 'node:assert/strict'
import { basename, resolve } from 'node:path'
import {
  dailyBriefSchema,
  presentationContentSchema,
  weeklyBriefSchema,
} from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'

const root = resolve(import.meta.dirname, '../..')
const briefDir = resolve(root, 'content/briefs')
const presentationDir = resolve(root, 'content/presentations')
const siteBase = '/Orbis'

const briefFiles = await listFiles(briefDir, ['.yaml', '.yml'])
let weekly: ReturnType<typeof weeklyBriefSchema.parse> | undefined
let weeklySlug: string | undefined
let daily: ReturnType<typeof dailyBriefSchema.parse> | undefined

for (const file of briefFiles) {
  const raw = await readYaml(file)
  const weeklyResult = weeklyBriefSchema.safeParse(raw)
  if (weeklyResult.success && weeklyResult.data.status === 'published') {
    weekly = weeklyResult.data
    weeklySlug = basename(file).replace(/\.(yaml|yml)$/, '')
  }
  const dailyResult = dailyBriefSchema.safeParse(raw)
  if (dailyResult.success && dailyResult.data.status === 'published') daily ??= dailyResult.data
}

assert.ok(weekly, 'weekly-v1 test requires one published Weekly')
assert.ok(weeklySlug)
assert.ok(daily, 'weekly-v1 test requires one published Daily for wrong-payload rejection')
assert.equal(weekly.presentation.enabled, false, 'RED 1 must run before real Weekly Presentation enablement')

const readingUrl = `${siteBase}/briefs/${weeklySlug}/`
const descriptor = toBriefPresentationDescriptor(weekly, { slug: weeklySlug, readingUrl })

let weeklyRenderer: typeof import('../../apps/slides/templates/weekly-v1.ts')
try {
  weeklyRenderer = await import('../../apps/slides/templates/weekly-v1.ts')
} catch (error) {
  assert.fail(`weekly-v1 renderer must exist: ${String(error)}`)
}
const registry = await import('../../apps/slides/templates/registry.ts')
```

Then assert the renderer/Registry contract:

```ts
const markdown = registry.renderPresentation(descriptor, { siteBase })
assert.equal(
  markdown,
  weeklyRenderer.renderWeeklyV1(weekly, { siteBase, readingHref: readingUrl }),
  'Registry must delegate weekly-v1 to the dedicated Weekly renderer',
)

const slideCount = (markdown.match(/^---$/gm) ?? []).length / 2
assert.equal(slideCount, weekly.sections.length + 5)
assert.equal(slideCount, 8, 'Current real Weekly has 3 sections and must render 8 slides')

for (const marker of ['ORBIS · WEEKLY', 'WEEKLY THESIS', 'TREND MOVEMENTS', 'NEXT PERIOD WATCH', 'REFERENCES']) {
  assert.match(markdown, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
for (const marker of ['FOUR SIGNALS', 'OPEN SOURCE RADAR', 'IMPACT × ADOPTION HORIZON', 'FROM SIGNALS TO ACTION']) {
  assert.ok(!markdown.includes(marker), `Weekly must not contain Daily marker: ${marker}`)
}
assert.ok(markdown.includes(readingUrl))
```

Construct minimum and maximum Weekly variants using schema-valid copies of existing sections:

```ts
const minWeekly = weeklyBriefSchema.parse({ ...weekly, sections: weekly.sections.slice(0, 2) })
const maxSections = Array.from({ length: 6 }, (_, index) => ({
  ...weekly.sections[index % weekly.sections.length],
  id: `weekly-max-${index + 1}`,
  title: `Weekly max section ${index + 1}`,
}))
const maxWeekly = weeklyBriefSchema.parse({ ...weekly, sections: maxSections })

const minMarkdown = weeklyRenderer.renderWeeklyV1(minWeekly, { siteBase, readingHref: readingUrl })
const maxMarkdown = weeklyRenderer.renderWeeklyV1(maxWeekly, { siteBase, readingHref: readingUrl })
assert.equal((minMarkdown.match(/^---$/gm) ?? []).length / 2, 7)
assert.equal((maxMarkdown.match(/^---$/gm) ?? []).length / 2, 11)
```

Add hostile content that remains schema-valid and prove escaping:

```ts
const unsafeWeekly = weeklyBriefSchema.parse({
  ...weekly,
  title: '<script>alert(1)</script> Safe Weekly title',
  summary: '<iframe src="https://example.com"></iframe> Safe Weekly summary.',
  weeklyThesis: '<script>alert(2)</script> Safe Weekly thesis remains sufficiently long.',
  trendMovements: weekly.trendMovements.map((movement, index) => index === 0 ? {
    ...movement,
    summary: '<iframe src="https://example.com"></iframe> Safe trend summary.',
  } : movement),
})
const unsafeMarkdown = weeklyRenderer.renderWeeklyV1(unsafeWeekly, { siteBase, readingHref: readingUrl })
assert.doesNotMatch(unsafeMarkdown, /<script|<iframe/i)
assert.match(unsafeMarkdown, /&lt;script&gt;/)
assert.match(unsafeMarkdown, /&lt;iframe/)
```

Load one standalone Presentation and add Registry rejection cases:

```ts
const presentationFiles = await listFiles(presentationDir, ['.yaml', '.yml'])
const talk = presentationContentSchema.parse(await readYaml(presentationFiles[0]))

assert.throws(
  () => registry.renderPresentation({ ...descriptor, readingUrl: undefined }, { siteBase }),
  /weekly-v1 requires readingUrl/,
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, payload: daily }, { siteBase }),
)
assert.throws(
  () => registry.renderPresentation({ ...descriptor, payload: talk }, { siteBase }),
)
```

Finish with:

```ts
console.log(`Weekly Presentation contract passed: ${weeklySlug}`)
```

- [ ] **Step 2: Wire the test into existing validation**

Change only the `test:presentation-platform` script in `package.json`:

```json
"test:presentation-platform": "tsx tools/generate-slides/presentation-platform.test.ts && tsx tools/generate-slides/standalone-presentation.test.ts && tsx tools/generate-slides/standalone-source-validation.test.ts && tsx tools/generate-slides/weekly-v1.test.ts"
```

Do not add a new top-level build pipeline.

- [ ] **Step 3: Commit the RED 1 test**

Commit only the test, package wiring, spec and plan state needed for the checkpoint:

```bash
git add tools/generate-slides/weekly-v1.test.ts package.json docs/superpowers/
git commit -m "test: define weekly-v1 presentation contract"
```

- [ ] **Step 4: Open a Draft PR and verify RED 1 in GitHub Actions**

Open a Draft PR to `main` titled:

```text
feat: add weekly-v1 presentation integration
```

Run/observe the read-only PR Build. Expected failure must be attributable to missing Weekly renderer/Registry support, preferably:

```text
weekly-v1 renderer must exist: ... Cannot find module .../weekly-v1.ts
```

Existing Daily and standalone Presentation baseline tests before this point must remain GREEN. Record run ID and failing job/log excerpt in the PR body.

---

### Task 2: GREEN 1 — Implement dedicated weekly-v1 and Registry dispatch

**Files:**
- Create: `apps/slides/templates/weekly-v1.ts`
- Modify: `apps/slides/templates/registry.ts`
- Modify: `apps/slides/style.css` only if renderer uses new Weekly utilities
- Test: `tools/generate-slides/weekly-v1.test.ts`

**Interfaces:**
- Consumes: `WeeklyBrief`, `PresentationDescriptor`, `PresentationRenderContext`, `weeklyBriefSchema`.
- Produces: `renderWeeklyV1(brief: WeeklyBrief, context: WeeklyV1RenderContext): string`; Registry supports `weekly-v1` while the real Weekly remains disabled.

- [ ] **Step 1: Implement the minimal renderer**

Create `apps/slides/templates/weekly-v1.ts` with this public interface:

```ts
import type { WeeklyBrief } from '@orbis/content-schema'

export type WeeklyV1RenderContext = {
  siteBase: string
  readingHref: string
}

export function renderWeeklyV1(
  brief: WeeklyBrief,
  context: WeeklyV1RenderContext,
): string
```

Use the same escaping primitive as `talk-v1`:

```ts
function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
```

Build pages in exactly this order:

```text
Cover
Period + Weekly Thesis
Trend Movements
one page per section
Next Period Watch
References
```

The Cover uses `orbis-cover`, includes `ORBIS · WEEKLY · <publishedAt>`, title, summary, `<period.from> → <period.to>`, and `[阅读版 ↗](<readingHref>)`.

The thesis page uses `orbis-default`, `WEEKLY THESIS`, a `.weekly-period` element and the escaped thesis.

Trend page uses `TREND MOVEMENTS` and maps directions exactly:

```ts
const directionLabel = {
  rising: 'RISING',
  stable: 'STABLE',
  cooling: 'COOLING',
  'new-variable': 'NEW VARIABLE',
} as const
```

Each section page mirrors Daily's stable section semantics: uppercase layout eyebrow, escaped title/conclusion/facts/limitations and first section reference URL as the source link.

Next Watch renders all watch items with `NEXT PERIOD WATCH`; it may reuse `action-grid/action-card` but not Daily copy.

References renders all top-level references, uses `REFERENCES`, and includes the Reading URL again.

Serialize frontmatter title with `JSON.stringify(escapeHtml(brief.title))` and favicon using the current `siteBase` pattern.

- [ ] **Step 2: Register weekly-v1 at the Registry boundary**

Modify imports in `apps/slides/templates/registry.ts`:

```ts
import { dailyBriefSchema, presentationContentSchema, weeklyBriefSchema } from '@orbis/content-schema'
import { renderWeeklyV1 } from './weekly-v1.ts'
```

Add exactly one renderer entry:

```ts
'weekly-v1': (descriptor, context) => {
  const weekly = weeklyBriefSchema.parse(descriptor.payload)
  if (!descriptor.readingUrl) {
    throw new Error('weekly-v1 requires readingUrl')
  }

  return renderWeeklyV1(weekly, {
    siteBase: context.siteBase,
    readingHref: descriptor.readingUrl,
  })
},
```

Do not add cadence switching outside the Registry.

- [ ] **Step 3: Add only necessary Weekly styles**

If needed by generated markup, append narrowly scoped classes to `apps/slides/style.css`, for example:

```css
.weekly-period { margin-top: 20px; font-family: var(--orbis-mono); font-weight: 800; }
.trend-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
.trend-card { background: var(--orbis-paper); border-left: 5px solid var(--orbis-olive); padding: 18px 22px; box-shadow: var(--orbis-shadow); }
.trend-direction { font-size: .7rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
```

Do not introduce theme/layout/component dependencies.

- [ ] **Step 4: Commit GREEN 1 implementation**

```bash
git add apps/slides/templates/weekly-v1.ts apps/slides/templates/registry.ts apps/slides/style.css
git commit -m "feat: add weekly-v1 renderer"
```

- [ ] **Step 5: Verify cloud GREEN 1**

Wait for the read-only PR Build at this new head and verify the complete current build succeeds while `content/briefs/2026-09-01-weekly.yaml` still has `presentation.enabled: false`.

Required log evidence includes:

```text
Presentation Platform contract passed for daily-v1: 2026-08-28
Standalone Presentation contract passed
Weekly Presentation contract passed: 2026-09-01-weekly
Weekly reading contract passed: 2026-09-01-weekly
```

At this checkpoint normal generated decks remain only Daily + Talk because real Weekly is intentionally disabled. Record run ID in PR body.

---

### Task 3: RED 2 — Migrate integration contracts before enabling Weekly

**Files:**
- Modify: `tools/weekly-brief/weekly-artifact-check.ts`
- Modify: `tools/multi-presentation-check/index.ts`
- Do not modify yet: `content/briefs/2026-09-01-weekly.yaml`

**Interfaces:**
- Consumes: existing normal build artifact in `dist/site`, generated source directory from `site.yaml`, current Daily/Weekly/Talk source schemas.
- Produces: Plan 30B integration expectations that intentionally fail while the real Weekly remains disabled.

- [ ] **Step 1: Migrate the Weekly artifact contract from absence to presence**

In `tools/weekly-brief/weekly-artifact-check.ts`, add paths:

```ts
const weeklyGeneratedPath = resolve(root, `${config.presentation.generatedDir}/${latestWeekly.slug}/slides.md`)
const weeklyDeckPath = resolve(root, `dist/site/slides/${latestWeekly.slug}/index.html`)
```

Include both in required `access(...)` checks.

Replace the two Plan 30A assertions that Weekly is absent from Slides/generated source with assertions that:

```ts
assert.ok(slides.includes(latestWeekly.brief.title), 'Slides discovery must include the presentation-enabled Weekly')
assert.ok(slides.includes(`data-presentation-id="${latestWeekly.slug}"`))
assert.ok(slides.includes('data-presentation-source="brief"'))
assert.ok(slides.includes('data-presentation-cadence="weekly"'))
```

Read generated Markdown and deck HTML, then assert:

```ts
const weeklyMarkdown = await readFile(weeklyGeneratedPath, 'utf8')
const weeklyDeck = await readFile(weeklyDeckPath, 'utf8')
const weeklyReadingHref = `${joinBasePath(siteBase, 'briefs', latestWeekly.slug)}/`
const weeklySlidesHref = `${joinBasePath(siteBase, 'slides', latestWeekly.slug)}/`

assert.ok(weeklyReading.includes(weeklySlidesHref), 'Weekly Reading must link to Weekly Slides')
assert.ok(weeklyMarkdown.includes(weeklyReadingHref), 'Weekly generated deck must link back to Reading')
assert.ok(weeklyMarkdown.includes('ORBIS · WEEKLY'))
assert.ok(weeklyMarkdown.includes('WEEKLY THESIS'))
assert.ok(weeklyMarkdown.includes('TREND MOVEMENTS'))
assert.ok(weeklyMarkdown.includes('NEXT PERIOD WATCH'))
assert.ok(weeklyMarkdown.includes('REFERENCES'))
assert.ok(weeklyDeck.includes(weeklySlidesHref), 'Weekly built deck must use its own public base path')
```

Add Homepage Latest Presentation assertion using the existing homepage metadata convention:

```ts
assert.ok(home.includes(`data-home-id="presentation:${latestWeekly.slug}"`), 'Homepage Latest Presentation must advance to Weekly')
```

Keep all existing Weekly Reading semantics, Archive/RSS/Topics inclusion and Daily latest/archive isolation assertions.

- [ ] **Step 2: Extend the mixed Presentation test to require an enabled Weekly seed**

In `tools/multi-presentation-check/index.ts`, import `weeklyBriefSchema` and discover a Weekly seed separately from Daily:

```ts
let weeklySeed: ReturnType<typeof weeklyBriefSchema.parse> | undefined
let weeklySeedSlug: string | undefined

for (const file of briefFiles) {
  const result = weeklyBriefSchema.safeParse(await readYaml(file))
  if (!result.success) continue
  if (result.data.status !== 'published' || !result.data.presentation.enabled) continue
  weeklySeed = result.data
  weeklySeedSlug = basename(file).replace(/\.(yaml|yml)$/, '')
  break
}

assert.ok(weeklySeed, 'Multi-presentation check requires one published weekly-v1 presentation as a seed')
assert.ok(weeklySeedSlug)
```

During the mixed build require:

```ts
const weeklySource = resolve(generatedRoot, weeklySeedSlug, 'slides.md')
const weeklyDeck = resolve(root, `dist/site/slides/${weeklySeedSlug}/index.html`)
await access(weeklySource)
await access(weeklyDeck)
```

Read/assert Weekly source/deck:

```ts
const weeklyMarkdown = await readFile(weeklySource, 'utf8')
const weeklyDeckHtml = await readFile(weeklyDeck, 'utf8')
const expectedWeeklyDeckBase = `${joinBasePath(siteBase, config.presentation.publicPath, weeklySeedSlug)}/`
const expectedWeeklyReading = `${joinBasePath(siteBase, 'briefs', weeklySeedSlug)}/`

assert.ok(weeklyDeckHtml.includes(expectedWeeklyDeckBase))
assert.ok(weeklyMarkdown.includes('ORBIS · WEEKLY'))
assert.ok(weeklyMarkdown.includes(expectedWeeklyReading))
assert.ok(slidesIndexHtml.includes(`data-presentation-id="${weeklySeedSlug}"`))
```

Update the success log to explicitly name all four public decks:

```ts
console.log(`Mixed Presentation integration passed: Daily=${dailySeedSlug}, Weekly=${weeklySeedSlug}, Talk=${talkSeedSlug}, future Daily=${futureDailySlug}`)
```

Do not change future Daily promotion, duplicate slug or non-public exclusion logic.

- [ ] **Step 3: Commit the integration expectations while Weekly is still disabled**

```bash
git add tools/weekly-brief/weekly-artifact-check.ts tools/multi-presentation-check/index.ts
git commit -m "test: require weekly presentation integration"
```

- [ ] **Step 4: Verify cloud RED 2**

Run/observe the read-only PR Build. Expected RED must be caused by the real Weekly still being disabled, with a message such as:

```text
Multi-presentation check requires one published weekly-v1 presentation as a seed
```

or a missing Weekly generated/deck artifact assertion.

Template/Registry tests from GREEN 1 must still pass before this integration failure. Record run ID/log excerpt in PR body.

---

### Task 4: GREEN 2 — Enable the real Weekly and satisfy integration contracts

**Files:**
- Modify: `content/briefs/2026-09-01-weekly.yaml`
- Modify only if an executable failure proves necessary: the focused integration/test files from Task 3
- Do not proactively modify generic discovery/build/assembler implementation.

**Interfaces:**
- Consumes: GREEN `weekly-v1` Registry capability and RED 2 integration expectations.
- Produces: one real presentation-enabled Weekly that flows through existing descriptor discovery, web discovery and build infrastructure.

- [ ] **Step 1: Flip only the real Weekly Presentation switch**

Change:

```yaml
presentation:
  enabled: false
  template: weekly-v1
```

To:

```yaml
presentation:
  enabled: true
  template: weekly-v1
```

No other Weekly content changes belong in this task.

- [ ] **Step 2: Commit the production enablement**

```bash
git add content/briefs/2026-09-01-weekly.yaml
git commit -m "feat: enable weekly-v1 presentation"
```

- [ ] **Step 3: Run/observe the full cloud build**

Expected normal real-content generation after ephemeral fixture cleanup:

```text
Generated Slidev deck: 2026-08-28 (daily-v1, brief)
Generated Slidev deck: 2026-09-01-weekly (weekly-v1, brief)
Generated Slidev deck: orbis-presentation-platform (talk-v1, presentation)
Generated 3 presentation(s)
```

Expected ephemeral mixed build includes at least:

```text
real Daily
real Weekly
real Talk
future Daily fixture
```

and logs the updated mixed integration success line.

- [ ] **Step 4: Fix only observed integration gaps**

If this run fails, use `superpowers:systematic-debugging` before editing.

Allowed likely fixes are assertion details in focused tests. Product implementation files declared unchanged in Global Constraints may change only when the failure demonstrates an actual missing behavior, and the root cause must be documented in the PR body.

- [ ] **Step 5: Re-run until GREEN 2 is fresh at the final code head**

Required evidence:

```text
Weekly Presentation contract passed: 2026-09-01-weekly
Mixed Presentation integration passed: Daily=..., Weekly=2026-09-01-weekly, Talk=..., future Daily=...
Homepage discovery ... Presentation=2026-09-01-weekly
Weekly reading contract passed: 2026-09-01-weekly
Daily latest isolation passed: Weekly=2026-09-01, Daily latest=2026-08-28
```

---

### Task 5: Final regression, artifact, Preview and scope verification

**Files:**
- Read only: all branch diff files
- Modify: PR body only, unless final verification uncovers a real defect

**Interfaces:**
- Consumes: final GREEN branch head.
- Produces: verifiable PR ready for user merge, with no merge performed by the agent.

- [ ] **Step 1: Verify required unchanged architecture boundaries**

Compare branch against `main@cde4f82de2f84ce6266e56008fe69c63d77bc725` and confirm no unintended changes under:

```text
packages/content-schema/**
tools/generate-slides/brief-source.ts
tools/generate-slides/discover-presentations.ts
tools/generate-slides/index.ts
tools/build-slides/**
tools/assemble-site/**
apps/web/src/lib/presentation-discovery.ts
apps/web/src/pages/rss.xml.ts
apps/web/src/pages/archive/index.astro
apps/web/src/pages/topics/[id].astro
.github/workflows/**
apps/slides/generated/**
dist/**
```

If any appears unexpectedly, explain or revert it before completion.

- [ ] **Step 2: Inspect the final read-only PR Build job and artifact**

Use the final head SHA to fetch the associated PR workflow run, jobs and logs. Require every build step to succeed, including frozen install, Path Guard, full `pnpm build`, and artifact upload.

Fetch `orbis-pr-preview` artifact metadata and record:

```text
run ID
job ID
artifact ID
artifact digest
artifact byte size
```

- [ ] **Step 3: Verify Trusted Preview publication**

Require the trusted publisher bot comment generated from the final successful read-only artifact after public HTTP smoke.

Expected Preview root:

```text
https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-<PR_NUMBER>/index.html
```

Inspect the published `preview-pr-<PR_NUMBER>` branch and verify:

```text
briefs/2026-09-01-weekly/index.html
slides/2026-09-01-weekly/index.html
slides/index.html
index.html
latest/index.html
archive.json
rss.xml
```

Confirm:

```text
Weekly Reading -> Slides
Weekly Slides -> Reading
Slides lists Weekly first
Homepage Latest Brief = Weekly
Homepage Latest Presentation = Weekly
/latest/ -> Daily 2026-08-28 stable route
archive.json.latest = 2026-08-28
archive.json.issues excludes Weekly
RSS Weekly item uses Reading URL
```

- [ ] **Step 4: Update PR body with TDD and final evidence**

Document four checkpoints:

```text
RED 1  weekly-v1 capability missing
GREEN 1 renderer + Registry, Weekly still disabled
RED 2  integration expects Weekly while Weekly still disabled
GREEN 2 final enabled mixed integration
```

Also document final changed-file scope, normal Daily + Weekly + Talk set, artifact metadata and Trusted Preview evidence.

- [ ] **Step 5: Final verification-before-completion gate**

Invoke `superpowers:verification-before-completion` and verify final evidence is from the actual final head, not an earlier checkpoint.

Check PR mergeability/reviews/threads. Do not claim independent second-model review unless such a reviewer actually ran.

- [ ] **Step 6: Stop at the merge gate**

Report the PR as ready for user merge. Do **not** call merge or enable auto-merge.
