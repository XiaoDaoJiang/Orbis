# Plan 40B — Registry-backed Content UI Implementation Plan

> **For implementers:** this is a stacked change based on the completed 40A Registry/Integrity branch. Do not duplicate validation logic in UI components.

**Goal:** Make existing Orbis reading pages display stable Author and Source identities from the 40A registries, without adding Registry routes or changing Slidev generation.

**Architecture:** Astro loads Source/Author collections at build time. A pure resolver converts IDs into small display models. Shared `AuthorByline` and `ReferenceList` components render those models across Essay, Brief and Knowledge reading pages. The integrity layer remains the authority for missing-relation failures; UI code may fail loudly on an impossible missing entity rather than introducing fallback IDs.

**Tech stack:** Astro, TypeScript, Astro Content Collections, existing Orbis CSS tokens, pnpm/tsx artifact tests.

**Base:** `feat/source-author-registry-integrity`

---

## Task 1 — Add the failing Registry UI artifact contract

**Files:**

- Create: `tools/registry-ui/registry-ui-artifact.test.ts`
- Modify: `package.json`

**Steps:**

1. After normal build/assembly, inspect the real Essay and Daily/Weekly reading artifacts.
2. Require semantic markers for:
   - resolved Essay Author ID/name;
   - Author URL when present;
   - registered Source ID/name/trust tier on a real Reference;
   - an unchanged source-less Reference fallback;
   - absence of `/sources/` and `/authors/` artifacts.
3. Wire `test:registry-ui` into the top-level build after site assembly/site checks.
4. Open the stacked Draft PR before UI components exist.
5. Observe a read-only PR Build RED at the new artifact contract while all 40A schema/integrity contracts remain GREEN.

**Commit:** `test: require registry-backed content metadata`

---

## Task 2 — Add pure Registry display resolvers

**Files:**

- Create: `apps/web/src/lib/content-registry.ts`
- Create: `apps/web/src/lib/content-registry.test.ts`
- Modify: `package.json`

**Steps:**

1. Define small display models for Author and Source metadata, including canonical ID and status.
2. Add deterministic map builders for Astro Source/Author collection entries.
3. Resolve Essay Author IDs in declared order.
4. Resolve optional Reference Source IDs without changing the concrete Reference URL/title/support text.
5. Throw an explicit invariant error on a missing entity; do not render raw IDs as a silent fallback.
6. Test active, archived, URL-less Author and source-less Reference behavior.
7. Add the focused unit test to `test:registry-ui` before the artifact assertion.

**Commit:** `feat: resolve registry metadata for web content`

---

## Task 3 — Implement shared Author and Reference components

**Files:**

- Create: `apps/web/src/components/AuthorByline.astro`
- Create: `apps/web/src/components/ReferenceList.astro`
- Modify: `apps/web/src/styles/global.css`

**Steps:**

1. Render `AuthorByline` with stable `data-author-id` and `data-author-status` markers.
2. Link only Authors that declare `url`; keep URL-less Authors as text.
3. Display archived status explicitly but keep the historical identity usable.
4. Render `ReferenceList` with stable `data-reference-source` markers when Source exists.
5. Preserve the concrete citation URL as the primary link.
6. Display Source name and trust tier; add archived status when applicable.
7. Preserve the old title/supports appearance when Source is absent.
8. Add only narrow CSS that reuses existing typography, pills, spacing and color tokens.

**Commit:** `feat: add registry-backed author and reference components`

---

## Task 4 — Enrich Essay detail pages

**Files:**

- Modify: `apps/web/src/pages/essays/[id].astro`

**Steps:**

1. Load Source and Author collections once in `getStaticPaths` with existing Brief/Essay/Knowledge collections.
2. Build display maps/models at build time.
3. Add the resolved Author byline below the Essay header metadata.
4. Render Essay frontmatter References after the Markdown body through `ReferenceList` when non-empty.
5. Keep Related Content behavior and public visibility unchanged.
6. Do not add Author links to an internal route; use only the optional external Author URL.

