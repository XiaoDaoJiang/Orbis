# Plan 50A — SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended where available) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic Production/Preview URL identity, canonical/robots/Open Graph/Twitter metadata, a static social image, sitemap, RSS URL alignment, and Slide/alias canonical contracts without changing Orbis content or routing semantics.

**Architecture:** Keep `config/site.yaml` as the repository-level source for Production metadata and keep `SITE_ORIGIN` / `SITE_BASE` as runtime Preview overrides. Extend the existing shared SiteConfig helper with absolute URL functions, let Astro `BaseLayout` render Web SEO from one build-time helper, and let Slide generation write a small output-only SEO sidecar that `build-slides` injects into compiled HTML. Alias redirects remain behaviorally unchanged but gain Production Reading canonical metadata.

**Tech Stack:** Astro 7.2.9, Slidev, TypeScript 5.9.3, Node >=22.13.0 / CI 22.16.0, pnpm 11.24.0, YAML 2.8.3.

**Spec:** `docs/superpowers/specs/2026-09-01-seo-sharing-design.md`

## Global Constraints

- Baseline is `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`.
- Plan 40 Production Pages gate is green: run `33495089941` deployed the exact baseline and passed public smoke.
- Production canonical origin/base come only from `config/site.yaml` (`site.origin` + `site.basePath`).
- Runtime share origin/base come from existing `SITE_ORIGIN` / `SITE_BASE` overrides; do not add a second Preview URL configuration path.
- Preview Astro and Preview Slidev output must emit `noindex,nofollow` while canonical still points to Production.
- Production Slidev output is not blanket `noindex`; Brief-derived decks canonicalize to Reading, standalone Talks self-canonicalize.
- `/latest/` and `/YYYY/MM/DD/` keep their existing redirect behavior. 50A adds canonical metadata but does not change where a browser is redirected.
- `content/**` remains the only publishable content source.
- No JSON-LD in 50A; that is Plan 50B.
- No dynamic/per-content OG image generation service; use one committed 1200×630 static PNG.
- No generated `apps/slides/generated/**`, `dist/**`, or compiled HTML is committed.
- Keep existing Daily/Weekly/Talk presentation template bodies unchanged unless a failing contract proves a template-level change is unavoidable.

---

## File Structure

### Create

- `apps/web/src/lib/seo.ts` — Web build-time SEO metadata composition over the shared SiteConfig URL contract.
- `apps/web/src/pages/sitemap.xml.ts` — explicit structured-content sitemap using Production URLs only.
- `apps/web/public/social/orbis-default.png` — committed 1200×630 static Orbis social image.
- `tools/generate-slides/presentation-seo.ts` — build a generic presentation SEO sidecar from a `PresentationDescriptor`.
- `tools/seo/url-contract.test.ts` — pure Production/Preview URL contract tests.
- `tools/seo/web-artifact-check.ts` — inspect `dist/web` metadata, sitemap, RSS, and social image.
- `tools/seo/site-artifact-check.ts` — inspect assembled alias routes and compiled Slidev canonical/robots metadata.

### Modify

- `config/site.yaml` — add site-wide SEO defaults only.
- `tools/shared/site-config.ts` — validate metadata and expose absolute Production/runtime URL helpers.
- `apps/web/src/layouts/BaseLayout.astro` — single Astro head renderer for canonical/robots/OG/Twitter.
- `apps/web/src/pages/briefs/[id].astro` — mark Brief detail as article metadata.
- `apps/web/src/pages/essays/[id].astro` — mark Essay detail as article metadata.
- `apps/web/src/pages/knowledge/[id].astro` — mark Knowledge detail as article metadata.
- `apps/web/src/pages/rss.xml.ts` — use deterministic runtime absolute Reading URLs; remove hard-coded fallback origin.
- `tools/generate-slides/index.ts` — write output-only `seo.json` next to each generated `slides.md`.
- `tools/build-slides/index.ts` — inject canonical/robots into each compiled Slidev `index.html` from the sidecar.
- `tools/assemble-site/index.ts` — add Production Reading canonical + environment robots to Daily/latest redirect documents without changing redirect targets.
- `package.json` — wire focused URL, Web artifact, and assembled-site SEO gates into the existing build order.

---

### Task 1: Establish the shared SiteConfig URL contract

