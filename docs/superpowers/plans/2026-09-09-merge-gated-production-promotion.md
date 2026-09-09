# Plan 90A · Merge-Gated Production Promotion Implementation

> Status: Done · 90B real Daily soak pending
> Milestone: I — Merge-Gated Production Promotion
> Design: `docs/superpowers/specs/2026-09-09-merge-gated-production-design.md` · Approved
> Base: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Branch: `feat/merge-gated-production-promotion`
> PR: #39 · merged
> Final implementation head: `e47ba81663dc56be166657390a1c90ebcda83a6c`
> Merge commit: `72e94158a93a2b552528b4887edb846abb523a6f`

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
no qualifying merged PR                                     → missing-merged-pr
multiple qualifying merged PRs                              → ambiguous-merged-pr
wrong merge_commit_sha                                      → merge-sha-mismatch
```

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
- current main is checked twice；
- only deploy job receives `pages: write` + `id-token: write`；
- dynamic Production smoke is reused；
- manual `pages-production.yml` remains unchanged as break-glass。

## TDD / PR evidence

```text
RED Build                    34301462494 failure
RED reason                   missing tools/pages-promotion/eligibility.ts
Final PR Build               34301641815 success
Final head                   e47ba81663dc56be166657390a1c90ebcda83a6c
Preview Artifact             10085185214
Preview SHA-256              35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview Publish      34301843125 success
```

Focused contracts printed:

```text
Merge-gated Production eligibility policy contract passed
Merge-gated Production promotion workflow contract passed
```

## Scope audit

Exactly five changed files:

```text
.github/workflows/pages-promote.yml
package.json
tools/pages-promotion/eligibility.ts
tools/pages-promotion/eligibility.test.ts
tools/pages-promotion/workflow-contract.test.ts
```

No changes to `content/**`, Registry identities, Astro/Slidev, generated output, Scheduled/correction authority, merge policy, or existing manual Production workflow。

## Post-merge proof · Done

PR #39 was human-merged to:

```text
72e94158a93a2b552528b4887edb846abb523a6f
```

No manual `Orbis Pages Production` dispatch was used for this proof。

### Fresh exact-main Build

```text
Site Build                  34305469307 success
head_sha                    72e94158a93a2b552528b4887edb846abb523a6f
orbis-site artifact         10086534242
artifact SHA-256            b002da24bf06f2dd890ebeefaa02207adbbd37bf0897cb29f51b2311cca70e51
```

### Automatic `Orbis Pages Promote`

```text
Promotion run               34305651335 success
source run id               34305469307
source SHA                  72e94158a93a2b552528b4887edb846abb523a6f
Pages artifact              10086541959
Pages artifact SHA-256      4b40b803c1630af7ced51de12f78e645f401104aadac314f6d04d37f03ce2b1f
```

Eligibility log:

```text
eligible=true
reason=eligible
source_sha=72e94158a93a2b552528b4887edb846abb523a6f
source_run_id=34305469307
```

The package job downloaded exact `orbis-site` artifact `10086534242` from exact run `34305469307` and verified SHA-256 `b002da24...` before creating the Pages artifact。

The pre-deploy race guard rechecked and logged:

```text
Pages promotion source remains current main: 72e94158a93a2b552528b4887edb846abb523a6f
```

Deployment payload:

```text
artifact_id          10086541959
pages_build_version  72e94158a93a2b552528b4887edb846abb523a6f
```

Public smoke:

```text
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/09/09/
Production Pages promotion smoke checks passed
```

The latest manual `Orbis Pages Production` remains run `34299051576` at `e639758d...`, before PR #39 merge. This proves the implementation merge reached Production without a second human deployment action。

## 90A status

```text
RED                               Done
GREEN policy/workflow             Done
full PR Build                     Done
Trusted Preview                   Done
scope/authority audit             Done
Human merge                       Done
first automatic Production proof  Done
```

90A is complete。

## Remaining Milestone I gate · 90B real Daily soak

One later real `automation/daily/*` PR must repeat the same no-second-click flow:

1. Scheduled Daily PR + existing guard / Build / Trusted Preview；
2. Human merge；
3. fresh main Site Build；
4. automatic `Orbis Pages Promote`；
5. exact source SHA/artifact promotion；
6. public smoke；
7. no manual `Orbis Pages Production` dispatch。

Only after that real Daily proof should Plan 90 / Milestone I be marked Done。
