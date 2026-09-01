# Plan 50A — SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` in environments without subagent dispatch. Execute each task with RED → GREEN evidence before moving on.

**Goal:** Add deterministic Production/Preview URL identity, canonical/robots/Open Graph/Twitter metadata, a static social image, sitemap, RSS URL alignment, and Slide/alias canonical contracts without changing Orbis content or routing semantics.

**Architecture:** `config/site.yaml` remains the Production metadata source; existing `SITE_ORIGIN` / `SITE_BASE` remain the only runtime Preview overrides. Shared URL helpers define Production/runtime absolute URLs, Astro `BaseLayout` renders Web SEO, slide generation writes an output-only generic SEO sidecar, and `build-slides` injects canonical/robots into compiled Slidev HTML. Redirect aliases keep their existing targets but gain Production Reading canonical metadata.

**Tech Stack:** Astro 7.2.9, Slidev, TypeScript 5.9.3, Node >=22.13.0 / CI 22.16.0, pnpm 11.24.0, YAML 2.8.3.

**Spec:** `docs/superpowers/specs/2026-09-01-seo-sharing-design.md`

## Global Constraints

- Baseline: `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`.
- Plan 40 production gate is green: Pages run `33495089941` built, deployed, and publicly smoked the exact baseline.
- Production canonical uses only `config/site.yaml` `site.origin + site.basePath`.
- Preview share URL uses only existing `SITE_ORIGIN + SITE_BASE` overrides.
- Preview Astro, Slidev, and redirect aliases: `robots=noindex,nofollow`; canonical still points to Production.
- Production Slidev is not blanket noindex: Brief-derived decks canonicalize to Reading; standalone Talks self-canonicalize.
- `/latest/` and `/YYYY/MM/DD/` redirect behavior must not change.
- No JSON-LD in 50A; that is 50B.
- One committed 1200×630 PNG social image; no runtime image service/dependency.
- Do not commit `apps/slides/generated/**`, `dist/**`, or compiled HTML.
- Keep `daily-v1`, `weekly-v1`, and `talk-v1` body/rendering contracts unchanged.

## Files

**Create**
- `apps/web/src/lib/seo.ts`
- `apps/web/src/pages/sitemap.xml.ts`
- `apps/web/public/social/orbis-default.png`
- `tools/generate-slides/presentation-seo.ts`
- `tools/seo/url-contract.test.ts`
- `tools/seo/web-artifact-check.ts`
- `tools/seo/site-artifact-check.ts`

**Modify**
- `config/site.yaml`
- `tools/shared/site-config.ts`
- `apps/web/src/layouts/BaseLayout.astro`
- `apps/web/src/pages/briefs/[id].astro`
- `apps/web/src/pages/essays/[id].astro`
- `apps/web/src/pages/knowledge/[id].astro`
- `apps/web/src/pages/rss.xml.ts`
- `tools/generate-slides/index.ts`
- `tools/build-slides/index.ts`
- `tools/assemble-site/index.ts`
- `package.json`

---

## Task 1 — Shared Production/Runtime URL Contract

**Produces**

```ts
normalizeSiteOrigin(value: string): string
absoluteSiteUrl(origin: string, basePath: string, routePath: string): string
productionSiteUrl(config: SiteConfig, routePath: string): string
runtimeSiteOrigin(config: SiteConfig): string
runtimeSiteUrl(config: SiteConfig, routePath: string): string
isPreviewRuntime(config: SiteConfig): boolean
```

### RED

- [ ] Create `tools/seo/url-contract.test.ts`:

