# Cross-content Navigation & Related Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Plan 10B by adding Daily Previous/Next navigation, deterministic Topic-related content, conditional Reading → Slides links, and Slidev → Reading backlinks without changing Orbis content architecture.

**Architecture:** Extend the existing `apps/web/src/lib/content-discovery.ts` projection with pure relation queries. Astro pages query structured collections at build time and render small reusable navigation components; the Slide Generator computes a base-path-safe reading URL and passes it into `daily-v1`, which keeps the exact 11-slide contract.

**Tech Stack:** Astro 5, Astro Content Collections, TypeScript, Slidev 52, pnpm, Node assert-based artifact checks, existing multi-presentation integration fixture.

**Spec:** `docs/superpowers/specs/2026-08-31-cross-content-navigation-design.md`

## Global Constraints

- Baseline is `main@f756822cd901ae680a6a37ae44a57df872e0cd44`.
- `content/**` remains the only publishable Source of Truth.
- Relations are computed at build time; do not add a relationship manifest, database, CMS, server API, search service or recommendation service.
- Do not modify `packages/content-schema/**` in this PR.
- Do not redesign homepage/index discovery routes in this PR.
- Do not introduce Presentation Registry, `content/presentations/**`, `talk-v1`, `weekly-v1` or Weekly-specific schema semantics.
- `daily-v1` remains exactly 11 slides.
- Generated Slidev sources, generated HTML and `dist/**` remain uncommitted.
- Final validation is the existing top-level `pnpm build`, read-only PR Build, Trusted Preview Publish and public Preview verification.

---

### Task 1: Add the RED navigation contract

**Files:**
- Modify: `tools/site-check/index.ts`

**Interfaces:**
- Consumes: parsed published Briefs plus assembled reading pages and generated `daily-v1` sources.
- Produces: a failing build before implementation when relation navigation and Reading backlinks are absent.

- [ ] **Step 1: Require Reading → Slides and Slides → Reading behavior**

For every published Brief, read `dist/site/briefs/<slug>/index.html`.

For `presentation.enabled === true`, assert it contains the configured presentation URL:

```ts
const presentationHref = `${joinBasePath(siteBase, config.presentation.publicPath, slug)}/`
assert.ok(briefHtml.includes(presentationHref), `${slug} reading page must link to ${presentationHref}`)
```

For `presentation.enabled === false`, assert the reading page does not contain that presentation URL.

For every generated `daily-v1` source, require the stable reading URL:

```ts
const readingHref = `${joinBasePath(siteBase, 'briefs', slug)}/`
assert.ok(slideSource.includes(readingHref), `${slug} daily-v1 must link back to ${readingHref}`)
```

Keep the existing exact 11-slide marker assertion.

- [ ] **Step 2: Require Related Content behavior for current public fixtures**

Read the current published Brief, Essay and Knowledge page HTML and assert:

```ts
assert.match(html, /Related Content/i)
```

For each current page, assert its own title is not present inside the Related Content section by checking explicit relation markers introduced by the implementation contract, such as `data-related-id="<kind>:<id>"`.

Require at least one cross-type related candidate when shared Topics exist in the current repository fixtures.

- [ ] **Step 3: Require Daily adjacency behavior**

Derive all public Daily Briefs sorted by `publishedAt` ascending. For each reading page:

- if an earlier Daily exists, require a `data-adjacent="previous"` link to it;
- otherwise require no previous marker;
- if a later Daily exists, require a `data-adjacent="next"` link to it;
- otherwise require no next marker.

This must remain content-driven and must not hard-code the current date or slug.

- [ ] **Step 4: Open a draft PR with only the RED contract**

Expected `build-preview`: foundations pass and the final `pnpm build` fails because the current pages/templates do not yet expose Related, adjacency or Slide → Reading behavior.

Confirm the failure reason from Actions logs before production implementation.

---

### Task 2: Add pure relation queries

**Files:**
- Modify: `apps/web/src/lib/content-discovery.ts`

**Interfaces:**
- Consumes: existing `DiscoveryItem` values and Astro Brief collection entries.
- Produces:
  - `DiscoveryIdentity`
  - `AdjacentContent`
  - `getDailyAdjacency(entries, currentId, base)`
  - `getRelatedContent(current, candidates, limit?)`
  - `buildPublicDiscoveryItems(briefs, essays, knowledge, base)`

