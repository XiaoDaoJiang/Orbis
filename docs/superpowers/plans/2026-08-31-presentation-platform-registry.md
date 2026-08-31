# Presentation Platform Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Plan 20A as a behavior-preserving platform refactor that converts published Brief presentations into a source-neutral Descriptor and dispatches rendering through an explicit Template Registry.

**Architecture:** Keep Brief discovery/publication filtering in `tools/generate-slides/index.ts`, move source adaptation to `tools/generate-slides/brief-source.ts`, define source-neutral presentation contracts in `apps/slides/presentation.ts`, and make `apps/slides/templates/registry.ts` the only template dispatch layer. The existing `renderDailyV1` implementation remains unchanged and is called through a registry adapter.

**Tech Stack:** TypeScript 5.9, Node.js >=22.13, pnpm 11.24, Zod via `@orbis/content-schema`, Slidev, tsx, Node `assert` contract tests, GitHub Actions read-only PR build.

**Spec:** `docs/superpowers/specs/2026-08-31-presentation-platform-registry-design.md`

## Global Constraints

- `content/**` remains the only publishable Source of Truth.
- Slides remain an output channel, not a second content source.
- Do not add `content/presentations/**`, `presentationContentSchema`, `talk-v1`, `weekly-v1`, duplicate-source resolution, or mixed-source discovery in this PR.
- Do not modify `apps/slides/templates/daily-v1.ts` markup or the fixed 11-slide contract.
- Keep current Brief eligibility exactly `status === 'published' && presentation.enabled === true`.
- `tools/build-slides` remains template-agnostic and unchanged.
- Unknown templates must fail during generation with `Unsupported presentation template: <template>`.
- Do not commit generated Slidev sources, generated HTML, or `dist/**`.
- Final validation is the existing full `pnpm build` contract plus trusted public Preview.

---

### Task 1: Add the RED Presentation Platform contract

