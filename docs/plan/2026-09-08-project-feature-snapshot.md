# 2026-09-08 · Orbis Project Feature Snapshot

> Status: Current snapshot after Milestone H closeout
> Production main: `fee254c81e899bc77c4671eda472071c390621a9`
> Production Pages run: `34191412383` · success
> Planning branch: `planning/product-capability-roadmap`

## Branch inventory

Current repository branch count at snapshot time: 20.

### Keep

```text
main
planning/product-capability-roadmap
automation/daily/2026-09-08
preview-pr-37
```

Reasons:

- `main` is the protected production branch;
- `planning/product-capability-roadmap` is the long-lived roadmap/design branch;
- `automation/daily/2026-09-08` is the head of open PR #37;
- `preview-pr-37` is the trusted public preview branch for open PR #37 and will be removed by `pr-preview-cleanup.yml` when PR #37 closes.

### Safe to delete now

All of the following branches correspond to merged historical PRs and no longer own active work:

```text
automation/daily/2026-09-04
automation/daily/2026-09-05
automation/daily/2026-09-06
automation/daily/2026-09-07
correction/daily/2026-09-07/openclaw-supervisor-version
feat/chatgpt-scheduled-daily-adapter
feat/evidence-correction-guard
feat/evidence-correction-provenance
feat/evidence-integrity-contract
feat/knowledge-lifecycle-contract
feat/knowledge-lifecycle-ui
feat/scheduled-daily-contracts
feat/seo-foundation
feat/structured-data
fix/pr-preview-integration-base
fix/weekly-artifact-date-order
```

Expected branch count after cleanup: 4 while PR #37 remains open. After PR #37 closes, `preview-pr-37` should be removed automatically; the merged `automation/daily/2026-09-08` branch can also be deleted, leaving only `main` + the long-lived planning branch.

## Current product features

### 1. Structured static publishing foundation

- pnpm monorepo;
- Astro static Reading application;
- Slidev presentation application;
- shared Zod content schemas;
- shared design tokens;
- `content/**` as the only publishable source of truth;
- deterministic build to `dist/site`;
- generated HTML / Slidev sources / `dist/**` are never committed.

### 2. Structured content model

First-class content types include:

- Daily Brief;
- Weekly Brief;
- ad-hoc Brief;
- Essay;
- Knowledge;
- Topic;
- standalone Presentation;
- Source Registry;
- Author Registry.

### 3. Daily publishing experience

Published Daily content provides:

- Astro Reading page `/briefs/<id>/`;
- fixed 11-page `daily-v1` Slidev presentation;
- stable `/YYYY/MM/DD/` alias;
- Daily-only `/latest/`;
- generated `archive.json`;
- RSS participation;
- Previous / Next navigation;
- Topic-based Related Content.

### 4. Weekly intelligence

Weekly Brief has a cadence-specific schema and Reading experience, plus `weekly-v1` presentation support. Weekly participates in Brief discovery, Archive, RSS, Topics and Related Content while remaining isolated from Daily-only latest/date/archive semantics.

### 5. Presentation platform

- source-neutral Presentation Descriptor;
- Template Registry;
- `daily-v1`, `weekly-v1`, `talk-v1`;
- Brief-derived and standalone presentations in one build;
- duplicate slug detection across source kinds;
- independent `/slides/<slug>/` outputs;
- `/slides/` discovery;
- standalone Talk stays out of generic Archive/RSS semantics.

### 6. Archive and discovery

- Homepage Latest Brief / Essay / Presentation;
- Knowledge Updates;
- Active Topics;
- `/archive/`;
- `/briefs/daily/`;
- `/briefs/weekly/`;
- `/slides/`;
- Topic aggregation;
- deterministic newest-first ordering and public-status filtering.

### 7. Source and Author identity

- filename-based canonical Source / Author IDs;
- Source / Author Registry validation;
- cross-file referential integrity for Source / Author / Topic relations;
- Registry-backed Author bylines and Reference metadata;
- archived identity preservation;
- unknown IDs fail validation/build;
- scheduled content agents cannot mutate registry identity.

### 8. SEO and sharing

- Production canonical URLs separated from Preview identity;
- Preview `noindex,nofollow`;
- Open Graph / Twitter Card metadata;
- sitemap;
- absolute RSS links;
- canonical handling for Reading, Slides, aliases and standalone presentations;
- JSON-LD: WebSite / Article / TechArticle;
- structured-data output never leaks Preview URLs into Production identity.

### 9. Knowledge lifecycle

- persisted editorial status separate from review health;
- deterministic `current / due-soon / overdue` evaluation;
- `supersededBy` relation and derived inverse supersedes;
- machine-readable / human-readable review report;
- Knowledge index lifecycle grouping;
- needs-review / archived stable routes;
- replacement navigation;
- lifecycle status remains advisory unless structural integrity fails.

### 10. Scheduled Daily automation

- explicit Asia/Shanghai `targetDate`;
- deterministic `automation/daily/YYYY-MM-DD` branch;
- exact `content/briefs/YYYY-MM-DD.yaml` candidate;
- exactly-one-PR identity;
- deletion/rename-safe Path Guard;
- Scheduled Daily exact-diff guard;
- already-published zero-write protection;
- same-day rerun/idempotency behavior;
- ChatGPT Scheduled Daily adapter;
- Agent cannot push main, merge, mutate Registry identity or deploy Production.

### 11. Evidence Integrity / correction provenance

Milestone H adds:

- Daily Evidence V1;
- stable fact IDs;
- explicit `fact.evidence[] -> canonical reference` edges;
- deterministic evidence integrity evaluator and report;
- frozen legacy migration boundary;
- reader-visible claim/reference anchors and evidence links;
- reader-visible correction notice/history;
- persisted correction events with stable targets;
- append-only published correction guard;
- factual/reference mutation must be covered by newly appended correction provenance;
- frozen legacy Daily correction fails closed until explicit Evidence V1 migration;
- evidence coverage validates structure, not factual truth.

### 12. CI / Preview / Production governance

- read-only PR Preview Build;
- Generic Path Guard on all PRs;
- branch-specific Scheduled Daily and correction guards;
- Trusted Preview publication from read-only artifacts;
- public Preview smoke before URL announcement;
- Preview branch cleanup on PR close;
- manual-only `Orbis Pages Production` workflow;
- Production deploy only from `main` with explicit `deploy=true`;
- exact-SHA GitHub Pages deployment + dynamic public smoke.

## Current active work

Open PR #37:

```text
title       content: daily brief 2026-09-08
branch      automation/daily/2026-09-08
head        323781fde4c25559b4e7bccc0d065706aea9ea45
state       open / mergeable
PR Build    34173049980 success
```

The branch and its `preview-pr-37` must remain until the PR is closed. Because PR #37 was initially validated against a pre-#36 main base, it should receive a fresh current-main integration validation before human merge.

## Current roadmap gate

Milestones / Plans 10 through 80 are complete. The next step is **Post-H Product Capability Roadmap Refresh**, not automatic creation of Plan 90.

Candidate directions remain evidence-dependent, including:

- Static Full-text Search;
- Weekly Scheduled Automation;
- Source / Author Directory;
- remaining legacy Daily Evidence migration.
