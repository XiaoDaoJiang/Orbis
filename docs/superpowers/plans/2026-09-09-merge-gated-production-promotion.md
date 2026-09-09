# Plan 90A · Merge-Gated Production Promotion Implementation

> Status: In Progress
> Milestone: I — Merge-Gated Production Promotion
> Design: `docs/superpowers/specs/2026-09-09-merge-gated-production-design.md` · Approved
> Base: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Branch: `feat/merge-gated-production-promotion`

## Goal

Add a trusted automatic GitHub Pages promotion path that activates only after Human merge and a successful exact-main `Orbis Site Build`, while leaving PR/Scheduled workflows read-only and retaining manual Production as break-glass.

## Implementation sequence

### RED 1 · Eligibility capability missing

Add executable tests first for a pure eligibility policy. Required decisions:

```text
success + push + main + current SHA + one merged PR → eligible
failed source run                                  → deny
workflow_dispatch source run                       → deny
feature branch source                              → deny
stale SHA                                           → stale-main
no merged PR                                        → deny
multiple qualifying merged PRs                      → deny
wrong merge_commit_sha                              → deny
```

Wire this suite into `pnpm validate` before the implementation module exists and capture the failing PR Build.

### RED 2 · Trusted workflow missing

Add workflow contract tests requiring `.github/workflows/pages-promote.yml` with:

- `workflow_run` → `Orbis Site Build` only;
- completed-source trigger;
- success/push/main source constraints;
- exact run-id download of `orbis-site`;
- current-main SHA gate;
- merged-PR provenance gate;
- no latest artifact discovery;
- no `pull_request_target`;
- no PR checkout under Pages/OIDC authority;
- Pages/OIDC only in deploy job;
- public smoke after deploy.

The RED checkpoint may combine both missing capabilities in the first failing Build if the tests are introduced together; record the first focused missing assertion rather than inventing multiple RED runs.

### GREEN 1 · Pure policy

Implement `tools/pages-promotion/eligibility.ts` as a deterministic pure evaluator with explicit outcome codes:

```text
eligible
source-not-successful
source-not-push
source-not-main
stale-main
missing-merged-pr
ambiguous-merged-pr
merge-sha-mismatch
```

No GitHub network calls in the pure module.

### GREEN 2 · Trusted promotion workflow

Add `.github/workflows/pages-promote.yml`.

Eligibility job:

- top-level `actions: read`, `contents: read`, `pull-requests: read`;
- requires successful Site Build `push` from main;
- resolves current main ref through GitHub REST;
- resolves associated PRs for source SHA through GitHub REST;
- requires exactly one merged PR to main with `merge_commit_sha == source SHA`;
- exposes explicit `eligible`, `reason`, `source_sha`, `source_run_id` outputs;
- stale-main returns success with `eligible=false`.

Package job:

- runs only when eligibility is true;
- downloads `orbis-site` from exact source run id using `actions/download-artifact`;
- uploads that directory via `actions/upload-pages-artifact`;
- does not checkout/rebuild from main.

Deploy job:

- depends on package job;
- receives only `contents: read`, `pages: write`, `id-token: write`;
- deploys with `actions/deploy-pages`;
- runs the existing dynamic Production smoke contract;
- logs source SHA and newest Daily route.

### GREEN 3 · Regression / authority audit

Full `pnpm build` must prove:

- existing PR Preview build remains read-only;
- Scheduled Daily/correction guards unchanged;
- manual `pages-production.yml` remains workflow_dispatch-only;
- no generated outputs committed;
- no content/schema change;
- promotion workflow contract green.

## Expected implementation file surface

```text
.github/workflows/pages-promote.yml
package.json
tools/pages-promotion/eligibility.ts
tools/pages-promotion/eligibility.test.ts
tools/pages-promotion/workflow-contract.test.ts
```

Optional operator documentation may be added if needed. No `content/**`, Registry, Astro, Slidev or generated output changes are expected.

## PR Gate

Open one implementation PR from `feat/merge-gated-production-promotion` to `main` after the initial RED test commit. Do not merge automatically.

Before Human Review Gate require:

1. final exact head known;
2. read-only PR Build success;
3. Preview artifact captured;
4. Trusted Preview success/public smoke;
5. changed-file scope reviewed;
6. workflow permissions reviewed;
7. no Production deployment triggered by the PR itself.

## Post-merge Gate · 90B

Only after Human merge:

1. confirm fresh main Site Build success;
2. observe automatic `Orbis Pages Promote` workflow_run;
3. verify exact source run id/SHA/artifact;
4. verify Pages deployment and smoke;
5. do not manually dispatch `Orbis Pages Production` for this proof;
6. require one later real Scheduled Daily merge to repeat the same path before closing Milestone I.
