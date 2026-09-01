# Plan 30B — Weekly v1 Presentation Design

> Status: Approved chat design, pending written-spec review
> Roadmap: `docs/plan/30-weekly-brief.md`
> Baseline: `main@cde4f82de2f84ce6266e56008fe69c63d77bc725`
> Branch: `feat/weekly-v1-presentation`
> Depends on: Plan 20 Presentation Platform + Plan 30A Weekly Brief Model/Reading

## 1. Goal

Plan 30B completes Weekly as a first-class Orbis Presentation output without changing the Presentation Platform architecture established by Plan 20.

A normal real-content build must support:

```text
Daily Brief 2026-08-28                 -> daily-v1  -> /slides/2026-08-28/
Weekly Brief 2026-09-01-weekly          -> weekly-v1 -> /slides/2026-09-01-weekly/
Standalone Orbis Presentation Platform  -> talk-v1   -> /slides/orbis-presentation-platform/
```

The Weekly deck expresses cross-time judgment rather than reusing Daily slide semantics.

Plan 30B is complete when:

- `weekly-v1` is a dedicated renderer;
- Template Registry owns `weekly-v1 -> WeeklyBrief` validation and dispatch;
- the real Weekly switches to `presentation.enabled: true`;
- Daily + Weekly + Talk use the existing descriptor/generator/build pipeline;
- Weekly enters Slides and Homepage Latest Presentation through existing discovery;
- Reading and Slides link to each other;
- Daily `/latest/`, date aliases and generated structured `archive.json` remain Daily-only;
- RED -> GREEN cloud evidence covers template and integration behavior;
- generated Slidev sources and `dist/**` are never committed.

## 2. Architecture Decision

Use a dedicated `weekly-v1` renderer registered through the existing Template Registry.

Do not:

- merge Daily and Weekly into a cadence-switching generic Brief renderer;
- adapt Weekly into standalone `PresentationContent` / `talk-v1`;
- add another generator or build path.

Target flow:

```text
WeeklyBrief
    -> toBriefPresentationDescriptor()
    -> PresentationDescriptor
         template = weekly-v1
         sourceKind = brief
         readingUrl = /briefs/<slug>/
         payload = WeeklyBrief
    -> Template Registry
         weeklyBriefSchema.parse(payload)
         require readingUrl
    -> renderWeeklyV1()
    -> apps/slides/generated/<slug>/slides.md
    -> unchanged tools/build-slides
    -> /slides/<slug>/
```

Existing platform boundaries remain authoritative:

- `tools/generate-slides/brief-source.ts` remains cadence-neutral;
- `tools/generate-slides/discover-presentations.ts` remains source/template-neutral;
- `tools/generate-slides/index.ts` remains renderer-neutral;
- `tools/build-slides/**` remains template-neutral;
- `apps/web/src/lib/presentation-discovery.ts` remains generic over presentation-enabled Briefs;
- Weekly payload validation belongs to the Registry before renderer invocation.

## 3. No Schema Redesign

Plan 30A already established:

- period exactly seven calendar dates inclusive;
- `publishedAt === period.to`;
- `weeklyThesis`;
- 2..8 trend movements;
- 2..6 sections;
- 1..5 next-period watches;
- `presentation.template === weekly-v1`;
- Daily-only body fields rejected on Weekly.

Plan 30B adds no Weekly content fields and changes none of these cardinalities.

`packages/content-schema/**` is expected to remain unchanged. If implementation reveals a genuine missing invariant, that is a scope change and must be reviewed before modifying the schema.

## 4. Registry Contract

The Template Registry exposes three explicit contracts:

```text
daily-v1
  -> dailyBriefSchema.parse(payload)
  -> readingUrl required
  -> renderDailyV1()

weekly-v1
  -> weeklyBriefSchema.parse(payload)
  -> readingUrl required
  -> renderWeeklyV1()

talk-v1
  -> presentationContentSchema.parse(payload)
  -> renderTalkV1()
```

Registry rejection cases:

- `weekly-v1` + Daily payload;
- `weekly-v1` + standalone Talk payload;
- `weekly-v1` without `readingUrl`;
- unsupported template names through the existing unsupported-template error.

