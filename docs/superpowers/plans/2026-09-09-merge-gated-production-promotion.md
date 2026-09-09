# Plan 90A · Merge-Gated Production Promotion Implementation

> Status: Review Gate
> Milestone: I — Merge-Gated Production Promotion
> Design: `docs/superpowers/specs/2026-09-09-merge-gated-production-design.md` · Approved
> Base: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Branch: `feat/merge-gated-production-promotion`
> PR: #39
> Final head: `e47ba81663dc56be166657390a1c90ebcda83a6c`

## Goal

Add a trusted automatic GitHub Pages promotion path that activates only after Human merge and a successful exact-main `Orbis Site Build`, while leaving PR/Scheduled workflows read-only and retaining manual Production as break-glass.

## Implemented contract

### Pure eligibility policy

`tools/pages-promotion/eligibility.ts` deterministically evaluates:

```text
success + push + main + current SHA + exactly one merged PR → eligible
failed source run                                           → source-not-successful
workflow_dispatch / non-push                                → source-not-push
non-main source                                              → source-not-main
stale SHA                                                    → stale-main
no qualifying merged PR                                      → missing-merged-pr
multiple qualifying merged PRs                               → ambiguous-merged-pr
wrong merge_commit_sha                                       → merge-sha-mismatch
```

The policy has no GitHub network calls.

### Trusted promotion workflow

`.github/workflows/pages-promote.yml`:

```text
Orbis Site Build completed
      ↓
source run must be success + push + main
      ↓
current refs/heads/main == source SHA
      ↓
exactly one associated merged PR targets main
      ↓
PR merge_commit_sha == source SHA
      ↓
download exact run-id / orbis-site
      ↓
upload Pages artifact
      ↓
recheck current main before deploy
      ↓
deploy + public smoke
```

Security / authority properties:

- trigger is `workflow_run` of `Orbis Site Build` only；
- top-level permissions are read-only + artifact/PR read；
- no `pull_request_target`；
- no checkout anywhere in promotion workflow；
- no `pnpm install` / rebuild in promotion workflow；
- exact source run id is used for artifact download；
- no latest/moving artifact discovery；
- stale source becomes successful no-deploy；
- current main is checked twice, including immediately before deploy；
- only deploy job receives `pages: write` + `id-token: write`；
- existing dynamic Production smoke is reused；
- manual `pages-production.yml` remains unchanged as break-glass。

## TDD evidence

### RED

```text
Run       34301462494
Head      1bf4e8fbf9e16d4af5fa33cabc7b00a9cedfa307
Result    failure
```

Existing frozen install, Path Guard, Scheduled Daily/correction workflow contracts all passed first. The focused new suite failed exactly at:

```text
ERR_MODULE_NOT_FOUND
.../tools/pages-promotion/eligibility.ts
```

This is the authoritative RED evidence.

### Final GREEN

```text
Run       34301641815
Base      e639758d993dfdb60791f300c78a6319f1dfe54a
Head      e47ba81663dc56be166657390a1c90ebcda83a6c
Result    success
Artifact  10085185214
SHA-256   35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
```

Focused contracts printed:

```text
Merge-gated Production eligibility policy contract passed
Merge-gated Production promotion workflow contract passed
```

The same full Build kept Scheduled Daily, correction guard, Evidence V1, Presentation, Weekly, Registry, SEO, JSON-LD and Knowledge Lifecycle green through the 2026-09-09 Daily baseline.

## Trusted Preview

```text
Publish run   34301843125 success
Source run    34301641815
Artifact      10085185214
SHA-256       35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Preview       https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-39/index.html
```

The trusted publisher downloaded the exact artifact, verified the digest, force-published `preview-pr-39`, then proved public RSS + favicon availability before posting the PR comment.

## Scope audit

Exactly five changed files:

```text
.github/workflows/pages-promote.yml
package.json
tools/pages-promotion/eligibility.ts
tools/pages-promotion/eligibility.test.ts
tools/pages-promotion/workflow-contract.test.ts
```

No changes to `content/**`, Registry identities, Astro/Slidev, generated output, Scheduled/correction authority, merge policy, or existing manual Production workflow.

## Human Review Gate

90A implementation is complete but **must not be auto-merged**.

After Human merge:

1. do not manually run `Orbis Pages Production` for the first proof；
2. wait for fresh main `Orbis Site Build`；
3. observe the automatically triggered `Orbis Pages Promote`；
4. verify source run id/SHA/artifact matches the deployed Pages source；
5. verify public smoke；
6. require one later real Scheduled Daily merge to repeat the no-second-click flow before Milestone I closes。

## Current status

```text
RED                               Done
GREEN policy/workflow             Done
full PR Build                     Done
Trusted Preview                   Done
scope/authority audit             Done
Human merge                       Pending
90B automatic Production proof    Blocked
```