- [ ] **Step 1: Add identity and shared candidate builder**

Use:

```ts
export type DiscoveryIdentity = Pick<DiscoveryItem, 'kind' | 'id'>

export function buildPublicDiscoveryItems(
  briefs: CollectionEntry<'briefs'>[],
  essays: CollectionEntry<'essays'>[],
  knowledge: CollectionEntry<'knowledge'>[],
  base: string,
): DiscoveryItem[]
```

The builder filters using existing public visibility helpers and normalizes all three types. It must not include Presentation as a separate entity.

- [ ] **Step 2: Implement deterministic Related ranking**

Use:

```ts
export function getRelatedContent(
  current: DiscoveryItem,
  candidates: DiscoveryItem[],
  limit = 3,
): DiscoveryItem[]
```

Algorithm:

```text
exclude same kind + id
compute shared Topic count
exclude zero-overlap candidates
sort shared count desc
sort publishedAt desc
sort title asc
sort kind asc
sort id asc
slice 0..limit
```

Return `[]` when `limit <= 0`.

- [ ] **Step 3: Implement Daily adjacency**

Use:

```ts
export type AdjacentContent = {
  previous?: DiscoveryItem
  next?: DiscoveryItem
}

export function getDailyAdjacency(
  entries: CollectionEntry<'briefs'>[],
  currentId: string,
  base: string,
): AdjacentContent
```

Filter to public Daily Briefs, sort ascending by `publishedAt`, then title, then ID. Return immediate neighbors only.

---

### Task 3: Add reusable Astro relation components

**Files:**
- Create: `apps/web/src/components/AdjacentContentNav.astro`
- Create: `apps/web/src/components/RelatedContent.astro`
- Modify: `apps/web/src/styles/global.css`

**Interfaces:**
- `AdjacentContentNav` consumes `{ previous?: DiscoveryItem; next?: DiscoveryItem }`.
- `RelatedContent` consumes `{ items: DiscoveryItem[] }`.

- [ ] **Step 1: Implement `AdjacentContentNav.astro`**

Render nothing when both sides are absent. Otherwise render a navigation container with machine-checkable markers:

```html
<a data-adjacent="previous" ...>Previous ...</a>
<a data-adjacent="next" ...>Next ...</a>
```

Each rendered side shows label, date and title.

- [ ] **Step 2: Implement `RelatedContent.astro`**

Render nothing for an empty array. Otherwise render heading `Related Content` and each item with:

```html
data-related-id={`${item.kind}:${item.id}`}
```

Show kind, date and title with the normalized `href`.

- [ ] **Step 3: Add focused styles**

Add `.adjacent-nav`, `.adjacent-link`, `.related-content`, and `.related-grid` styles using existing tokens. Do not alter global typography or index-page layout.

---

### Task 4: Integrate relations into reading pages

**Files:**
- Modify: `apps/web/src/pages/briefs/[id].astro`
- Modify: `apps/web/src/pages/essays/[id].astro`
- Modify: `apps/web/src/pages/knowledge/[id].astro`

**Interfaces:**
- Consumes: `buildPublicDiscoveryItems`, `getRelatedContent`, `getDailyAdjacency`, normalized item constructors and relation components.
- Produces: relation-aware public reading pages.

- [ ] **Step 1: Update Brief static-path props with public relation data**

Inside `getStaticPaths`, load Brief/Essay/Knowledge collections once, build public discovery candidates, and for every public Brief compute:

```ts
const current = toBriefDiscoveryItem(entry, base)
const related = getRelatedContent(current, candidates)
const adjacent = entry.data.cadence === 'daily'
  ? getDailyAdjacency(briefEntries, entry.id, base)
  : {}
```

Pass `entry`, `related`, and `adjacent` as props.

- [ ] **Step 2: Make Brief → Slides conditional**

Render the existing presentation link only when `entry.data.presentation.enabled` is true.

- [ ] **Step 3: Render adjacency and Related on Brief pages**

Place Daily adjacency after the article header/body and Related Content below the article body. Weekly/ad-hoc pages may render Related but never adjacency.

- [ ] **Step 4: Add Related Content to Essay pages**