The renderer receives a validated `WeeklyBrief`; it does not guess cadence.

## 5. Weekly v1 Slide Count

Use a fixed semantic skeleton with one slide per structured Weekly section:

```text
1            Cover
2            Period + Weekly Thesis
3            Trend Movements
4..N         Weekly Section x sections.length
N + 1        Next Period Watch
N + 2        References
```

For `sections.length = S`:

```text
slides = S + 5
```

The existing Weekly Schema therefore gives:

```text
2 sections -> 7 slides
3 sections -> 8 slides   # current real Weekly
6 sections -> 11 slides
```

This is a hard template contract. Weekly is not fixed at 11 slides; Daily remains exactly 11.

## 6. Slide Semantics

### 6.1 Cover

Use `orbis-cover` and existing Orbis frontmatter conventions.

```text
ORBIS · WEEKLY · <publishedAt>
<title>
<summary>
<period.from> -> <period.to>
Reading ->
```

The first slide must link to the real Brief Reading URL.

### 6.2 Period + Weekly Thesis

Use `orbis-default`.

```text
WEEKLY THESIS
<period.from> -> <period.to>
<weeklyThesis>
```

This is the executive conclusion slide. It does not duplicate sections, references or watch items.

### 6.3 Trend Movements

Use one slide for all 2..8 movements.

Display labels:

```text
rising        -> RISING
stable        -> STABLE
cooling       -> COOLING
new-variable  -> NEW VARIABLE
```

Each trend card contains only direction, topic and summary. Do not invent percentages, scores, charts or forecast quantities.

A small Weekly-specific grid/card utility may be added to `apps/slides/style.css` if reusing `signal-grid` would imply Daily semantics.

### 6.4 Weekly Sections

Render each Weekly `section` on a dedicated slide and reuse the stable Brief section language from `daily-v1`:

- layout as eyebrow;
- title;
- conclusion;
- facts;
- optional limitations;
- first section reference as original-source link.

Do not merge multiple structured sections onto one slide.

### 6.5 Next Period Watch

Render all 1..5 watch items on one slide:

```text
NEXT PERIOD WATCH
<title>
<reason>
```

Existing `action-grid` / `action-card` may be reused visually, but the semantic marker remains Watch. It must not be labeled `FROM SIGNALS TO ACTION`.

### 6.6 References

Use one final references slide with all Weekly top-level references and the real Reading URL.

Both first and last slide therefore provide a path back to Reading.

## 7. Weekly vs Daily Semantics

Weekly must contain:

```text
ORBIS · WEEKLY
WEEKLY THESIS
TREND MOVEMENTS
NEXT PERIOD WATCH
REFERENCES
```

Weekly must not contain Daily-only template markers:

```text
FOUR SIGNALS
OPEN SOURCE RADAR
IMPACT × ADOPTION HORIZON
FROM SIGNALS TO ACTION
```

Tests enforce this separation explicitly.

## 8. HTML / Markdown Safety

`weekly-v1` follows the escaping discipline already used by `talk-v1`.

Escape structured strings before interpolation into generated HTML/Markdown, including:

- title and summary;
- weekly thesis;
- period values when placed in HTML-bearing strings;
- trend topic/direction/summary;
- section title/conclusion/facts/limitations;
- section reference title/url/supports;
- next-period watch title/reason;
- top-level reference title/url/supports.

Frontmatter strings must be serialized safely. The title must not allow raw HTML to escape through frontmatter.

Renderer tests include schema-valid hostile strings such as:

```html
<script>alert(1)</script>
<iframe src="https://example.com"></iframe>
```

Generated Markdown must not contain raw executable `<script` or `<iframe` fragments originating from content. Escaped forms such as `&lt;script&gt;` must be present instead.

Do not introduce `v-html`, raw arbitrary HTML pass-through, external scripts or remote fonts.

## 9. Visual System

Reuse:

- `orbis-cover`;
- `orbis-default`;
- `.eyebrow`;
- `.topic-facts`;
- `.action-grid` / `.action-card` where appropriate;
- `.reference-list`;
- existing Orbis design tokens.

Allowed small Weekly utilities may include equivalents of:

```text
.weekly-period
.trend-grid
.trend-card
.trend-direction
```

