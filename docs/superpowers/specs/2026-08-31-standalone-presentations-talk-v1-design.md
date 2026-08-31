# Standalone Presentations + talk-v1 Design

> Status: Approved design for Plan 20B implementation
> Roadmap: `docs/plan/20-presentation-platform.md`
> Baseline: `main@827d640529406f2fa202cebcdad5fec9e8f33711`
> Branch: `feat/standalone-presentations-talk-v1`
> Prerequisite: Plan 20A / PR #11 — Presentation Descriptor + Template Registry

## 1. Goal

Complete Plan 20 by adding a first-class standalone Presentation content source and a reusable `talk-v1` renderer while preserving the core Orbis rule:

**Slides are an output channel, not a second copy of another content source.**

After this change Orbis supports two independent structured sources that converge on the same Presentation Platform:

```text
content/briefs/**
  -> Brief adapter
          |
          v
PresentationDescriptor[]
          ^
          |
content/presentations/**
  -> Standalone Presentation adapter

PresentationDescriptor[]
  -> duplicate-slug gate
  -> Template Registry
       |- daily-v1
       `- talk-v1
  -> apps/slides/generated/<slug>/slides.md
  -> unchanged build-slides x N
  -> /slides/<slug>/
```

`weekly-v1` and Weekly-specific product semantics remain Plan 30 work.

## 2. Scope

Plan 20B adds:

- `content/presentations/**` as a new structured content source;
- `presentationContentSchema` in `@orbis/content-schema`;
- Astro `presentations` collection registration;
- `config/site.yaml -> content.presentationsDir`;
- standalone Presentation -> `PresentationDescriptor` adaptation;
- descriptor discovery across Briefs and standalone Presentations;
- duplicate slug validation before generated files are written;
- `talk-v1` renderer registered through the existing Template Registry;
- one real published standalone Talk committed to the repository;
- unified Presentation discovery for `/slides/` and Homepage Latest Presentation;
- Daily + Talk mixed integration coverage;
- negative coverage for invalid standalone source, unsupported template and duplicate slug;
- public Preview verification for both a Daily presentation and standalone Talk.

## 3. Explicit Non-goals

This PR does not add:

- `weekly-v1` implementation;
- Weekly business semantics;
- standalone Presentation reading/detail pages;
- standalone Presentation entries in `/archive/`;
- standalone Presentation participation in Related Content;
- standalone Presentation participation in Topic detail aggregation;
- standalone Presentation RSS entries;
- arbitrary Markdown/MDX body content;
- arbitrary HTML or Vue injection;
- runtime/user-defined templates;
- custom theme upload;
- visual slide editing;
- PPTX export;
- database, CMS or server API.

These boundaries prevent Plan 20 from turning into a broader Discovery or authoring-system redesign.

## 4. Content Model

### 4.1 Storage format

Standalone Presentations use YAML only:

```text
content/presentations/**/*.{yaml,yml}
```

The file basename is the stable Presentation slug.

Example:

```yaml
kind: presentation
title: Agent Harness as a System Layer
summary: A structured technical talk about the role of agent harnesses in modern software development.
publishedAt: 2026-08-31
status: published
topics:
  - agent-harness
  - coding-agent
template: talk-v1
sections:
  - id: system-layer
    layout: architecture
    title: Why the harness becomes a system layer
    conclusion: The harness increasingly owns context, tools, execution policy and verification around the model.
    facts:
      - Agent runtimes now coordinate model calls, tools, workspace state and verification loops.
      - Tool protocols make external capabilities composable instead of model-specific.
    limitations:
      - Runtime boundaries differ significantly across current products.
    references:
      - title: Claude Code memory documentation
        url: https://docs.anthropic.com/
        supports: Example of an agent harness owning persistent project context.
references:
  - title: Model Context Protocol
    url: https://modelcontextprotocol.io/
    supports: Reference architecture for exposing external tools and context to agents.
