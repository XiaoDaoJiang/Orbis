# Orbis Incremental Publishing Architecture Plan

Status: **PLANNING**  
Branch: `planning/incremental-publishing-architecture`  
Scope: framework-first build and publishing optimization for Astro + Slidev

## 1. Why this iteration exists

Orbis has reached a stable structured-publishing architecture: `content/**` is the source of truth, Astro produces the reading site, Slidev produces presentation artifacts, and GitHub Actions publishes the validated `dist/site` artifact.

The next scaling constraint is no longer correctness of the static architecture, but repeated work during normal publishing. A new Daily or Weekly currently flows through broad validation, full Astro generation, full Slidev source generation, full Slidev build, assembly and artifact verification. As the repository accumulates more Essays, Briefs, Knowledge and presentations, normal publishing cost risks growing with historical content volume.

This iteration optimizes that behavior without giving up the current strongest property:

> `content/** + repository code` must always be sufficient to deterministically rebuild the complete site from scratch.

The optimization therefore introduces a fast incremental path while retaining an explicit clean full-build path.

## 2. Product and architecture principles

### 2.1 Static is the default product model

Orbis remains a static publishing system. It does not add a server database, SSR requirement, online CMS or dynamic API merely to avoid rebuilding old content.

Published and archived content is already static after Astro/Slidev build. The optimization target is to avoid rerendering unchanged static output, not to create a second generated-HTML source of truth.

### 2.2 Framework-first, custom code last

Implementation priority is:

1. Astro/Slidev native capability;
2. officially supported framework configuration and build entry points;
3. CI cache/artifact facilities;
4. only then small Orbis-specific glue for dependency identity or changed-deck selection.

Do not build a generic custom build DAG, persistent build database or custom incremental compiler while the framework can own invalidation safely.

### 2.3 Editorial lifecycle is not build lifecycle

Content states such as `draft`, `published`, `needs-review` and `archived` express editorial meaning. They must not directly determine whether an artifact can be reused.

Reuse is determined by whether all output-affecting inputs are unchanged: source content, referenced registry data, adjacent content when rendered, templates/layouts, shared design code and toolchain configuration.

### 2.4 Fast path must degrade safely

Cache loss or an ambiguous impact calculation must never block publishing or silently reuse stale output.

The required fallback is always:

```text
cache unavailable / unsafe to reuse
  -> clean deterministic full build
```

## 3. Target content model

The desired division of responsibilities is:

| Content | Preferred source | Framework behavior |
| --- | --- | --- |
| Opaque static assets such as favicon, images, PDFs and robots files | `apps/web/public/**` | copied as static assets; no content rendering |
| Small one-off site pages | Astro page Markdown or `.astro` pages where appropriate | static page generation |
| Human-authored Essays / blog posts | `content/essays/**/*.md` | Astro Content Collections + schema + incremental static build |
| Durable Knowledge | `content/knowledge/**/*.md` | Astro Content Collections + schema + incremental static build |
| Daily / Weekly / ad-hoc Briefs | `content/briefs/**/*.yaml` | structured Content Collection rendered to static pages |
| Structured generated presentations | Brief / `content/presentations/**` -> generated Slidev source | per-deck Slidev build |
| Human-authored free-form talks | future native Slidev Markdown entry | direct Slidev build without forcing all authoring through `talk-v1` |

Generated HTML, generated Slidev sources and final build artifacts remain build outputs, not committed editorial sources.

## 4. Astro optimization plan

### 4.1 Enable Astro incremental static build

Current `@orbis/web` uses Astro 7.2.9 and `output: 'static'`. Adopt Astro's native incremental static-build capability before implementing Orbis-level page caching.

Expected configuration direction:

```js
experimental: {
  incrementalBuild: true,
}
```

The implementation must confirm the exact Astro 7.2.x contract before merging because this capability is experimental.

### 4.2 Add route-level `cacheKey` using Content Collection identity

Dynamic content routes should opt into stable cache identity where supported. Start from Astro Content Collection entry digest rather than an Orbis-maintained content hash.

Candidate routes include:

- `apps/web/src/pages/essays/[id].astro`
- `apps/web/src/pages/briefs/[id].astro`
- `apps/web/src/pages/knowledge/[id].astro`
- topic or presentation routes where the same pattern is applicable

