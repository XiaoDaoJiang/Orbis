# Plan 30B — Weekly v1 Presentation Design

> Status: Approved chat design, pending written-spec review
> Roadmap: `docs/plan/30-weekly-brief.md`
> Baseline: `main@cde4f82de2f84ce6266e56008fe69c63d77bc725`
> Branch: `feat/weekly-v1-presentation`
> Depends on: Plan 20 Presentation Platform + Plan 30A Weekly Brief Model/Reading

## 1. Goal

Plan 30B completes Weekly as a first-class Orbis Presentation output without changing the Presentation Platform architecture established by Plan 20.

The completed repository must support three real Presentation sources/templates in one normal build:

```text
Daily Brief 2026-08-28                 -> daily-v1  -> /slides/2026-08-28/
Weekly Brief 2026-09-01-weekly          -> weekly-v1 -> /slides/2026-09-01-weekly/
Standalone Orbis Presentation Platform  -> talk-v1   -> /slides/orbis-presentation-platform/
```

The Weekly Presentation must express cross-time judgment rather than reuse Daily slide semantics.

Plan 30B is complete when:

- `weekly-v1` is implemented as a dedicated renderer;
- Template Registry owns `weekly-v1 -> WeeklyBrief` validation and dispatch;
- the real Weekly switches to `presentation.enabled: true`;
- Daily + Weekly + Talk build through the existing descriptor/generator/build pipeline;
- Weekly enters Slides and Homepage Latest Presentation naturally through existing discovery;
- Weekly deck links back to its Reading page and Reading links to the deck;
- Daily `/latest/`, date aliases and generated structured `archive.json` remain Daily-only;
- all new template and integration behavior is covered by RED -> GREEN cloud evidence;
- no generated Slidev source or `dist/**` output is committed.

## 2. Architecture Decision

Use a dedicated `weekly-v1` renderer registered through the existing Template Registry.

Do not merge Daily and Weekly into a cadence-switching generic Brief renderer, and do not adapt Weekly into standalone `PresentationContent` / `talk-v1`.

Target flow:

```text
WeeklyBrief
    |
    v
toBriefPresentationDescriptor()
    |
    v
PresentationDescriptor
  id / slug
  title
  publishedAt
  topics
  template = weekly-v1
  sourceKind = brief
  readingUrl = /briefs/<slug>/
  payload = WeeklyBrief
    |
    v
Template Registry
    |
    +-- weeklyBriefSchema.parse(payload)
    +-- require readingUrl
    |
    v
renderWeeklyV1()
    |
    v
apps/slides/generated/<slug>/slides.md
    |
    v
unchanged tools/build-slides
    |
    v
/slides/<slug>/
```

Existing platform boundaries remain authoritative:

- `tools/generate-slides/brief-source.ts` remains cadence-neutral;
- `tools/generate-slides/discover-presentations.ts` remains source/template-neutral;
- `tools/generate-slides/index.ts` remains renderer-neutral;
- `tools/build-slides/**` remains template-neutral;
- `apps/web/src/lib/presentation-discovery.ts` remains generic over presentation-enabled Briefs;
- Weekly-specific payload validation is owned by the Registry before renderer invocation.

## 3. No Schema Redesign

Plan 30A already established the Weekly content contract:

- period exactly seven calendar dates inclusive;
- `publishedAt === period.to`;
- `weeklyThesis`;
- 2..8 trend movements;
- 2..6 sections;
- 1..5 next-period watches;
- `presentation.template === weekly-v1`;
- Daily-only body fields rejected on Weekly.

Plan 30B does not add new Weekly content fields and does not change those cardinalities.

`packages/content-schema/**` should remain unchanged unless implementation reveals a genuine missing invariant required by the already-approved design. Any such discovery upgrades scope and requires explicit review before changing the schema.

## 4. Registry Contract

The Template Registry will expose three explicit renderer contracts:

```text
daily-v1
  -> dailyBriefSchema.parse(descriptor.payload)
  -> descriptor.readingUrl required
  -> renderDailyV1(...)

weekly-v1
  -> weeklyBriefSchema.parse(descriptor.payload)
  -> descriptor.readingUrl required
  -> renderWeeklyV1(...)

talk-v1
  -> presentationContentSchema.parse(descriptor.payload)
  -> renderTalkV1(...)
```

The Registry must reject:

- `weekly-v1` with Daily payload;
- `weekly-v1` with standalone Talk payload;
- `weekly-v1` without `readingUrl`;
- unsupported template names through the existing unsupported-template error.

