# Plan 50 — SEO & Sharing Design

> Status: Design review
> Roadmap: `docs/plan/50-seo-sharing.md`
> Baseline: `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> Delivery: 50A SEO Foundation + 50B Structured Data
> Production prerequisite: Plan 40 production Pages deploy/smoke must be green before Plan 50 implementation is merged.

## 1. Goal

Make Astro Reading pages the stable public identity for Orbis content across search engines, social sharing, RSS and structured data without creating a second URL system or allowing PR Preview URLs to compete with production content.

Plan 50 does not attempt to optimize search ranking. It establishes correct, deterministic and build-verifiable metadata contracts.

## 2. Existing foundation

Orbis already has the pieces required to build the SEO layer without adding a new runtime service:

- `config/site.yaml` defines production `site.origin`, `site.basePath` and `site.locale` plus separate Preview origin/repository/branch data;
- `apps/web/astro.config.mjs` already accepts `SITE_ORIGIN` and `SITE_BASE` runtime overrides;
- `BaseLayout.astro` already owns document title, description, favicon and RSS discovery;
- `tools/shared/site-config.ts` is the shared build-time SiteConfig loader;
- `content/**` is the sole publishable content source;
- Source/Author Registry and referential integrity are already established by Plan 40;
- Brief-derived Slidev decks already have explicit Reading backlinks;
- standalone `talk-v1` Presentations intentionally have no fake Reading URL.

Plan 50 extends these contracts rather than adding parallel SEO configuration.

## 3. Architectural decision: separate search identity from preview share identity

The same generated page may run in Production or PR Preview, but those environments do not own equal search identity.

### 3.1 Production

For a canonical Reading path such as `/briefs/2026-08-28/`:

```text
canonicalUrl = https://xiaodaojiang.github.io/Orbis/briefs/2026-08-28/
shareUrl     = https://xiaodaojiang.github.io/Orbis/briefs/2026-08-28/
robots       = index,follow
```

### 3.2 PR Preview

For the equivalent Preview page:

```text
canonicalUrl = https://xiaodaojiang.github.io/Orbis/briefs/2026-08-28/
shareUrl     = https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-<N>/briefs/2026-08-28/
robots       = noindex,nofollow
```

Preview remains a real, shareable review artifact, but it never declares `raw.githack.com/.../preview-pr-*` as the permanent search identity.

### 3.3 Consequences

- `<link rel="canonical">` always targets the Production URL for content that has a production identity.
- `og:url` uses the current environment share URL so Preview links still describe the page the reviewer opened.
- Preview emits `<meta name="robots" content="noindex,nofollow">`.
- Production does not emit a restrictive robots value.
- Sitemap always describes Production canonical URLs; Preview builds may generate the same sitemap document for validation, but its entries remain Production URLs.
- No Preview URL is persisted into `content/**`.

## 4. URL contract

Plan 50 introduces one shared URL model instead of hand-building SEO URLs in individual pages.

Conceptual API:

```ts
export type SeoEnvironment = 'production' | 'preview'

export type SiteUrlContext = {
  environment: SeoEnvironment
  productionOrigin: string
  productionBase: string
  runtimeOrigin: string
  runtimeBase: string
}

export function productionUrl(path: string, context: SiteUrlContext): string
export function runtimeUrl(path: string, context: SiteUrlContext): string
```

Rules:

1. all returned SEO URLs are absolute;
2. path normalization preserves Orbis trailing-slash route semantics;
3. production URL uses `site.origin + site.basePath` regardless of Preview runtime overrides;
4. runtime/share URL uses Astro runtime `site`/`base` values;
5. no helper hard-codes `/Orbis/`, `raw.githack.com` or a PR number;
6. invalid/missing absolute origin fails the build rather than silently emitting a relative canonical.

`tools/shared/site-config.ts` and Web SEO helpers may have separate implementations, but they must obey the same observable URL contract.

## 5. Site metadata contract

`config/site.yaml` remains the single repository-level metadata source. Extend `site` only with values that are truly site-wide:

```yaml
site:
  name: Orbis
  origin: https://xiaodaojiang.github.io
  basePath: /Orbis
  locale: zh-CN
  defaultTitle: Orbis
  defaultDescription: Essays, briefs, slides, topics and durable knowledge.
  defaultSocialImage: /social/orbis-default.png
  brandName: Orbis
```

Do not duplicate content-specific title, description, authors, dates or topics here.

`defaultSocialImage` is a path under the built site and is resolved to an absolute runtime URL for OG/Twitter sharing. The first release uses one static 1200×630 brand image; per-content generated OG images are explicitly deferred.

## 6. BaseLayout SEO interface

`BaseLayout.astro` becomes the single HTML-head renderer for Astro pages.

Conceptual props:

```ts
type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>

interface SeoProps {
  title?: string
  description?: string
  canonicalPath?: string
  sharePath?: string
  type?: 'website' | 'article'
  imagePath?: string
  robots?: 'index,follow' | 'noindex,nofollow'
  jsonLd?: JsonLdValue
}
```

Page components pass route/content intent; they do not construct absolute URLs themselves.

BaseLayout emits:

- title;
- meta description;
- canonical link when the page has a canonical identity;
- robots policy derived from environment unless explicitly stricter;
- Open Graph title/description/url/type/image/locale/site_name;
- Twitter Card title/description/image using `summary_large_image`;
- RSS discovery;
- JSON-LD script when provided.

The default social image must exist in the final artifact or the build fails.

## 7. Canonical page taxonomy

### 7.1 Canonical and indexable

Production canonical URLs are generated for:

- `/`;
- `/essays/` and `/essays/:id/`;
- `/briefs/`, cadence indexes and `/briefs/:id/`;
- `/knowledge/` and `/knowledge/:id/`;
- `/topics/` and `/topics/:id/`;
- `/archive/`;
- `/slides/`;
- standalone Presentation deck URLs `/slides/:slug/` when the source kind is `presentation` and therefore has no Reading page.

Only public content participates.

### 7.2 Alias/non-primary routes

Daily aliases are navigation conveniences, not distinct content identities:

- `/latest/` canonicalizes to the current Daily Reading URL;
- `/YYYY/MM/DD/` canonicalizes to the corresponding `/briefs/:id/` Reading URL.

They are excluded from sitemap entries.

### 7.3 Brief-derived Slidev decks

For `daily-v1` and `weekly-v1` decks:

- UI Reading backlink remains mandatory;
- Slide deck canonical points to the corresponding Astro Reading URL;
- deck URL is not added as a separate sitemap canonical;
- do not add `noindex` in 50A unless evidence later shows a need; canonical/backlink is the first-release boundary.

### 7.4 Standalone Talk decks

`talk-v1` has no fake Reading page. Therefore:

- the deck self-canonicalizes to `/slides/:slug/`;
- it may appear in sitemap because it is the only public canonical resource for that Presentation;
- it must not fabricate an Astro Reading canonical.

## 8. Open Graph and Twitter contract

All canonical public Astro pages receive basic social metadata.

Required fields:

```text
og:title
og:description
og:url
og:type
og:image
og:locale
og:site_name
twitter:card = summary_large_image
twitter:title
twitter:description
twitter:image
```

Semantics:

- home/index pages use `website`;
- Essay, Brief and Knowledge detail pages use `article`;
- Topic/Archive/Slides indexes use `website`;
- `og:url` is the current runtime/share URL, while canonical remains Production identity;
- title/description come from content fields where available, otherwise site defaults;
- first release uses the static default social image.

## 9. Sitemap contract

Prefer one generated `/sitemap.xml`; a sitemap index is unnecessary at current content scale.

The sitemap is built from structured content and explicit public route taxonomy, not by crawling `dist/site`.

Include:

- canonical static indexes;
- published Essay detail pages;
- published Brief detail pages;
- public Knowledge detail pages (`published` or `active` under the existing public policy);
- active/public Topic pages under existing Topic visibility rules;
- standalone public Presentation deck URLs.

Exclude:

- draft/needs-review/archived private content under existing public visibility rules;
- `/latest/`;
- `/YYYY/MM/DD/` aliases;
- Brief-derived Slide deck URLs;
- Preview-only branches/routes;
- generated assets and RSS.

All `<loc>` values are absolute Production URLs even during Preview builds.

## 10. RSS contract

RSS and canonical identity must agree in Production without breaking Preview reviewability.

Production:

```text
item link = Production Reading canonical URL
```

Preview:

```text
item link = Preview Reading URL
```

This keeps Preview RSS links usable for artifact review while ensuring the production feed publishes the canonical Reading identity.

The RSS route must stop relying on a fallback hard-coded origin and consume Astro/site URL context deterministically.

## 11. JSON-LD scope — 50B

50B adds structured data only after the 50A URL contract is stable.

### 11.1 Site

Homepage emits `WebSite`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Orbis",
  "url": "<production home canonical>",
  "description": "<site default description>",
  "inLanguage": "zh-CN"
}
```

### 11.2 Essay

Essay emits `Article` using only real fields:

- `headline` ← title;
- `description` ← description;
- `datePublished` ← publishedAt;
- `dateModified` ← updatedAt ?? publishedAt;
- `mainEntityOfPage` ← production canonical;
- `url` ← production canonical;
- `inLanguage` ← site locale;
- `author` ← resolved Author Registry entries in declared order.

Author mapping:

```json
{
  "@type": "Person",
  "name": "XiaoDaoJiang",
  "url": "https://github.com/XiaoDaoJiang"
}
```

`url` is omitted when the Author Registry has none. Archived Authors remain valid historical people; status is not emitted as Schema.org data.

### 11.3 Brief

Brief emits `Article`:

- `headline` ← title;
- `description` ← summary;
- `datePublished` ← publishedAt;
- `mainEntityOfPage`/`url` ← production Reading canonical;
- `inLanguage` ← site locale;
- no fabricated person author because Brief schema has no author field.

### 11.4 Knowledge

Knowledge emits `TechArticle`:

- `headline` ← title;
- `description` ← summary;
- `datePublished` ← publishedAt;
- `dateModified` ← updatedAt ?? publishedAt;
- `mainEntityOfPage`/`url` ← production canonical;
- `inLanguage` ← site locale.

Do not map `reviewAt` to an unrelated Schema.org property.

### 11.5 Source Registry

Reference Source Registry metadata is not emitted as Article publisher/author by default. A Source entity describes citation provenance, not necessarily the publisher of the Orbis page.

## 12. Error handling and build invariants

Plan 50 treats SEO metadata as a build contract, not optional decoration.

Build must fail when:

- production origin is missing or not an absolute HTTP(S) URL;
- generated canonical is relative;
- canonical loses the configured base path;
- a canonical public content route has no canonical link;
- Preview canonical contains `raw.githack.com` or `preview-pr-`;
- Production canonical contains Preview origin/branch data;
- sitemap contains aliases, non-public content or Brief-derived deck URLs;
- default social image is absent;
- JSON-LD cannot be parsed as JSON;
- Article/TechArticle URL differs from the page production canonical;
- Essay JSON-LD cannot resolve a declared Author (normally already prevented by Plan 40 integrity).

## 13. Testing strategy

### 13.1 Focused URL/metadata tests

Add pure tests for:

- production vs Preview canonical/share URL derivation;
- base-path normalization;
- trailing slash stability;
- Preview robots policy;
- invalid origin failure.

### 13.2 Artifact tests

Extend final artifact checks to inspect generated HTML/XML:

- homepage canonical/OG/Twitter;
- real Essay detail canonical and social metadata;
- real Daily and Weekly Reading metadata;
- Knowledge metadata;
- `/latest/` and date alias canonical target;
- `sitemap.xml` inclusion/exclusion contract;
- default social image existence;
- Preview HTML canonical Production + robots noindex + OG runtime URL.

### 13.3 JSON-LD tests

50B parses every emitted `application/ld+json` block and verifies:

- valid JSON;
- expected `@type`;
- canonical URL equality;
- real dates only;
- Essay Author order and optional Author URL semantics;
- no invented Source-as-publisher field.

### 13.4 End-to-end gates

Every PR still requires:

- Path Guard;
- full `pnpm build`;
- read-only PR artifact;
- Trusted Preview publication;
- public Preview smoke.

Production verification after merge continues through the guarded Pages workflow.

## 14. Delivery split

### 50A — SEO Foundation

Suggested PR title:

```text
feat: add canonical seo metadata and sitemap
```

Scope:

- extend SiteConfig site metadata;
- add production/runtime URL helpers;
- expand BaseLayout head contract;
- add canonical/robots/OG/Twitter metadata;
- add static 1200×630 default social image;
- add `/sitemap.xml`;
- align production RSS links with canonical Reading URLs while retaining Preview runtime links;
- add Brief-derived Slide canonical-to-Reading and standalone Talk self-canonical behavior;
- add focused + artifact contracts for Production and Preview.

50A does not add JSON-LD.

### 50B — Structured Data

Suggested PR title:

```text
feat: add structured data for published content
```

Scope:

- WebSite JSON-LD;
- Essay Article + Author Registry mapping;
- Brief Article;
- Knowledge TechArticle;
- JSON parse/schema-shape artifact validation.

50B consumes 50A canonical helpers and does not redefine URL identity.

## 15. Non-goals

Plan 50 does not add:

- dynamic or server-rendered OG images;
- per-content image generation;
- SEO ranking promises;
- keyword stuffing;
- hreflang/multilingual routing;
- analytics or marketing tracking;
- database/CMS/search service;
- Source/Author public directory routes;
- fake authors for Brief/Knowledge;
- fake Reading pages for standalone Presentations;
- automatic `noindex` for every Slidev deck in the first release.

## 16. Acceptance criteria

Plan 50 is complete when:

1. every primary public Astro page has an absolute Production canonical;
2. Preview pages canonicalize to Production and emit `noindex,nofollow`;
3. Preview social `og:url` remains the Preview URL;
4. Production OG/Twitter metadata uses correct absolute URLs and a valid 1200×630 default image;
5. sitemap contains only public canonical resources and no aliases/Preview URLs/Brief-derived deck duplicates;
6. Production RSS links equal canonical Reading URLs;
7. Brief-derived Slide decks canonicalize/backlink to Reading while standalone Talks self-canonicalize;
8. WebSite/Essay/Brief/Knowledge JSON-LD uses only real schema fields and parses successfully;
9. Essay JSON-LD resolves Author Registry metadata in declared order;
10. `pnpm build`, PR Preview and final Production Pages verification detect origin/base/canonical regressions automatically.

## 17. Dependency gate

Plan 50 design and planning may proceed while Plan 40 closeout is being verified. Plan 50 implementation must not be treated as production-ready until a Plan 40 `Orbis Pages Production` run on `main@0c867438...` has `Deploy to GitHub Pages = success` and the built-in public smoke check passes.