```

The committed production example must contain real, attributable technical content. Test-only sentinel text belongs only in ephemeral fixtures.

### 4.2 `presentationContentSchema`

The schema shape is:

```ts
type PresentationContent = {
  kind: 'presentation'
  title: string
  summary: string
  publishedAt: string
  status: PublicationStatus
  topics: string[]
  template: 'talk-v1'
  sections: PresentationSection[]
  references: Reference[]
}
```

The first standalone content schema accepts only `template: 'talk-v1'`.

The broader Template Registry may still reject arbitrary runtime strings with the existing unsupported-template error, but structured standalone content must not claim `daily-v1` or `weekly-v1`.

### 4.3 Presentation sections

Do not reuse `briefSectionSchema` directly because that would couple standalone Talk evolution to Daily Brief constraints.

Define a dedicated `presentationSectionSchema`:

```ts
type PresentationSection = {
  id: string
  layout: 'content' | 'architecture' | 'comparison' | 'timeline' | 'metrics' | 'system-map'
  title: string
  conclusion: string
  facts: string[]
  limitations: string[]
  references: Reference[]
}
```

Constraints:

- `id`: minimum 2 characters;
- `title`: minimum 3 characters;
- `conclusion`: minimum 12 characters;
- `facts`: 1-6 items;
- `limitations`: 0-3 items;
- `references`: at least 1 item;
- presentation `sections`: 1-12 items;
- top-level `references`: at least 1 item.

The renderer may give semantic layouts distinct labels/styling, but every layout consumes the same safe structured fields in this first version.

## 5. Site Configuration

Extend the existing content config contract:

```yaml
content:
  briefsDir: content/briefs
  presentationsDir: content/presentations
```

`SiteConfig.content.presentationsDir` is required.

All filesystem scanners must read the directory from configuration rather than hard-code `content/presentations`.

Astro collection registration can still use its compile-time repository-relative loader base, matching the existing Astro collection pattern.

## 6. Descriptor Discovery Architecture

### 6.1 Source adapters

The existing Brief adapter remains unchanged in responsibility:

```ts
toBriefPresentationDescriptor(
  brief: Brief,
  input: { slug: string; readingUrl: string },
): PresentationDescriptor
```

Add a standalone adapter:

```ts
toStandalonePresentationDescriptor(
  presentation: PresentationContent,
  input: { slug: string },
): PresentationDescriptor
```

It produces:

```ts
{
  id: slug,
  slug,
  title: presentation.title,
  publishedAt: presentation.publishedAt,
  topics: presentation.topics,
  template: presentation.template,
  sourceKind: 'presentation',
  payload: presentation,
}
```

Standalone Presentations have no fake `readingUrl` in Plan 20B.

### 6.2 Descriptor discovery

Introduce a focused discovery function that scans all generator sources and returns descriptors before rendering begins.

Conceptual interface:

```ts
type DiscoverPresentationDescriptorsOptions = {
  root: string
  briefsDir: string
  presentationsDir: string
  siteBase: string
}