The renderer itself receives a validated `WeeklyBrief`; it should not inspect or guess cadence.

## 5. Weekly v1 Slide Count Contract

Use a fixed semantic skeleton with one slide per structured Weekly section:

```text
1            Cover
2            Period + Weekly Thesis
3            Trend Movements
4..N         one slide per Weekly section
N + 1        Next Period Watch
N + 2        References
```

With `sections.length = S`:

```text
slides = S + 5
```

Because Weekly Schema already constrains `sections` to 2..6:

```text
2 sections -> 7 slides
3 sections -> 8 slides   # current real Weekly
6 sections -> 11 slides
```

This is a hard template contract.

Weekly is deliberately not fixed at 11 slides. Daily remains exactly 11 slides.

## 6. Slide Semantics

### 6.1 Cover

Use `orbis-cover` and the existing Orbis Slidev frontmatter conventions.

Expected information hierarchy:

```text
ORBIS · WEEKLY · <publishedAt>

<title>

<summary>

<period.from> -> <period.to>

Reading ->
```

The Cover must communicate both publication date and period. The deck's first slide must link to the real Brief Reading URL.

### 6.2 Period + Weekly Thesis

Use `orbis-default`.

Expected semantics:

```text
WEEKLY THESIS

<period.from> -> <period.to>

<weeklyThesis>
```

This is the executive conclusion slide. Do not duplicate sections, references or watch items onto this slide.

### 6.3 Trend Movements

Use one slide for all 2..8 trend movements.

Direction display labels:

```text
rising        -> RISING
stable        -> STABLE
cooling       -> COOLING
new-variable  -> NEW VARIABLE
```

Each trend card contains:

- direction label;
- topic;
- summary.

Do not introduce percentages, scores, charts, arrows implying quantitative forecasts, or any value not represented by structured Weekly content.

A small Weekly-specific grid/card utility may be added to `apps/slides/style.css` if existing `signal-grid` semantics are visually misleading.

### 6.4 Weekly Section Slides

Render each Weekly `section` on a dedicated slide.

Reuse the stable Brief section language from `daily-v1`:

- `section.layout` as eyebrow;
- section title;
- conclusion;
- facts;
- optional limitations;
- first section reference as original-source link.

Do not merge multiple structured sections onto one slide.

### 6.5 Next Period Watch

Render all 1..5 watch items on one slide.

Expected semantics:

```text
NEXT PERIOD WATCH

<title>
<reason>
```

Existing `action-grid` / `action-card` may be reused where it fits visually, but the copy and template markers must remain Watch semantics.

Do not label this slide `FROM SIGNALS TO ACTION`.

### 6.6 References

Use one final references slide with all Weekly top-level references.

It must contain the real Reading URL again so both the first and last slide can return to the structured Reading page.

## 7. Weekly Must Not Inherit Daily Slide Semantics

A Weekly deck must contain Weekly markers:

```text
ORBIS · WEEKLY
WEEKLY THESIS
TREND MOVEMENTS
NEXT PERIOD WATCH
REFERENCES
```

It must not contain Daily-only template markers:

```text
FOUR SIGNALS
OPEN SOURCE RADAR
IMPACT × ADOPTION HORIZON
FROM SIGNALS TO ACTION
```

This separation is tested explicitly.

## 8. HTML / Markdown Safety

`weekly-v1` follows the escaping discipline already used by `talk-v1`.

Escape all structured user/content strings before interpolation into generated HTML/Markdown where raw content could become markup:

- title;
- summary;
- weekly thesis;
- period values when rendered into HTML-bearing strings;
- trend topic;
- trend direction display value;
- trend summary;
- section title;
- section conclusion;
- section facts;
- section limitations;
- section reference title/url/supports;
- next-period watch title/reason;
- top-level reference title/url/supports.

Frontmatter string values must be serialized safely. The title must not allow raw HTML to escape through frontmatter.

Renderer tests include hostile-but-schema-valid strings such as:

```html
<script>alert(1)</script>
<iframe src="https://example.com"></iframe>
```

Generated Markdown must not contain executable/raw `<script` or `<iframe` fragments originating from those strings. Escaped forms such as `&lt;script&gt;` must be present instead.

No `v-html`, raw arbitrary HTML pass-through, external script injection or remote font dependency is introduced.

## 9. Visual System

Reuse the existing Orbis Slidev system:

- `orbis-cover`;
- `orbis-default`;
- `.eyebrow`;
- `.topic-facts`;
- `.action-grid` / `.action-card` where semantically appropriate;
- `.reference-list`;
- existing design tokens.

Allowed small additions to `apps/slides/style.css`:

```text
.weekly-period
.trend-grid
.trend-card
.trend-direction
```

Actual class names may differ, but additions must be narrowly Weekly-oriented utilities.

Do not add:

- a Weekly theme;
- Weekly-only layout components;
- another design-token package;
- JavaScript charting;
- external font/image dependencies;
- a second Slidev build process.

## 10. Real Weekly Enablement

After the renderer/Registry contract is GREEN, update the real source:

```yaml
presentation:
  enabled: true
  template: weekly-v1
```

for:

```text
content/briefs/2026-09-01-weekly.yaml
```

Do not enable the real Weekly before the first template/Registry RED -> GREEN checkpoint is established.

The Reading page already exposes a Presentation link whenever `presentation.enabled` is true, so no Weekly-specific Reading page implementation should be required.

## 11. Normal Repository Presentation Set

After real Weekly enablement and after all ephemeral fixtures are cleaned, one normal build must discover exactly the three current real Presentation sources:

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

The generated-source and final artifact checks must prove all three exist independently.

## 12. Slides Discovery

No product-code change is expected in `apps/web/src/lib/presentation-discovery.ts` because it already includes every public Brief where:

```text
status === published
presentation.enabled === true
```

After Weekly enablement, `/slides/` should naturally order current real Presentations by published date:

```text
2026-09-01  Weekly
2026-08-31  standalone Talk
2026-08-28  Daily
```

The Weekly Slides card must expose Brief-source semantics:

```text
sourceKind = brief
cadence = weekly
Open presentation ->
Read brief ->
```

No Weekly-specific discovery branch is added unless tests demonstrate a real gap.

## 13. Homepage Semantics

After 30B:

```text
Homepage Latest Brief        = Weekly 2026-09-01
Homepage Latest Presentation = Weekly 2026-09-01
```

This is intentional because the same Weekly is both the newest public Brief and the newest presentation-enabled source.

The Homepage Weekly Presentation card must expose both:

- Slides link;
- Reading link.

Standalone Talk remains a Presentation but has no fake Reading link.

## 14. Reading <-> Presentation Link Integrity

For the real Weekly:

```text
/briefs/2026-09-01-weekly/
  -> /slides/2026-09-01-weekly/

/slides/2026-09-01-weekly/
  -> /briefs/2026-09-01-weekly/
```

The generated `slides.md` must contain the correct Reading path using the current preview/production site base.

The built Slidev deck must reference its own independent public base path and must not leak another deck's base path.

## 15. Archive / RSS / Topic Identity Is Unchanged

Enabling Presentation does not change the Weekly's content identity.

Weekly remains a Brief in:

- `/archive/`;
- `/rss.xml`;
- Topic aggregation;
- Related Content.

RSS continues to publish the Weekly Reading URL, not the Slides URL.

Standalone Presentation remains outside generic Archive/RSS semantics according to Plan 20 scope.

No Archive, RSS or Topic product implementation change is expected.

## 16. Daily Stable Route Isolation

30B must preserve the distinction between latest Brief, latest Presentation and latest Daily.

With current real content:

```text
latest public Brief          = Weekly 2026-09-01
latest public Presentation   = Weekly 2026-09-01
latest Daily                 = Daily 2026-08-28
```

Daily-only generated routing contracts remain:

```text
/latest/                     -> /2026/08/28/
/YYYY/MM/DD/ aliases         -> Daily only
generated dist/site/archive.json.latest -> 2026-08-28
generated dist/site/archive.json.issues -> Daily entries only
```

`dist/site/archive.json` is a generated structured compatibility/output artifact owned by the current assembler; it is not a source-of-truth content file and must not be committed.

Weekly must never create a `/2026/09/01/` Daily alias solely because its `publishedAt` is 2026-09-01.

## 17. Mixed Presentation Integration

Extend the existing `tools/multi-presentation-check/index.ts` instead of creating another independent build harness.

The test must identify:

- a real public Daily `daily-v1` seed;
- the real public Weekly `weekly-v1` seed;
- a real public standalone Talk `talk-v1` seed.

It continues creating the existing ephemeral future Daily and non-public fixtures.

During the mixed ephemeral build, at minimum these four public decks must coexist:

```text
real Daily       -> daily-v1
real Weekly      -> weekly-v1
real Talk        -> talk-v1
future Daily     -> daily-v1
```

