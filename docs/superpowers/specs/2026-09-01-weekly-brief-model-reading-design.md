# Weekly Brief Model + Reading Experience Design

> Status: Approved design for Plan 30A implementation
> Roadmap: `docs/plan/30-weekly-brief.md`
> Baseline: `main@087bdd18a4094ac4eedc532463d2c66a12cc350b`
> Branch: `feat/weekly-brief-model-reading`
> Prerequisite: Plan 20 Presentation Platform is complete
> Follow-up: Plan 30B adds `weekly-v1` rendering and mixed Daily + Weekly + Talk presentation integration

## 1. Goal

Implement Weekly Brief as a first-class structured Brief cadence whose semantics describe change across a bounded period rather than reusing Daily's signal/action shape.

Plan 30A delivers the Weekly content model, reading experience, discovery participation, one real published Weekly entry, and regression protection for Daily-only stable/latest routes.

It intentionally does **not** implement `weekly-v1` yet.

The product distinction is:

```text
Daily
  -> what matters now?
  -> signals / sections / actions

Weekly
  -> what changed across the period?
  -> thesis / trend movement / key sections / next-period watch
```

A Weekly is an independent structured editorial judgment. It is not a mechanical merge of Daily entries.

## 2. Architectural Decision

`briefSchema` becomes cadence-discriminated at the schema boundary:

```text
Brief
|- DailyBrief
|- WeeklyBrief
`- AdHocBrief
```

The important change is that `cadence: weekly` no longer falls through the current generic non-Daily schema.

The implementation should use a shared metadata schema for fields that are truly cadence-neutral, then define cadence-specific bodies.

Conceptually:

```ts
briefSchema = z.discriminatedUnion('cadence', [
  dailyBriefSchema,
  weeklyBriefSchema,
  adHocBriefSchema,
])
```

If Zod's inferred types or transformed date fields make a literal `z.discriminatedUnion` unsuitable, an equivalent explicit union is acceptable only if tests prove cadence-exclusive validation. The product contract matters more than the helper name.

## 3. Compatibility Boundary

This slice must not broaden into an Ad-hoc Brief redesign.

### 3.1 Daily

Daily semantics remain unchanged:

- exactly 4 `signals`;
- exactly 5 `sections`;
- 3..5 `actions`;
- existing `projects`, `radar`, `archivePicks` support;
- `presentation.template` must be `daily-v1`;
- existing `daily-v1` output remains unchanged;
- Daily stable date routes and `/latest/` remain Daily-only.

### 3.2 Weekly

Weekly receives a dedicated schema and must not require Daily-only `signals`, `projects`, `radar`, `actions`, or `archivePicks`.

A Weekly containing Daily-only body fields should fail strict cadence validation rather than silently accepting a hybrid document.

### 3.3 Ad-hoc

`cadence: ad-hoc` preserves the current non-Daily body contract for compatibility in Plan 30A:

- `signals`: 1..8;
- `sections`: 1..8;
- `projects`: max 6;
- `radar`: max 8;
- `actions`: 1..8;
- `archivePicks`: max 6;
- existing presentation-template allowance is preserved.

No new Ad-hoc semantics are introduced in this plan.

## 4. Shared Brief Metadata

Fields shared by all Brief cadences:

```text
kind
cadence
publishedAt
status
title
summary
topics
sections
references
presentation
```

`sections` remains based on the existing structured Brief section schema because the current architecture/comparison/timeline/metrics/system-map semantics are useful across Daily and Weekly.

The cadence-specific schemas own their own quantity bounds for `sections`.

## 5. Weekly Content Model

A valid Weekly has this shape:

```yaml
kind: brief
cadence: weekly
publishedAt: 2026-09-06
status: published
title: Agent Harness Weekly — Execution Is Becoming a Product Boundary
summary: A structured weekly judgment about how agent execution, verification and protocol boundaries moved during the period.
topics:
  - agent-harness
  - coding-agent

period:
  from: 2026-08-31
  to: 2026-09-06

weeklyThesis: The most important change this week is that execution harness quality is increasingly becoming a product boundary rather than an implementation detail.

trendMovements:
  - topic: agent-harness
    direction: rising
    summary: Harness-level state, verification and recovery are receiving more explicit product treatment.

sections:
  - id: execution-boundary
    layout: architecture
    title: Execution moves above raw model capability
    conclusion: Product differentiation is shifting toward orchestration, verification and recovery around the model.
    facts:
      - Structured execution boundaries are increasingly visible in agent platform designs.
    limitations: []
    references:
      - title: Orbis Presentation Platform Plan
        url: https://github.com/XiaoDaoJiang/Orbis/blob/planning/product-capability-roadmap/docs/plan/20-presentation-platform.md
        supports: Demonstrates Orbis separating content semantics from presentation rendering.

