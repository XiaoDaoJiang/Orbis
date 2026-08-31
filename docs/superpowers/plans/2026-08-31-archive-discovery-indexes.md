# Archive & Discovery Indexes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Plan 10A as a small product-capability PR that adds human-facing Archive, Slides, Daily Brief and Weekly Brief indexes while centralizing public visibility rules.

**Architecture:** Keep `content/**` as the only publishable source and implement discovery as an Astro build-time projection over existing collections. Add one focused `apps/web/src/lib/content-discovery.ts` helper module for public visibility, normalization, sorting and cadence filtering; pages consume that helper and final artifact checks enforce the routes.

**Tech Stack:** Astro 5, Astro Content Collections, TypeScript, pnpm, existing Orbis design tokens/global CSS, Node assert-based artifact checks.

**Spec:** `docs/superpowers/specs/2026-08-31-archive-discovery-indexes-design.md`

## Global Constraints

- `content/**` remains the only publishable Source of Truth.
- Do not add a database, CMS, server API, search service or client framework.
- Do not read generated Slidev sources, `dist/**` or `archive.json` to build discovery pages.
- Do not implement Previous / Next, Related Content, Slide → Reading injection, homepage redesign, Template Registry, `talk-v1`, `weekly-v1`, Weekly-specific schema semantics or legacy compatibility.
- Do not commit generated HTML, generated Slidev source or `dist/**`.
- Final validation is the existing top-level `pnpm build` contract plus PR Preview/public smoke.

---

### Task 1: Add the RED artifact contract

**Files:**
- Modify: `tools/site-check/index.ts`

**Interfaces:**
- Consumes: assembled `dist/site` produced by the existing build pipeline.
- Produces: build failures when `/archive/`, `/slides/`, `/briefs/daily/` or `/briefs/weekly/` are missing or semantically wrong.

- [ ] **Step 1: Extend required route checks before implementation**

Add these files to the `required` array:

```ts
'dist/site/archive/index.html',
'dist/site/slides/index.html',
'dist/site/briefs/daily/index.html',
'dist/site/briefs/weekly/index.html',
```

After existing home/RSS checks, read the four route HTML files and assert the current fixture behavior:

```ts
const archivePage = await readFile(resolve(root, 'dist/site/archive/index.html'), 'utf8')
const slidesPage = await readFile(resolve(root, 'dist/site/slides/index.html'), 'utf8')
const dailyPage = await readFile(resolve(root, 'dist/site/briefs/daily/index.html'), 'utf8')
const weeklyPage = await readFile(resolve(root, 'dist/site/briefs/weekly/index.html'), 'utf8')

assert.match(archivePage, /Archive/i)
assert.match(archivePage, /2026-08-28/)
assert.match(slidesPage, /Presentations/i)
assert.match(slidesPage, /2026-08-28/)
assert.match(dailyPage, /Daily Briefs/i)
assert.match(dailyPage, /2026-08-28/)
assert.match(weeklyPage, /Weekly Briefs/i)
assert.match(weeklyPage, /No weekly briefs have been published yet/i)
```

- [ ] **Step 2: Open a draft PR to watch RED in the real Actions environment**

Expected: `build-preview` fails in `pnpm build` because the new route files do not exist yet. Confirm the failure is the missing discovery route contract, not an unrelated baseline failure.

- [ ] **Step 3: Keep the PR open and continue only after RED is confirmed**

No production route code is added before this failure is observed.

---

### Task 2: Centralize public discovery rules

**Files:**
- Create: `apps/web/src/lib/content-discovery.ts`

**Interfaces:**
- Consumes: Astro collection entries for `briefs`, `essays`, `knowledge`, `topics`.
- Produces:
  - `isPublicBrief(entry)`
  - `isPublicEssay(entry)`
  - `isPublicKnowledge(entry)`
  - `isPublicTopic(entry)`
  - `toBriefDiscoveryItem(entry, base)`
  - `toEssayDiscoveryItem(entry, base)`
  - `toKnowledgeDiscoveryItem(entry, base)`
  - `sortDiscoveryNewestFirst(items)`
  - `filterBriefsByCadence(entries, cadence)`

Use a normalized shape:

```ts
export type DiscoveryKind = 'brief' | 'essay' | 'knowledge'

export type DiscoveryItem = {
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

Visibility rules:

```ts
brief.data.status === 'published'
essay.data.status === 'published'
knowledge.data.status === 'published' || knowledge.data.status === 'active'
topic.data.status !== 'archived'
```

`presentationHref` exists only when a public Brief has `presentation.enabled === true`.

- [ ] **Step 1: Implement the minimal helper module required by route code**

Keep URL construction base-path safe by receiving `base` from page code and producing `${base}/.../` URLs.

- [ ] **Step 2: Do not introduce registry abstractions for future presentations**

The Slides projection must remain Brief-derived until Plan 20.

---

### Task 3: Add Daily and Weekly discovery routes

**Files:**
- Create: `apps/web/src/pages/briefs/daily/index.astro`
- Create: `apps/web/src/pages/briefs/weekly/index.astro`
- Modify: `apps/web/src/pages/briefs/index.astro`

**Interfaces:**
- Consumes: `filterBriefsByCadence`, normalized items and shared sorting rules.
- Produces: stable `/briefs/daily/` and `/briefs/weekly/` routes.

- [ ] **Step 1: Implement `/briefs/daily/`**

Render only public Daily Briefs, newest first. Use the existing `BaseLayout`, `.grid`, `.card`, `.pills` patterns.

- [ ] **Step 2: Implement `/briefs/weekly/` with a stable empty state**

When no public Weekly Brief exists, render this exact build-checkable sentence:

```text
No weekly briefs have been published yet.
```

When Weekly content exists later, the same route renders cards instead.

- [ ] **Step 3: Add Daily/Weekly entry points to `/briefs/`**

Preserve the all-cadence list and add visible links to `/briefs/daily/` and `/briefs/weekly/`.

---

### Task 4: Add `/slides/` presentation discovery

**Files:**
- Create: `apps/web/src/pages/slides/index.astro`

**Interfaces:**
- Consumes: public Briefs where `presentation.enabled === true`.
- Produces: stable `/slides/` index linking both presentation and reading routes.

- [ ] **Step 1: Filter from structured Brief collection only**

Never scan generated files or `dist/slides`.

- [ ] **Step 2: Render newest-first presentation cards**

Each card includes cadence/date/title/topics and two links:

```text
Open presentation
Read brief
```

The page heading contains `Presentations` so the artifact gate can verify semantics.

---

### Task 5: Add `/archive/` cross-content discovery

**Files:**
- Create: `apps/web/src/pages/archive/index.astro`
- Modify: `apps/web/src/styles/global.css`

**Interfaces:**
- Consumes: normalized public Brief, Essay and Knowledge discovery items.
- Produces: static cross-content archive with progressive-enhancement filters.

- [ ] **Step 1: Build one newest-first normalized list**

Merge public Briefs, Essays and Knowledge and call `sortDiscoveryNewestFirst`.

- [ ] **Step 2: Render semantic filter metadata into cards**

Each archive article/card carries dataset attributes:

```html
data-kind="brief"
data-cadence="daily"
data-topics="agent-harness ..."
```

- [ ] **Step 3: Render filter controls**

Provide controls for type, cadence and topic. The default static HTML shows every public item.

- [ ] **Step 4: Add a tiny inline client script**

On control changes, hide/show already-rendered items only. Do not fetch data, mutate URLs or require a framework.

- [ ] **Step 5: Add focused global styles**

Add only filter/empty-state/link-row styles while preserving the current visual system.

---

### Task 6: Apply shared visibility to Topic aggregation and global navigation

**Files:**
- Modify: `apps/web/src/pages/topics/[id].astro`
- Modify: `apps/web/src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: public visibility helpers.
- Produces: Topic pages that cannot expose non-public content; navigation links to Archive/Slides.

- [ ] **Step 1: Replace raw Topic matches with public-filtered collections**

Apply `isPublicEssay`, `isPublicBrief`, `isPublicKnowledge` before topic matching.

- [ ] **Step 2: Keep Topic itself public only under existing `status !== 'archived'` route generation**

Do not add Related ranking in this PR.

- [ ] **Step 3: Add `Slides` and `Archive` to the main navigation**

Keep existing Essays, Briefs, Topics, Knowledge and RSS links.

---

### Task 7: Verify GREEN and complete the PR

**Files:**
- Review all changed files.

**Interfaces:**
- Consumes: GitHub Actions `build-preview`, preview artifact and trusted publish workflow.
- Produces: a review-ready PR with verified public routes.

- [ ] **Step 1: Let the updated branch rerun `build-preview`**

Expected: the full repository `pnpm build` succeeds, including schema/content validation, multi-presentation check, Astro build, Slidev build, assembly and the extended site check.

- [ ] **Step 2: Inspect changed files/diff for scope leakage**

Confirm there are no changes to `content/**`, content schemas, Slidev templates/runtime, workflows, generated sources or `dist/**`.

- [ ] **Step 3: Verify trusted Preview publication**

Inspect the publish workflow and public preview URL. Smoke these routes:

```text
/
/archive/
/slides/
/briefs/
/briefs/daily/
/briefs/weekly/
/briefs/2026-08-28/
/slides/2026-08-28/
```

Expected HTTP result: successful public response for each route.

- [ ] **Step 4: Mark the draft PR ready for review**

Use title:

```text
feat: add archive and discovery indexes
```

PR body summarizes product scope, architecture constraints, build results and Preview verification. Do not merge automatically; merge remains a separate decision after review.
