# Structured Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or equivalent task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic Schema.org JSON-LD for the Orbis homepage, Essay, Brief and Knowledge Reading pages while preserving the Production canonical identity established by Plan 50A.

**Architecture:** A pure `json-ld.ts` Web helper builds typed JSON-LD objects from validated content plus the existing Author Registry and SiteConfig. `BaseLayout.astro` owns the single `application/ld+json` renderer. Page routes pass structured-data intent; they never construct absolute URLs outside the existing Production URL helper.

**Tech Stack:** Astro, TypeScript 5.9, Astro Content Collections, existing Plan 40 Registry helpers, existing Plan 50A SiteConfig/SEO URL helpers, Node/tsx artifact contracts.

**Spec:** `docs/superpowers/specs/2026-09-01-seo-sharing-design.md`

## Global Constraints

- Baseline is `main@16de75931c984f64cd1458769b6eb87bfa5fe572`.
- JSON-LD URLs always use Production canonical identity, including Preview builds.
- Homepage emits `WebSite`.
- Essay emits `Article`; `dateModified = updatedAt ?? publishedAt`; Author Registry order is preserved.
- Brief emits `Article`; it has no fabricated author or publisher.
- Knowledge emits `TechArticle`; `dateModified = updatedAt ?? publishedAt`; it has no fabricated author or publisher.
- `reviewAt` is not mapped to Schema.org.
- Reference Source Registry is not treated as Article publisher/author.
- No standalone Presentation JSON-LD detail page is introduced.
- No `content/**`, `packages/content-schema/**`, Slidev template, workflow, generated source or `dist/**` changes.
- 50B consumes the existing `productionSiteUrl()` / canonical contract and must not redefine Sitemap, RSS, OG or robots behavior.

---

### Task 1: Establish JSON-LD builder contract

**Files:**
- Create: `tools/seo/json-ld-contract.test.ts`
- Modify: `package.json`
- Create after RED: `apps/web/src/lib/json-ld.ts`

**Interfaces:**
- Consumes: `SiteConfig`, `productionSiteUrl`, `ResolvedAuthor`.
- Produces:
  - `JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>`
  - `buildWebSiteJsonLd()`
  - `buildEssayJsonLd()`
  - `buildBriefJsonLd()`
  - `buildKnowledgeJsonLd()`
  - `serializeJsonLd()`

- [ ] **Step 1: Write failing pure contract**

Create `tools/seo/json-ld-contract.test.ts` that imports `apps/web/src/lib/json-ld.ts` dynamically and fails with `JSON-LD helper must exist` before production code exists.

The test must then require these exact behaviors after implementation:

```ts
const home = buildWebSiteJsonLd()
assert.equal(home['@context'], 'https://schema.org')
assert.equal(home['@type'], 'WebSite')
assert.equal(home.url, 'https://xiaodaojiang.github.io/Orbis/')

const essay = buildEssayJsonLd({
  title: 'Essay title',
  description: 'Essay description long enough.',
  publishedAt: '2026-08-01',
  updatedAt: '2026-08-02',
  canonicalPath: '/essays/example/',
  authors: [
    { id: 'a', name: 'Author A', status: 'active', url: 'https://example.com/a' },
    { id: 'b', name: 'Author B', status: 'archived' },
  ],
})
assert.equal(essay['@type'], 'Article')
assert.equal(essay.url, 'https://xiaodaojiang.github.io/Orbis/essays/example/')
assert.equal(essay.mainEntityOfPage, essay.url)
assert.equal(essay.datePublished, '2026-08-01')
assert.equal(essay.dateModified, '2026-08-02')
assert.deepEqual(essay.author, [
  { '@type': 'Person', name: 'Author A', url: 'https://example.com/a' },
  { '@type': 'Person', name: 'Author B' },
])
```

Also require:

```ts
assert.equal('author' in buildBriefJsonLd(...), false)
assert.equal('publisher' in buildBriefJsonLd(...), false)
assert.equal(buildKnowledgeJsonLd(...)['@type'], 'TechArticle')
assert.equal('author' in buildKnowledgeJsonLd(...), false)
assert.equal('publisher' in buildKnowledgeJsonLd(...), false)
assert.equal('reviewAt' in buildKnowledgeJsonLd(...), false)
```

`serializeJsonLd()` must return parseable JSON and replace literal `<` with `\u003c` so user-controlled text cannot terminate the script block.

- [ ] **Step 2: Wire RED into validation**

Add:

```json
"test:structured-data": "tsx tools/seo/json-ld-contract.test.ts"
```

and run it from `validate` after `test:seo-url` and before `content:validate`.

- [ ] **Step 3: Verify RED in read-only PR Build**

Expected failure:

```text
AssertionError: JSON-LD helper must exist
```

Existing Plan 10–50A contracts must pass first.

- [ ] **Step 4: Implement minimal pure builder**

Create `apps/web/src/lib/json-ld.ts` using `webSiteConfig` and `productionSiteUrl()`.

Required output shapes:

```ts
export function buildWebSiteJsonLd(): Record<string, unknown>

export function buildEssayJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
  authors: ResolvedAuthor[]
}): Record<string, unknown>

export function buildBriefJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  canonicalPath: string
}): Record<string, unknown>

export function buildKnowledgeJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  canonicalPath: string
}): Record<string, unknown>
```

Every object includes:

```ts
'@context': 'https://schema.org'
inLanguage: webSiteConfig.site.locale
```