nextPeriodWatch:
  - title: Watch protocol-level interoperability
    reason: More explicit interoperability boundaries would confirm that harness concerns are becoming platform concerns.

references:
  - title: Orbis repository
    url: https://github.com/XiaoDaoJiang/Orbis
    supports: Provides repository evidence used by this first Weekly example.

presentation:
  enabled: false
  template: weekly-v1
```

## 6. Weekly Field Contracts

### 6.1 `period`

```ts
period: {
  from: DateString
  to: DateString
}
```

Rules:

1. `from <= to`;
2. the range contains exactly seven calendar dates, so `to - from === 6 days`;
3. `publishedAt === period.to`.

Plan 30A intentionally does not require Monday-to-Sunday boundaries. A strict seven-day period provides stable semantics while allowing future editorial scheduling changes.

Date arithmetic must use UTC date-only values; local timezone parsing must not be allowed to change the result.

### 6.2 `weeklyThesis`

A required meaningful string representing the primary system-level judgment for the period.

Recommended schema boundary:

```text
min 24 characters
```

The schema should reject an empty or token-length placeholder thesis without embedding editorial style rules that belong to authoring guidance.

### 6.3 `trendMovements`

```ts
type TrendMovement = {
  topic: string
  direction: 'rising' | 'stable' | 'cooling' | 'new-variable'
  summary: string
}
```

Quantity:

```text
2..8
```

Rules:

- `topic` uses the same identifier convention as Brief `topics`;
- `summary` has a meaningful-text minimum;
- multiple movements may refer to the same top-level Brief topic only if authored intentionally; Plan 30A does not add cross-field uniqueness constraints.

### 6.4 Weekly `sections`

Weekly uses the existing structured Brief section semantics but has its own quantity boundary:

```text
2..6
```

It is not constrained to Daily's exact five sections.

### 6.5 `nextPeriodWatch`

```ts
type NextPeriodWatch = {
  title: string
  reason: string
}
```

Quantity:

```text
1..5
```

This field describes what evidence or variable should be watched next. It is not a prediction model.

### 6.6 `presentation`

Weekly requires:

```yaml
presentation:
  enabled: <boolean>
  template: weekly-v1
```

The template literal is part of the Weekly schema even in Plan 30A.

The first real Weekly entry is committed with `enabled: false` because `weekly-v1` is intentionally deferred to Plan 30B. This allows Weekly reading/discovery to ship independently without creating an unsupported Presentation Registry dispatch.

## 7. Public Type Contract

`@orbis/content-schema` exports:

```ts
export type WeeklyBrief = z.infer<typeof weeklyBriefSchema>
export type AdHocBrief = z.infer<typeof adHocBriefSchema>
```

Existing `Brief` remains the union type consumed by generic Brief discovery.

`DailyBrief` remains unchanged for Daily renderer and Daily-specific tools.

## 8. Schema Validation Requirements

Positive tests must prove:

- a valid Weekly parses;
- Weekly may use 2 sections and therefore is not forced to Daily's 5-section contract;
- Weekly has no `signals` requirement;
- Weekly template is `weekly-v1`;
- valid `period` is seven calendar dates inclusive;
- `publishedAt` equals `period.to`.

Negative tests must prove:

- Weekly without `period` fails;
- Weekly without `weeklyThesis` fails;
- Weekly with 1 `trendMovement` fails;
- Weekly with an unknown trend direction fails;
- Weekly with fewer than 2 or more than 6 sections fails;
- Weekly with no next-period watch fails;
- Weekly with a non-seven-day period fails;
- Weekly whose `publishedAt` differs from `period.to` fails;
- Weekly using `daily-v1` fails;
- Daily using `weekly-v1` still fails;
- Weekly carrying Daily-only fields such as `signals` fails if strict object validation is enabled at the cadence boundary;
- existing valid Daily still parses with exactly the same output contract;
- a representative Ad-hoc fixture still parses under its existing contract.

## 9. Reading Architecture

The public route remains:

```text
/briefs/<id>/
```

Do not create separate detail URL hierarchies such as `/briefs/weekly/<id>/`.

`apps/web/src/pages/briefs/[id].astro` remains the shared page shell responsible for:

- static path generation;
- public visibility;
- title/summary/topics header;
- Presentation link when enabled;
- Related Content;
- Daily-only adjacency.

Cadence-specific body rendering is extracted into focused components:

```text
apps/web/src/components/briefs/DailyBriefBody.astro
apps/web/src/components/briefs/WeeklyBriefBody.astro
```

The page chooses one body from `entry.data.cadence`.

Plan 30A may leave Ad-hoc rendering in the existing generic body path or extract a small compatibility component if required for type clarity. It must not redesign Ad-hoc content.

## 10. Daily Reading Contract

The extracted Daily component must preserve current visible semantics:

```text
Four signals
sections
From signals to action
References
```

No Daily reading copy, ordering, or field semantics should change as a side effect of Weekly work.

This extraction is allowed only because the shared route currently hard-codes Daily structure for every cadence and must be made cadence-aware.

## 11. Weekly Reading Contract

Weekly body order:

```text
Period
Weekly Thesis
Trend Movements
Key Sections
Next Period Watch
References
```

Suggested semantic markup:

```text
Period
  -> explicit from -> to range