Do not add a Weekly theme, Weekly-only layout components, another token system, JavaScript charting, external image/font dependencies or a second Slidev build process.

## 10. Real Weekly Enablement

The real source is:

```text
content/briefs/2026-09-01-weekly.yaml
```

Final state:

```yaml
presentation:
  enabled: true
  template: weekly-v1
```

Do not enable it before the template/Registry RED -> GREEN checkpoint is complete.

The Reading page already exposes a Presentation link whenever `presentation.enabled` is true, so no Weekly-specific Reading implementation is expected.

## 11. Normal Real Presentation Set

After enablement and ephemeral cleanup, one normal build must contain the current three real Presentation sources:

```text
2026-08-28
  sourceKind = brief
  cadence = daily
  template = daily-v1

2026-09-01-weekly
  sourceKind = brief
  cadence = weekly
  template = weekly-v1

orbis-presentation-platform
  sourceKind = presentation
  template = talk-v1
```

Generated source and final artifact checks prove all three exist independently.

## 12. Slides Discovery

No product-code change is expected in `apps/web/src/lib/presentation-discovery.ts`; it already includes public Briefs with presentation enabled.

Expected real `/slides/` order:

```text
2026-09-01  Weekly
2026-08-31  standalone Talk
2026-08-28  Daily
```

Weekly card semantics:

```text
sourceKind = brief
cadence = weekly
Open presentation ->
Read brief ->
```

No Weekly-specific discovery branch is added unless executable tests expose a real gap.

## 13. Homepage Semantics

After 30B:

```text
Homepage Latest Brief        = Weekly 2026-09-01
Homepage Latest Presentation = Weekly 2026-09-01
```

The Weekly Presentation card exposes both Slides and Reading links.

Standalone Talk remains a Presentation without a fake Reading link.

## 14. Reading <-> Presentation Integrity

For the real Weekly:

```text
/briefs/2026-09-01-weekly/
  -> /slides/2026-09-01-weekly/

/slides/2026-09-01-weekly/
  -> /briefs/2026-09-01-weekly/
```

Generated `slides.md` must contain the correct Reading path using the active preview/production site base.

The built Weekly deck must use its own public base path and not leak another deck's base path.

## 15. Archive / RSS / Topic Identity

Enabling Presentation does not change Weekly's content identity.

Weekly remains a Brief in:

- Archive;
- RSS;
- Topic aggregation;
- Related Content.

RSS continues to publish the Weekly Reading URL, not its Slides URL.

Standalone Presentation remains outside generic Archive/RSS semantics under Plan 20.

No Archive, RSS or Topic product implementation change is expected.

## 16. Daily Stable Route Isolation

Current real-content semantics after 30B:

```text
latest public Brief          = Weekly 2026-09-01
latest public Presentation   = Weekly 2026-09-01
latest Daily                 = Daily 2026-08-28
```

Daily-only generated routes remain:

```text
/latest/                     -> /2026/08/28/
/YYYY/MM/DD/ aliases         -> Daily only
dist/site/archive.json.latest -> 2026-08-28
dist/site/archive.json.issues -> Daily entries only
```

`dist/site/archive.json` is a generated assembler output, not source-of-truth content, and is never committed.

Weekly must not create a `/2026/09/01/` Daily alias solely because its `publishedAt` is 2026-09-01.

## 17. Mixed Presentation Integration

Extend the existing `tools/multi-presentation-check/index.ts`; do not create another build harness.

The test identifies:

- real public Daily `daily-v1`;
- real public Weekly `weekly-v1`;
- real public standalone Talk `talk-v1`.

It continues creating the existing ephemeral future Daily and non-public fixtures.

During the ephemeral mixed build these public decks coexist:

```text
real Daily       -> daily-v1
real Weekly      -> weekly-v1
real Talk        -> talk-v1
future Daily     -> daily-v1
```

Weekly assertions include:

- generated source exists;
- built deck exists;
- independent public base path;
- Weekly markers in generated Markdown;
- real Reading URL in generated Markdown;
- Slides discovery exposes `sourceKind=brief` and `cadence=weekly`.

Existing checks remain authoritative:

