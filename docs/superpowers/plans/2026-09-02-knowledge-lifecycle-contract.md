# Plan 60A · Knowledge Lifecycle Contract Implementation Plan

> Baseline: `main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> Design: `docs/superpowers/specs/2026-09-02-knowledge-lifecycle-design.md`

## Goal

Add deterministic Knowledge review lifecycle evaluation and one-way supersession integrity without changing Web UI or making review-date expiry a fatal production condition.

## Task 1 — RED: lifecycle evaluator contract

Create:

- `tools/knowledge-lifecycle/lifecycle-contract.test.ts`
- package script `test:knowledge-lifecycle`

Contract must require a production helper and prove:

- explicit evaluation date input;
- missing `reviewAt` does not become overdue;
- current / due-soon / overdue boundaries;
- `needs-review` editorial status is independent from derived date health;
- UTC calendar semantics.

Expected RED: missing lifecycle helper.

## Task 2 — GREEN: pure evaluator

Create a pure runtime-agnostic helper, preferably:

- `tools/knowledge-lifecycle/lifecycle.ts`

No filesystem, Astro or system-clock dependency inside the evaluator.

API should accept ISO dates and an explicit `today` date. Initial due-soon threshold: 14 days.

Run full `pnpm build` and require all existing Plan 10–50 contracts to remain green.

## Task 3 — RED: Knowledge schema/relation contract

Extend tests to require optional persisted:

```yaml
supersededBy: replacement-id
```

and validation rules:

- target exists in Knowledge registry;
- target != self;
- inverse `supersedes[]` can be derived from the entry set;
- no second persisted reverse field.

Expected RED: schema/referential validation does not yet understand supersession.

## Task 4 — GREEN: schema + referential integrity

Modify only Knowledge-specific schema and content validation surfaces.

Preferred files:

- `packages/content-schema/src/index.ts`
- `tools/validate-content/index.ts` and/or a focused Knowledge relation helper/test.

Do not redesign the shared PublicationStatus enum.

## Task 5 — RED: review report contract

Add a report contract requiring deterministic output from repository Knowledge entries for an explicit evaluation date.

Report shape should be machine-readable and human-readable, e.g.:

```json
{
  "evaluationDate": "2026-09-02",
  "summary": {"current": 0, "dueSoon": 0, "overdue": 0, "needsReview": 0},
  "entries": []
}
```

Severity semantics:

- ERROR relation/structure invalid (existing validation failure path);
- WARN overdue;
- INFO due-soon.

Overdue must not produce non-zero exit status by itself.

## Task 6 — GREEN: report command + build integration

Create:

- `tools/knowledge-lifecycle/report.ts` or equivalent;
- package script, e.g. `knowledge:review`;
- executable contract.

Integrate into validation/build only as a non-fatal lifecycle report check. Do not generate or commit report artifacts under `dist/**` or source directories.

## Task 7 — final verification

Required on exact final head:

- Path Guard;
- full `pnpm build`;
- lifecycle contract passes;
- schema/relation negative contracts pass;
- overdue fixture/report proves zero exit;
- no `content/**` modifications required for the feature;
- no Web/Slidev/workflow changes;
- Trusted Preview smoke stays green even though 60A has no visible UI change.

Then update PR body with complete RED/GREEN evidence and leave merge as the human integration gate.

## Approved 60A scope

Allowed production surfaces:

- Knowledge schema field `supersededBy?`;
- Knowledge lifecycle evaluator/report tooling;
- Knowledge relation validation;
- package scripts/tests.

Explicitly deferred to 60B:

- Knowledge index/detail UI;
- badges/notices/navigation;
- public archived/needs-review rendering policy changes beyond what is strictly needed to keep stable routes.