**Files:**
- Modify: `config/site.yaml`
- Modify: `tools/shared/site-config.ts`
- Create: `tools/seo/url-contract.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `normalizeSiteOrigin(value: string): string`
- Produces: `absoluteSiteUrl(origin: string, basePath: string, routePath: string): string`
- Produces: `productionSiteUrl(config: SiteConfig, routePath: string): string`
- Produces: `runtimeSiteOrigin(config: SiteConfig): string`
- Produces: `runtimeSiteUrl(config: SiteConfig, routePath: string): string`
- Produces: `isPreviewRuntime(config: SiteConfig): boolean`
- Preserves: current `normalizeBasePath`, `joinBasePath`, `runtimeSiteBase` behavior for existing consumers.

- [ ] **Step 1: Write the failing URL contract test**

Create `tools/seo/url-contract.test.ts`:

```ts
import assert from 'node:assert/strict'
import type { SiteConfig } from '../shared/site-config.ts'
import {
  absoluteSiteUrl,
  isPreviewRuntime,
  normalizeBasePath,
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
  content: {
    briefsDir: 'content/briefs',
    presentationsDir: 'content/presentations',
  },
  presentation: {
    generatedDir: 'apps/slides/generated',
    outputDir: 'dist/slides',
    publicPath: 'slides',
  },
  preview: {
    provider: 'raw.githack',
    origin: 'https://raw.githack.com',
    repositoryPath: '/XiaoDaoJiang/Orbis',
    branchPrefix: 'preview-pr-',
  },
}

assert.equal(normalizeBasePath('/Orbis/'), '/Orbis')
assert.equal(normalizeSiteOrigin('https://xiaodaojiang.github.io/'), 'https://xiaodaojiang.github.io')
assert.equal(
  absoluteSiteUrl('https://xiaodaojiang.github.io', '/Orbis', '/briefs/example/'),
  'https://xiaodaojiang.github.io/Orbis/briefs/example/',
)
assert.equal(
  absoluteSiteUrl('https://xiaodaojiang.github.io', '/Orbis', '/sitemap.xml'),
  'https://xiaodaojiang.github.io/Orbis/sitemap.xml',
)
assert.equal(
  productionSiteUrl(config, '/briefs/example/'),
  'https://xiaodaojiang.github.io/Orbis/briefs/example/',
)

const oldOrigin = process.env.SITE_ORIGIN
const oldBase = process.env.SITE_BASE
process.env.SITE_ORIGIN = 'https://raw.githack.com'
process.env.SITE_BASE = '/XiaoDaoJiang/Orbis/preview-pr-50'
try {
  assert.equal(isPreviewRuntime(config), true)
  assert.equal(
    runtimeSiteUrl(config, '/briefs/example/'),
    'https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-50/briefs/example/',
  )
  assert.equal(
    productionSiteUrl(config, '/briefs/example/'),
    'https://xiaodaojiang.github.io/Orbis/briefs/example/',
  )
} finally {
  if (oldOrigin === undefined) delete process.env.SITE_ORIGIN
  else process.env.SITE_ORIGIN = oldOrigin
  if (oldBase === undefined) delete process.env.SITE_BASE
  else process.env.SITE_BASE = oldBase
}

assert.throws(() => normalizeSiteOrigin('ftp://example.com'), /HTTP\(S\)/)
assert.throws(() => normalizeSiteOrigin('/relative'), /absolute HTTP\(S\)/)

