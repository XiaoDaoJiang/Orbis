# Presentation Platform Registry Design

> Status: Approved design for Plan 20A implementation
> Roadmap: Plan 20 · Presentation Platform
> Baseline: `main@02a93c3aa31294920ff080cd6a4cc181cc446dee`
> Branch: `refactor/presentation-platform-registry`

## Goal

Deliver the first independently shippable slice of Plan 20 by separating presentation source adaptation from template rendering, while preserving the current published Daily presentation behavior byte-for-byte at the renderer boundary and keeping the fixed 11-slide `daily-v1` contract unchanged.

The platform rule remains:

**Slides are an output channel, not a second content source.**

## Scope

Plan 20A adds only the platform abstraction needed before new presentation sources or templates are introduced:

- a source-neutral `PresentationDescriptor` contract;
- a Brief → Presentation Descriptor adapter;
- an explicit Template Registry;
- migration of `daily-v1` into the Registry;
- a single `renderPresentation(descriptor, context)` dispatch entry point;
- focused presentation-platform contract tests;
- migration of `tools/generate-slides/index.ts` to Descriptor + Registry without changing discovery, output paths, layout/style copying, or Daily eligibility rules.

## Explicit Non-goals

This PR does not implement:

- `content/presentations/**`;
- `presentationContentSchema`;
- Astro registration for standalone Presentation content;
- `talk-v1`;
- `weekly-v1` rendering or Weekly-specific semantics;
- mixed Daily + Talk fixtures;
- duplicate-slug detection across multiple source kinds;
- changes to `/slides/` product discovery semantics;
- visual Slide Editor, user themes, runtime templates or PPTX export;
- generated Slidev sources committed to Git.

Those capabilities remain Plan 20B or Plan 30 work.

## Architecture Boundary

The current steady-state graph remains intact:

```text
content/briefs/**
  -> @orbis/content-schema
  -> Brief source adapter
  -> Presentation Descriptor
  -> Template Registry
  -> Generated Slidev source
  -> existing build-slides × N
  -> assemble-site
  -> /slides/<slug>/
```

`tools/build-slides` remains template-agnostic. It only discovers generated decks and invokes Slidev. No template branching is added there.

## Presentation Descriptor

The Descriptor is a build-time transport object, not a new publishable content model.

It lives with the Slide platform contracts under `apps/slides/presentation.ts` so both the generator and template registry can depend on it without the Slide app importing tool-layer code.

First-version shape:

```ts
export type PresentationSourceKind = 'brief' | 'presentation'

export type PresentationDescriptor = {
  id: string
  slug: string
  title: string
  publishedAt: string
  topics: string[]
  template: string
  sourceKind: PresentationSourceKind
  readingUrl?: string
  payload: unknown
}

export type PresentationRenderContext = {
  siteBase: string
}
```

Design choices:

- `template` is a string at the Descriptor boundary so the Registry owns unsupported-template failure explicitly.
- `payload` is `unknown` because each renderer validates the payload it owns; the Descriptor does not grow into a union that must change whenever a template is added.
- `readingUrl` is optional because future standalone Presentations may not have a reading page.
- `sourceKind` already includes `presentation`, but 20A produces only `brief`; this is a stable contract field, not an implementation of standalone presentation content.

## Brief Source Adapter

Create `tools/generate-slides/brief-source.ts` with one focused conversion function:

```ts
toBriefPresentationDescriptor(
  brief: Brief,
  input: { slug: string; readingUrl: string },
): PresentationDescriptor
```

It maps existing structured Brief data into the Descriptor and does not decide public eligibility. Eligibility remains exactly where it is today in `tools/generate-slides/index.ts`:

```text
brief.presentation.enabled === true
AND brief.status === 'published'
```

This prevents a platform refactor from silently changing publication semantics.

## Template Registry

Create `apps/slides/templates/registry.ts` as the only template-dispatch layer.

Public interface:

```ts
export type PresentationRenderer = (
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
) => string

export function renderPresentation(
  descriptor: PresentationDescriptor,
  context: PresentationRenderContext,
): string
```

The first registry contains exactly one implemented template:

```text
daily-v1 -> daily-v1 adapter renderer
```

The `daily-v1` registry adapter must:

1. validate `descriptor.payload` with `dailyBriefSchema`;
2. require `descriptor.readingUrl`;
3. call the existing `renderDailyV1` unchanged;
4. pass `{ siteBase, readingHref: descriptor.readingUrl }`.

Unknown templates fail before Slidev build with the existing user-facing error form:

```text
Unsupported presentation template: <template>
```

No fallback renderer is allowed.

## Generator Migration

`tools/generate-slides/index.ts` keeps responsibility for:

- loading site config;
- discovering Brief YAML files;
- parsing with `briefSchema`;
- filtering to published + presentation-enabled Briefs;
- computing the stable reading URL;
- creating each generated deck directory;
- copying shared `style.css` and layouts;
- writing `slides.md`;
- logging generated deck count;
- failing when zero published decks are generated.

It stops owning:

- direct `dailyBriefSchema` parsing for template dispatch;
- direct `renderDailyV1` imports;
- `switch (brief.presentation.template)`.

Generation flow becomes:

```text
brief
  -> toBriefPresentationDescriptor(...)
  -> renderPresentation(descriptor, { siteBase })
  -> slides.md
```

## Compatibility Contract

20A is intentionally behavior-preserving.

For the same valid published Daily Brief, `renderPresentation(toBriefPresentationDescriptor(...))` must produce exactly the same Markdown string as the existing direct call to `renderDailyV1` with the same `siteBase` and reading URL.

Therefore this PR must not modify:

- `apps/slides/templates/daily-v1.ts` presentation markup;
- fixed 11-slide semantics;
- Daily reading backlinks;
- generated directory convention;
- `/slides/<slug>/` base-path behavior;
- Brief publication filtering.

## Validation Strategy

Use TDD and the existing cloud build as the source of execution evidence.

### RED

Add a focused `tools/generate-slides/presentation-platform.test.ts` contract before production modules exist. The test must fail by assertion because the Descriptor/Registry platform modules and expected interfaces do not exist yet.

Open a Draft PR and confirm `build-preview` fails in the new presentation-platform test for that expected reason.

### GREEN

Implement Descriptor, Brief adapter, Registry, and generator migration. The focused test then asserts:

- Brief metadata maps correctly into the Descriptor;
- source kind is `brief`;
- `readingUrl` is preserved;
- `payload` remains the validated source Brief;
- Registry output equals the legacy direct `renderDailyV1` result for the same Daily input;
- unknown template fails with `Unsupported presentation template: ...`;
- a `daily-v1` Descriptor without `readingUrl` fails clearly.

Then run the repository's full `pnpm build` through `build-preview`, which continues to cover:

- content-schema tests;
- content validation;
- N>1 Daily presentation integration;
- exact 11-slide Daily contract;
- Astro build;
- Slidev build;
- assembly;
- final site artifact checks.

## PR Boundary

Expected PR title:

`refactor: introduce presentation registry and descriptor`

The PR is complete when:

- `tools/generate-slides/index.ts` contains no template `switch` and no direct `renderDailyV1` dependency;
- a Brief is converted to a source-neutral Descriptor before rendering;
- all template dispatch goes through the explicit Registry;
- `daily-v1` output remains equivalent to the pre-refactor renderer call;
- unsupported templates fail in Registry dispatch;
- the full read-only PR build passes;
- the trusted public Preview publishes successfully;
- no generated Slidev source, generated HTML or `dist/**` is committed.

Merge remains a separate user decision. Plan 20B begins only after this PR is merged.