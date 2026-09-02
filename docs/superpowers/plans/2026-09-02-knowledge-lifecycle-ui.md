# Plan 60B · Knowledge Lifecycle UI Implementation Plan

> Baseline: `main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> Design: `docs/superpowers/specs/2026-09-02-knowledge-lifecycle-design.md`
> Depends on: Plan 60A Knowledge Lifecycle Contract · merged via PR #23

## Goal

Expose Knowledge editorial state, derived review health and replacement relationships in Astro Reading without duplicating Plan 60A lifecycle logic or changing source content semantics.

60B is a Web-only consumer of the stable 60A contract. It must preserve existing SEO/JSON-LD/Related Content behavior and stable Knowledge URLs.

## Architecture boundary

Astro must not reimplement date arithmetic or inverse replacement logic.

Create a Web adapter that imports the 60A pure helpers directly:

```text
apps/web/src/lib/knowledge-lifecycle.ts
        ↓
tools/knowledge-lifecycle/lifecycle.ts
  ├── evaluateReviewHealth
  └── deriveSupersedes
```

The Web adapter may build presentation-oriented view models, but all review-date classification stays in `evaluateReviewHealth`.

### Evaluation date

The static build needs one explicit UTC calendar date at its boundary:

```text
KNOWLEDGE_EVALUATION_DATE=<YYYY-MM-DD>   # deterministic fixture/test override
otherwise                                # Production / ordinary build
new Date().toISOString().slice(0, 10)
```

The environment override exists for deterministic tests; it is not persisted into content.

## Publication / addressability policy

Keep normal discovery semantics separate from stable detail addressability.

```text
published / active      current public Knowledge
needs-review            publicly addressable + attention UI
archived                publicly addressable + historical UI
draft                   not publicly addressable
```

Do not simply widen the existing `isPublicKnowledge()` predicate if that would make archived Knowledge enter Related Content, Sitemap or other current discovery surfaces.

Preferred split:

- existing current discovery remains focused on `published / active` unless an explicit product surface opts in;
- new `isKnowledgeAddressable()` covers `published / active / needs-review / archived` for detail routes;
- Knowledge Index intentionally renders lifecycle groups from all non-draft entries.

## Task 1 — RED: Web lifecycle view-model contract

Create:

- `tools/knowledge-lifecycle/ui-contract.test.ts`
- package script `test:knowledge-lifecycle-ui`

The contract must require a Web adapter and prove with a fixed evaluation date:

- active + future review → current;
- active + 14 days → due-soon;
- active + past review → overdue;
- explicit `needs-review` remains needs-review even when review health is current;
- archived remains addressable but historical;
- draft is not addressable;
- `supersededBy` resolves to a replacement record;
- inverse `supersedes[]` is derived from 60A helper output;
- deterministic sorting for inverse links;
- no lifecycle result depends on local timezone.

Expected RED: missing Web lifecycle adapter.

## Task 2 — GREEN: Web lifecycle adapter

Create:

- `apps/web/src/lib/knowledge-lifecycle.ts`

Responsibilities:

- import `evaluateReviewHealth` and `deriveSupersedes` from 60A;
- resolve/validate one build evaluation date;
- expose an addressability predicate;
- build lifecycle view records for index/detail rendering;
- resolve replacement and inverse replacement navigation metadata;
- keep source `status` untouched.

Do not add a second review-health enum or second date algorithm.

Run full `pnpm build` and require Plan 10–60A contracts to remain green.

## Task 3 — RED: lifecycle fixture UI contract

Create an ephemeral fixture build test, preferably:

- `tools/knowledge-lifecycle/ui-fixture-build.test.ts`

Use a fixed:

```text
KNOWLEDGE_EVALUATION_DATE=2026-09-02
```

Create temporary Knowledge entries covering at least:

1. `active` + overdue review date;
2. `needs-review` + future review date;
3. `archived` + `supersededBy` replacement;
4. replacement entry that derives `supersedes[]`.

The RED fixture must require final HTML behavior that does not yet exist:

### Index

- lifecycle summary counts;
- Current section;
- Needs Review / Attention section;
- Historical / Archived section;
- visible `current / due-soon / overdue` labels where relevant;
- archived content not mixed into Current.

### Detail

- `needs-review` route is generated;
- archived route is generated;
- editorial status is visible;
- review health is visible;
- next-review / overdue text is visible;
- archived notice is visible;
- superseded page links to replacement;
- replacement page links back through derived `supersedes[]`;
- canonical URL remains the entry's own stable Knowledge URL;
- no automatic redirect from archived/superseded URL.

Expected RED: current route filtering and templates do not render these lifecycle states.

## Task 4 — GREEN: Knowledge Index + Detail UI

Preferred files:

- `apps/web/src/pages/knowledge/index.astro`
- `apps/web/src/pages/knowledge/[id].astro`
- `apps/web/src/lib/knowledge-lifecycle.ts`
- optional focused component, e.g. `apps/web/src/components/KnowledgeLifecycleMeta.astro`
- existing shared stylesheet/layout only if lifecycle presentation needs reusable classes.

### Knowledge Index

Render lifecycle-aware groups without turning the page into a dashboard product:

```text
Knowledge
├── Current
├── Needs Review / Attention
├── Recently Updated
└── Historical
```

Recommended grouping rules:

- Current: `published / active` and reviewHealth=current;
- Attention: explicit `needs-review`, `due-soon` or `overdue`;
- Historical: archived;
- Recently Updated: a secondary list derived from `updatedAt ?? publishedAt`, not a new persisted state.

Avoid duplicate cards inside the primary Current/Attention/Historical partition; Recently Updated may be a compact secondary view.

### Knowledge Detail

Show lifecycle metadata near the article header:

- editorial status;
- Published;
- Updated when present;
- Next review when present;
- Review health;
- days until / days overdue where useful;
- explicit needs-review warning;
- archived warning;
- `Replaced by` link for `supersededBy`;
- `Supersedes` links derived from inverse relation.

Keep Topics, References, Related Content, canonical and JSON-LD behavior unchanged unless artifact verification proves a required compatibility adjustment.

## Task 5 — RED: final artifact lifecycle contract

Create:

- `tools/knowledge-lifecycle/ui-artifact-check.ts`

Wire a package script such as:

```text
test:knowledge-lifecycle-ui-artifact
```

The normal real-content artifact check should avoid date-fragile assertions. It may require stable structural markers such as:

- lifecycle metadata container exists on current Knowledge detail;
- editorial status is rendered;
- review date is rendered when source has `reviewAt`;
- lifecycle Index headings exist;
- existing Knowledge JSON-LD remains valid;
- canonical still points to Production Knowledge URL;
- no raw `preview-pr-*` identity leaks into canonical/JSON-LD.

Exact due-soon/overdue variants belong in the fixed-date fixture test from Task 3.

Expected RED: normal artifact lacks lifecycle UI markers/groups.

## Task 6 — GREEN: build integration

Wire:

- `test:knowledge-lifecycle-ui` into validation after 60A lifecycle contracts;
- deterministic fixture UI test into validation or a focused pre-artifact phase;
- final lifecycle artifact check after Web/site assembly at an order that does not conflict with ephemeral fixtures.

Do not commit fixture content or generated artifacts.

Do not add workflow changes unless existing read-only PR Build cannot exercise the contract through `pnpm build`.

## Task 7 — regression boundaries

Required executable coverage on final head:

- `Path Guard` passes;
- full `pnpm build` passes;
- 60A evaluator/relation/report contracts stay green;
- 60B fixed-date fixture proves current/due-soon/overdue/needs-review/archived semantics;
- archived and needs-review detail URLs are generated;
- archived/superseded URLs remain self-canonical and do not redirect;
- replacement link and inverse supersedes link are correct;
- Related Content / Sitemap / RSS do not accidentally promote archived Knowledge as current content;
- existing SEO URL and structured-data contracts stay green;
- no source content mutation occurs;
- Trusted Preview public smoke passes.

## Approved 60B scope

Allowed production surfaces:

- Knowledge-specific Astro index/detail rendering;
- a focused Knowledge lifecycle Web adapter/component;
- Web styles required for lifecycle notices/badges;
- lifecycle UI tests/artifact checks;
- minimal current-vs-addressable predicate changes necessary for stable routes.

Explicit non-scope:

- changing 60A evaluator rules;
- adding `reviewIntervalDays` or automatic next-review calculation;
- source content edits solely to demonstrate the feature;
- automatic status mutation;
- automatic redirects from archived/superseded Knowledge;
- database/CMS/server runtime;
- scheduled review automation (Plan 70);
- redesign of global Brief/Essay/Presentation publication statuses.

## Merge / Production gate

60B implementation must start from the current stable main after the 60A Production gate is complete.

Final delivery sequence:

```text
60A exact-SHA Production gate
        ↓
create feat/knowledge-lifecycle-ui
        ↓
RED / GREEN contracts
        ↓
Draft PR
        ↓
full PR Build + Trusted Preview
        ↓
human merge
        ↓
fresh main Site Build
        ↓
Production Pages deploy=true + public smoke
        ↓
Plan 60 / Milestone F Done
```