console.log('SEO URL contract passed')
```

- [ ] **Step 2: Run the new test and observe RED**

Run:

```bash
pnpm exec tsx tools/seo/url-contract.test.ts
```

Expected: FAIL because `normalizeSiteOrigin`, `absoluteSiteUrl`, `productionSiteUrl`, `runtimeSiteUrl`, and `isPreviewRuntime` do not exist yet.

- [ ] **Step 3: Extend the site metadata configuration**

Update `config/site.yaml` site block to exactly:

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

Do not move Preview origin/branch fields into `site`.

- [ ] **Step 4: Implement the shared absolute URL helpers**

Extend `SiteConfig.site` in `tools/shared/site-config.ts` with:

```ts
site: {
  name: string
  origin: string
  basePath: string
  locale: string
  defaultTitle: string
  defaultDescription: string
  defaultSocialImage: string
  brandName: string
}
```

Add these helpers:

```ts
export function normalizeSiteOrigin(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Site origin must be an absolute HTTP(S) URL: ${value}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Site origin must use HTTP(S): ${value}`)
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new Error(`Site origin must not contain a path, query, or hash: ${value}`)
  }
  return url.origin
}

export function absoluteSiteUrl(origin: string, basePath: string, routePath: string): string {
  const normalizedOrigin = normalizeSiteOrigin(origin)
  const normalizedBase = normalizeBasePath(basePath)
  const wantsTrailingSlash = routePath === '/' || routePath.endsWith('/')
  const joined = joinBasePath(normalizedBase, routePath)
  const pathname = joined === '/' ? '/' : wantsTrailingSlash ? `${joined}/` : joined
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

Extend `loadSiteConfig()` validation so `name`, `locale`, `defaultTitle`, `defaultDescription`, `defaultSocialImage`, and `brandName` are required and `normalizeSiteOrigin()` is called for both Production and runtime origins when the helper is used.

- [ ] **Step 5: Run RED → GREEN verification**

Run:

```bash
pnpm exec tsx tools/seo/url-contract.test.ts
pnpm build:web
```

Expected: `SEO URL contract passed`, and the existing Web build still exits 0.

- [ ] **Step 6: Wire the unit gate into root validation**

Add to `package.json`:

```json
"test:seo-url": "tsx tools/seo/url-contract.test.ts"
```

Insert `pnpm test:seo-url` in `validate` before `pnpm content:validate`.

- [ ] **Step 7: Commit Task 1**

```bash
git add config/site.yaml tools/shared/site-config.ts tools/seo/url-contract.test.ts package.json
git commit -m "feat: establish seo url contract"
```

---

### Task 2: Render canonical, robots, Open Graph, and Twitter in Astro

**Files:**
- Create: `apps/web/src/lib/seo.ts`
- Create: `apps/web/public/social/orbis-default.png`
- Modify: `apps/web/src/layouts/BaseLayout.astro`
- Modify: `apps/web/src/pages/briefs/[id].astro`
- Modify: `apps/web/src/pages/essays/[id].astro`
- Modify: `apps/web/src/pages/knowledge/[id].astro`
- Create: `tools/seo/web-artifact-check.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 `SiteConfig` + absolute URL helpers.
- Produces: `buildSeoMetadata(input): Promise<SeoMetadata>`.
- BaseLayout owns all absolute URL construction; page routes pass content intent only.

- [ ] **Step 1: Add a failing Web artifact contract**

Create `tools/seo/web-artifact-check.ts` with these helpers and initial assertions:

```ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, essaySchema, knowledgeSchema } from '@orbis/content-schema'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'
import {
  isPreviewRuntime,
  loadSiteConfig,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()

function has(html: string, fragment: string, message: string) {
  assert.ok(html.includes(fragment), message)
}

async function firstPublishedEssay() {
  for (const file of await listFiles(resolve(root, 'content/essays'), ['.md', '.mdx'])) {
    const { data } = await readMarkdownFrontmatter(file)
    const parsed = essaySchema.parse(data)
    if (parsed.status === 'published') return { id: basename(file).replace(/\.(md|mdx)$/, ''), data: parsed }
  }
  throw new Error('SEO contract requires one published Essay')
}

async function firstPublishedBrief() {
  for (const file of await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])) {
    const parsed = briefSchema.parse(await readYaml(file))
    if (parsed.status === 'published') return { id: basename(file).replace(/\.(yaml|yml)$/, ''), data: parsed }
  }
  throw new Error('SEO contract requires one published Brief')
}

async function firstPublicKnowledge() {
  for (const file of await listFiles(resolve(root, 'content/knowledge'), ['.md', '.mdx'])) {
    const { data } = await readMarkdownFrontmatter(file)
    const parsed = knowledgeSchema.parse(data)
    if (parsed.status === 'published' || parsed.status === 'active') {
      return { id: basename(file).replace(/\.(md|mdx)$/, ''), data: parsed }
    }
  }
  throw new Error('SEO contract requires one public Knowledge entry')
}

const home = await readFile(resolve(root, 'dist/web/index.html'), 'utf8')
const essay = await firstPublishedEssay()
const brief = await firstPublishedBrief()
const knowledge = await firstPublicKnowledge()

for (const sample of [
  { path: '/', file: 'index.html', html: home, type: 'website' },
  { path: `/essays/${essay.id}/`, file: `essays/${essay.id}/index.html`, html: await readFile(resolve(root, `dist/web/essays/${essay.id}/index.html`), 'utf8'), type: 'article' },
  { path: `/briefs/${brief.id}/`, file: `briefs/${brief.id}/index.html`, html: await readFile(resolve(root, `dist/web/briefs/${brief.id}/index.html`), 'utf8'), type: 'article' },
  { path: `/knowledge/${knowledge.id}/`, file: `knowledge/${knowledge.id}/index.html`, html: await readFile(resolve(root, `dist/web/knowledge/${knowledge.id}/index.html`), 'utf8'), type: 'article' },
]) {
  const canonical = productionSiteUrl(config, sample.path)
  const share = runtimeSiteUrl(config, sample.path)
  has(sample.html, `<link rel="canonical" href="${canonical}">`, `${sample.file} must have Production canonical`)
  has(sample.html, `<meta property="og:url" content="${share}">`, `${sample.file} must have runtime og:url`)
  has(sample.html, `<meta property="og:type" content="${sample.type}">`, `${sample.file} must have correct og:type`)
  has(sample.html, 'name="twitter:card" content="summary_large_image"', `${sample.file} must have Twitter Card`)
  has(sample.html, `property="og:image" content="${runtimeSiteUrl(config, config.site.defaultSocialImage)}"`, `${sample.file} must have social image`)
  if (isPreviewRuntime(config)) {
    has(sample.html, 'name="robots" content="noindex,nofollow"', `${sample.file} Preview must be noindex`)
  } else {
    has(sample.html, 'name="robots" content="index,follow"', `${sample.file} Production must be indexable`)
  }
}

console.log('Web SEO artifact contract passed')
```

- [ ] **Step 2: Observe RED against the current Web artifact**

Run:

```bash
pnpm build:web
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Expected: FAIL on the missing `<link rel="canonical">` in the homepage or first content page.

- [ ] **Step 3: Implement the Web metadata helper**

Create `apps/web/src/lib/seo.ts`:

```ts
import {
  isPreviewRuntime,
  loadSiteConfig,
  normalizeBasePath,
  productionSiteUrl,
  runtimeSiteUrl,
} from '../../../../tools/shared/site-config.ts'

export type SeoPageType = 'website' | 'article'

export type SeoMetadata = {
  title: string
  description: string
  canonicalUrl: string
  shareUrl: string
  imageUrl: string
  type: SeoPageType
  robots: 'index,follow' | 'noindex,nofollow'
  locale: string
  siteName: string
}

function routePathFromRuntimePathname(pathname: string, runtimeBase: string): string {
  const base = normalizeBasePath(runtimeBase)
  if (!base) return pathname || '/'
  if (pathname === base || pathname === `${base}/`) return '/'
  if (!pathname.startsWith(`${base}/`)) {
    throw new Error(`Runtime pathname ${pathname} does not start with configured base ${base}`)
  }
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
}): Promise<SeoMetadata> {
  const config = await loadSiteConfig()
  const currentRoute = routePathFromRuntimePathname(input.pathname, input.runtimeBase)
  const canonicalPath = input.canonicalPath ?? currentRoute
  const sharePath = input.sharePath ?? currentRoute
  return {
    title: input.title ?? config.site.defaultTitle,
    description: input.description ?? config.site.defaultDescription,
    canonicalUrl: productionSiteUrl(config, canonicalPath),
    shareUrl: runtimeSiteUrl(config, sharePath),
    imageUrl: runtimeSiteUrl(config, input.imagePath ?? config.site.defaultSocialImage),
    type: input.type ?? 'website',
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow',
    locale: config.site.locale,
    siteName: config.site.brandName,
  }
}
```

- [ ] **Step 4: Generate and commit the static social image**

Create `apps/web/public/social/orbis-default.png` as a **1200×630 PNG**. Use the existing favicon identity exactly as the visual source:

```text
background     #2c2416
orbit ring     #d4a574
accent node    #d97642
inner arc      #f5e6d3
composition    enlarged orbital mark with generous negative space
```

Do not add a runtime image-generation dependency. This is a committed static asset.

- [ ] **Step 5: Make BaseLayout the single Astro SEO head renderer**

Update `BaseLayout.astro` props to:

```ts
interface Props {
  title?: string
  description?: string
  canonicalPath?: string
  sharePath?: string
  type?: 'website' | 'article'
  imagePath?: string
}
```

Call:

```ts
const seo = await buildSeoMetadata({
  pathname: Astro.url.pathname,
  runtimeBase: import.meta.env.BASE_URL,
  title,
  description,
  canonicalPath,
  sharePath,
  imagePath,
  type,
})
```

Render these exact head tags in addition to existing charset/viewport/favicon/RSS:

```astro
<meta name="description" content={seo.description} />
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