- [ ] **Step 5: Verify GREEN**

Run full `pnpm build`; expected `JSON-LD builder contract passed` plus all existing contracts green.

---

### Task 2: Establish rendered JSON-LD artifact contract

**Files:**
- Create: `tools/seo/structured-data-artifact-check.ts`
- Modify: `package.json`
- Modify after RED: `apps/web/src/layouts/BaseLayout.astro`
- Modify after RED: `apps/web/src/pages/index.astro`
- Modify after RED: `apps/web/src/pages/essays/[id].astro`
- Modify after RED: `apps/web/src/pages/briefs/[id].astro`
- Modify after RED: `apps/web/src/pages/knowledge/[id].astro`

**Interfaces:**
- Consumes: JSON-LD builders from Task 1, existing `BaseLayout` canonical metadata, existing Author Registry resolution.
- Produces: exactly one `script[type="application/ld+json"]` on the four target page classes.

- [ ] **Step 1: Write failing artifact contract**

The test reads `dist/site` after assembly and extracts JSON-LD scripts from:

```text
index.html
essays/agent-harness-system-layer/index.html
briefs/2026-08-28/index.html
knowledge/verification-loop/index.html
```

Before integration, it must fail because no JSON-LD block exists.

For every block:

- `JSON.parse()` succeeds;
- `url` equals the page `<link rel="canonical">` value;
- no serialized string contains `raw.githack.com` or `preview-pr-`.

Page-specific assertions:

```text
Homepage   @type=WebSite
Essay      @type=Article; author[0].name=XiaoDaoJiang; author[0].url=https://github.com/XiaoDaoJiang
Brief      @type=Article; no author; no publisher
Knowledge  @type=TechArticle; no author; no publisher; no reviewAt
```

Essay `datePublished=2026-08-28`; `dateModified` uses `updatedAt ?? publishedAt` from the real fixture. Knowledge follows the same rule.

- [ ] **Step 2: Wire artifact test last in build**

Add:

```json
"test:structured-data-artifact": "tsx tools/seo/structured-data-artifact-check.ts"
```

and append it after `test:seo-site` in root `build`.

- [ ] **Step 3: Verify RED**

Expected failure after all prior build steps pass:

```text
AssertionError: Homepage must emit JSON-LD
```

- [ ] **Step 4: Extend BaseLayout renderer**

Add prop:

```ts
jsonLd?: JsonLdValue
```

and render only when present:

```astro
{jsonLd && <script type="application/ld+json" set:html={serializeJsonLd(jsonLd)} />}
```

Do not compute content JSON-LD inside BaseLayout; pages own content intent.

- [ ] **Step 5: Integrate homepage**

`apps/web/src/pages/index.astro` passes:

```astro
<BaseLayout jsonLd={buildWebSiteJsonLd()}>
```

- [ ] **Step 6: Integrate Essay**

Reuse already resolved `authors` and pass:

```ts
const jsonLd = buildEssayJsonLd({
  title: entry.data.title,
  description: entry.data.description,
  publishedAt: entry.data.publishedAt,
  updatedAt: entry.data.updatedAt,
  canonicalPath: `/essays/${entry.id}/`,
  authors,
})
```

Then `BaseLayout ... jsonLd={jsonLd}`.

- [ ] **Step 7: Integrate Brief**

Pass only real Brief fields and `/briefs/${entry.id}/`; do not add author/publisher.

- [ ] **Step 8: Integrate Knowledge**

Pass title, summary, publishedAt, optional updatedAt and `/knowledge/${entry.id}/`; do not pass `reviewAt`.

- [ ] **Step 9: Verify GREEN**

Full `pnpm build` must end with:

```text
Structured data artifact contract passed
```

and all Plan 50A SEO contracts remain green.

---

### Task 3: Final Preview and scope gate

**Files:** No new product files unless a verified defect is found.

- [ ] **Step 1: Inspect exact PR changed-file list**

Expected 50B production scope is limited to:

```text
apps/web/src/lib/json-ld.ts
apps/web/src/layouts/BaseLayout.astro
apps/web/src/pages/index.astro
apps/web/src/pages/essays/[id].astro
apps/web/src/pages/briefs/[id].astro
apps/web/src/pages/knowledge/[id].astro
package.json
tools/seo/json-ld-contract.test.ts
tools/seo/structured-data-artifact-check.ts
```

No content/schema/Slidev/workflow/generated/dist changes.

- [ ] **Step 2: Verify Trusted Preview**

Read-only PR Build must upload the normal Preview artifact and trusted publisher must post a fresh public smoke-pass comment after artifact creation.

- [ ] **Step 3: Inspect public Preview artifact**

Confirm homepage/Essay/Brief/Knowledge JSON-LD URLs remain Production URLs while Preview canonical/robots/OG behavior from 50A remains unchanged.

- [ ] **Step 4: Update PR evidence**

PR body records RED/GREEN run IDs, final artifact digest, Preview evidence, changed-file audit and explicit statement that JSON-LD did not invent author/publisher fields.

- [ ] **Step 5: Merge gate**

Do not merge automatically. Hand PR to the human integration gate.

---

## Post-merge Gate

After the human merges 50B:

1. verify exact new `main` SHA;
2. verify fresh `Orbis Site Build` including structured-data artifact contract;
3. run governed `Orbis Pages Production` with `deploy=true` for that exact SHA;
4. verify Build → Deploy → public smoke;
5. mark Milestone E / Plan 50 Done and advance Roadmap to Plan 60.