```ts
import assert from 'node:assert/strict'
import type { SiteConfig } from '../shared/site-config.ts'
import {
  absoluteSiteUrl,
  isPreviewRuntime,
  normalizeSiteOrigin,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../shared/site-config.ts'

const config: SiteConfig = {
  version: 1,
  site: {
    name: 'Orbis',
    origin: 'https://xiaodaojiang.github.io',
    basePath: '/Orbis',
    locale: 'zh-CN',
    defaultTitle: 'Orbis',
    defaultDescription: 'Essays, briefs, slides, topics and durable knowledge.',
    defaultSocialImage: '/social/orbis-default.png',
    brandName: 'Orbis',
  },
  content: { briefsDir: 'content/briefs', presentationsDir: 'content/presentations' },
  presentation: { generatedDir: 'apps/slides/generated', outputDir: 'dist/slides', publicPath: 'slides' },
  preview: { provider: 'raw.githack', origin: 'https://raw.githack.com', repositoryPath: '/XiaoDaoJiang/Orbis', branchPrefix: 'preview-pr-' },
}

assert.equal(normalizeSiteOrigin('https://xiaodaojiang.github.io/'), 'https://xiaodaojiang.github.io')
assert.equal(absoluteSiteUrl(config.site.origin, config.site.basePath, '/briefs/example/'), 'https://xiaodaojiang.github.io/Orbis/briefs/example/')
assert.equal(absoluteSiteUrl(config.site.origin, config.site.basePath, '/sitemap.xml'), 'https://xiaodaojiang.github.io/Orbis/sitemap.xml')
assert.equal(productionSiteUrl(config, '/briefs/example/'), 'https://xiaodaojiang.github.io/Orbis/briefs/example/')

const oldOrigin = process.env.SITE_ORIGIN
const oldBase = process.env.SITE_BASE
process.env.SITE_ORIGIN = 'https://raw.githack.com'
process.env.SITE_BASE = '/XiaoDaoJiang/Orbis/preview-pr-50'
try {
  assert.equal(isPreviewRuntime(config), true)
  assert.equal(runtimeSiteUrl(config, '/briefs/example/'), 'https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-50/briefs/example/')
  assert.equal(productionSiteUrl(config, '/briefs/example/'), 'https://xiaodaojiang.github.io/Orbis/briefs/example/')
} finally {
  if (oldOrigin === undefined) delete process.env.SITE_ORIGIN; else process.env.SITE_ORIGIN = oldOrigin
  if (oldBase === undefined) delete process.env.SITE_BASE; else process.env.SITE_BASE = oldBase
}

assert.throws(() => normalizeSiteOrigin('ftp://example.com'), /HTTP\(S\)/)
assert.throws(() => normalizeSiteOrigin('/relative'), /absolute HTTP\(S\)/)
console.log('SEO URL contract passed')
```

- [ ] Run and observe the intended missing-export failure:

```bash
pnpm exec tsx tools/seo/url-contract.test.ts
```

### GREEN

- [ ] Extend `config/site.yaml`:

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

- [ ] Extend `SiteConfig.site` and validation in `tools/shared/site-config.ts`, then add:

```ts
export function normalizeSiteOrigin(value: string): string {
  let url: URL
  try { url = new URL(value) } catch { throw new Error(`Site origin must be an absolute HTTP(S) URL: ${value}`) }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`Site origin must use HTTP(S): ${value}`)
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) throw new Error(`Site origin must not contain a path, query, or hash: ${value}`)
  return url.origin
}

export function absoluteSiteUrl(origin: string, basePath: string, routePath: string): string {
  const normalizedOrigin = normalizeSiteOrigin(origin)
  const normalizedBase = normalizeBasePath(basePath)
  const wantsSlash = routePath === '/' || routePath.endsWith('/')
  const joined = joinBasePath(normalizedBase, routePath)
  const pathname = joined === '/' ? '/' : wantsSlash ? `${joined}/` : joined
  return new URL(pathname, `${normalizedOrigin}/`).href
}

export function productionSiteUrl(config: SiteConfig, routePath: string): string {
  return absoluteSiteUrl(config.site.origin, config.site.basePath, routePath)
}
export function runtimeSiteOrigin(config: SiteConfig): string {
  return normalizeSiteOrigin(process.env.SITE_ORIGIN ?? config.site.origin)
}
export function runtimeSiteUrl(config: SiteConfig, routePath: string): string {
  return absoluteSiteUrl(runtimeSiteOrigin(config), runtimeSiteBase(config), routePath)
}
export function isPreviewRuntime(config: SiteConfig): boolean {
  return runtimeSiteOrigin(config) !== normalizeSiteOrigin(config.site.origin)
    || runtimeSiteBase(config) !== normalizeBasePath(config.site.basePath)
}
```