The first implementation should use the framework-provided digest for content-owned output and only add extra identity inputs where the rendered page truly depends on them.

### 4.3 Narrow content-page dependency scope

Current detail pages often load broad collections to render related content, registries or adjacency. That can cause an otherwise unchanged historical page to become output-dependent on newly published content.

Classify rendered data into two categories:

**Stable page-owned data**

- title / summary / description;
- body;
- editorial status;
- publication/update dates;
- direct topics;
- direct authors;
- direct references and evidence.

**Discovery / neighborhood data**

- related content;
- newest content;
- trending content;
- previous/next navigation;
- broad cross-collection recommendations.

Prefer keeping durable historical pages dependent primarily on stable page-owned data. Cross-content discovery belongs primarily on Archive, Topics, indexes and other aggregation surfaces.

If a detail page keeps discovery data, its cache identity must include exactly the output-affecting dependency rather than the entire repository state.

### 4.4 Preserve legitimate local invalidation

Some old pages should change after a new publication. Daily adjacency is the clearest example: publishing `2026-09-11` can legitimately change the `next` link on `2026-09-10`.

The target behavior is local invalidation:

```text
new 2026-09-11 Daily
  -> build 2026-09-11
  -> invalidate 2026-09-10 if adjacency output changed
  -> reuse older Daily pages
```

Do not remove useful navigation solely to maximize cache hit rate.

### 4.5 Use precise registry dependencies

When an Essay depends on specific Author or Source records, cache identity should represent only those referenced records where practical.

A Source or Author edit should invalidate the content that renders it, not every Essay merely because the route loaded the whole registry.

Prefer collection-entry digest or another framework-owned stable identity over duplicating hashing logic.

### 4.6 Keep Markdown rendering cache-friendly

Do not enable optional deferred Markdown rendering solely as an optimization. Retain the default Content Layer behavior unless repository size demonstrates memory pressure that justifies a different trade-off.

## 5. Slidev optimization plan

### 5.1 Make the deck the unit of build

Slidev natively builds an entry presentation. Orbis should preserve that unit instead of forcing every build through all generated decks.

Current build tooling removes presentation output directories and loops over every entry. Change this architecture so a requested set of presentation IDs can be generated and built independently.

Target interface may be environment- or CLI-based, for example:

```text
build all decks
build one deck
build an explicit set of decks
```

The exact command shape is implementation detail; the important contract is deck-scoped build support.

### 5.2 Stop unconditional removal of all generated/output decks

`tools/generate-slides/index.ts` and `tools/build-slides/index.ts` currently clear their output roots before rebuilding. Replace unconditional global clearing in the incremental path with scoped replacement of affected deck directories.

Keep an explicit clean/full mode that still removes and regenerates everything.

### 5.3 Prefer native Slidev Markdown for free-form human talks

Daily and Weekly presentations should remain structured and template-driven because they derive from machine-readable Brief content.

For human-authored technical talks, evaluate a native Slidev source mode such as a dedicated presentation directory containing `slides.md`. This would allow authors to use Slidev features directly instead of continuously expanding `talk-v1` and the Orbis presentation schema to reproduce Slidev itself.

This is a capability boundary decision, not a requirement to migrate existing standalone presentations immediately.

### 5.4 Use native Slidev composition before custom composition

For reusable presentation sections, prefer Slidev-supported imports / `src:` composition and native layouts/components before creating an Orbis-specific slide composition language.

### 5.5 Reuse previous deck artifacts in CI

After deck-scoped build exists, CI may restore prior Slidev output and replace only affected deck directories.

Initial invalidation rules should remain intentionally simple:

**deck-local dirty**

- its Brief / Presentation source changed;
- directly generated SEO metadata inputs changed.

**all decks dirty**

- shared Slidev styles changed;
- shared layouts changed;
- presentation template implementation changed;
- design tokens affecting slides changed;
- Slidev/toolchain dependency changed;
- impact cannot be established safely.

Do not introduce a persistent fingerprint database in the first iteration unless native/CI mechanisms prove insufficient.

## 6. Build and validation lanes

The current root `pnpm build` remains the canonical full deterministic build, but normal content publishing should eventually have a narrower fast path.

Target conceptual lanes:

### 6.1 Content validation lane

Validates editorial and referential correctness:

- schema;
- Source / Author / Topic references;
- Daily evidence contract;
- Weekly contract;
- Knowledge lifecycle relations;
- content-agent path rules where applicable.

### 6.2 Impact / incremental artifact lane

Builds and checks affected outputs:

- changed content pages;
- legitimately affected neighboring pages;
- changed presentations;
- global discovery surfaces such as home/index/archive/topic pages;
- RSS, sitemap, latest and archive metadata;
- assembled artifact smoke checks.

### 6.3 Full regression lane

Runs all current contracts and performs a clean full site rebuild. It remains mandatory for framework/toolchain/build-system changes and should also run periodically as a regression safety net.

Do not weaken correctness checks simply to report a faster CI duration.

## 7. CI change classification

Introduce change-scope classification only after the framework-native incremental path is working.

### Content-only changes

Typical examples:

```text
content/briefs/**
content/essays/**
content/knowledge/**
content/presentations/**
```

These should use the canonical Linux build plus appropriate content/incremental checks. Full cross-platform portability builds need not run for every ordinary publication if no build tooling changed.

### Build/toolchain changes

Typical examples:

```text
apps/**
packages/**
tools/**
.github/**
package.json
pnpm-lock.yaml
configuration that changes rendering/build behavior
```

These should retain the complete portability matrix.

### Scheduled safety regression

Run a clean cross-platform or canonical full-build regression on a schedule so the fast path cannot hide long-lived rebuild failures.

## 8. CI cache versus artifact semantics

Treat cache and artifact as different things.

**Cache** accelerates reproducible work and may disappear at any time. Candidate examples include Astro incremental-build cache and restored intermediate Slidev output.

**Artifact** is a validated result of a specific workflow run and may be promoted/deployed when repository governance allows it.

Rules:

- cache must never become the only copy of publishable history;
- cache miss triggers rebuild, not failure;
- production deployment must continue to use a validated workflow artifact;
- do not commit generated site output merely to make incremental builds possible.

## 9. Expected normal Daily flow

After this iteration, a common new Daily should approximate:

```text
new content/briefs/YYYY-MM-DD.yaml
  -> validate content contract
  -> Astro incremental build
       old Essays / Knowledge / Daily pages: cache hit where dependencies are stable
       new Daily: render
       previous Daily: rerender only if adjacency changed
       home / indexes / archive / affected topics / RSS / sitemap: update as required
  -> generate/build changed Daily Slidev deck only
       historical decks: reuse
  -> assemble complete dist/site
  -> artifact checks
  -> PR preview
  -> human merge
  -> governed Pages promotion
```

Daily publication cost should trend toward being proportional to changed/affected content, not total historical content count.

## 10. Full rebuild triggers

The implementation must retain an obvious full rebuild path. A full or broad rebuild is expected when one of these changes can affect many historical outputs:

- Astro configuration or framework upgrade;
- shared page layouts/components that alter historical pages;
- shared SEO/JSON-LD renderer;
- content schema semantics with output implications;
- global design tokens;
- Slidev version, layouts, styles or presentation templates;
- build/assembly tools;
- cache restore is unavailable and no safe reusable artifact exists;
- operator explicitly requests a clean build.

## 11. Implementation phases

### Phase A — Measure and establish baseline

1. Record current clean `pnpm build` behavior and meaningful phase timings.
2. Record number of generated Astro content pages and Slidev decks.
3. Add no optimization until baseline correctness and timing are reproducible.

Exit: baseline can distinguish optimization benefit from accidental test removal.

### Phase B — Astro native incremental build

1. Verify Astro 7.2.9 incremental-build API and limitations from the pinned framework contract.
2. Enable the feature in `apps/web/astro.config.mjs`.
3. Add correct `cacheKey` support to initial detail routes.
4. Ensure aggregate/global routes still update.
5. Prove a second unchanged build reuses historical pages.
6. Prove modifying a shared layout invalidates affected historical pages.
7. Add CI cache persistence for Astro's supported cache directory.

Exit: unchanged historical Astro pages do not require rerender on the normal path, and full rebuild remains available.

### Phase C — Dependency narrowing

1. Review detail-page collection reads.
2. Remove unnecessary global discovery dependencies from durable pages where product value is low.
3. Keep adjacency where useful and make its invalidation local.
4. Tie Author/Source-dependent output to the referenced records rather than broad registry state where feasible.