**Commit:** `feat: show essay author and source metadata`

---

## Task 5 — Enrich Brief reading references

**Files:**

- Modify: `apps/web/src/pages/briefs/[id].astro`
- Modify: `apps/web/src/components/briefs/DailyBriefBody.astro`
- Modify: `apps/web/src/components/briefs/WeeklyBriefBody.astro`
- Modify: `apps/web/src/components/briefs/AdHocBriefBody.astro`

**Steps:**

1. Load the Source collection in the shared Brief route and build a Source display map.
2. Pass registry metadata into cadence-specific body components without introducing cadence-specific loading.
3. Replace hand-written top-level Reference lists with the shared `ReferenceList`.
4. Use the same component for section References wherever the current body exposes them.
5. Keep every existing Daily/Weekly semantic marker, adjacency and Related Content contract unchanged.
6. Confirm Daily remains 11 slides and Weekly remains 7–11 slides; no Slidev code changes are allowed.

**Commit:** `feat: show source metadata in brief references`

---

## Task 6 — Enrich Knowledge references

**Files:**

- Modify: `apps/web/src/pages/knowledge/[id].astro`

**Steps:**

1. Load Sources alongside existing content used for static paths/Related Content.
2. Render non-empty Knowledge frontmatter References with the shared component.
3. Preserve Markdown body, lifecycle metadata and Related Content behavior.
4. Do not introduce Knowledge lifecycle changes from Plan 60.

**Commit:** `feat: show source metadata in knowledge references`

---

## Task 7 — Complete artifact and regression coverage

**Files:**

- Modify: `tools/registry-ui/registry-ui-artifact.test.ts`
- Modify: existing `tools/site-check/index.ts` only if shared route existence coverage cannot be expressed in the focused test

**Steps:**

1. Assert the real Essay contains:
   - `data-author-id="xiaodaojiang"`;
   - visible `XiaoDaoJiang`;
   - external GitHub Author URL.
2. Assert a Reference with `source: slidev` shows:
   - `data-reference-source="slidev"`;
   - visible `Slidev`;
   - visible `primary` trust tier.
3. Assert at least one current source-less Reference remains rendered without a fabricated Source marker.
4. Assert Daily/Weekly reading semantic markers and links remain present.
5. Assert these paths are absent:
   - `dist/site/sources/index.html`;
   - `dist/site/authors/index.html`.
6. Keep Registry UI tests data-driven from content/collections where practical rather than hard-coding all current titles.

**Commit:** `test: verify registry-backed reading artifacts`

---

## Task 8 — Final 40B verification and stacked PR completion

**Steps:**

1. Run focused tests:

   ```bash
   pnpm test:content-registry
   pnpm test:registry-ui
   pnpm content:validate
   ```

2. Run the complete build:

   ```bash
   pnpm build
   ```

3. Confirm real output still contains exactly Daily + Weekly + Talk Presentation paths and all prior mixed-source tests pass.
4. Confirm RSS URLs/content identity, Archive/Topic/Related behavior and Daily `/latest/`/date/archive contracts are unchanged.
5. Confirm no `apps/slides/**`, generator, assembly, workflow, generated or `dist/**` source changes exist in the 40B diff relative to 40A.
6. Inspect the final artifact and Trusted Preview:
   - Essay author metadata is visible;
   - registered Source metadata is visible;
   - source-less Reference fallback remains clean;
   - no Registry routes exist.
7. Update the stacked PR description with RED/GREEN evidence and exact base branch.
8. Leave merge/retarget decisions to the user. After 40A merges, retarget 40B to `main`, verify the new merge ref, then merge separately.

**Expected 40B exit:** existing reading pages expose stable human-readable Author/Source identity while build-time integrity, Slidev and all discovery/lifecycle boundaries remain unchanged.