- duplicate slug fails before generated output;
- future Daily promotes `/latest/`, date route and generated Daily archive output;
- non-public Brief/Presentation sources do not generate or leak;
- fixtures and generated artifacts are cleaned after the integration run.

## 18. Plan 30A Artifact Contract Migration

`tools/weekly-brief/weekly-artifact-check.ts` currently proves the intentional 30A boundary: Weekly is presentation-disabled and absent from Slides.

30B must migrate this contract. Final assertions prove:

- Weekly Reading semantic sections remain intact;
- Reading links to Weekly Slides;
- Weekly generated source exists;
- Weekly built deck exists;
- deck links back to Reading;
- `/slides/` contains Weekly;
- Homepage Latest Brief remains Weekly;
- Homepage Latest Presentation becomes Weekly;
- Archive/RSS/Topics continue including Weekly as Brief content;
- Daily `/latest/`, date aliases and generated Daily archive output remain Daily-only;
- Weekly still has no Daily previous/next adjacency.

The old “Weekly must be absent from Slides/generated source” assertions are removed because they encode the completed 30A boundary, not the 30B product contract.

## 19. TDD Sequence

### 19.1 RED 1 — weekly-v1 capability missing

Before changing real Weekly enablement, add template/Registry tests requiring:

- `renderWeeklyV1`;
- Registry dispatch for `weekly-v1`;
- real Weekly descriptor -> weekly-v1 rendering;
- 7..11 dynamic slide counts;
- HTML escaping;
- wrong-payload rejection;
- missing-readingUrl rejection.

The first Draft PR build must fail specifically because weekly-v1/Registry support is absent while existing Daily/Talk baseline contracts remain GREEN.

### 19.2 GREEN 1 — renderer + Registry

Implement only:

- `apps/slides/templates/weekly-v1.ts`;
- Registry registration;
- narrowly required Weekly style utilities.

Keep the real Weekly `presentation.enabled: false` during this checkpoint.

Run the full PR build and record a GREEN template checkpoint.

### 19.3 RED 2 — real Weekly Presentation integration

With the renderer already GREEN and the real Weekly still disabled, first migrate the 30A artifact/integration tests so they now expect:

- a generated Weekly source/deck;
- Weekly in Slides;
- Homepage Latest Presentation = Weekly;
- Reading <-> Slides links.

Run the PR build and record the expected RED caused by the real Weekly still being presentation-disabled.

Only after that RED is observed, change the real Weekly to `presentation.enabled: true`.

This preserves test-first ordering for the production enablement switch.

### 19.4 GREEN 2 — integration

After enabling the real Weekly, run the same integration contracts.

If existing product discovery already behaves correctly, do not modify product code merely to create a larger diff. Make only changes required by observed failures.

The final build proves both normal real-content and ephemeral mixed-content behavior.

## 20. Template Test Contract

Add focused Weekly renderer/Registry coverage, likely:

```text
tools/generate-slides/weekly-v1.test.ts
```

Required cases:

- real Weekly: 3 sections -> 8 slides;
- minimum Weekly: 2 sections -> 7 slides;
- maximum Weekly: 6 sections -> 11 slides;
- Weekly semantic markers present;
- Daily-only markers absent;
- real Reading URL present;
- hostile HTML escaped;
- Weekly missing reading URL fails;
- Daily payload with `weekly-v1` fails;
- Talk payload with `weekly-v1` fails;
- existing unsupported-template behavior remains unchanged.

Existing Daily exact-output / exactly-11-slide checks remain GREEN.

Existing Talk `sections.length + 2` checks remain GREEN.

## 21. Error Handling

Fail at the narrowest responsible boundary:

- malformed Weekly content -> schema/content validation;
- weekly-v1 wrong payload -> Registry Weekly parse;
- Weekly missing Reading URL -> Registry explicit error;
- duplicate public slug -> discovery before generated writes;
- renderer-output violation -> template unit test;
- public artifact/discovery violation -> integration/artifact tests.

Do not hide malformed content or downgrade failures to warnings.

## 22. Expected File Changes

Expected production changes:

```text
apps/slides/templates/weekly-v1.ts             NEW
apps/slides/templates/registry.ts              MODIFY
apps/slides/style.css                          OPTIONAL narrow Weekly utilities
content/briefs/2026-09-01-weekly.yaml          enabled false -> true
```

Expected test/integration changes:

```text
tools/generate-slides/weekly-v1.test.ts        NEW
tools/generate-slides/presentation-platform.test.ts  MODIFY only if shared Registry assertions belong there
tools/multi-presentation-check/index.ts        MODIFY
tools/weekly-brief/weekly-artifact-check.ts    MODIFY
tools/site-check/index.ts                      OPTIONAL only for generic artifact assertions
package.json                                   MODIFY only for focused test wiring
```

Design document:

```text
docs/superpowers/specs/2026-09-01-weekly-v1-presentation-design.md
```

An implementation plan is written only after this spec is approved.

## 23. Expected Unchanged Files

Do not plan changes to:

```text
packages/content-schema/**
tools/generate-slides/brief-source.ts
tools/generate-slides/discover-presentations.ts
tools/generate-slides/index.ts
tools/build-slides/**
tools/assemble-site/**
apps/web/src/lib/presentation-discovery.ts
apps/web/src/pages/rss.xml.ts
apps/web/src/pages/archive/index.astro
apps/web/src/pages/topics/[id].astro
.github/workflows/**
```

If an executable contract proves one must change, investigate the root cause first and keep any change minimal.

## 24. Non-goals

Plan 30B does not implement:

- Weekly auto-generation from Daily;
- seven-day automatic summarization;
- new Weekly Schema fields;
- Weekly brand-column/design-system expansion;
- monthly Briefs;
- trend forecasting or invented quantitative scores;
- Weekly previous/next navigation;
- new Weekly date aliases;
- a second Presentation pipeline;
- generic Brief renderer consolidation;
- conversion of Weekly into standalone Presentation content;
- changes to Daily 11-slide semantics;
- changes to Talk semantics.

## 25. Final Acceptance Matrix

Fresh cloud evidence must prove:

| Contract | Required result |
| --- | --- |
| Plan 30A Weekly schema | unchanged / GREEN |
| daily-v1 | exactly 11 slides |
| talk-v1 | `sections.length + 2` slides |
| weekly-v1 minimum | 2 sections -> 7 slides |
| real weekly-v1 | 3 sections -> 8 slides |
| weekly-v1 maximum | 6 sections -> 11 slides |
| Weekly semantic markers | present |
| Daily-only markers in Weekly | absent |
| HTML escaping | raw hostile HTML absent; escaped content present |
| weekly-v1 + Daily payload | fail |
| weekly-v1 + Talk payload | fail |
| Weekly missing readingUrl | fail |
| unsupported template | existing failure preserved |
| normal real decks | Daily + Weekly + Talk |
| ephemeral mixed build | Daily + Weekly + Talk + future Daily coexist |
| deck base paths | independent and correct |
| Weekly Reading -> Slides | correct |
| Weekly Slides -> Reading | correct |
| `/slides/` | Weekly present as Brief/weekly |
| Homepage Latest Brief | Weekly |
| Homepage Latest Presentation | Weekly |
| Archive | Weekly remains Brief/weekly |
| RSS | Weekly Reading URL, not Slides URL |
| Topic / Related | Weekly remains included as Brief content |
| `/latest/` | newest Daily stable route |
| Daily date aliases | Daily only |
| generated `dist/site/archive.json` | Daily-only latest/issues |
| Weekly date | no Daily alias |
| non-public sources | excluded |
| duplicate slug | fail before generated writes |
| generated sources / dist | not committed |
| tools/build-slides | unchanged |
| workflows | unchanged |
| Trusted Preview | Weekly Reading and Weekly Slides publicly accessible |

## 26. Completion Boundary

After Plan 30B merges, Plan 30 Weekly Brief is functionally complete for its first release:

```text
Weekly structured model      complete (30A)
Weekly Reading               complete (30A)
Weekly discovery             complete (30A)
weekly-v1 Presentation       complete (30B)
Daily + Weekly + Talk build  complete (30B)
Weekly Trusted Preview       complete (30B)
```

Further Weekly work should be driven by product evidence rather than expanding this first-release scope.
