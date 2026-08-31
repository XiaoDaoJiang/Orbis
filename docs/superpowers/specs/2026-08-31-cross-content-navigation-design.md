# Cross-content Navigation & Related Content Design

> Status: Approved design for Plan 10B implementation
> Baseline: `main@f756822cd901ae680a6a37ae44a57df872e0cd44`
> Branch: `feat/cross-content-navigation`
> Roadmap: Plan 10B — Cross-content Navigation & Related Content

## Goal

Complete the second independently shippable slice of Discoverable Orbis by making published content navigable in sequence, discoverable by shared Topic, and bidirectionally connected between Astro reading pages and their Slidev presentation when one exists.

This PR builds on Plan 10A. It does not redesign the homepage and does not begin the Plan 20 Presentation Platform abstraction.

## Scope

This change adds:

- Previous / Next navigation for published Daily Briefs;
- Topic-based Related Content for public Brief, Essay and Knowledge pages;
- conditional Brief → Slides navigation that only renders when `presentation.enabled === true`;
- stable Slidev → Reading links for `daily-v1` decks;
- shared relation-query helpers in `apps/web/src/lib/content-discovery.ts`;
- focused Astro UI components for adjacent and related navigation;
- content-driven artifact checks for zero/one/many relation states and Reading ↔ Slides links.

## Explicit Non-goals

This PR does not implement:

- homepage information architecture redesign;
- `/archive/`, `/slides/`, Daily or Weekly index redesign;
- full-text search or semantic recommendations;
- user-specific recommendations;
- a generated relationship graph or manifest;
- independent `content/presentations/**`;
- Template Registry;
- `talk-v1`;
- `weekly-v1`;
- Weekly-specific semantic schema;
- SEO / Open Graph / Sitemap / JSON-LD;
- database, CMS or server-side API;
- legacy or migration compatibility behavior.

## Architecture Boundary

The publishing graph remains unchanged:

```text
content/**
  -> @orbis/content-schema
  -> Astro + RSS
  -> Slide Generator
  -> Slidev
  -> assemble-site
  -> dist/site
```

Relations are computed at build time from the same structured content collections already used by Plan 10A. No relationship file is committed or generated as a new source of truth.

Astro owns reading-page relation queries and navigation UI. Slidev receives only the reading URL it needs through the existing deterministic generator path. Astro and Slidev still do not share Runtime UI.

## Shared Discovery Identity

A normalized discovery item is identified by both type and ID:

```ts
type DiscoveryIdentity = {
  kind: 'brief' | 'essay' | 'knowledge'
  id: string
}
```

Self-exclusion and relation comparisons use `kind + id`, not only `id`, so future cross-type slug collisions cannot suppress valid related items.

The existing `DiscoveryItem` remains the relation candidate shape and should not gain presentation-platform abstractions.

## Daily Previous / Next

Adjacency is defined only inside the public Daily Brief sequence.

Input:

- public Brief collection;
- current Brief identity.

Rules:

1. Include only entries where `status === 'published'` and `cadence === 'daily'`.
2. Sort deterministically by `publishedAt` ascending for sequence calculation; use stable title / ID tie-break if needed even though duplicate published Daily dates already fail the build.
3. `previous` is the immediately earlier Daily.
4. `next` is the immediately later Daily.
5. The oldest Daily has no `previous`.
6. The newest Daily has no `next`.
7. A single Daily has neither link.
8. Weekly and ad-hoc Briefs never participate in Daily adjacency.

Conceptual API:

```ts
type AdjacentContent = {
  previous?: DiscoveryItem
  next?: DiscoveryItem
}

function getDailyAdjacency(
  entries: CollectionEntry<'briefs'>[],
  currentId: string,
  base: string,
): AdjacentContent
```

The helper returns normalized public items so page code does not reconstruct URLs or visibility rules.

## Related Content

Related Content is intentionally deterministic Topic overlap, not recommendation infrastructure.

### Candidate pool

Candidates are the merged public projections of:

- Briefs where `status === 'published'`;
- Essays where `status === 'published'`;
- Knowledge where `status === 'published' || status === 'active'`.

Presentation is not a separate candidate because it is currently a Brief output mode, not an independent content entity.

### Ranking

For a current `DiscoveryItem`:

1. Exclude the exact current identity using `kind + id`.
2. Exclude candidates with zero shared Topics.
3. Rank by shared Topic count descending.
4. Then rank by `publishedAt` descending.
5. Then by title ascending.
6. Then by `kind` and `id` as final stable tie-breakers.
7. Return at most 3 items.

Conceptual API:

```ts
function getRelatedContent(
  current: DiscoveryItem,
  candidates: DiscoveryItem[],
  limit?: number,
): DiscoveryItem[]
```

Default `limit` is 3.

The function must be pure and deterministic so the ranking can be tested independently of Astro page rendering.

## Astro Page Integration

### Brief reading page

`/briefs/:id/` gains:

- conditional `打开演示版` only when `entry.data.presentation.enabled === true`;
- Previous / Next navigation only for Daily cadence;
- Related Content from the shared candidate pool.

A Weekly or ad-hoc Brief may receive Related Content but does not receive Daily Previous / Next.

### Essay page

`/essays/:id/` gains Related Content after the main body.

### Knowledge page

`/knowledge/:id/` gains Related Content after the main body.

All three page types must use the same public candidate builder and ranking logic.

## Astro UI Components

Use two focused components:

```text
apps/web/src/components/AdjacentContentNav.astro
apps/web/src/components/RelatedContent.astro
```

### `AdjacentContentNav.astro`

Consumes optional normalized `previous` and `next` items.

