# Plan 40B — Registry-backed Content UI Design

> Status: Approved; stacked implementation on final Plan 40A head
> Date: 2026-09-01
> Roadmap: Plan 40 / Milestone D — Knowledge Identity
> Depends on: `docs/superpowers/specs/2026-09-01-source-author-registry-integrity-design.md`
> Merge order: Plan 40A PR #15 first, then retarget this PR to `main`

## 1. Purpose

Plan 40B makes the identity and integrity work from Plan 40A visible on Orbis reading pages.

The registries remain build-time content metadata. This slice does not create a Source or Author browsing product. Instead, existing Essay, Brief and Knowledge pages resolve stable IDs and render human-readable Author and Source information inline.

The outcome is:

```text
Essay authors[]
    -> Author Registry
    -> display name + optional external profile + archived state

Reference.source
    -> Source Registry
    -> source name + homepage + type + trust tier + archived state
```

Plan 40B must consume, not redefine, the canonical IDs and referential-integrity rules established by Plan 40A.

## 2. Approved product decisions

1. No `/sources/`, `/sources/:id/`, `/authors/` or `/authors/:id/` routes are introduced.
2. Author metadata is displayed as an Essay byline.
3. Source metadata is displayed inside existing Reference lists.
4. A Reference without `source` remains valid and renders exactly as an unsourced Reference.
5. An Author without `url` renders as text rather than a dead or synthetic link.
6. Source links point to the Registry `homepage`; Author links point to the optional Registry `url`.
7. Archived Source and Author identities remain renderable and expose an explicit archived marker.
8. Source and Author aliases are not shown and are not used for runtime resolution.
9. Slidev output, RSS payloads, Archive cards, Topic cards and Related Content ranking remain unchanged.
10. Registry resolution happens during Astro build; no client-side fetch, API or hydration is added.

## 3. Target architecture

```text
content/sources/*.yaml        content/authors/*.yaml
          |                             |
          +-------- Astro collections --+
                         |
              content-registry helper
                 |                 |
          AuthorByline       ReferenceList
                 |                 |
             Essay page      Brief / Essay / Knowledge
```

The Web layer uses small, explicit units:

- `apps/web/src/lib/content-registry.ts` builds deterministic indexes and resolves IDs;
- `apps/web/src/components/AuthorByline.astro` owns Author presentation;
- `apps/web/src/components/ReferenceList.astro` owns Reference + Source presentation;
- existing pages/components provide already validated content and Registry collections.

No component reads generated files. No Registry data is copied into page-specific manifests.

## 4. Registry resolution helper

`apps/web/src/lib/content-registry.ts` exposes pure build-time helpers over Astro collection entries.

Representative interfaces:

```ts
import type { CollectionEntry } from 'astro:content'

export type ResolvedAuthor = {
  id: string
  name: string
  status: 'active' | 'archived'
  url?: string
  bio?: string
}

export type ResolvedSource = {
  id: string
  name: string
  homepage: string
  type: 'official' | 'publisher' | 'individual' | 'community' | 'aggregator'
  trustTier: 'primary' | 'secondary' | 'discovery'
  status: 'active' | 'archived'
}

export function buildAuthorIndex(
  entries: CollectionEntry<'authors'>[],
): ReadonlyMap<string, ResolvedAuthor>

export function buildSourceIndex(
  entries: CollectionEntry<'sources'>[],
): ReadonlyMap<string, ResolvedSource>

export function resolveAuthors(
  ids: string[],
  index: ReadonlyMap<string, ResolvedAuthor>,
): ResolvedAuthor[]

export function resolveReferenceSource(
  sourceId: string | undefined,
  index: ReadonlyMap<string, ResolvedSource>,
): ResolvedSource | undefined
```

Plan 40A should already prevent missing relations. The Web helper nevertheless fails explicitly when called with an unknown declared ID so direct `pnpm build:web` runs do not silently degrade:

```text
Unknown author ID in Web registry resolution: <id>
Unknown source ID in Web registry resolution: <id>
```

An omitted `Reference.source` returns `undefined` and does not fail.

## 5. Essay Author byline

`AuthorByline.astro` receives resolved authors rather than raw IDs.

Target semantics:

```html
<p class="author-byline" data-author-count="1">
  <span>By</span>
  <a
    data-author-id="xiaodaojiang"
    data-author-status="active"
    href="https://github.com/XiaoDaoJiang"
  >XiaoDaoJiang</a>
</p>
```

For an Author without `url`:

```html
<span data-author-id="internal-editor" data-author-status="active">
  Internal Editor
</span>
```

For an archived Author, the visible name remains and an `archived` label is appended. Historical Essays do not lose their byline.

Multiple Authors preserve the order declared by `essay.authors[]`. The Registry does not reorder authors alphabetically.

The byline is placed in the Essay article header after the description and before Topic pills. It is not added to Brief or Knowledge pages because those content models do not currently declare authors.

## 6. Shared Reference list

`ReferenceList.astro` replaces repeated inline Reference markup on Astro reading surfaces.

Props include:

```ts
interface Props {
  references: Array<{
    title: string
    url: string
    source?: string
    supports: string
    accessedAt?: string
  }>
  sourceIndex: ReadonlyMap<string, ResolvedSource>
}
```

Each item always renders the material itself:

```html
<li>
  <a href="https://docs.github.com/...">GitHub Pages custom workflows</a>
  <span>— Supports the Pages build contract.</span>
</li>
```

When `source` is declared, the same item also renders Registry metadata:

```html
<li
  data-source-id="github"
  data-source-type="official"
  data-trust-tier="primary"
  data-source-status="active"
>
  <a href="https://docs.github.com/...">GitHub Pages custom workflows</a>
  <span>— Supports the Pages build contract.</span>
  <small class="reference-source">
    Source:
    <a href="https://github.com/">GitHub</a>
    · official · primary
  </small>
</li>
```

An archived Source adds a visible `archived` marker and retains its homepage link.

A source-less Reference must not receive synthetic `data-source-*` attributes, an inferred source name or a homepage link.

`accessedAt`, when present, may be shown as a compact `accessed YYYY-MM-DD` suffix. This field remains secondary to title, support statement and Source identity.

## 7. Reading surfaces covered

### 7.1 Briefs

`apps/web/src/pages/briefs/[id].astro` loads the Source collection during the static build and passes the resulting index to the cadence-specific body component.

The following components replace their top-level inline Reference list with `ReferenceList`:

- `DailyBriefBody.astro`;
- `WeeklyBriefBody.astro`;
- `AdHocBriefBody.astro`.

Plan 40B does not redesign the cadence-specific body, section ordering, Previous/Next or Related Content.

Section-level References are not newly exposed on Astro pages in this slice. They continue to support facts and Slide rendering, and Plan 40A validates their Source IDs. Adding section citation UI is a separate presentation-density decision.

### 7.2 Essays

`apps/web/src/pages/essays/[id].astro`:

- loads Author and Source Registry entries;
- resolves `entry.data.authors` in declared order;
- renders `AuthorByline` in the header;
- renders the frontmatter Reference list after the Markdown body only when non-empty;
- preserves Related Content.

### 7.3 Knowledge

`apps/web/src/pages/knowledge/[id].astro` renders its frontmatter References after the Markdown body only when non-empty. Knowledge receives no Author byline because its Schema has no `authors` field.

### 7.4 Standalone Presentations and Slidev

Standalone Presentations have no Astro reading detail route, so no Source UI is added for them.

`daily-v1`, `weekly-v1` and `talk-v1` continue rendering Reference title, URL and support text exactly through their current template contracts. They do not load Astro collections or receive embedded Registry snapshots.

## 8. Styling and accessibility

Use small additions to `apps/web/src/styles/global.css`:

- `.author-byline`;
- `.author-status`;
- `.reference-source`;
- `.registry-status` if a shared archived label is useful.

The design uses existing typography, link and muted-text tokens. It introduces no new design system or JavaScript.

Accessibility requirements:

- linked Author and Source names remain meaningful without surrounding labels;
- unlinked Authors use text, not an anchor without `href`;
- `archived` is visible text, not color-only status;
- list semantics remain `<ol><li>`;
- external links are ordinary links and do not force a new tab.

## 9. Archived entities

Archived Registry state is an editorial lifecycle marker, not a broken identity.

Web behavior:

- archived Author name still renders;
- archived Author profile link still renders when present;
- archived Source homepage link still renders;
- an explicit `archived` marker is visible;
- no content is hidden because a related Registry entity is archived.

Plan 40B does not warn authors or editors about choosing an archived entity. That remains an authoring-governance concern.

## 10. Error handling

Plan 40A's `pnpm content:validate` is the primary integrity gate. Plan 40B adds defense-in-depth at the Web resolver boundary.

Build failure is preferred to silent fallback for a declared but missing ID. The UI must not display the raw ID as though it were a human name.