Set `<html lang={seo.locale}>`. Keep existing visible navigation/footer unchanged.

- [ ] **Step 6: Mark content detail pages as articles**

Change only the three detail calls:

```astro
<BaseLayout title={entry.data.title} description={...} type="article">
```

in:

- `apps/web/src/pages/briefs/[id].astro`
- `apps/web/src/pages/essays/[id].astro`
- `apps/web/src/pages/knowledge/[id].astro`

All indexes, Topic pages, Archive, Slides and homepage retain the default `website` type.

- [ ] **Step 7: Verify GREEN and image dimensions**

Extend `tools/seo/web-artifact-check.ts` after the HTML checks:

```ts
const png = await readFile(resolve(root, 'dist/web/social/orbis-default.png'))
assert.equal(png.toString('ascii', 1, 4), 'PNG')
assert.equal(png.readUInt32BE(16), 1200, 'Social image width must be 1200')
assert.equal(png.readUInt32BE(20), 630, 'Social image height must be 630')
```

Run:

```bash
pnpm build:web
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Expected: `Web SEO artifact contract passed`.

- [ ] **Step 8: Wire the Web artifact gate at the correct build stage**

Add:

```json
"test:seo-web": "tsx tools/seo/web-artifact-check.ts"
```

Change root `build` so `pnpm test:seo-web` runs immediately after `pnpm build:web` and before `pnpm build:slides`.

- [ ] **Step 9: Commit Task 2**

```bash
git add apps/web/src/lib/seo.ts apps/web/public/social/orbis-default.png apps/web/src/layouts/BaseLayout.astro apps/web/src/pages/briefs/[id].astro apps/web/src/pages/essays/[id].astro apps/web/src/pages/knowledge/[id].astro tools/seo/web-artifact-check.ts package.json
git commit -m "feat: add canonical and social metadata"
```

---

### Task 3: Add explicit sitemap and align RSS URL identity

**Files:**
- Create: `apps/web/src/pages/sitemap.xml.ts`
- Modify: `apps/web/src/pages/rss.xml.ts`
- Modify: `tools/seo/web-artifact-check.ts`

**Interfaces:**
- Consumes: Task 1 `productionSiteUrl()` / `runtimeSiteUrl()`.
- Sitemap emits Production URLs in both Production and Preview builds.
- RSS emits runtime Reading URLs: Production canonical in Production, Preview Reading URLs in Preview.

- [ ] **Step 1: Extend the Web artifact test to RED on missing sitemap**

Add to `tools/seo/web-artifact-check.ts`:

```ts
const sitemapPath = resolve(root, 'dist/web/sitemap.xml')
const sitemap = await readFile(sitemapPath, 'utf8')
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, '/')}</loc>`), 'Sitemap must include Production home canonical')
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, `/essays/${essay.id}/`)}</loc>`), 'Sitemap must include published Essay')
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, `/briefs/${brief.id}/`)}</loc>`), 'Sitemap must include published Brief')
assert.ok(sitemap.includes(`<loc>${productionSiteUrl(config, `/knowledge/${knowledge.id}/`)}</loc>`), 'Sitemap must include public Knowledge')
assert.ok(!sitemap.includes('/latest/'), 'Sitemap must exclude /latest/')
assert.ok(!sitemap.match(/\/\d{4}\/\d{2}\/\d{2}\//), 'Sitemap must exclude Daily date aliases')
assert.ok(!sitemap.includes('raw.githack.com'), 'Sitemap must never include Preview origin')
assert.ok(!sitemap.includes('preview-pr-'), 'Sitemap must never include Preview branch identity')
```

