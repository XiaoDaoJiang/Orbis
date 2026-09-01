# Registry-backed Content UI Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and test-driven-development task-by-task.

**Goal:** Resolve canonical Author and Source IDs during Astro builds and render their metadata on existing Essay, Brief and Knowledge reading pages without adding Registry routes or changing Slidev/RSS/discovery semantics.

**Architecture:** A pure Web helper indexes validated Astro Registry collections. `AuthorByline.astro` and `ReferenceList.astro` receive resolved data. Existing static routes load registries once, pass deterministic indexes through props and reuse the shared components. Plan 40A remains the primary integrity gate; Web resolution adds direct-build defense in depth.

**Stacked base:** `feat/source-author-registry-integrity@97056620da87f9f2e939f6f45f07c62185d4c4c1`

**Spec:** `docs/superpowers/specs/2026-09-01-registry-backed-content-ui-design.md`

## Constraints

- Do not change Registry schemas, canonical IDs or referential-integrity rules.
- Do not add `/sources/`, `/authors/` or reverse aggregation.
- Do not change content files, Slide templates, Presentation generation/build, assembly, RSS, Archive, Topic or workflows.
- Keep source-less References valid and free of synthetic metadata.
- Render archived identities with visible text; do not hide historical content.
- Preserve declared Author order.
- Unknown declared IDs must fail direct `build:web` with explicit messages.
- Do not commit `dist/**` or generated Slidev sources.

---

## Task 1 — RED 1: require the Web Registry consumption boundary

**Files**
- Create: `tools/registry-ui-check/content-registry.test.ts`
- Modify: `package.json`

- [ ] Create a dynamic-import contract that fails intentionally before `apps/web/src/lib/content-registry.ts` exists.
- [ ] Require `AuthorByline.astro` and `ReferenceList.astro` paths to exist.
- [ ] Once the module exists, exercise:
  - author/source index construction;
  - declared order preservation;
  - active and archived metadata preservation;
  - optional Author URL;
  - omitted Reference Source returning `undefined`;
  - explicit unknown Author/Source errors;
  - duplicate Web index IDs failing explicitly.
- [ ] Add `test:registry-ui-contract` to `package.json` and append it after Plan 40A Registry tests in `validate`.
- [ ] Open a Draft stacked PR against `feat/source-author-registry-integrity`.
- [ ] Record a read-only build that passes Plan 40A and fails exactly because the Web helper is missing.

Expected RED marker:

```text
Web content registry helper must exist
```

---

## Task 2 — GREEN 1: implement the pure resolver and shared components

**Files**
- Create: `apps/web/src/lib/content-registry.ts`
- Create: `apps/web/src/components/AuthorByline.astro`
- Create: `apps/web/src/components/ReferenceList.astro`
- Modify: `tools/registry-ui-check/content-registry.test.ts`

### Helper contract

Implement:

```ts
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

export function buildAuthorIndex(entries: CollectionEntry<'authors'>[]): ReadonlyMap<string, ResolvedAuthor>
export function buildSourceIndex(entries: CollectionEntry<'sources'>[]): ReadonlyMap<string, ResolvedSource>
export function resolveAuthors(ids: string[], index: ReadonlyMap<string, ResolvedAuthor>): ResolvedAuthor[]
export function resolveReferenceSource(id: string | undefined, index: ReadonlyMap<string, ResolvedSource>): ResolvedSource | undefined
```

Required failures:

```text
Duplicate author ID in Web registry resolution: <id>
Duplicate source ID in Web registry resolution: <id>
Unknown author ID in Web registry resolution: <id>
Unknown source ID in Web registry resolution: <id>
```

### Components

`AuthorByline.astro`:
- receives `ResolvedAuthor[]`;
- outputs `data-author-count`;
- emits `data-author-id` and `data-author-status` on each linked/unlinked author;
- links only when `url` exists;
- appends visible `archived` text;
- preserves input order.

`ReferenceList.astro`:
- receives references and `sourceIndex`;
- always renders title URL + support statement;
- resolves declared Source through the helper;
- emits `data-source-id`, `data-source-type`, `data-trust-tier`, `data-source-status` only when Source exists;
- links Source name to Registry homepage;
- appends visible archived marker;
- optionally displays `accessedAt`;
- does not infer Source for unsourced references.

- [ ] Run `pnpm test:registry-ui-contract` and make it pass before touching reading routes.
- [ ] Run `pnpm build:web`; existing pages must remain green but UI output is still unchanged.
- [ ] Commit the helper/components checkpoint.

---

## Task 3 — RED 2: require actual UI integration and direct-build defense

**Files**
- Create: `tools/registry-ui-check/fixture-build.test.ts`
- Create: `tools/registry-ui-check/index.ts`
- Modify: `package.json`

### Temporary fixture build contract

Create and clean in `finally`:

```text
content/sources/zz-orbis-archived-ui-source.yaml
content/authors/zz-orbis-archived-ui-author.yaml
content/essays/zz-orbis-archived-ui-check.md
```

