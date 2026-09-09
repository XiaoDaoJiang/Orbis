# Milestone I · Merge-Gated Production Promotion Design

> Status: Design Review
> Date: 2026-09-09
> Evidence baseline: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Selected by: `docs/plan/2026-09-09-product-capability-roadmap-refresh.md`

## Problem

Orbis currently requires two human approval actions for normal Daily publication:

1. human merge of a fully validated PR;
2. separate manual `Orbis Pages Production` dispatch.

After Milestone H, PR #37 and PR #38 showed that the second click is repeated operational friction rather than an additional meaningful review boundary.

The system already has all important preconditions before merge:

- read-only PR Build;
- branch/path-specific guards;
- full `pnpm build`;
- Trusted Preview;
- human merge.

After merge it also runs a fresh read-only `Orbis Site Build` from the exact main SHA. The missing capability is a trusted promotion step that consumes that exact green artifact without granting deployment authority to PR or Scheduled Agent code.

## Design principle

**Human merge is the approval; green exact-main Build is the deployability proof.**

Production promotion is automatic only after both exist.

```text
Human merge
    +
fresh exact-main green artifact
    =
eligible Production promotion
```

Neither condition alone is sufficient.

## Chosen architecture

Keep the existing `Orbis Site Build` read-only and add a separate trusted workflow, tentatively:

```text
.github/workflows/pages-promote.yml
```

Trigger:

```yaml
on:
  workflow_run:
    workflows: ["Orbis Site Build"]
    types: [completed]
```

This workflow must use the default-branch workflow definition and must not execute untrusted PR code with a write token.

### Stage 1 · Eligibility gate

The trusted promotion workflow receives the completed Site Build metadata and proves all of the following before requesting Pages authority:

```text
workflow_run.conclusion == success
workflow_run.event == push
workflow_run.head_branch == main
workflow_run.head_sha == current refs/heads/main
associated merged PR exists
associated PR.base.ref == main
associated PR.merged_at != null
```

Recommended implementation uses GitHub REST through the trusted workflow token to:

1. fetch `repos/$GITHUB_REPOSITORY/git/ref/heads/main` and compare its object SHA with `workflow_run.head_sha`;
2. fetch `repos/$GITHUB_REPOSITORY/commits/$SHA/pulls` using the commit-media API supported by current GitHub;
3. require at least one associated merged PR whose base is `main` and whose merge commit / associated commit corresponds to the source SHA.

If any proof is ambiguous, stop without deploying.

### Stage 2 · Exact artifact promotion

The trusted workflow downloads only:

```text
artifact name: orbis-site
source run: github.event.workflow_run.id
source SHA: github.event.workflow_run.head_sha
```

Use `actions/download-artifact` with an explicit `run-id` and GitHub token. The workflow must not rebuild from a moving branch checkout and must not discover “latest successful artifact”.

Then convert that exact directory into the standard Pages artifact using `actions/upload-pages-artifact`.

This preserves a single build proof:

```text
main SHA
   ↓
Site Build once
   ↓
orbis-site artifact
   ↓
trusted promotion
   ↓
Pages
```

rather than rebuilding Production a second time from a potentially changed ref.

### Stage 3 · Narrow Pages authority

Top-level workflow permissions should remain read-only / artifact-read capable. Only the deploy job receives:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

If artifact download requires `actions: read`, grant it only as necessary. PR and Scheduled workflows remain unchanged and read-only.

### Stage 4 · Production smoke

Reuse the existing Production smoke contract after `actions/deploy-pages`:

- `/`;
- `/latest/`;
- `/archive.json`;
- `/rss.xml`;
- `/favicon.svg`;
- newest structured Daily path resolved from `archive.json`.

Milestone I should additionally verify that the deployed Pages build version / source SHA equals the triggering Site Build SHA.

## Stale-build race protection

This is mandatory.

Example:

```text
merge A → Build A starts
merge B → main advances → Build B starts
Build A finishes success after B is already main
```

Build A must not deploy.

Eligibility must compare:

```text
workflow_run.head_sha
vs
current refs/heads/main SHA
```

If they differ, the promotion ends as `stale-main` / skipped without Pages write. Build B becomes the only eligible candidate.

This is more important than relying only on workflow concurrency because build completion order may differ from merge order.

## Human-merge proof

A normal `push` to main is not sufficient evidence by itself. The design must distinguish an approved PR merge from an administrator direct push.

Fail closed unless the source SHA is associated with a merged PR targeting main.

This preserves the product statement:

> Human PR merge is the normal Production approval point.

If emergency direct pushes are ever required, they continue through the manual recovery workflow rather than silently gaining auto-deploy semantics.