Exit: publishing one content item invalidates a bounded set of historical detail pages.

### Phase D — Slidev deck-scoped build

1. Add generate/build selection by presentation ID(s).
2. Stop deleting all generated and built decks on the incremental path.
3. Keep an explicit clean/full deck build mode.
4. Restore prior deck output in CI and replace only changed decks.
5. Treat shared Slidev/template/toolchain changes as all-decks-dirty.

Exit: adding one Daily/Weekly presentation does not invoke Slidev build for every historical deck.

### Phase E — Human Slidev authoring capability decision

1. Prototype one native human-authored `slides.md` presentation.
2. Confirm coexistence with structured Brief-generated presentations.
3. Verify routing, SEO, base path and final assembly.
4. Decide whether native Slidev becomes the recommended free-form talk authoring mode.

Exit: documented decision; no mandatory bulk migration.

### Phase F — Validation and CI lane optimization

1. Separate content correctness, incremental artifact checks and full regression concepts into explicit commands/workflows where useful.
2. Classify content-only versus build/toolchain changes.
3. Avoid the full portability matrix for ordinary content-only PRs once evidence demonstrates safety.
4. Add scheduled clean regression.

Exit: faster content publishing without reducing full rebuild coverage for architecture changes.

## 12. Acceptance criteria

This architecture iteration is complete when all of the following are demonstrated:

- A new human-authored Essay remains a plain Markdown contribution under the structured content model and does not require editing Astro UI code.
- Opaque assets can use Astro `public/**` semantics without passing through content rendering.
- Published and archived historical content remains source-controlled as Markdown/YAML, not generated HTML.
- Two equivalent Astro builds can reuse unchanged historical detail-page output through framework-supported incremental behavior.
- Changing a shared renderer/layout invalidates pages whose output would change.
- Adding one new Daily does not require Slidev to rebuild every historical deck on the fast path.
- Global pages and feeds that genuinely depend on new content still update.
- Cache deletion never prevents a clean complete rebuild.
- `pnpm build` or an explicit equivalent remains capable of deterministic full reconstruction.
- Production continues to deploy validated artifacts rather than mutable cache state.
- No generated HTML/Slidev artifact is introduced as a second editorial source of truth.

## 13. Non-goals

This iteration does not introduce:

- a database-backed CMS;
- SSR merely for publishing performance;
- a custom generic build graph engine;
- a persistent incremental-build database;
- committing `dist/**` as history;
- content lifecycle rules that permanently exempt archived content from renderer changes;
- migration of all existing presentations to native Slidev Markdown;
- weakening current repository governance or production deployment controls.

## 14. Risks and safeguards

### Astro incremental build is experimental

Safeguard: keep version pinning, add targeted regression tests, retain `--force` / clean full build behavior and make cache optional.

### Incorrect `cacheKey` can reuse stale output

Safeguard: begin with small route scope; identify actual rendered dependencies; add tests where changing a dependency must invalidate the page; prefer framework entry digests over custom hashes.

### Incremental Slidev output can retain stale directories

Safeguard: deck-level replacement must be deterministic; deleted/unpublished presentations require explicit stale-output cleanup; scheduled/full builds reconstruct output from scratch.

### CI branching can accidentally skip required checks

Safeguard: change classification only controls performance-oriented lanes; ambiguous changes fall back to full validation.

## 15. Recommended first implementation slice

Do not implement every item at once. The first code PR after this planning branch should be intentionally small:

1. enable and verify Astro native incremental build;
2. add cache identity to Essay and Knowledge detail routes first;
3. persist the supported Astro cache in CI;
4. add regression evidence for cache hit and shared-layout invalidation;
5. leave Slidev behavior unchanged until the Astro slice proves the framework-first model.

The second slice should then make Slidev build presentation-scoped.

This order reduces risk and avoids mixing two independent caching systems in the first implementation PR.

## 16. Decision summary

The intended Orbis steady-state is:

```text
Git-controlled editorial source
  -> framework-owned content identity
  -> incremental static rendering where safe
  -> deck-scoped Slidev generation/build
  -> reuse unchanged outputs
  -> rebuild global/affected outputs
  -> assemble one complete static site
  -> validate artifact
  -> governed Pages deployment
```

The system remains fully static, fully rebuildable and source-driven; it simply stops treating every publication as if every historical artifact had changed.