async function discoverPresentationDescriptors(
  options: DiscoverPresentationDescriptorsOptions,
): Promise<PresentationDescriptor[]>
```

Rules:

1. Parse every Brief through `briefSchema`.
2. Include only Briefs where `status === 'published' && presentation.enabled === true`.
3. Build their reading URL and adapt them through the existing Brief adapter.
4. Parse every standalone Presentation through `presentationContentSchema`.
5. Include only standalone Presentations where `status === 'published'`.
6. Adapt them through the standalone adapter.
7. Validate slug uniqueness across the complete descriptor set.
8. Return descriptors in deterministic slug order.

The generator then owns only output cleanup, shared Slidev support-file copying, Registry rendering and source writing.

## 7. Duplicate Slug Policy

A slug collision across any publishable Presentation source is a hard build error.

Examples that must fail:

```text
content/briefs/platform.yaml
content/presentations/platform.yaml
```

and future collisions between other source kinds once they exist.

The error format must identify the slug and both source kinds, for example:

```text
Duplicate presentation slug: platform (brief, presentation)
```

The duplicate check occurs **before any generated deck directory or `slides.md` is written**.

This prevents partial output where one source silently overwrites another.

## 8. `talk-v1` Renderer

### 8.1 Registration

Register `talk-v1` in `apps/slides/templates/registry.ts`.

The registry remains the only template-dispatch layer.

`tools/generate-slides/index.ts` and `tools/build-slides/index.ts` must not gain a `talk-v1` conditional.

### 8.2 Slide structure

`talk-v1` has variable length:

```text
Cover
+ one slide per section
+ References
```

Therefore:

```text
slide count = sections.length + 2
```

It must not copy the Daily fixed 11-slide information architecture.

### 8.3 Cover

Cover renders:

- `ORBIS · TALK` eyebrow;
- publication date;
- title;
- summary;
- Topics;
- optional Reading link only if the Descriptor genuinely contains `readingUrl`.

The standard local Orbis favicon and Slidev metadata contract remain consistent with `daily-v1`.

### 8.4 Section slides

Each structured section renders:

- semantic layout name as eyebrow;
- title;
- conclusion;
- facts;
- optional limitations;
- at least one source link.

The first version does not interpret arbitrary user markup.

The semantic layout categories are a content contract and may receive small CSS differences, but no category is allowed to inject arbitrary components.

### 8.5 References

The final References slide renders all top-level references and, when a genuine `readingUrl` exists, an optional Reading link.

Standalone Presentations normally have no Reading link in this Plan.

## 9. Content Validation and Astro Registration

### 9.1 CLI validation

`tools/validate-content/index.ts` adds `content.presentationsDir` / YAML validation through `presentationContentSchema`.

A malformed Presentation must fail the normal `pnpm validate` / `pnpm build` path before slide generation.

### 9.2 Astro collection

Register:

```ts
const presentations = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/presentations' }),
  schema: presentationContentSchema,
})
```

and export it in `collections`.

This collection exists for public Presentation discovery metadata. Plan 20B does not create `/presentations/<slug>/` reading pages.

## 10. Presentation Discovery Projection

Do not add standalone Presentations to the existing generic `DiscoveryKind = 'brief' | 'essay' | 'knowledge'` model.

Add a focused Presentation discovery shape:

```ts
type PresentationDiscoveryItem = {
  id: string
  title: string
  summary: string
  publishedAt: string
  topics: string[]
  sourceKind: 'brief' | 'presentation'
  presentationHref: string
  readingHref?: string
  cadence?: BriefCadence
}
```

Provide helpers conceptually equivalent to:

```ts
toBriefPresentationDiscoveryItem(entry, base)
toStandalonePresentationDiscoveryItem(entry, base)
buildPublicPresentations(briefs, presentations, base)
```

Public rules:

- Brief presentation: Brief is `published` and `presentation.enabled === true`.
- Standalone presentation: Presentation is `published`.

`buildPublicPresentations` returns one newest-first deterministic list.

Tie-breaking:

1. `publishedAt` descending;
2. `title` ascending;
3. `sourceKind` ascending;
4. `id` ascending.

## 11. `/slides/` Product Behavior

Replace the current Brief-only projection with `buildPublicPresentations`.

Every card renders:

- source type (`Brief presentation` or `Standalone presentation`);
- date;
- optional cadence for Brief-derived decks;
- title;
- summary;
- topics;
- `Open presentation` link.

Only Brief-derived presentations render a Reading link.

The page description and lead text must describe presentations from structured Orbis content generally, not claim that all decks are Brief-derived.

No generated files or `dist/**` are used as discovery input.

## 12. Homepage Latest Presentation

Homepage Latest Presentation must consume the same `buildPublicPresentations` projection as `/slides/`.

This fixes the current implicit assumption that the latest Presentation is always a Brief.

Behavior:

- newest standalone Talk can become Latest Presentation;
- Brief-derived Presentation still exposes Reading;
- standalone Presentation does not render a fake Reading action;
- `data-home-id="presentation:<id>"` remains the stable artifact-test identity;
- `Latest Brief` remains independent and still derives only from Briefs.

## 13. Real Published Talk

Plan 20B commits one real standalone Presentation under `content/presentations/**`.

Purpose:

- prove the capability exists in the normal repository state;
- make final PR Preview expose both a Daily and standalone Talk after ephemeral fixtures are cleaned;
- provide an authoring reference for future Presentation content.

The production Talk must:

- use `template: talk-v1`;
- be `status: published`;
- contain at least 2 sections with at least 2 semantic layout categories;
- contain valid references;
- use a slug that does not collide with any Brief;
- contain no test sentinel wording.

## 14. Validation Strategy

Validation remains part of the existing top-level `pnpm build` contract.

### 14.1 Schema tests

Add positive/negative assertions for:

- valid standalone Presentation;
- wrong `kind`;
- unsupported standalone template;
- zero sections;
- invalid section layout;
- missing section reference.

### 14.2 Presentation Platform contract

Extend the existing contract to verify:

- standalone adapter maps metadata correctly;
- `sourceKind === 'presentation'`;
- standalone Descriptor does not invent `readingUrl`;
- Registry accepts `talk-v1`;
- `talk-v1` slide count is `sections.length + 2`;
- unsupported runtime template still fails explicitly;
- existing direct-vs-Registry `daily-v1` output equality remains intact.

### 14.3 Mixed integration test

Update the permanent multi-presentation integration gate so its ephemeral state contains at least:

- one existing published Daily;
- one ephemeral additional Daily where still useful for Daily promotion coverage;
- one published standalone Talk fixture;
- one non-public standalone Presentation fixture.

Verify:

- Daily + Talk generated together;
- Daily + Talk build through unchanged `build-slides`;
- every deck has independent `/slides/<slug>/` base path;
- non-public standalone source generates no deck and is absent from discovery;
- `/slides/` contains both source kinds;
- Homepage Latest Presentation follows newest Presentation across source kinds;
- fixture cleanup removes ephemeral content and generated artifacts.

### 14.4 Duplicate slug negative gate

Create an ephemeral standalone Presentation using the slug of a published Brief.

Run slide generation and require failure with:

```text
Duplicate presentation slug: <slug> (brief, presentation)
```

After failure, assert the generated root contains no partial deck output from that invocation.

Clean the fixture unconditionally.

### 14.5 Invalid source negative gate

Schema tests cover invalid in-memory payloads, while content validation continues to fail malformed repository files.

Do not commit permanently invalid content.

### 14.6 Final site checks

Extend final artifact checks so the normal repository state asserts:

- at least one public Brief-derived Presentation;
- at least one public standalone Presentation;
- both appear in `/slides/`;
- the real Talk deck exists under `/slides/<slug>/`;
- its generated source uses `talk-v1` semantics and variable slide count;
- all existing Daily 11-slide assertions remain unchanged;
- Homepage Latest Presentation is derived from the full public Presentation set.

## 15. TDD / CI Sequence

Use the same evidence pattern as Plan 20A:

1. Add new schema/platform/integration expectations first.
2. Open a Draft PR while production support is intentionally missing.
3. Observe a read-only `build-preview` RED failure caused by the new Plan 20B contract.
4. Confirm frozen install, Path Guard and prior baseline checks reached the expected new failure point.
5. Implement the minimum Schema/source-discovery/renderer/Web changes.
6. Require the complete `pnpm build` pipeline to turn GREEN.
7. Inspect all changed files for scope leakage.
8. Require trusted Preview publication and its public smoke gate.
9. Verify the final public Preview exposes both the Daily deck and real standalone Talk.

No completion claim is made from partial tests.

## 16. Expected File Boundaries

Expected created files include:

```text
apps/slides/templates/talk-v1.ts
content/presentations/<real-talk-slug>.yaml
tools/generate-slides/presentation-source.ts
```

Expected modified files include focused changes to:

```text
packages/content-schema/src/index.ts
packages/content-schema/test/schema.test.ts
config/site.yaml
tools/shared/site-config.ts
tools/validate-content/index.ts
apps/web/src/content.config.ts
apps/slides/templates/registry.ts
tools/generate-slides/index.ts
tools/generate-slides/presentation-platform.test.ts
tools/multi-presentation-check/index.ts
apps/web/src/lib/content-discovery.ts
apps/web/src/pages/slides/index.astro
apps/web/src/pages/index.astro
tools/site-check/index.ts
```

A small additional generator discovery module may be introduced if it keeps source adaptation, duplicate validation and output writing independently understandable.

Do not modify `tools/build-slides/index.ts` unless a genuine template-agnostic bug is discovered. Supporting `talk-v1` alone is not a reason to modify it.

Do not modify `apps/slides/templates/daily-v1.ts` unless a verified regression requires a fix. Plan 20B is not a Daily redesign.

## 17. Acceptance Criteria

Plan 20 is complete when all of these are true:

- existing Daily `daily-v1` output behavior remains regression-free;
- `presentationContentSchema` validates standalone structured content;
- at least one real published standalone Presentation exists;
- a repository build produces at least one Daily + one standalone Talk;
- `talk-v1` is registered through Template Registry;
- adding `talk-v1` required no template-specific change to `build-slides`;
- Brief and standalone sources both become `PresentationDescriptor`s before rendering;
- duplicate slugs across sources fail before any generated output is written;
- unknown Registry template fails explicitly;
- non-public standalone Presentation does not generate or appear publicly;
- `/slides/` discovers both Brief-derived and standalone Presentations;
- Homepage Latest Presentation selects across both source kinds;
- standalone Presentation has no fake reading page/link;
- Daily Deck remains exactly 11 slides;
- Talk Deck uses variable `sections.length + 2` slide count;
- all decks keep independent `/slides/<slug>/` routes;
- read-only PR Build is GREEN after an observed RED phase;
- trusted Preview publicly exposes both source kinds;
- no generated Slidev source, generated HTML or `dist/**` is committed.

## 18. PR Boundary

Expected PR title:

```text
feat: add standalone presentations and talk-v1
```

This is the second and final implementation PR for Plan 20.

After it merges, Plan 20 can be marked complete and the roadmap can move to Plan 30 — Weekly Brief without carrying unfinished Presentation Platform infrastructure forward.
