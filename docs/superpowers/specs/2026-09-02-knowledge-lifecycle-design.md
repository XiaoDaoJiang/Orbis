# Plan 60 · Knowledge Lifecycle Design

> Status: Approved
> Baseline: `main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> Milestone: F — Durable Knowledge

## 1. Decision

Plan 60 separates persisted editorial state from derived review health.

Persisted editorial state stays in Git-authored content:

```text
draft → active ↔ needs-review → archived
```

Derived review health is computed from `reviewAt` and an explicit evaluation date:

```text
current | due-soon | overdue
```

A calendar boundary must never rewrite source content or silently change `status`.

## 2. Persistence model

Knowledge source remains Git-native and may persist:

```yaml
status: active
publishedAt: 2026-08-28
updatedAt: 2026-08-28
reviewAt: 2026-11-01
supersededBy: optional-new-knowledge-id
```

`needs-review` is an explicit editorial judgment, not a computed alias for `reviewAt < today`.

## 3. Derived review health

The lifecycle evaluator accepts an explicit UTC calendar date so tests and CI do not depend on runner locale/timezone.

Recommended first contract:

```text
no reviewAt         → current / unscheduled metadata
reviewAt > dueSoon  → current
0 <= daysUntil <= N → due-soon
reviewAt < today    → overdue
```

The due-soon threshold is a tool policy, initially 14 days, not persisted per entry.

Review health is advisory:

- `ERROR` — invalid structure or broken relation;
- `WARN` — overdue;
- `INFO` — due soon.

Overdue alone must not fail the production build.

## 4. Replacement relation

Persist only one canonical edge:

```yaml
supersededBy: new-knowledge-id
```

Rules:

- target ID must resolve to another Knowledge entry;
- self-reference is invalid;
- archived entries may point to their replacement;
- active entries may temporarily declare a replacement during a migration PR, but tooling should report the relation explicitly;
- inverse `supersedes[]` is derived from the registry of entries and is never stored.

This avoids inconsistent dual persistence between `supersedes[]` and `supersededBy`.

## 5. Publication semantics

Plan 60 does not globally redesign `publicationStatusSchema` because Brief, Essay and Presentation already depend on it.

For Knowledge only:

- `published` remains a compatible public legacy state;
- `active` is the preferred current durable state;
- `needs-review` remains publicly addressable but visually flagged;
- `archived` remains permanently addressable but excluded from normal current discovery and visibly marked as historical/superseded.

The detail route must preserve stable URLs for `needs-review` and `archived` entries.

## 6. 60A — Knowledge Lifecycle Contract

Scope:

- optional `supersededBy` in Knowledge Schema;
- pure lifecycle evaluator with explicit evaluation date;
- due-soon / overdue detection;
- replacement relation validation and inverse derivation;
- human-readable + machine-readable review report;
- executable contracts integrated into root validation/build without making overdue a fatal error.

Non-scope:

- Web visual changes;
- automatic source edits;
- status mutation;
- LLM truth evaluation;
- scheduled automation.

## 7. 60B — Knowledge Lifecycle UI

Scope:

- Knowledge index groups/status summaries;
- detail lifecycle metadata;
- current / due-soon / overdue indicators;
- explicit `needs-review` warning;
- archived/superseded notice;
- replacement navigation;
- derived inverse supersedes links when useful.

## 8. Determinism and time

All lifecycle logic must compare `YYYY-MM-DD` values in UTC calendar semantics. Production/tests must never infer different outcomes from machine timezone.

Tests must cover:

- day before due-soon boundary;
- first due-soon day;
- review date itself;
- first overdue day;
- leap/calendar-safe ISO comparisons;
- missing reviewAt;
- explicit needs-review independent of date.

## 9. Governance

Agents may:

- report overdue/due-soon Knowledge;
- propose review PRs;
- propose `supersededBy` relationships.

Agents must not automatically:

- convert `active` to `needs-review` merely because a date passed;
- promote draft/candidate Knowledge to active;
- archive or delete durable Knowledge without a reviewed content change.

## 10. Exit criteria

Plan 60 is complete when:

- lifecycle evaluation is deterministic and executable;
- overdue/due-soon are visible without blocking publishing;
- broken/self replacement relations fail validation;
- inverse replacement relationships are derived, not duplicated;
- needs-review/archived detail URLs remain stable;
- lifecycle UI communicates currentness and supersession clearly;
- fresh PR, main and Production verification are green.