Behavior:

- render nothing when both are absent;
- render only the side that exists at sequence boundaries;
- label links clearly as Previous / Next;
- show the adjacent content title and date;
- do not contain collection querying logic.

### `RelatedContent.astro`

Consumes a pre-ranked `DiscoveryItem[]`.

Behavior:

- render nothing for an empty array;
- render at most the supplied items;
- show type, date, title and shared-discovery navigation link;
- do not recalculate ranking or visibility.

Components use the existing Orbis global visual system. Only small focused styles may be added.

## Reading → Slides Contract

The current Brief page outputs a Slides link unconditionally. This PR corrects the contract:

```text
presentation.enabled === true  -> render /slides/<id>/
presentation.enabled === false -> no Slides link
```

No filesystem scan is used to determine deck existence. Structured Brief data remains the source of truth.

## Slides → Reading Contract

The Slide Generator already knows the Brief slug and runtime site base, so it is responsible for calculating the stable reading URL:

```text
<siteBase>/briefs/<slug>/
```

`renderDailyV1` should receive a focused render context rather than derive the slug itself:

```ts
type DailyV1RenderContext = {
  siteBase: string
  readingHref: string
}

renderDailyV1(brief, context)
```

The generator constructs `readingHref`; the template only renders it.

### Placement

Do not add a twelfth slide.

The existing `daily-v1` 11-page contract remains exact. Reading navigation is added to natural existing pages:

- Cover: a compact `阅读版 ↗` link;
- final Extended Reading page: a stable `返回阅读版 ↗` link.

The link must use the configured preview/production base path and work identically in PR Preview and GitHub Pages production builds.

## Relation Data Flow

```text
Astro Collections
      ↓
public visibility helpers
      ↓
DiscoveryItem[]
      ├── Daily adjacency query
      └── Topic-overlap related ranking
              ↓
     Astro page components

Brief YAML + slug
      ↓
Slide Generator
      ↓
{ siteBase, readingHref }
      ↓
daily-v1 template
      ↓
11-page Slidev deck with reading links
```

## Testing Strategy

Testing remains part of the repository's existing full `pnpm build` contract.

### RED contract

Before implementation, extend final artifact checks to require:

- enabled Brief reading page contains its presentation URL;
- generated `daily-v1` source contains the correct reading URL;
- Related Content appears for current public fixtures where shared Topics exist;
- a page never lists itself as Related;
- Daily adjacency behavior matches the number of published Daily entries.

The first RED run should fail on missing adjacency / Related / Slide reading-backlink behavior while existing build foundations still pass.

### Normal repository state

The current repository has one published Daily. Verify:

- no Previous / Next links are rendered for that Daily;
- Brief, Essay and Knowledge pages render cross-content Related Content from their shared Topics;
- Brief → Slides exists because the current Daily has presentation enabled;
- generated Slidev source links back to the Brief reading route;
- `daily-v1` still has exactly 11 slides.

### Multi-presentation integration state

The existing ephemeral multi-presentation fixture creates a second published Daily. Reuse it to verify:

- older Daily receives `next` pointing to the future fixture;
- newer fixture receives `previous` pointing to the seed Daily;
- boundary sides that do not exist are absent;
- reading/presentation links remain base-path safe for both decks.

### Non-public relation exclusion

Extend the integration fixture with one ephemeral non-public Brief sharing the same Topics, or add an equivalently isolated deterministic relation test. Verify its title never appears in Related Content or public navigation output.

The preferred implementation is whichever keeps the fixture deterministic and does not require committing content fixtures.

## Artifact Checks

`tools/site-check/index.ts` should remain content-driven. It must not hard-code the current Daily date or title.

Checks derive expectations from parsed structured content and assert:

- public content pages exist;
- presentation-enabled Brief pages link to their Deck;
- presentation-disabled Brief pages do not claim a Deck;
- each generated Daily Deck source contains its correct reading URL;
- Daily adjacency follows the sorted public Daily sequence;
- Related blocks exclude self and non-public candidates;
- Related blocks appear only when valid candidates exist;
- `daily-v1` remains exactly 11 slides.

## Styling

Reuse current `.article`, `.card`, `.pills`, `.link-row` and design tokens.

Add only small classes for:

- adjacent navigation container and directional items;
- Related Content section spacing/grid.

Do not redesign article typography or index pages in this PR.

## Expected Files

Primary implementation surface:

```text
apps/web/src/lib/content-discovery.ts
apps/web/src/components/AdjacentContentNav.astro
apps/web/src/components/RelatedContent.astro
apps/web/src/pages/briefs/[id].astro
apps/web/src/pages/essays/[id].astro
apps/web/src/pages/knowledge/[id].astro
apps/web/src/styles/global.css
apps/slides/templates/daily-v1.ts
tools/generate-slides/index.ts
tools/site-check/index.ts
```

The multi-presentation integration tool may change only if needed to create a deterministic non-public relation fixture.

## PR Boundary

Expected PR title:

`feat: add cross-content navigation and related content`

The PR is complete when:

- Daily Previous / Next follows the defined sequence and boundaries;
- Brief / Essay / Knowledge pages expose deterministic Topic-related content without self or non-public entries;
- Brief → Slides only exists for enabled presentations;
- every generated `daily-v1` Deck exposes a correct Reading backlink;
- the 11-slide contract is unchanged;
- relation checks are content-driven rather than tied to a specific date;
- full `pnpm build` passes;
- read-only PR Build succeeds;
- Trusted Preview Publish succeeds;
- public Preview verifies reading and presentation navigation.

Merge remains a separate decision after review and Preview verification.