- [ ] Add root script:

```json
"test:seo-url": "tsx tools/seo/url-contract.test.ts"
```

Insert `pnpm test:seo-url` into `validate` before `content:validate`.

- [ ] Verify:

```bash
pnpm test:seo-url
pnpm build:web
```

Expected: `SEO URL contract passed`; Web build exits 0.

- [ ] Commit:

```bash
git add config/site.yaml tools/shared/site-config.ts tools/seo/url-contract.test.ts package.json
git commit -m "feat: establish seo url contract"
```

---

## Task 2 — Astro Canonical / Robots / OG / Twitter

**Produces**

```ts
buildSeoMetadata(input): Promise<{
  title: string
  description: string
  canonicalUrl: string
  shareUrl: string
  imageUrl: string
  type: 'website' | 'article'
  robots: 'index,follow' | 'noindex,nofollow'
  locale: string
  siteName: string
}>
```

### RED

- [ ] Create `tools/seo/web-artifact-check.ts`. It must load one public Essay, Brief, and Knowledge entry from `content/**`, then inspect `dist/web/index.html` and those three detail pages. For every sample assert:

```ts
const canonical = productionSiteUrl(config, sample.path)
const share = runtimeSiteUrl(config, sample.path)
assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`))
assert.ok(html.includes(`<meta property="og:url" content="${share}">`))
assert.ok(html.includes(`<meta property="og:type" content="${sample.type}">`))
assert.ok(html.includes('name="twitter:card" content="summary_large_image"'))
assert.ok(html.includes(`property="og:image" content="${runtimeSiteUrl(config, config.site.defaultSocialImage)}"`))
assert.ok(html.includes(`name="robots" content="${isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'}"`))
```

Use existing `listFiles`, `readYaml`, `readMarkdownFrontmatter`, and `briefSchema` / `essaySchema` / `knowledgeSchema`; do not hard-code current content IDs.

- [ ] Run:

```bash
pnpm build:web
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Expected: FAIL on missing canonical metadata.

### GREEN

- [ ] Create `apps/web/src/lib/seo.ts`:

```ts
import {
  isPreviewRuntime,
  loadSiteConfig,
  normalizeBasePath,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../../../../tools/shared/site-config.ts'

export type SeoPageType = 'website' | 'article'

function routePath(pathname: string, runtimeBase: string): string {
  const base = normalizeBasePath(runtimeBase)
  if (!base) return pathname || '/'
  if (pathname === base || pathname === `${base}/`) return '/'
  if (!pathname.startsWith(`${base}/`)) throw new Error(`Runtime pathname ${pathname} does not start with base ${base}`)
  return pathname.slice(base.length) || '/'
}

export async function buildSeoMetadata(input: {
  pathname: string
  runtimeBase: string
  title?: string
  description?: string
  canonicalPath?: string
  sharePath?: string
  imagePath?: string
  type?: SeoPageType
}) {
  const config = await loadSiteConfig()
  const current = routePath(input.pathname, input.runtimeBase)
  return {
    title: input.title ?? config.site.defaultTitle,
    description: input.description ?? config.site.defaultDescription,
    canonicalUrl: productionSiteUrl(config, input.canonicalPath ?? current),
    shareUrl: runtimeSiteUrl(config, input.sharePath ?? current),
    imageUrl: runtimeSiteUrl(config, input.imagePath ?? config.site.defaultSocialImage),
    type: input.type ?? 'website',
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' as const : 'index,follow' as const,
    locale: config.site.locale,
    siteName: config.site.brandName,
  }
}
```

- [ ] Create `apps/web/public/social/orbis-default.png`, exactly 1200×630. Reuse favicon palette/identity:

```text
background #2c2416
ring       #d4a574
node       #d97642
arc        #f5e6d3
```

This is a committed static asset; do not add image-generation dependencies.

- [ ] Extend `BaseLayout.astro` props with `canonicalPath`, `sharePath`, `type`, `imagePath`; call `buildSeoMetadata()` using `Astro.url.pathname` and `import.meta.env.BASE_URL`.

Render exactly one canonical plus:

```astro
<meta name="robots" content={seo.robots} />
<link rel="canonical" href={seo.canonicalUrl} />
<meta property="og:title" content={seo.title} />
<meta property="og:description" content={seo.description} />
<meta property="og:url" content={seo.shareUrl} />
<meta property="og:type" content={seo.type} />
<meta property="og:image" content={seo.imageUrl} />
<meta property="og:locale" content={seo.locale} />
<meta property="og:site_name" content={seo.siteName} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={seo.title} />
<meta name="twitter:description" content={seo.description} />
<meta name="twitter:image" content={seo.imageUrl} />
```

Use `<html lang={seo.locale}>`; preserve visible layout/navigation.

- [ ] Mark only `briefs/[id].astro`, `essays/[id].astro`, `knowledge/[id].astro` as `type="article"`; indexes/Topic/Archive/Slides remain website.

- [ ] Extend Web artifact check to validate PNG signature and dimensions:

```ts
const png = await readFile(resolve(root, 'dist/web/social/orbis-default.png'))
assert.equal(png.toString('ascii', 1, 4), 'PNG')
assert.equal(png.readUInt32BE(16), 1200)
assert.equal(png.readUInt32BE(20), 630)
```

- [ ] Add:

```json
"test:seo-web": "tsx tools/seo/web-artifact-check.ts"
```

Run it immediately after `build:web` in root `build`.

- [ ] Verify and commit:

```bash
pnpm build:web
pnpm test:seo-web
git add apps/web/src/lib/seo.ts apps/web/public/social/orbis-default.png apps/web/src/layouts/BaseLayout.astro apps/web/src/pages/briefs/[id].astro apps/web/src/pages/essays/[id].astro apps/web/src/pages/knowledge/[id].astro tools/seo/web-artifact-check.ts package.json
git commit -m "feat: add canonical and social metadata"
```

---

## Task 3 — Sitemap and RSS Identity

### RED

- [ ] Extend `web-artifact-check.ts` to require `dist/web/sitemap.xml`, Production-only `<loc>` values, no `/latest/`, no date aliases, no raw.githack/preview identity, and a runtime Reading URL inside `rss.xml`.

Core assertions:

```ts
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, '/')}</loc>`))
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, `/essays/${essay.id}/`)}</loc>`))
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, `/briefs/${brief.id}/`)}</loc>`))
assert.ok(!sitemap.includes('/latest/'))
assert.ok(!/\/\d{4}\/\d{2}\/\d{2}\//.test(sitemap))
assert.ok(!sitemap.includes('raw.githack.com'))
assert.ok(!sitemap.includes('preview-pr-'))
assert.ok(rss.includes(runtimeSiteUrl(config, `/briefs/${brief.id}/`)))
```

- [ ] Run `pnpm build:web && pnpm test:seo-web` and observe RED because sitemap is absent.

### GREEN

- [ ] Create `apps/web/src/pages/sitemap.xml.ts`. Use `getCollection()` with existing public policies:

```text
essays          status=published
briefs          status=published
knowledge       status=published|active
topics          status!=archived
presentations   status=published
```

Static canonical paths:

```text
/
/essays/
/briefs/
/briefs/daily/
/briefs/weekly/
/knowledge/
/topics/
/archive/
/slides/
```

Add detail paths for public Essay/Brief/Knowledge/Topic and standalone Presentation `/slides/<id>/`. Build every `<loc>` using `productionSiteUrl(config, path)`, sort deterministically, XML-escape values, return `application/xml; charset=utf-8`.

Do **not** add `/latest/`, date aliases, RSS/assets, or Brief-derived deck URLs.

- [ ] Update `rss.xml.ts`: load SiteConfig; build every item link with `runtimeSiteUrl(config, readingPath)`; set RSS `site` to `runtimeSiteUrl(config, '/')`; use config title/description/locale. Remove literal `https://xiaodaojiang.github.io` fallback.

- [ ] Verify Production mode by genuinely unsetting Preview variables:

```bash
env -u SITE_ORIGIN -u SITE_BASE pnpm build:web
env -u SITE_ORIGIN -u SITE_BASE pnpm test:seo-web
```

PowerShell equivalent:

```powershell
Remove-Item Env:SITE_ORIGIN -ErrorAction SilentlyContinue
Remove-Item Env:SITE_BASE -ErrorAction SilentlyContinue
pnpm build:web
pnpm test:seo-web
```

- [ ] Verify Preview mode:

```bash
SITE_ORIGIN=https://raw.githack.com SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 pnpm build:web
SITE_ORIGIN=https://raw.githack.com SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 pnpm test:seo-web
```

Expected: canonical+sitemap remain Production; OG/image/RSS use Preview; robots noindex.

- [ ] Commit:

```bash
git add apps/web/src/pages/sitemap.xml.ts apps/web/src/pages/rss.xml.ts tools/seo/web-artifact-check.ts
git commit -m "feat: add sitemap and rss url identity"
```

---

## Task 4 — Slidev and Alias Canonical Metadata

### RED

- [ ] Create `tools/seo/site-artifact-check.ts`. Use `discoverPresentationDescriptors()` to inspect every `dist/site/slides/<slug>/index.html`:

```ts
const expected = descriptor.sourceKind === 'brief'
  ? productionSiteUrl(config, `/briefs/${descriptor.slug}/`)
  : productionSiteUrl(config, `/slides/${descriptor.slug}/`)
assert.ok(html.includes(`<link rel="canonical" href="${expected}">`))
assert.ok(html.includes(`<meta name="robots" content="${isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'}">`))
```

Load all published Daily Briefs and require each date alias plus `/latest/` canonicalize to Production `/briefs/<slug>/`.

- [ ] Start from a clean generated/output state and observe RED:

```bash
pnpm build:web
pnpm generate:slides
pnpm build:slides
pnpm assemble
pnpm exec tsx tools/seo/site-artifact-check.ts
```

Expected: missing canonical in Slidev or redirect HTML.

### GREEN

- [ ] Create `tools/generate-slides/presentation-seo.ts`:

```ts
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'
import type { SiteConfig } from '../shared/site-config.ts'
import { isPreviewRuntime, productionSiteUrl } from '../shared/site-config.ts'

export type PresentationSeoManifest = {
  canonicalUrl: string
  robots: 'index,follow' | 'noindex,nofollow'
}

export function buildPresentationSeoManifest(descriptor: PresentationDescriptor, config: SiteConfig): PresentationSeoManifest {
  const path = descriptor.sourceKind === 'brief'
    ? `/briefs/${descriptor.slug}/`
    : `/slides/${descriptor.slug}/`
  return {
    canonicalUrl: productionSiteUrl(config, path),
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow',
  }
}
```

- [ ] In `generate-slides/index.ts`, after `slides.md`, write output-only `seo.json`:

```ts
await writeFile(
  resolve(directory, 'seo.json'),
  `${JSON.stringify(buildPresentationSeoManifest(descriptor, config), null, 2)}\n`,
  'utf8',
)
```

- [ ] In `build-slides/index.ts`, after each successful Slidev build read `<generated>/<slug>/seo.json`, read `<out>/index.html`, reject missing `</head>` or an existing canonical, then insert:

```html
<link rel="canonical" href="..."><meta name="robots" content="...">
```

Escape HTML attribute values. Do not branch on template names.

- [ ] In `assemble-site/index.ts`, change `redirectHtml(target)` to `redirectHtml(target, canonicalUrl, robots)`. Keep existing JavaScript/noscript redirect target selection unchanged.

For every Daily date alias compute canonical separately:

```ts
const canonicalUrl = productionSiteUrl(config, `/briefs/${slug}/`)
```

Store canonical by date for `/latest/`. Preview aliases get `noindex,nofollow`; Production aliases get `index,follow`.

- [ ] Add root script:

```json
"test:seo-site": "tsx tools/seo/site-artifact-check.ts"
```

Run after final assembly/site/scope gates in root `build`.

- [ ] Verify clean Production and Preview pipelines:

```bash
env -u SITE_ORIGIN -u SITE_BASE pnpm build
SITE_ORIGIN=https://raw.githack.com SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 pnpm build
```

Both must print:

```text
SEO URL contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
```

- [ ] Commit:

```bash
git add tools/generate-slides/presentation-seo.ts tools/generate-slides/index.ts tools/build-slides/index.ts tools/assemble-site/index.ts tools/seo/site-artifact-check.ts package.json
git commit -m "feat: add slide and alias canonical metadata"
```

---

## Task 5 — Full 50A Integration Gate

- [ ] Run frozen dependency + Production build from a clean environment:

```bash
env -u SITE_ORIGIN -u SITE_BASE pnpm install --frozen-lockfile
env -u SITE_ORIGIN -u SITE_BASE pnpm build
git diff --check
```

PowerShell: remove both environment variables first, then run the same pnpm/git commands.

- [ ] Run explicit Preview build:

```bash
SITE_ORIGIN=https://raw.githack.com SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 pnpm build
```

- [ ] Scope audit. Allowed implementation paths:

```text
config/site.yaml
apps/web/public/social/orbis-default.png
apps/web/src/lib/seo.ts
apps/web/src/layouts/BaseLayout.astro
apps/web/src/pages/briefs/[id].astro
apps/web/src/pages/essays/[id].astro
apps/web/src/pages/knowledge/[id].astro
apps/web/src/pages/rss.xml.ts
apps/web/src/pages/sitemap.xml.ts
tools/shared/site-config.ts
tools/generate-slides/presentation-seo.ts
tools/generate-slides/index.ts
tools/build-slides/index.ts
tools/assemble-site/index.ts
tools/seo/**
package.json
```

Reject changes to `content/**`, `packages/content-schema/**`, Slide template bodies, workflows, generated source, or `dist/**`.

- [ ] Push branch `feat/seo-foundation` and create non-Draft PR to `main` titled:

```text
feat: add canonical seo metadata and sitemap
```

PR body records RED/GREEN evidence, final Production build, explicit Preview build, changed-file scope, and `JSON-LD deferred to 50B`.

- [ ] Require real GitHub PR Build + artifact + Trusted Preview. Preview inspection must prove:

```text
Astro canonical       Production URL
Astro robots          noindex,nofollow
Astro og:url          Preview URL
sitemap <loc>         Production URLs only
RSS item links        Preview Reading URLs
Daily/Weekly Slide    Production Reading canonical + noindex
Standalone Talk       Production deck canonical + noindex
/latest/ + date alias Production Daily Reading canonical + noindex
```

- [ ] Merge is a separate GitHub integration gate. After merge require fresh `main` Site Build and governed `Orbis Pages Production` Build + Deploy + Smoke before marking 50A Done or starting 50B implementation.

## Self-Review

- [x] Spec coverage: every 50A requirement maps to a task.
- [x] No JSON-LD implementation leaks into 50A.
- [x] Production canonical and Preview share identity are separate.
- [x] Preview Astro/Slidev/aliases are noindex; Production Slidev is not blanket noindex.
- [x] Existing Daily redirect targets remain unchanged.
- [x] Brief-derived Slide vs standalone Talk canonical semantics are explicit.
- [x] Sitemap is structured-content driven, not dist crawling.
- [x] RSS Production/Preview behavior is explicit.
- [x] Production commands genuinely unset Preview variables; no empty-string override is used.
- [x] Slide/alias RED starts from a valid Web build before assembly.
- [x] No generated output is committed.
- [x] No TBD/TODO/placeholders remain.