Weekly Thesis
  -> one prominent thesis paragraph

Trend Movements
  -> cards/list with direction label + topic + summary

Sections
  -> existing section title/conclusion/facts/limitations semantics

Next Period Watch
  -> watch title + reason

References
  -> same trusted structured references pattern as Daily
```

The UI should use existing Orbis typography/cards/pills where practical. Plan 30A does not introduce a new visual design system.

## 12. Discovery Semantics

A published Weekly participates in generic Brief discovery exactly because it is a public Brief.

### 12.1 `/briefs/`

Weekly is included through existing public Brief discovery.

### 12.2 `/briefs/weekly/`

The existing route becomes real rather than placeholder-only.

The current explanatory copy referring to future schema/template work should be updated to describe the published Weekly collection.

### 12.3 `/archive/`

Archive already consumes all public Briefs and already exposes a Weekly cadence filter.

Plan 30A should not redesign Archive. Tests should prove the real Weekly appears with `data-cadence="weekly"` and remains filterable.

### 12.4 `/rss.xml`

RSS already consumes all published Briefs.

Plan 30A should not add a Weekly-specific feed. Tests should prove the Weekly reading URL appears in the existing Orbis RSS feed.

### 12.5 Topic aggregation

Topic pages already aggregate all public Briefs matching a Topic.

Plan 30A should not create Weekly-specific Topic logic. Tests should prove the real Weekly appears on each relevant Topic page.

### 12.6 `/slides/`

The real Weekly is committed with presentation disabled in 30A, so it must **not** appear in `/slides/` yet.

Plan 30B changes this when `weekly-v1` is implemented and the Weekly content switches to `presentation.enabled: true`.

## 13. Homepage Semantics

Homepage Latest Brief is a generic Brief concept and may advance to a newer Weekly.

Example:

```text
Daily publishedAt  = 2026-08-28
Weekly publishedAt = 2026-09-06

