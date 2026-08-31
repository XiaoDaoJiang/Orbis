# Archive & Discovery Indexes Design

> Status: Approved design for Plan 10A implementation
> Baseline: `main@d2f0235587c01558ced1492225c4e376bfb20c22`
> Branch: `feat/archive-discovery-indexes`

## Goal

Deliver the first small, independently shippable slice of Plan 10 by making existing structured content discoverable through stable Archive, Slides, Daily Brief and Weekly Brief indexes without changing the Orbis publishing architecture.

## Scope

This change adds:

- `/archive/`
- `/slides/`
- `/briefs/daily/`
- `/briefs/weekly/`
- shared public-content visibility, sorting and filtering helpers inside `apps/web`
- discovery navigation from the existing Briefs and site navigation surfaces
- public visibility filtering for Topic aggregation
- build artifact checks for the new stable routes and key empty/non-empty states

`/briefs/weekly/` is a real stable route even when no published Weekly Brief exists. Its first version renders an explicit empty state rather than returning 404.

## Explicit Non-goals

This PR does not implement:

- Previous / Next navigation
- Related Content blocks on individual Brief, Essay or Knowledge pages
- Slide → Reading navigation
- homepage information architecture redesign
- independent `content/presentations/**`
- Template Registry
- `talk-v1` or `weekly-v1` implementation
- Weekly-specific schema semantics
- search service, database, CMS or server-side API
- any legacy/migration compatibility behavior

Those capabilities remain in Plan 10B/10C or later roadmap milestones.

## Architecture Boundary

The steady-state publishing graph remains unchanged:

```text
content/**
  -> @orbis/content-schema
  -> Astro + RSS
  -> Slide Generator
  -> Slidev
  -> assemble-site
  -> dist/site
```

The new discovery layer is an Astro build-time projection over the existing content collections. It must not read generated Slidev sources, `dist/**`, `archive.json`, or a new hand-maintained manifest as its source of truth.

## Public Content Rules

The Web application owns public visibility policy because visibility in indexes is a product/query concern, not a content-format contract.

First-version rules:

- Essay is public when `status === 'published'`.
- Brief is public when `status === 'published'`.
- Knowledge is public when `status === 'published' || status === 'active'`.
- Topic is public when `status !== 'archived'`.
- A presentation is discoverable when its Brief is public and `presentation.enabled === true`.

These rules should be represented once in `apps/web/src/lib/content-discovery.ts` and reused by new indexes and Topic aggregation where applicable.

## Discovery Item Model

The Web application should normalize public entries to a small presentation-neutral discovery shape rather than exposing raw Astro collection entries to every page.

Conceptually:

```ts
type DiscoveryKind = 'brief' | 'essay' | 'knowledge'

type DiscoveryItem = {
  id: string
  kind: DiscoveryKind
  title: string
  summary: string
  publishedAt: string
  topics: string[]
  href: string
  cadence?: 'daily' | 'weekly' | 'ad-hoc'
  presentationHref?: string
}
```

The exact implementation may use focused helper functions rather than one universal constructor, but all new pages must share the same visibility and descending-date ordering rules.

## Route Design

### `/archive/`

Purpose: human-facing cross-content history.

It lists public Briefs, Essays and Knowledge entries in descending publication date order.

Each card exposes enough metadata for discovery:

- content type
- publication date
- title
- summary
- topics
- cadence for Briefs
- reading link
- presentation link only when a presentation exists

The first version supports lightweight client-side filtering over already-rendered static HTML by:

- content type
- Brief cadence
- Topic

No client framework is introduced. Filtering should progressively enhance the static list: with JavaScript disabled, all public entries remain visible and usable.

### `/slides/`

Purpose: presentation discovery index.

It derives entries only from public Briefs with `presentation.enabled === true`, sorted newest first. Each entry links to the presentation and exposes the corresponding reading link.

This route intentionally models only presentations that actually exist today. It does not anticipate the Plan 20 Presentation Registry in code.

### `/briefs/daily/`

Purpose: stable Daily Brief discovery route.

It contains only public Briefs with `cadence === 'daily'`, sorted newest first.

### `/briefs/weekly/`

Purpose: stable Weekly Brief discovery route.

It contains only public Briefs with `cadence === 'weekly'`, sorted newest first. When the collection is empty, render a clear product empty state explaining that no Weekly Brief has been published yet.

### `/briefs/`

The existing Brief index remains the all-cadence index and gains visible entry points to Daily and Weekly sub-indexes.

## Navigation

The global site navigation gains direct access to Archive and Slides while preserving existing Essays, Briefs, Topics, Knowledge and RSS access.

This is a navigation addition only; the full homepage discovery redesign is deferred to Plan 10C.

## Topic Aggregation Correction

The current Topic detail page matches raw Essay, Brief and Knowledge collections by topic without applying public-status filtering.

This PR changes Topic aggregation to consume the same public visibility helpers used by discovery indexes so draft, needs-review and archived/unpublished content cannot leak into a public Topic page.

Related-content ranking is not introduced here.

## Styling

Reuse the existing Orbis `BaseLayout`, global card/grid/pill styles and shared design tokens. Add only small focused styles needed for filter controls and empty states.

Do not introduce a component framework or redesign the existing visual system in this PR.

## Validation Strategy

Validation remains part of the existing top-level `pnpm build` contract.

TDD sequence:

1. Extend final site artifact checks so the expected new routes fail before implementation.
2. Add discovery helpers and routes until those artifact checks pass.
3. Assert the current repository's important boundary states:
   - Archive contains the known published structured content and excludes non-public content.
   - Slides index includes the published presentation.
   - Daily index includes the current Daily Brief.
   - Weekly index exists and renders the empty state when no published Weekly exists.
   - Topic pages do not expose non-public content.
4. Run the full `pnpm build` pipeline.
5. Open a PR and require `build-preview` plus trusted public Preview smoke verification before considering merge.

No generated HTML, generated Slidev source or `dist/**` is committed.

## PR Boundary

Expected PR title:

`feat: add archive and discovery indexes`

The PR is complete when:

- all four stable discovery routes are built from structured content;
- public visibility rules are shared rather than duplicated;
- Topic aggregation respects public visibility;
- `/briefs/` exposes Daily/Weekly discovery paths;
- global navigation exposes Archive and Slides;
- the full repository build passes;
- read-only PR build succeeds;
- trusted public Preview is reachable and the new routes pass HTTP/content smoke checks.

Merge is a separate decision after Preview verification.