Expected failures:

```text
Essay authors: [missing-author]
  -> content:validate fails in Plan 40A
  -> direct build:web also throws explicit unknown-author resolution error

Reference source: missing-source
  -> content:validate fails in Plan 40A
  -> direct build:web also throws explicit unknown-source resolution error
```

Source-less References remain the only intentional no-resolution path.

## 11. TDD and acceptance

Plan 40B uses two focused RED stages.

### RED 1 — Web Registry consumption capability missing

Add a focused contract for the pure resolver and component boundaries before the helper/components exist. Existing Plan 40A and publishing contracts remain green, then the new contract fails at the missing Web helper.

### GREEN 1 — Helper and shared components

Implement the pure resolver, `AuthorByline` and `ReferenceList` without wiring reading routes yet. Unit contracts cover:

- active linked Author;
- active unlinked Author;
- archived Author;
- declared active Source;
- declared archived Source;
- omitted Source;
- unknown Author and Source failures;
- duplicate Web index IDs;
- declared author order preservation.

### RED 2 — Registry metadata not rendered

Add build-artifact and temporary-fixture assertions for:

- the real Essay Author ID resolving to `XiaoDaoJiang` and its profile URL;
- the real Daily Reference source IDs resolving to Registry names and trust metadata;
- source-less References remaining free of fake Source metadata;
- archived Author/Source visible rendering;
- direct `build:web` unknown Author/Source failures;
- no `/sources/` or `/authors/` routes.

Before route integration, these contracts fail because pages still render no Author byline or Source metadata.

### GREEN 2 — Reading surface integration

Wire Brief, Essay and Knowledge reading pages to the helper/components and make all fixture/artifact contracts pass.

### Final full-build acceptance

A fresh `pnpm build` must prove:

- Daily, Weekly and Talk still generate/build;
- Daily stays 11 slides;
- Weekly stays within its 7..11 contract;
- `/latest/`, date aliases and `archive.json` remain Daily-only;
- RSS remains Reading-URL based;
- Essay displays Registry-backed Author metadata;
- declared Web References display Registry-backed Source metadata;
- unsourced References render without fabricated metadata;
- archived entity rendering is covered by a real temporary build fixture;
- direct `build:web` fails explicitly for missing Author/Source IDs;
- no Registry routes exist;
- no generated source or `dist/**` is committed.

## 12. Expected file scope

Expected production changes:

```text
apps/web/src/lib/content-registry.ts
apps/web/src/components/AuthorByline.astro
apps/web/src/components/ReferenceList.astro
apps/web/src/pages/briefs/[id].astro
apps/web/src/components/briefs/DailyBriefBody.astro
apps/web/src/components/briefs/WeeklyBriefBody.astro
apps/web/src/components/briefs/AdHocBriefBody.astro
apps/web/src/pages/essays/[id].astro
apps/web/src/pages/knowledge/[id].astro
apps/web/src/styles/global.css
```

Expected tests/documentation:

```text
tools/registry-ui-check/content-registry.test.ts
tools/registry-ui-check/fixture-build.test.ts
tools/registry-ui-check/index.ts
package.json
docs/superpowers/plans/2026-09-01-registry-backed-content-ui.md
```

No changes are expected in Registry schemas, referential-integrity rules, content IDs, Slide templates, Presentation generation/build, assembly, RSS implementation, Archive/Topic product code, workflows or generated output.

## 13. Non-goals

Plan 40B does not implement:

- Source/Author directory or detail pages;
- reverse aggregation such as “all content by Source/Author”;
- filtering Archive by Author/Source;
- Source badges in Slidev output;
- Author metadata for content models that do not declare authors;
- automatic Source inference from URL hosts;
- alias-based lookup;
- JSON-LD, OpenGraph author tags or citation schema — these belong to Plan 50;
- client-side registry fetch or hydration;
- database, API or CMS support.

## 14. Exit criteria

Plan 40B is complete when:

1. Essay Author IDs resolve into names, optional links and archived state.
2. Declared Reference Source IDs resolve into name, homepage, type, trust tier and archived state.
3. Source-less References preserve the existing rendering path.
4. Brief, Essay and Knowledge pages share one Reference component.
5. Missing declared IDs fail explicitly rather than degrading to raw strings.
6. No Source/Author public routes or reverse indexes are introduced.
7. Existing discovery, RSS, Presentation and Daily-stable-route behavior remains green.
8. Plan 40 is ready to be marked Done after both 40A and 40B merge and receive public Preview verification.