The test verifies for Weekly:

- generated source exists;
- built deck exists;
- deck uses its own public base path;
- generated Markdown contains Weekly markers;
- generated Markdown contains the real Reading URL;
- Slides discovery includes the Weekly as `sourceKind=brief`, `cadence=weekly`.

Existing checks remain authoritative:

- duplicate slug fails before generated output is written;
- future Daily promotes `/latest/`, date route and structured Daily archive output;
- non-public Brief/Presentation sources do not generate or leak into public discovery;
- fixtures and generated artifacts are cleaned after the integration run.

## 18. Plan 30A Artifact Contract Migration

`tools/weekly-brief/weekly-artifact-check.ts` currently encodes the intentional 30A boundary that the real Weekly is presentation-disabled and absent from Slides.

30B must update this existing contract rather than leave contradictory tests behind.

After migration, it must prove:

- Weekly Reading still has its cadence-specific semantic sections;
- Weekly Reading links to `/slides/2026-09-01-weekly/`;
- Weekly generated source exists;
- Weekly built deck exists;
- Weekly deck links back to Reading;
- `/slides/` contains the Weekly;
- Homepage Latest Brief remains Weekly;
- Homepage Latest Presentation becomes Weekly;
- Archive/RSS/Topics continue including Weekly as Brief content;
- Daily `/latest/`, date aliases and generated structured archive output remain Daily-only;
- Weekly still has no Daily previous/next adjacency.

The old assertions that Weekly must be absent from Slides/generated source are removed because they represent the completed 30A boundary, not the 30B product contract.

## 19. TDD Sequence

### 19.1 RED 1 — weekly-v1 capability missing

Before changing the real Weekly `presentation.enabled`, add template/Registry tests that require:

- a `renderWeeklyV1` implementation;
- Registry dispatch for `weekly-v1`;
- real Weekly descriptor -> weekly-v1 rendering;
- 7..11 dynamic slide-count contract;
- HTML escaping;
- wrong-payload and missing-readingUrl rejection.

The first Draft PR build must fail specifically because weekly-v1/Registry support is not implemented while existing Daily/Talk baseline tests remain GREEN.

### 19.2 GREEN 1 — renderer + Registry

Implement only:

- `apps/slides/templates/weekly-v1.ts`;
- Registry registration;
- narrowly required Weekly style utilities.

Do not enable the real Weekly yet.

Run the full PR build and record the first GREEN template checkpoint.

### 19.3 RED 2 — real Weekly Presentation integration

Then switch the real Weekly to `presentation.enabled: true` and update artifact/integration expectations first.

The next failing checkpoint should expose any missing Slides/Homepage/mixed-build integration contract rather than template capability.

If existing product discovery already behaves correctly, no product code is added merely to create a GREEN diff.

### 19.4 GREEN 2 — integration

Make only the minimum changes required by observed failures.

Final build must prove normal real-content and ephemeral mixed-content behavior.

## 20. Template Tests

Add focused Weekly renderer/Registry coverage, likely under:

```text
tools/generate-slides/weekly-v1.test.ts
```

Required cases:

### Valid real Weekly

Current real Weekly has 3 sections:

```text
expected slides = 3 + 5 = 8
```

Verify Weekly markers, Reading URL, references and no Daily-only markers.

### Minimum Weekly

Clone/construct a valid Weekly with 2 sections:

```text
expected slides = 7
```

### Maximum Weekly

Clone/construct a valid Weekly with 6 sections:

```text
expected slides = 11
```

### Escaping

Use schema-valid hostile strings to prove raw script/iframe markup does not survive rendering.

### Registry rejection

Verify:

- Weekly descriptor missing reading URL fails;
- Daily payload with `template=weekly-v1` fails;
- Talk payload with `template=weekly-v1` fails;
- existing unsupported-template behavior remains unchanged.

### Daily regression

Existing Daily renderer output equality and exactly-11-slide checks remain untouched and GREEN.

### Talk regression

Existing Talk `sections.length + 2` behavior remains GREEN.

## 21. Error Handling

Fail early at the narrowest responsible boundary:

- malformed Weekly content -> content schema/validation;
- weekly-v1 with wrong payload -> Registry Weekly parse;
- Weekly missing Reading URL -> Registry explicit error;
- duplicate public slug -> discovery before generated writes;
- renderer output violation -> template unit test;
- mixed public artifact violation -> integration/artifact checks.