Also read `dist/web/rss.xml` and require the current environment Reading URL for the selected Brief:

```ts
const rss = await readFile(resolve(root, 'dist/web/rss.xml'), 'utf8')
assert.ok(rss.includes(runtimeSiteUrl(config, `/briefs/${brief.id}/`)), 'RSS must use runtime Reading URL')
```

- [ ] **Step 2: Observe RED**

Run:

```bash
pnpm build:web
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Expected: FAIL because `dist/web/sitemap.xml` does not exist.

- [ ] **Step 3: Implement the structured sitemap route**

Create `apps/web/src/pages/sitemap.xml.ts` with this shape:

```ts
import { getCollection } from 'astro:content'
import {
  loadSiteConfig,
  productionSiteUrl,
} from '../../../../tools/shared/site-config.ts'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET() {
  const config = await loadSiteConfig()
  const [essays, briefs, knowledge, topics, presentations] = await Promise.all([
    getCollection('essays', ({ data }) => data.status === 'published'),
    getCollection('briefs', ({ data }) => data.status === 'published'),
    getCollection('knowledge', ({ data }) => data.status === 'published' || data.status === 'active'),
    getCollection('topics', ({ data }) => data.status !== 'archived'),
    getCollection('presentations', ({ data }) => data.status === 'published'),
  ])

  const paths = new Set<string>([
    '/',
    '/essays/',
    '/briefs/',
    '/briefs/daily/',
    '/briefs/weekly/',
    '/knowledge/',
    '/topics/',
    '/archive/',
    '/slides/',
  ])

  for (const entry of essays) paths.add(`/essays/${entry.id}/`)
  for (const entry of briefs) paths.add(`/briefs/${entry.id}/`)
  for (const entry of knowledge) paths.add(`/knowledge/${entry.id}/`)
  for (const entry of topics) paths.add(`/topics/${entry.id}/`)
  for (const entry of presentations) paths.add(`/slides/${entry.id}/`)

  const urls = [...paths]
    .map((path) => productionSiteUrl(config, path))
    .sort()
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join('\n')

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
```

This intentionally does not add Brief-derived deck URLs because Brief Reading is their canonical identity.

- [ ] **Step 4: Remove RSS hard-coded origin fallback**

Update `apps/web/src/pages/rss.xml.ts` to load SiteConfig and build absolute runtime links:

```ts
const config = await loadSiteConfig()
const items = [
  ...essays.map((entry) => ({ ..., link: runtimeSiteUrl(config, `/essays/${entry.id}/`) })),
  ...briefs.map((entry) => ({ ..., link: runtimeSiteUrl(config, `/briefs/${entry.id}/`) })),
  ...knowledge.map((entry) => ({ ..., link: runtimeSiteUrl(config, `/knowledge/${entry.id}/`) })),
]

return rss({
  title: config.site.defaultTitle,
  description: config.site.defaultDescription,
  site: runtimeSiteUrl(config, '/'),
  items,
  customData: `<language>${config.site.locale}</language>`,
})
```

Delete the literal fallback `https://xiaodaojiang.github.io` from this route.

- [ ] **Step 5: Verify GREEN in both explicit URL modes**

Production-style run:

```bash
SITE_ORIGIN= SITE_BASE= pnpm build:web
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Then Preview-style run:

```bash
SITE_ORIGIN=https://raw.githack.com \
SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 \
pnpm build:web
SITE_ORIGIN=https://raw.githack.com \
SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 \
pnpm exec tsx tools/seo/web-artifact-check.ts
```

Expected in Preview: canonical and sitemap remain Production; `og:url`, image and RSS links use Preview; robots is `noindex,nofollow`.

- [ ] **Step 6: Commit Task 3**

```bash
git add apps/web/src/pages/sitemap.xml.ts apps/web/src/pages/rss.xml.ts tools/seo/web-artifact-check.ts
git commit -m "feat: add sitemap and rss url identity"
```

---

### Task 4: Add static canonical contracts to Slidev and Daily aliases

**Files:**
- Create: `tools/generate-slides/presentation-seo.ts`
- Modify: `tools/generate-slides/index.ts`
- Modify: `tools/build-slides/index.ts`
- Modify: `tools/assemble-site/index.ts`
- Create: `tools/seo/site-artifact-check.ts`
- Modify: `package.json`

**Interfaces:**
- Produces sidecar `apps/slides/generated/<slug>/seo.json` with only generic SEO build metadata.
- `build-slides` remains template-neutral: it reads the sidecar and injects tags; it never branches on daily/weekly/talk templates.
- Alias redirect target remains exactly the existing target; canonical is a separate Production Reading URL.

- [ ] **Step 1: Write the failing assembled-site SEO contract**

Create `tools/seo/site-artifact-check.ts`:

```ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema } from '@orbis/content-schema'
import { discoverPresentationDescriptors } from '../generate-slides/discover-presentations.ts'
import { listFiles, readYaml } from '../shared/content.ts'
import {
  isPreviewRuntime,
  loadSiteConfig,
  productionSiteUrl,
  runtimeSiteBase,
} from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const config = await loadSiteConfig()
const preview = isPreviewRuntime(config)
const descriptors = await discoverPresentationDescriptors({ root, siteBase: runtimeSiteBase(config), config })