Load the same public candidate pool in `getStaticPaths`, normalize the current Essay, compute `getRelatedContent`, pass it as props and render `RelatedContent` after the body.

- [ ] **Step 5: Add Related Content to Knowledge pages**

Use the same flow for public Knowledge pages, preserving `published || active` visibility.

---

### Task 5: Add Slidev → Reading backlinks

**Files:**
- Modify: `apps/slides/templates/daily-v1.ts`
- Modify: `tools/generate-slides/index.ts`

**Interfaces:**
- Generator produces `{ siteBase, readingHref }`.
- `renderDailyV1(brief, context)` consumes that context.

- [ ] **Step 1: Change the daily-v1 render signature**

Add:

```ts
export type DailyV1RenderContext = {
  siteBase: string
  readingHref: string
}

export function renderDailyV1(brief: DailyBrief, context: DailyV1RenderContext)
```

Use `context.siteBase` for favicon generation.

- [ ] **Step 2: Add Reading links without changing slide count**

On the existing Cover slide add:

```md
[阅读版 ↗](<readingHref>)
```

On the existing final Extended Reading slide add:

```md
[返回阅读版 ↗](<readingHref>)
```

Do not add or split slides. The generated source must still contain exactly 22 `---` markers for 11 slides.

- [ ] **Step 3: Compute reading URL in the generator**

Import `joinBasePath` and construct:

```ts
const readingHref = `${joinBasePath(siteBase, 'briefs', slug)}/`
```

Call:

```ts
renderDailyV1(daily, { siteBase, readingHref })
```

---

### Task 6: Extend integration boundaries and verify GREEN

**Files:**
- Modify: `tools/multi-presentation-check/index.ts` only if required for relation-boundary verification.
- Modify: `tools/site-check/index.ts` as needed to keep all checks content-driven.

**Interfaces:**
- Consumes: the existing temporary second published Daily fixture.
- Produces: proof of 1-item and 2-item Daily adjacency plus relation/public-visibility correctness.

- [ ] **Step 1: Reuse the current future Daily fixture for adjacency N=2**

During the integration build assert:

```text
seed Daily: no previous, next -> future fixture
future fixture: previous -> seed, no next
```

Use actual slugs and generated site base, never literal production paths.

- [ ] **Step 2: Verify relation self-exclusion**

For every public reading page that has a Related block, require that its own `kind:id` marker does not appear as a related item.

- [ ] **Step 3: Verify non-public exclusion without committed fixtures**

If the existing repository has no non-public overlapping fixture, extend `multi-presentation-check` to temporarily create a `needs-review` Brief with the same Topics as the seed, build the site, and assert its title/ID is absent from reading pages and Related markers. Remove it in the existing `finally` cleanup.

- [ ] **Step 4: Run the full build in the PR Actions environment**

Expected: `pnpm build` passes schema/content validation, multi-presentation integration, Astro, Slidev, assembly and final site-check.

- [ ] **Step 5: Inspect scope**

Compare against `main@f756822cd901ae680a6a37ae44a57df872e0cd44`. Confirm no changes under `content/**`, `packages/content-schema/**`, workflows, homepage, generated source or `dist/**`.

---

### Task 7: Trusted Preview and merge gate

**Files:**
- Review PR metadata and Preview artifact only.

**Interfaces:**
- Consumes: successful `build-preview` artifact.
- Produces: a review-ready PR with public navigation verification.

- [ ] **Step 1: Verify Trusted Preview Publish**

Require the trusted workflow to download the latest read-only artifact and publish `preview-pr-<PR>` successfully.

- [ ] **Step 2: Verify published Preview content**

Confirm the published Preview branch contains and semantically exposes:

```text
/briefs/<current>/        Reading -> Slides, Related, boundary adjacency
/essays/<current>/        Related
/knowledge/<current>/     Related
/slides/<current>/        generated source/deck with Reading backlink contract
```

- [ ] **Step 3: Update PR body with RED/GREEN and Preview evidence**

Use title:

```text
feat: add cross-content navigation and related content
```

Record the failing RED run, final successful build run, artifact ID/digest, trusted publish run and scope comparison.

- [ ] **Step 4: Stop at merge decision**

Do not merge automatically. Report whether the verified PR is suitable to merge; the user makes the merge decision.