Do not hide malformed content or downgrade failures to warnings.

## 22. Expected File Changes

Expected production changes:

```text
apps/slides/templates/weekly-v1.ts
  NEW: dedicated Weekly renderer

apps/slides/templates/registry.ts
  MODIFY: register weekly-v1 and enforce Weekly payload/reading URL

apps/slides/style.css
  OPTIONAL MODIFY: only narrow trend/Weekly utilities

content/briefs/2026-09-01-weekly.yaml
  MODIFY: presentation.enabled false -> true
```

Expected test/integration changes:

```text
tools/generate-slides/weekly-v1.test.ts
  NEW: Weekly renderer + Registry contract

tools/generate-slides/presentation-platform.test.ts
  MODIFY only if shared Registry assertions belong there

tools/multi-presentation-check/index.ts
  MODIFY: explicitly assert Daily + Weekly + Talk + future Daily mixed build

tools/weekly-brief/weekly-artifact-check.ts
  MODIFY: migrate 30A presentation-absent assertions to 30B presentation-present assertions

tools/site-check/index.ts
  OPTIONAL MODIFY only if generic site checks need a weekly-v1-specific assertion

package.json
  MODIFY only for focused test wiring if required
```

Design documentation:

```text
docs/superpowers/specs/2026-09-01-weekly-v1-presentation-design.md
```

An implementation plan will be written only after this spec is approved.

## 23. Files Expected to Remain Unchanged

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

If a failing executable contract proves one of these must change, investigate the root cause first and keep the change minimal.

## 24. Non-goals

Plan 30B does not implement:

- Weekly auto-generation from Daily;
- seven-day automatic summarization;
- new Weekly Schema fields;
- a Weekly design system or brand-column system;
- monthly Briefs;
- trend forecasting or quantitative trend scores;
- charts sourced from invented metrics;
- Weekly previous/next navigation;
- new stable date aliases for Weekly;
- a second Presentation build pipeline;
- generic Brief renderer consolidation;
- conversion of Weekly into standalone Presentation content;
- changes to Daily 11-slide semantics;
- changes to Talk semantics.

## 25. Final Acceptance Matrix

The final PR must provide fresh cloud evidence for all of the following:

| Contract | Required result |
| --- | --- |
| Plan 30A Weekly schema | unchanged / GREEN |
| daily-v1 slide count | exactly 11 |
| talk-v1 slide count | `sections.length + 2` |
| weekly-v1 min | 2 sections -> 7 slides |
| real weekly-v1 | 3 sections -> 8 slides |
| weekly-v1 max | 6 sections -> 11 slides |
| Weekly semantic markers | present |
| Daily-only markers in Weekly | absent |
| Weekly HTML escaping | raw hostile HTML absent, escaped content present |
| weekly-v1 wrong Daily payload | fail |
| weekly-v1 wrong Talk payload | fail |
| Weekly missing readingUrl | fail |
| unsupported template | existing failure preserved |
| normal generated decks | exactly real Daily + Weekly + Talk |
| ephemeral mixed build | Daily + Weekly + Talk + future Daily coexist |
| independent deck bases | all correct |
| Weekly Reading -> Slides | correct |
| Weekly Slides -> Reading | correct |
| `/slides/` | Weekly present as Brief/weekly |
| Homepage Latest Brief | Weekly |
| Homepage Latest Presentation | Weekly |
| Archive | Weekly remains Brief/weekly |
| RSS | Weekly Reading URL, not Slides URL |
| Topic aggregation | Weekly remains included |
| Related Content | Weekly remains Brief content |
| `/latest/` | newest Daily stable route |
| Daily date aliases | Daily only |
| generated `dist/site/archive.json` | Daily-only latest/issues |
| Weekly date | does not create Daily alias |
| non-public sources | excluded from source/deck/discovery |
| duplicate slug | fail before generated writes |
| generated sources / dist | not committed |
| tools/build-slides | unchanged |
| workflows | unchanged |
| Trusted Preview | Weekly Reading and Weekly Slides publicly accessible |

## 26. Completion Boundary

When Plan 30B is merged, Plan 30 Weekly Brief is functionally complete for the first release:

```text
Weekly structured model      complete (30A)
Weekly Reading               complete (30A)
Weekly discovery             complete (30A)
weekly-v1 Presentation       complete (30B)
Daily + Weekly + Talk build  complete (30B)
Weekly trusted Preview       complete (30B)
```

Further Weekly work should be driven by product evidence rather than expanding this first-release scope.
