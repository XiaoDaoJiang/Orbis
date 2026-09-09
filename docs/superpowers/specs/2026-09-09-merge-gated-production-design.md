# Milestone I · Merge-Gated Production Promotion Design

> Status: Approved
> Approved: 2026-09-09
> Evidence baseline: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Selected by: `docs/plan/2026-09-09-product-capability-roadmap-refresh.md`

## Problem

Orbis currently requires two human approval actions for normal Daily publication:

1. human merge of a fully validated PR;
2. separate manual `Orbis Pages Production` dispatch.

PR #37 and PR #38 showed that the second click is repeated operational friction rather than an additional meaningful review boundary. Before merge, Orbis already has read-only PR Build, branch/path-specific guards, full `pnpm build`, Trusted Preview and Human Review. After merge, `Orbis Site Build` produces a fresh read-only artifact for the exact main SHA.

## Approved principle

**Human merge is the Production approval; green exact-main Build is the deployability proof.**

```text
Human merge
    +
fresh exact-main green artifact
    =
eligible Production promotion
```

Neither condition alone is sufficient.

## Approved architecture

Keep `Orbis Site Build` read-only and add a separate trusted workflow:

```text
.github/workflows/pages-promote.yml
```

Trigger only from completion of `Orbis Site Build`:

```yaml
on:
  workflow_run:
    workflows: ['Orbis Site Build']
    types: [completed]
```

The trusted promotion path must not execute PR code with Pages/OIDC authority.

### Eligibility contract

Promotion requires all of the following:

```text
source run conclusion == success
source run event == push
source run head_branch == main
source run head_sha == current refs/heads/main
exactly one associated merged PR targets main
associated PR merge_commit_sha == source run head_sha
```

A stale source run is an expected concurrency outcome and must finish as a successful no-deploy `stale-main` result. Missing or ambiguous merged-PR provenance must fail closed without deployment.

A direct administrator push to main is not a normal Production approval and therefore does not auto-promote.

### Exact artifact contract

The promotion workflow must consume only:

```text
artifact name: orbis-site
source run id: github.event.workflow_run.id
source SHA: github.event.workflow_run.head_sha
```

It must not rebuild Production from a moving branch and must not select a generic latest-successful artifact.

Approved artifact path:

```text
main SHA
   ↓
Orbis Site Build once
   ↓
orbis-site artifact
   ↓
trusted promotion
   ↓
Pages artifact
   ↓
GitHub Pages
```

### Authority contract

Top-level promotion permissions remain read-only plus artifact access. Only the deploy job receives:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Scheduled Daily remains PR-only and receives no merge or Pages authority.

### Production smoke

Reuse the existing Production smoke contract:

- `/`;
- `/latest/`;
- `/archive.json`;
- `/rss.xml`;
- `/favicon.svg`;
- newest structured Daily path resolved from `archive.json`.

The promotion logs must also expose the exact source SHA used for deployment.

## Stale-build race protection

This is mandatory:

```text
merge A → Build A starts
merge B → main advances → Build B starts
Build A finishes after B
```

Build A must not deploy because:

```text
Build A head_sha != current main SHA
```

Build B is the only eligible candidate.

## Human-merge proof

A successful main push Build alone is insufficient. The source SHA must have exactly one associated merged PR targeting main whose `merge_commit_sha` equals the source SHA.

This preserves the product rule:

> Human PR merge is the normal Production approval point.

## Scheduled Daily / Correction boundary

No Scheduled authority expansion:

```text
automation/daily/*
    → exact content target only
    → PR only
    → no merge
    → no Pages token

correction/daily/*
    → exact published Daily only
    → append-only provenance
    → PR only
    → no merge
    → no Pages token
```

Feature, Daily and correction PRs can become Production-eligible only after Human merge and a green exact-main Build.

## Manual Production workflow

Keep `.github/workflows/pages-production.yml` in the first release as a manual recovery / break-glass path. It remains `workflow_dispatch` only and must not become callable by Scheduled Agents.

## Approved workflow responsibilities

```text
Orbis PR Preview Build
  → validate candidate with read-only authority

Orbis PR Preview Publish
  → trusted non-Production preview publication

Orbis Site Build
  → build/test exact main + upload orbis-site

Orbis Pages Promote
  → prove eligibility + promote exact artifact + public smoke

Orbis Pages Production
  → explicit manual recovery / break-glass
```

## Required executable contracts

### Workflow contract

Tests must prove that `pages-promote.yml`:

- listens only to `workflow_run` of `Orbis Site Build`;
- requires successful `push` run from `main`;
- uses `workflow_run.id` to download `orbis-site`;
- checks source SHA against current main;
- checks exactly-one merged-PR provenance;
- does not use unspecified/latest artifact lookup;
- gives Pages/OIDC only to the deploy job;
- does not use `pull_request_target`;
- does not checkout/run PR code under Pages authority;
- performs public smoke after deployment.

### Pure eligibility policy

Representative outcomes:

```text
success + main push + current SHA + exactly one merged PR → eligible
failed build                                             → deny
manual Site Build workflow_dispatch                     → deny
feature branch run                                       → deny
stale main SHA                                           → stale-main / no deploy
direct push / no merged PR                              → deny
ambiguous merged PR provenance                           → deny
```

## Rollout

### 90A · Promotion Contract

- pure eligibility policy + tests;
- trusted workflow contract tests;
- `pages-promote.yml`;
- exact artifact handoff;
- stale-main and merged-PR proof;
- manual Production retained.

### 90B · Real-cycle Closeout

After 90A Human merge:

1. fresh main Site Build must auto-trigger promotion;
2. exact source artifact/SHA must be deployed without a manual Production click;
3. public smoke must pass;
4. a subsequent real Scheduled Daily Human merge must repeat the same path;
5. only then close Milestone I.

## Non-goals

- auto-merge;
- Scheduled Agent direct Production authority;
- deployment from PR artifacts or arbitrary branches;
- automatic rollback orchestration;
- canary/multi-environment release platform;
- removing Human Review from publication.

## Approval decisions

The Design Review recommendations are accepted:

1. automatic promotion applies to every qualifying `Orbis Site Build` produced by a merged PR; the Site Build path filter remains the single change-scope gate;
2. manual `Orbis Pages Production` remains during initial rollout as break-glass recovery;
3. stale runs end as successful no-deploy outcomes with explicit reason.

**Design approved. Plan 90 / 90A implementation is authorized from exact `main@e639758d993dfdb60791f300c78a6319f1dfe54a`.**