## Scheduled Daily boundary

No change to Scheduled Daily authority:

```text
automation/daily/*
    → exact content target only
    → PR only
    → no merge
    → no Pages token
```

The Scheduled producer cannot trigger promotion directly. Its candidate only becomes eligible after a human merges the PR and the new exact-main Build succeeds.

The same rule applies to explicit correction PRs and normal feature PRs that affect the site: human merge + green exact-main Build is the promotion gate.

## Manual Production workflow

Keep `.github/workflows/pages-production.yml` during the first release as a manual recovery / break-glass path.

Recommended changes once automatic promotion is proven:

- document it as recovery rather than normal Daily publishing;
- keep `workflow_dispatch` only;
- keep main-only deploy condition;
- continue full build + validation before deploy;
- never let Scheduled Agent invoke it.

Do not remove the manual workflow in the first Milestone I slice. Real operating evidence should prove the automatic path first.

## Workflow responsibilities after Milestone I

```text
Orbis PR Preview Build
  authority: contents read
  responsibility: validate candidate

Orbis PR Preview Publish
  authority: trusted preview branch only
  responsibility: publish non-Production preview

Orbis Site Build
  authority: contents read
  responsibility: build/test current main + upload orbis-site

Orbis Pages Promote
  authority: actions/artifact read + narrowly scoped Pages/OIDC
  responsibility: prove merge/current-SHA eligibility + promote exact artifact + smoke

Orbis Pages Production
  authority: explicit manual recovery
  responsibility: break-glass validated rebuild/deploy
```

## Required executable contracts

### Workflow contract tests

Repository tests should prove the promotion workflow:

- listens only to `workflow_run` of `Orbis Site Build`;
- requires successful source run;
- requires `event == push` and `head_branch == main`;
- uses source `workflow_run.id` to download `orbis-site`;
- never downloads an unspecified latest artifact;
- checks source SHA against current main;
- checks merged-PR provenance;
- grants Pages/OIDC only to the deploy job;
- has no `pull_request_target` code checkout path;
- performs public smoke after deploy.

### Pure eligibility policy tests

Prefer a small pure policy module / script that can be tested without GitHub Actions runtime. Representative outcomes:

```text
success + main push + current SHA + merged PR       → eligible
failed build                                        → deny
manual Site Build workflow_dispatch                 → deny
feature branch run                                  → deny
stale main SHA                                      → deny
direct push / no merged PR                          → deny
ambiguous PR provenance                             → deny
```

### Real workflow evidence

Before closing Milestone I:

1. implementation PR passes read-only Build + Trusted Preview;
2. human merge;
3. fresh main Site Build;
4. automatic promotion triggers without a manual Production click;
5. promotion uses exact source Build SHA/artifact;
6. public smoke passes;
7. one real Scheduled Daily PR later repeats the same path successfully.

## Rollout sequence

### Slice A · Promotion contract

- pure eligibility policy;
- workflow contract tests;
- trusted `pages-promote.yml`;
- artifact handoff from Site Build;
- stale SHA and merged-PR proof;
- manual Production remains untouched except documentation if necessary.

### Slice B · Real-cycle closeout

After Slice A human merge:

- verify exact-main automatic promotion on the implementation merge;
- verify a real Daily merge completes without manual Production dispatch;
- verify stale/failure behavior using controlled non-Production tests where practical;
- update operator runbooks;
- mark Milestone I Done only after public smoke.

Do not combine automatic promotion with unrelated Search, Weekly automation, Registry, content-model, or Evidence migrations.

## Non-goals

- auto-merge;
- Scheduled Agent direct Production authority;
- deployment from PR artifacts;
- deployment from arbitrary branches;
- automatic rollback orchestration;
- canary/multi-environment deployment platform;
- general release management system;
- removing human review from content publication.

## Open review questions

1. Should automatic promotion apply to every qualifying main Site Build from a merged PR, or only merged PRs whose diff intersects Site Build paths? The current Site Build path filter already makes the latter effectively true; duplicating diff logic in promotion is probably unnecessary.
2. Should manual Production remain indefinitely or be revisited after several successful automatic cycles? Recommended: retain initially, revisit after soak evidence.
3. Should stale eligible runs end as successful `skipped` outcome or explicit neutral/failure? Recommended: successful no-deploy outcome with clear log/report, because stale is expected concurrency rather than an incident.

## Design review gate

The selected architecture is intentionally narrower than “auto deploy main”. It is:

```text
merged PR
  ∧ successful main push Build
  ∧ exact SHA still current main
  ∧ exact artifact available
      ↓
trusted automatic Production promotion
```

Implementation is not authorized until this design is accepted.