**Files:**
- Create: `tools/generate-slides/presentation-platform.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing published Daily Brief fixture(s), `renderDailyV1`, and the planned platform module paths.
- Produces: a build-time contract that proves the Descriptor and Registry abstractions exist and preserve Daily rendering behavior.

- [ ] **Step 1: Add a dedicated script before production modules exist**

Add:

```json
"test:presentation-platform": "tsx tools/generate-slides/presentation-platform.test.ts"
```

and place it in `validate` before `content:validate`:

```json
"validate": "pnpm --filter @orbis/content-schema test && pnpm test:presentation-platform && pnpm content:validate"
```

- [ ] **Step 2: Write the failing contract test**

The test must dynamically import the planned modules so a missing module becomes an explicit assertion failure rather than an uncaught loader error.

It loads one published `daily-v1` Brief from `content/briefs/**`, computes a stable test reading URL, and expects these interfaces:

```ts
toBriefPresentationDescriptor(
  brief,
  { slug, readingUrl },
)

renderPresentation(
  descriptor,
  { siteBase },
)
```

Assertions after modules exist:

```ts
assert.equal(descriptor.id, slug)
assert.equal(descriptor.slug, slug)
assert.equal(descriptor.title, daily.title)
assert.equal(descriptor.publishedAt, daily.publishedAt)
assert.deepEqual(descriptor.topics, daily.topics)
assert.equal(descriptor.template, 'daily-v1')
assert.equal(descriptor.sourceKind, 'brief')
assert.equal(descriptor.readingUrl, readingUrl)
assert.equal(descriptor.payload, daily)
```

Renderer compatibility assertion:

```ts
assert.equal(
  renderPresentation(descriptor, { siteBase }),
  renderDailyV1(daily, { siteBase, readingHref: readingUrl }),
)
```

Negative assertions:

```ts
assert.throws(
  () => renderPresentation({ ...descriptor, template: 'unsupported-v1' }, { siteBase }),
  /Unsupported presentation template: unsupported-v1/,
)

assert.throws(
  () => renderPresentation({ ...descriptor, readingUrl: undefined }, { siteBase }),
  /daily-v1 requires readingUrl/,
)
```

- [ ] **Step 3: Open a Draft PR and verify RED in Actions**

Expected: `build-preview` reaches `pnpm test:presentation-platform` and fails with the assertion explaining that the planned presentation platform module is missing. Confirm the failure is not a baseline install/schema/build failure.

No production platform module is added before this failure is observed.

---

### Task 2: Define the Descriptor contract and Brief adapter

**Files:**
- Create: `apps/slides/presentation.ts`
- Create: `tools/generate-slides/brief-source.ts`

**Interfaces:**
- Produces:

```ts
export type PresentationSourceKind = 'brief' | 'presentation'

export type PresentationDescriptor = {
  id: string
  slug: string
  title: string
  publishedAt: string
  topics: string[]
  template: string
  sourceKind: PresentationSourceKind
  readingUrl?: string
  payload: unknown
}

export type PresentationRenderContext = {
  siteBase: string
}
```

and:

```ts
export function toBriefPresentationDescriptor(
  brief: Brief,
  input: { slug: string; readingUrl: string },
): PresentationDescriptor
```

- [ ] **Step 1: Implement the smallest Descriptor types required by the RED test**

Do not introduce schema parsing or source discovery in `apps/slides/presentation.ts`; it is types only.

- [ ] **Step 2: Implement the Brief adapter as a pure mapping**

Return:

```ts
{
  id: input.slug,
  slug: input.slug,
  title: brief.title,
  publishedAt: brief.publishedAt,
  topics: brief.topics,
  template: brief.presentation.template,
  sourceKind: 'brief',
  readingUrl: input.readingUrl,
  payload: brief,
}
```

Do not filter `status` or `presentation.enabled` here.

- [ ] **Step 3: Rerun the focused test**

Expected: the module-existence/Descriptor assertions advance, while Registry assertions still fail because `apps/slides/templates/registry.ts` does not exist yet.

---

### Task 3: Add the Template Registry and migrate `daily-v1`

**Files:**
- Create: `apps/slides/templates/registry.ts`

**Interfaces:**
- Consumes: `PresentationDescriptor`, `PresentationRenderContext`, `dailyBriefSchema`, `renderDailyV1`.
- Produces:

```ts
export type PresentationRenderer = (
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) => string

export function renderPresentation(
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
): string
```

- [ ] **Step 1: Implement the `daily-v1` registry adapter**

Use:

```ts
const renderers: Record<string, PresentationRenderer> = {
  'daily-v1': (descriptor, context) => {
    const daily = dailyBriefSchema.parse(descriptor.payload)
    if (!descriptor.readingUrl) {
      throw new Error('daily-v1 requires readingUrl')
    }

    return renderDailyV1(daily, {
      siteBase: context.siteBase,
      readingHref: descriptor.readingUrl,
    })
  },
}
```

- [ ] **Step 2: Implement explicit unsupported-template failure**

Use:

```ts
export function renderPresentation(
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) {
  const renderer = renderers[descriptor.template]
  if (!renderer) {
    throw new Error(`Unsupported presentation template: ${descriptor.template}`)
  }
  return renderer(descriptor, context)
}
```

No default/fallback renderer.

- [ ] **Step 3: Run the focused test to GREEN**

Expected: Descriptor mapping, exact Daily renderer equivalence, unsupported-template failure, and missing-readingUrl failure all pass.

---

### Task 4: Migrate the production generator to Descriptor + Registry

**Files:**
- Modify: `tools/generate-slides/index.ts`

**Interfaces:**
- Consumes: `toBriefPresentationDescriptor`, `renderPresentation`.
- Produces: the same generated directory layout and `slides.md` output as before.

- [ ] **Step 1: Remove template-specific imports from the generator**

Delete direct imports of:

```ts
dailyBriefSchema
renderDailyV1
```

Add:

```ts
import { renderPresentation } from '../../apps/slides/templates/registry.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'
```

Keep `briefSchema` parsing.

- [ ] **Step 2: Preserve existing eligibility and URL construction**

Keep:

```ts
if (!brief.presentation.enabled || brief.status !== 'published') continue
```

Compute:

```ts
const readingUrl = `${joinBasePath(siteBase, 'briefs', slug)}/`
const descriptor = toBriefPresentationDescriptor(brief, { slug, readingUrl })
```

- [ ] **Step 3: Replace the template switch with one registry call**

Write:

```ts
await writeFile(
  resolve(directory, 'slides.md'),
  renderPresentation(descriptor, { siteBase }),
  'utf8',
)
```

Delete the whole `switch (brief.presentation.template)` block.

- [ ] **Step 4: Log from the Descriptor**

Use:

```ts
console.log(`Generated Slidev deck: ${descriptor.slug} (${descriptor.template})`)
```

Keep the zero-generated failure unchanged.

- [ ] **Step 5: Run the focused presentation-platform test again**

Expected: PASS.

---

### Task 5: Verify full repository behavior and finish the PR

**Files:**
- Review all changed files.

**Interfaces:**
- Consumes: GitHub Actions `build-preview`, workflow artifact, trusted preview publisher.
- Produces: a review-ready Plan 20A PR with RED/GREEN evidence and no behavior regression.

- [ ] **Step 1: Push the GREEN implementation and inspect `build-preview`**

Expected full `pnpm build` success including:

```text
@orbis/content-schema test
presentation-platform test
content:validate
multi-presentation integration
generate:slides
Astro build
Slidev build × N
assemble
site-check
artifact upload
```

- [ ] **Step 2: Verify existing Daily/N>1 contracts remain green**

The existing multi-presentation integration must still prove:

- at least two published Daily decks build together;
- independent `/slides/<slug>/` base paths;
- future Daily stable/latest/archive promotion;
- non-public Brief exclusion;
- cleanup of ephemeral sources/artifacts.

The existing Daily 11-slide assertion must remain unchanged and pass.

- [ ] **Step 3: Inspect the PR diff for scope leakage**

Expected changed surface only:

```text
apps/slides/presentation.ts
apps/slides/templates/registry.ts
tools/generate-slides/brief-source.ts
tools/generate-slides/index.ts
tools/generate-slides/presentation-platform.test.ts
package.json
docs/superpowers/specs/2026-08-31-presentation-platform-registry-design.md
docs/superpowers/plans/2026-08-31-presentation-platform-registry.md
```

No changes under `content/**`, Astro pages, workflows, generated source, `dist/**`, or `apps/slides/templates/daily-v1.ts`.

- [ ] **Step 4: Verify trusted public Preview**

The trusted publisher must rebuild/publish the read-only PR artifact and pass its public availability smoke before posting the Preview URL.

Smoke at least:

```text
/
/slides/
/slides/2026-08-28/
/briefs/2026-08-28/
```

- [ ] **Step 5: Finalize PR metadata**

Use title:

```text
refactor: introduce presentation registry and descriptor
```

PR body records:

- Plan 20A scope and explicit 20B deferrals;
- Descriptor/Registry architecture;
- RED workflow run and failure reason;
- GREEN workflow run and full build evidence;
- trusted Preview URL/evidence;
- exact changed-file scope;
- statement that merge is separate and Plan 20B starts only after merge.

Do not merge automatically.