function requireSeo(html: string, canonical: string, label: string) {
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${label} canonical mismatch`)
  const robots = preview ? 'noindex,nofollow' : 'index,follow'
  assert.ok(html.includes(`<meta name="robots" content="${robots}">`), `${label} robots mismatch`)
}

for (const descriptor of descriptors) {
  const html = await readFile(resolve(root, `dist/site/slides/${descriptor.slug}/index.html`), 'utf8')
  const canonical = descriptor.sourceKind === 'brief'
    ? productionSiteUrl(config, `/briefs/${descriptor.slug}/`)
    : productionSiteUrl(config, `/slides/${descriptor.slug}/`)
  requireSeo(html, canonical, `Slide ${descriptor.slug}`)
}

const publishedDaily: Array<{ id: string; date: string }> = []
for (const file of await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])) {
  const brief = briefSchema.parse(await readYaml(file))
  if (brief.status === 'published' && brief.cadence === 'daily') {
    publishedDaily.push({ id: basename(file).replace(/\.(yaml|yml)$/, ''), date: brief.publishedAt })
  }
}
publishedDaily.sort((a, b) => b.date.localeCompare(a.date))
assert.ok(publishedDaily.length > 0, 'SEO site check requires one published Daily')

for (const daily of publishedDaily) {
  const datePath = daily.date.replaceAll('-', '/')
  const html = await readFile(resolve(root, `dist/site/${datePath}/index.html`), 'utf8')
  requireSeo(html, productionSiteUrl(config, `/briefs/${daily.id}/`), `Daily alias ${daily.date}`)
}

const latest = await readFile(resolve(root, 'dist/site/latest/index.html'), 'utf8')
requireSeo(latest, productionSiteUrl(config, `/briefs/${publishedDaily[0].id}/`), 'Latest alias')

console.log('Assembled SEO canonical contract passed')
```

- [ ] **Step 2: Observe RED**

Run:

```bash
pnpm generate:slides
pnpm build:slides
pnpm assemble
pnpm exec tsx tools/seo/site-artifact-check.ts
```

Expected: FAIL because compiled Slidev and redirect documents currently have no canonical link.

- [ ] **Step 3: Create the generic presentation SEO manifest**

Create `tools/generate-slides/presentation-seo.ts`:

```ts
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'
import type { SiteConfig } from '../shared/site-config.ts'
import { isPreviewRuntime, productionSiteUrl } from '../shared/site-config.ts'

export type PresentationSeoManifest = {
  canonicalUrl: string
  robots: 'index,follow' | 'noindex,nofollow'
}

export function buildPresentationSeoManifest(
  descriptor: PresentationDescriptor,
  config: SiteConfig,
): PresentationSeoManifest {
  const canonicalPath = descriptor.sourceKind === 'brief'
    ? `/briefs/${descriptor.slug}/`
    : `/slides/${descriptor.slug}/`

  return {
    canonicalUrl: productionSiteUrl(config, canonicalPath),
    robots: isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow',
  }
}
```

- [ ] **Step 4: Write the output-only sidecar during slide generation**

In `tools/generate-slides/index.ts`, after writing `slides.md`, write:

```ts
const seo = buildPresentationSeoManifest(descriptor, config)
await writeFile(
  resolve(directory, 'seo.json'),
  `${JSON.stringify(seo, null, 2)}\n`,
  'utf8',
)
```

Do not add `seo.json` to Git-tracked generated files.

- [ ] **Step 5: Inject static Slidev canonical/robots after each build**

In `tools/build-slides/index.ts`, import `readFile`/`writeFile` and add:

```ts
function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

async function injectSeoHead(slug: string, out: string) {
  const manifestPath = resolve(generatedRoot, slug, 'seo.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    canonicalUrl: string
    robots: 'index,follow' | 'noindex,nofollow'
  }
  const indexPath = resolve(out, 'index.html')
  const html = await readFile(indexPath, 'utf8')
  if (!html.includes('</head>')) throw new Error(`Slidev index is missing </head>: ${slug}`)
  if (html.includes('rel="canonical"')) throw new Error(`Slidev index already contains canonical metadata: ${slug}`)
  const tags = `<link rel="canonical" href="${escapeHtmlAttribute(manifest.canonicalUrl)}"><meta name="robots" content="${manifest.robots}">`
  await writeFile(indexPath, html.replace('</head>', `${tags}</head>`), 'utf8')
}
```

Call `await injectSeoHead(slug, out)` immediately after each successful `slidev build`.

Do not inspect template names in `build-slides`.

- [ ] **Step 6: Add SEO metadata to redirect documents without changing redirect targets**

Change `tools/assemble-site/index.ts` `redirectHtml` to accept separate canonical/robots values:

```ts
function redirectHtml(
  target: string,
  canonicalUrl: string,
  robots: 'index,follow' | 'noindex,nofollow',
): string {
  const jsTarget = JSON.stringify(target)
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orbis · Redirect</title><link rel="canonical" href="${canonicalUrl}"><meta name="robots" content="${robots}"><script>const q=location.search||'';location.replace(${jsTarget}+q)</script><noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript></head><body></body></html>`
}
```

At assembly time:

```ts
const robots = isPreviewRuntime(config) ? 'noindex,nofollow' : 'index,follow'
const dailyCanonicalByDate = new Map<string, string>()
```

For each published Daily, compute:

```ts
const canonicalUrl = productionSiteUrl(config, `/briefs/${slug}/`)
dailyCanonicalByDate.set(brief.publishedAt, canonicalUrl)
```

Write the date alias with `redirectHtml(target, canonicalUrl, robots)` while preserving the existing `target` selection logic.

Write `/latest/` with the canonical from `dailyCanonicalByDate.get(issues[0].date)` while preserving its existing redirect target to the latest stable date route.

- [ ] **Step 7: Verify GREEN**

Run:

```bash
pnpm generate:slides
pnpm build:slides
pnpm assemble
pnpm exec tsx tools/seo/site-artifact-check.ts
```

Expected: `Assembled SEO canonical contract passed`.

Then run the same pipeline with Preview environment variables and expect Slidev + alias robots to be `noindex,nofollow` while canonical remains Production.

- [ ] **Step 8: Wire the assembled-site gate**

Add:

```json
"test:seo-site": "tsx tools/seo/site-artifact-check.ts"
```

Run it at the end of root `build` after `assemble` and after existing site/scope/weekly artifact checks, so it validates final `dist/site`.

- [ ] **Step 9: Commit Task 4**

```bash
git add tools/generate-slides/presentation-seo.ts tools/generate-slides/index.ts tools/build-slides/index.ts tools/assemble-site/index.ts tools/seo/site-artifact-check.ts package.json
git commit -m "feat: add slide and alias canonical metadata"
```

---

### Task 5: Complete the repository and Preview/Production regression gate

**Files:**
- Modify only files required by failures found in this task; no scope expansion.
- Review: `package.json`, `tools/seo/**`, `apps/web/src/lib/seo.ts`, `apps/web/src/layouts/BaseLayout.astro`, `apps/web/src/pages/sitemap.xml.ts`, slide SEO sidecar/injection, assembler redirect metadata.

**Interfaces:**
- Consumes all 50A contracts from Tasks 1–4.
- Produces one independently mergeable 50A branch/PR with no JSON-LD.

- [ ] **Step 1: Run the complete local-equivalent Production build**

Run with Production defaults and no stale Preview overrides:

```bash
unset SITE_ORIGIN SITE_BASE 2>/dev/null || true
pnpm install --frozen-lockfile
pnpm build
git diff --check
```

On PowerShell use:

```powershell
Remove-Item Env:SITE_ORIGIN -ErrorAction SilentlyContinue
Remove-Item Env:SITE_BASE -ErrorAction SilentlyContinue
pnpm install --frozen-lockfile
pnpm build
git diff --check
```

Expected:

```text
SEO URL contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
```

plus all existing Daily/Weekly/Talk/Registry/discovery contracts and exit code 0.

- [ ] **Step 2: Run an explicit Preview-mode build before relying on GitHub Actions**

```bash
SITE_ORIGIN=https://raw.githack.com \
SITE_BASE=/XiaoDaoJiang/Orbis/preview-pr-999 \
pnpm build
```

Expected:

- Astro canonical and sitemap use `https://xiaodaojiang.github.io/Orbis/...`;
- Astro `og:url`, OG/Twitter image URLs and RSS Reading links use `/preview-pr-999/...`;
- Astro/Slidev/alias robots are `noindex,nofollow`;
- Brief-derived Slide canonical uses Production Reading;
- standalone Talk canonical uses Production `/slides/<slug>/`.

- [ ] **Step 3: Perform a strict scope review**

The 50A diff may contain only:

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
docs/superpowers/specs/2026-09-01-seo-sharing-design.md
docs/superpowers/plans/2026-09-01-seo-foundation.md
```

Reject accidental changes to `content/**`, content schemas, presentation template bodies, workflows, generated source, or `dist/**`.

- [ ] **Step 4: Commit any verification-only fixes, then verify again**

If a real regression required a fix, run the exact failing contract first, then full `pnpm build`, then commit the minimal fix. Do not weaken a failing assertion to make the build green.

- [ ] **Step 5: Push `feat/seo-foundation` and create a non-Draft PR to `main`**

Use title:

```text
feat: add canonical seo metadata and sitemap
```

PR body must record:

- baseline SHA;
- RED/GREEN runs for URL, Web artifact and Slide/alias contracts;
- Production-style full `pnpm build` result;
- Preview-style full `pnpm build` result;
- exact changed-file scope;
- explicit statement: JSON-LD is deferred to 50B.

- [ ] **Step 6: Require the real read-only PR Build and Trusted Preview**

Do not merge from local evidence alone. Require GitHub PR Build to run with the repository's existing Preview environment:

```text
SITE_ORIGIN=https://raw.githack.com
SITE_BASE=/<repo>/preview-pr-<PR>
```

Verify the uploaded artifact belongs to the latest PR head, Trusted Preview Publish succeeds, and the bot comment is posted only after public availability smoke.

- [ ] **Step 7: Inspect the published Preview contract**

At minimum inspect:

- `/index.html` canonical = Production, robots = noindex, `og:url` = Preview;
- one Essay, Daily, Weekly and Knowledge detail page with the same identity split;
- `/sitemap.xml` contains Production URLs only;
- `/rss.xml` links to Preview Reading routes;
- Daily/Weekly Slidev canonical = Production Reading and robots = noindex;
- standalone Talk canonical = Production Talk deck and robots = noindex;
- `/latest/` and one date alias canonical = Production Daily Reading.

- [ ] **Step 8: Merge remains a separate integration gate**

After PR evidence is green, merge only through the repository's normal GitHub flow. Then require a fresh `main` Site Build and a governed `Orbis Pages Production` deploy/smoke before marking 50A Done and beginning 50B implementation.

---

## Self-Review Checklist

Before execution starts, verify:

- [x] Every 50A requirement in the approved Spec maps to a task.
- [x] 50B JSON-LD is absent from implementation tasks.
- [x] Production canonical and Preview share identity are not conflated.
- [x] Preview Astro + Slidev + aliases are noindex; Production Slidev is not blanket noindex.
- [x] Daily alias redirect behavior is preserved.
- [x] Brief-derived Slide canonical and standalone Talk self-canonical semantics are explicit.
- [x] Sitemap is structured-content driven, not dist crawling.
- [x] RSS behavior differs intentionally between Production and Preview.
- [x] No generated output is committed.
- [x] No placeholder/TODO implementation steps remain.