Homepage Latest Brief = Weekly
```

This is correct because Homepage Latest Brief means newest public Brief, not newest Daily.

Homepage Latest Presentation remains driven by presentation-enabled sources; a Plan 30A Weekly with Presentation disabled does not affect it.

## 14. Daily Stable Route Isolation

Weekly must never participate in Daily stable routing.

These remain Daily-only contracts:

```text
/YYYY/MM/DD/
/latest/
archive.json.latest
archive.json.issues
```

Even when Weekly is newer than every Daily:

```text
latest public Brief      -> Weekly
/latest/ target          -> latest Daily stable route
archive.json.latest      -> latest Daily publishedAt
/YYYY/MM/DD/ aliases     -> Daily entries only
```

This distinction must be enforced in integration tests, not just inferred from current implementation.

## 15. Related Content

Weekly participates in Related Content as `kind: brief`, using the existing topic-overlap ranking.

This is intentional: unlike standalone Presentation, Weekly is a first-class Brief and therefore belongs to generic reading relationships.

Daily adjacency remains Daily-only.

Plan 30A does not add Weekly previous/next navigation. A future weekly adjacency contract may be added separately if product evidence warrants it.

## 16. Real Weekly Content

Commit one small but real published Weekly under `content/briefs/**`.

The first Weekly should use repository/project evolution as evidence so it can remain factually grounded without manufacturing external claims.

Recommended identity:

```text
slug: 2026-09-01-weekly
publishedAt: 2026-09-01
period: 2026-08-26 -> 2026-09-01
```

The exact title may describe Orbis's transition from a Daily-only Slide pipeline toward a structured multi-output publishing platform.

The content must:

- be useful as an actual Weekly example rather than a test fixture;
- include at least two trend movements;
- include 2..6 real structured sections;
- include at least one next-period watch;
- use references to repository plans/commits/PRs or other verifiable public sources;
- set `presentation.enabled: false` and `template: weekly-v1`.

The date is intentionally aligned to the current project date so Homepage Latest Brief can exercise the Weekly-newer-than-Daily behavior in the normal repository artifact.

## 17. Validation and Integration Strategy

Plan 30A follows TDD with cloud GitHub Actions evidence.

### 17.1 First RED boundary

Add Weekly schema contract tests before `weeklyBriefSchema` exists.

The first Draft PR build must fail specifically because the Weekly schema/cadence contract is missing, after existing baseline checks pass.

### 17.2 Schema GREEN

Implement the minimal cadence-specific schema split and prove:

- Daily unchanged;
- Weekly dedicated;
- Ad-hoc compatibility preserved.

### 17.3 Reading RED/GREEN

Add artifact assertions for Weekly semantic sections before the Weekly reading body exists.

Then implement cadence-aware reading components.

### 17.4 Discovery integration

The real Weekly must be verified in:

```text
/briefs/
/briefs/weekly/
/archive/
/rss.xml
relevant Topic pages
Homepage Latest Brief
```

It must be absent from `/slides/` in 30A.

### 17.5 Daily isolation integration

With the real Weekly newer than the existing Daily, prove:

```text
Homepage Latest Brief = Weekly
/latest/ = Daily
archive.json.latest = Daily
structured date aliases = Daily only
```

Existing future-Daily ephemeral integration coverage must continue to work.

## 18. Error Handling

Weekly content errors must fail early and explicitly through the existing content validation pipeline.

Examples:

```text
invalid period
invalid trend direction
wrong Weekly template
missing Weekly thesis
wrong cadence-specific fields
```

No renderer or page should attempt to compensate for malformed Weekly content.

## 19. Governance

Weekly lives under the existing `content/briefs/**` path, so no new Path Guard or CODEOWNERS category is required.

Existing content-agent authority to modify `content/briefs/**` continues to apply.

Generated artifacts remain forbidden.

## 20. Files / Responsibility Map

Expected production responsibilities:

```text
packages/content-schema/src/index.ts
  -> shared Brief metadata + daily/weekly/ad-hoc cadence schemas

packages/content-schema/test/schema.test.ts
  -> cadence-exclusive schema contract

apps/web/src/components/briefs/DailyBriefBody.astro
  -> preserve Daily reading body

apps/web/src/components/briefs/WeeklyBriefBody.astro
  -> Weekly semantic reading body

apps/web/src/pages/briefs/[id].astro
  -> shared shell + cadence dispatch

apps/web/src/pages/briefs/weekly/index.astro
  -> Weekly collection discovery copy/list

content/briefs/2026-09-01-weekly.yaml
  -> first real published Weekly

tools/site-check/index.ts and/or focused Weekly integration test
  -> final artifact/discovery/Daily-isolation assertions
```

Other files should change only when required by an executable acceptance contract.

## 21. Explicit Non-goals

Plan 30A does not implement:

- `weekly-v1` renderer;
- Weekly Presentation Registry registration;
- presentation-enabled Weekly content;
- automated Weekly generation from Daily entries;
- automatic seven-day summarization;
- Weekly-specific RSS feed;
- Weekly previous/next navigation;
- monthly reports;
- trend prediction;
- new Topic semantics;
- new Archive information architecture;
- a new visual design system;
- Ad-hoc Brief redesign.

## 22. Acceptance Criteria

Plan 30A is complete when:

1. `weeklyBriefSchema` exists and is exported;
2. `Brief` has cadence-exclusive Daily / Weekly / Ad-hoc validation;
3. existing Daily schema and Daily reading semantics remain non-regressed;
4. a representative Ad-hoc Brief still validates under the previous generic contract;
5. Weekly does not require Daily's 4 signals / 5 sections / actions model;
6. Weekly period is exactly seven calendar dates and ends on `publishedAt`;
7. one real published Weekly exists in structured content;
8. `/briefs/<weekly-slug>/` renders Weekly-specific semantics;
9. Weekly appears in `/briefs/`, `/briefs/weekly/`, Archive, RSS and relevant Topic pages;
10. Homepage Latest Brief can advance to the newer Weekly;
11. `/latest/`, Daily date aliases and `archive.json.latest/issues` remain Daily-only;
12. Weekly does not enter `/slides/` while Presentation is disabled;
13. invalid Weekly source fails validation explicitly;
14. PR Preview can publicly access the Weekly reading page;
15. generated Slidev source and `dist/**` remain uncommitted.

## 23. Follow-up Boundary: Plan 30B

After 30A merges, Plan 30B will:

```text
weeklyBriefSchema payload
  -> existing Brief Presentation adapter
  -> PresentationDescriptor
  -> Registry weekly-v1
  -> renderWeeklyV1
  -> unchanged build-slides
  -> /slides/<weekly-slug>/
```

Plan 30B will switch the real Weekly to:

```yaml
presentation:
  enabled: true
  template: weekly-v1
```

and prove Daily + Weekly + standalone Talk coexist in one build.

The 30A schema therefore defines `weekly-v1` now, but 30A must never enable it before the renderer exists.