The Essay is published, uses the archived unlinked Author and has one Reference using the archived Source plus one unsourced Reference.

Run direct `pnpm build:web` and require generated HTML to contain:

```text
data-author-id="zz-orbis-archived-ui-author"
data-author-status="archived"
data-source-id="zz-orbis-archived-ui-source"
data-source-status="archived"
visible archived text
the unsourced material without synthetic source metadata
```

Then run two defense-in-depth variants:

1. remove the Author Registry file while keeping the Essay and require direct build failure:
   `Unknown author ID in Web registry resolution: zz-orbis-archived-ui-author`;
2. restore Author, remove Source and require direct build failure:
   `Unknown source ID in Web registry resolution: zz-orbis-archived-ui-source`.

Always clean fixtures and `dist/web`.

### Real artifact contract

After normal assemble, read:

```text
dist/site/essays/agent-harness-system-layer/index.html
dist/site/briefs/2026-08-28/index.html
dist/site/knowledge/verification-loop/index.html
```

Assert:

- real Essay renders `xiaodaojiang` as `XiaoDaoJiang` with GitHub profile and active status;
- Daily renders Source metadata for `astro`, `slidev`, `github`, all as official/primary/active;
- real Essay's unsourced `Slidev Building and Hosting` Reference renders with no `data-source-*` attributes;
- Knowledge with no references has no empty Registry-generated Reference section;
- `/sources/index.html` and `/authors/index.html` are absent;
- existing Related Content and presentation links remain present.

Wire:

```json
"test:registry-ui-fixtures": "tsx tools/registry-ui-check/fixture-build.test.ts",
"test:registry-ui-artifact": "tsx tools/registry-ui-check/index.ts"
```

Run fixture test during `validate` after `content:validate`. Run artifact test at the end of top-level `build`.

Before route integration, the fixture/artifact contracts must fail because Author/Source metadata is not rendered.

---

## Task 4 — GREEN 2: integrate Brief, Essay and Knowledge reading surfaces

**Files**
- Modify: `apps/web/src/pages/briefs/[id].astro`
- Modify: `apps/web/src/components/briefs/DailyBriefBody.astro`
- Modify: `apps/web/src/components/briefs/WeeklyBriefBody.astro`
- Modify: `apps/web/src/components/briefs/AdHocBriefBody.astro`
- Modify: `apps/web/src/pages/essays/[id].astro`
- Modify: `apps/web/src/pages/knowledge/[id].astro`
- Modify: `apps/web/src/styles/global.css`

### Brief route

- Load `getCollection('sources')` with other collections.
- Build one Source index per static path-generation pass.
- Pass it to each cadence body.
- Replace only the top-level Reference `<ol>` in each body with `ReferenceList`.
- Do not expose section-level References or change cadence semantics.

### Essay route

- Load `authors` and `sources` with other collections.
- Build both indexes once.
- Resolve each Essay's authors in declared order inside `getStaticPaths`.
- Render `AuthorByline` after the lead and before Topic pills.
- After Markdown body, render `References` + `ReferenceList` only when frontmatter references are non-empty.
- Preserve Related Content.

### Knowledge route

- Load Sources.
- After Markdown body, render `References` + `ReferenceList` only when non-empty.
- Add no Author semantics.

### Styling

Add only small rules for:

```text
.author-byline
.author-entry
.reference-source
.reference-accessed
.registry-status
```

Use existing tokens and responsive behavior; add no JavaScript.

- [ ] Make `pnpm test:registry-ui-fixtures` pass.
- [ ] Run `pnpm build` and make the real artifact contract pass.
- [ ] Verify no Registry routes and no Slidev/RSS/discovery changes.
- [ ] Commit the integration checkpoint.

---

## Task 5 — Final verification and stacked merge gate

- [ ] Run the latest-head read-only PR Build through the complete `pnpm build` pipeline.
- [ ] Confirm Plan 40A Registry/integrity contracts remain green.
- [ ] Confirm archived fixture rendering and direct-build unknown-ID failures.
- [ ] Confirm real Essay byline and Daily Source metadata in final artifact.
- [ ] Confirm Daily + Weekly + Talk build counts and Daily route isolation remain unchanged.
- [ ] Confirm Trusted Preview is rebuilt from the final read-only artifact and passes public availability smoke.
- [ ] Inspect Preview Essay, Daily and Knowledge HTML.
- [ ] Confirm `/sources/` and `/authors/` remain absent.
- [ ] Compare the stacked branch against `feat/source-author-registry-integrity`; only the 40B files in this plan may differ.
- [ ] Record RED/GREEN runs, artifact ID/digest, Preview URL, scope and review-thread state in PR body.
- [ ] Do not merge. The required order is:
  1. merge PR #15;
  2. retarget the stacked 40B PR to `main`;
  3. ensure GitHub recalculates the diff and CI remains green;
  4. merge 40B separately.
