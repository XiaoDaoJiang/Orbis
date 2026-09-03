# Plan 70A · Scheduled Daily Repository Contract Implementation Plan

> Status: Prepared — implementation blocked by Plan 60 Production Gate + Plan 70 design approval
> Planning baseline: `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> Design: `docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
> Proposed branch after gate: `feat/scheduled-daily-contracts`
> Proposed PR: `feat: add scheduled daily automation contracts and guards`

## Goal

Create the deterministic repository-side safety contract for a Scheduled Daily producer.

70A must make the following statement executable:

> A run for `targetDate=YYYY-MM-DD` may propose exactly one Daily source at `content/briefs/YYYY-MM-DD.yaml`, may never delete/rename its way around the guard, may never silently modify an already-published Daily on `main`, and must enter the existing full Build / Trusted Preview pipeline.

70A does **not** implement the Scheduler, model calls, RSS research, GitHub branch/PR transport or Production Pages deployment.

## Design constraints to preserve

- generic `content-agent` remains available for broader reviewed Agent contributions;
- Scheduled Daily gets a narrower contract;
- `targetDate` is explicit and resolved by the Scheduler using `Asia/Shanghai`;
- repository tooling never chooses a Daily date from runner-local time;
- deterministic branch identity is `automation/daily/<targetDate>`;
- feature-branch `status: published` is allowed as a publication candidate;
- only a **published target on the integration base/main** is protected from normal scheduled overwrite;
- CI / Preview evidence is authoritative and cannot be pre-claimed by Producer metadata;
- no Pages/workflow-dispatch authority is granted to the Producer.

## Task 1 — RED: deletion / rename-safe Git change-set contract

The highest-priority security gap is the existing Path Guard change discovery:

```text
git diff --name-only --diff-filter=ACMRTUXB <base>...HEAD
```

It excludes deletion paths and does not expose enough old/new-path information for robust rename policy.

Add executable tests first, preferably:

- `tools/path-guard/change-set.test.ts`
- `tools/path-guard/policy.test.ts`

Require a typed changed-entry model, conceptually:

```ts
type ChangedEntry = {
  status: string
  path: string
  oldPath?: string
}
```

Tests must prove discovery/policy behavior for:

```text
A  allowed path
M  allowed path
D  allowed path
R  allowed -> allowed
R  protected -> allowed
R  allowed -> protected
C  source -> destination
```

For rename/copy-style records, policy evaluation must have access to both relevant paths. Deletion must never disappear from the change set.

Expected RED: current Path Guard cannot represent these cases correctly.

## Task 2 — GREEN: extract change-set + pure Path Guard policy

Refactor without weakening the public CLI.

Preferred files:

- `tools/path-guard/change-set.ts`
- `tools/path-guard/policy.ts`
- `tools/path-guard/index.ts`

Recommended Git adapter uses a machine-safe form such as:

```text
git diff --name-status -z --find-renames <base>...HEAD
```

The parser must handle status variants like `R100` / `C100` and preserve old/new paths.

The pure policy evaluator receives parsed changes + mode config and returns violations. The existing CLI remains compatible:

```text
pnpm path:guard --mode pr --base <ref>
pnpm path:guard --mode content-agent --base <ref>
```

Generic policy requirements:

- a deletion of a denied path is denied;
- rename from denied → allowed is denied because the old path participates;
- rename from allowed → denied is denied because the new path participates;
- generated/protected paths cannot bypass policy through delete/rename;
- existing valid PR behavior remains unchanged otherwise.

## Task 3 — RED: Scheduled Daily target-date / identity contract

Create:

- `tools/content-automation/daily-target.test.ts`

Require pure helpers that prove:

- strict `YYYY-MM-DD` input;
- calendar-valid dates, not regex-only acceptance;
- canonical path `content/briefs/<targetDate>.yaml`;
- canonical branch `automation/daily/<targetDate>`;
- no implicit system-clock fallback;
- parsed candidate is `kind: brief`;
- parsed candidate is `cadence: daily`;
- `publishedAt === targetDate`;
- `presentation.template === daily-v1`;
- filename/date/publishedAt mismatch fails;
- Weekly/ad-hoc Brief cannot satisfy the contract.

Expected RED: no Scheduled Daily target helper exists.

## Task 4 — GREEN: target helper + provider-neutral contracts

Create, preferably:

- `tools/content-automation/contracts.ts`
- `tools/content-automation/daily-target.ts`

Define repository-owned types including the design's `DailyAutomationReport`.

Suggested pure APIs:

```ts
resolveDailyTarget(targetDate)
assertDailyCandidateIdentity(targetDate, source)
```

The module may reuse `dailyBriefSchema`; it must not access GitHub, network or machine-local current date.

## Task 5 — RED: idempotency / publication-base decision contract

Create:

- `tools/content-automation/daily-decision.test.ts`

The tests must distinguish **integration-base state** from feature-branch candidate state.

Required repository decisions include:

```text
base target missing                    -> create-candidate
owned open candidate supplied by adapter -> update-open-candidate
base target non-public                 -> revision-required
base target published                  -> already-published / no write
attempted normal diff over published base -> correction-required
conflicting/unowned candidate identity -> blocked
```

A feature branch containing `status: published` must not by itself be interpreted as already in Production.

The helper is pure; 70B will provide remote PR/branch ownership state.

## Task 6 — GREEN: deterministic Daily decision helper

Create:

- `tools/content-automation/daily-decision.ts`

The output should be explicit enough that the adapter cannot confuse no-write success with correction authorization.

Recommended decision vocabulary:

```text
create-candidate
update-open-candidate
revision-required
already-published
correction-required
blocked
```

No normal decision may mean “overwrite published main target”.

## Task 7 — RED: Scheduled Daily exact-diff guard

Create integration tests, preferably:

- `tools/content-automation/daily-guard.test.ts`

The first adapter may modify exactly:

```text
content/briefs/<targetDate>.yaml
```

Required matrix:

```text
PASS A target Daily when base target missing
PASS M target Daily only when base semantics permit explicit revision
FAIL D target Daily
FAIL R anything -> target Daily
FAIL R target Daily -> anything
FAIL C-style path transition used to bypass exact target
FAIL second Brief changed in same diff
FAIL another Daily date
FAIL content/presentations/**
FAIL content/essays/**
FAIL content/knowledge/**
FAIL content/topics/**
FAIL content/sources/**
FAIL content/authors/**
FAIL config/**
FAIL apps/**
FAIL packages/**
FAIL tools/**
FAIL .github/**
FAIL apps/slides/generated/**
FAIL dist/**
FAIL target filename / publishedAt mismatch
FAIL normal modification when base target is published
```

Use real temporary Git fixtures where practical so deletion/rename behavior is tested against Git output, not only hand-built arrays.

Expected RED: generic `content-agent` is intentionally too broad and deletion is currently invisible.

## Task 8 — GREEN: Scheduled Daily guard CLI

Add, preferably:

- `tools/content-automation/daily-guard.ts`

Command contract:

```text
pnpm automation:daily:guard --base <sha-or-ref> --target-date YYYY-MM-DD
```

The guard composes:

1. deletion/rename-safe Git change collection;
2. static Scheduled Daily directory policy;
3. dynamic exact-target policy;
4. Daily Schema + identity validation;
5. integration-base publication protection.

Add `config/path-guard.yaml` mode:

```yaml
scheduled-daily:
  allowPrefixes:
    - content/briefs/
```

This static mode is defense-in-depth only. It is **not sufficient by itself**; the dynamic guard must still enforce the single exact target path.

For the first Scheduled Daily flow, allow only ordinary add/modify of the exact target. Delete/rename/copy-style path transitions are rejected even if the destination would otherwise be allowlisted.

## Task 9 — RED: automation report / PR metadata contract

Create:

- `tools/content-automation/report.test.ts`
- `tools/content-automation/pr-metadata.test.ts`

Require the provider-neutral report fields approved by the design:

```text
version
kind=daily
targetDate
branch
contentPath
outcome
sourceCount
primarySourceCount
validation
fullBuild
unverified[]
failureStage?
```

Required guarantees:

- deterministic title for the target Daily;
- stable contract marker;
- human-readable metadata;
- machine-readable report block;
- `fullBuild` distinguishes passed / failed / not-run;
- Producer metadata cannot claim Trusted Preview success before CI actually returns it;
- chain-of-thought, credentials, raw prompts and secret fields are not part of the report model.

Expected RED: no repository-owned automation report renderer exists.

## Task 10 — GREEN: report + PR metadata renderer

Create, preferably:

- `tools/content-automation/report.ts`
- `tools/content-automation/pr-metadata.ts`

Suggested marker:

```html
<!-- orbis-content-automation:v1 -->
```

Suggested title:

```text
content: daily brief <YYYY-MM-DD>
```

The renderer performs no GitHub API calls.

70B may use the output when creating/updating the PR through the selected repository transport.

## Task 11 — RED/GREEN: align prompt idempotency semantics

Update only the parts of:

- `config/daily-task-prompt.md`
- `config/scheduled-task-prompt.md`

that currently permit ambiguous same-date overwrite behavior.

Required semantics after 70A:

```text
main missing target          -> normal candidate allowed
open automation candidate    -> same candidate may be revised by 70B
main published target        -> normal Scheduled Daily does not overwrite
published correction         -> explicit correction workflow only
```

Do not prematurely encode provider-specific GitHub tool syntax in these prompts; branch/PR transport belongs to 70B.

## Task 12 — GREEN: root scripts and mandatory PR CI enforcement

Update `package.json` with at least:

```text
test:content-automation
automation:daily:guard
```

Integrate `test:content-automation` into root validation/build.

Update `.github/workflows/pr-preview-build.yml` so PRs whose head branch starts with:

```text
automation/daily/
```

must run the Scheduled Daily guard **before** `pnpm build`.

The CI step derives `targetDate` from the deterministic branch name and passes the exact PR base SHA already available from the pull-request event.

The PR build job remains:

```text
permissions:
  contents: read
```

Do not add write permissions.

Normal non-automation PRs continue through the generic PR Path Guard + full Build unchanged.

## Task 13 — Full security regression suite

Before final GREEN, prove at minimum:

- generic PR deletion of generated/protected path is rejected;
- content-agent deletion/rename cannot escape allowlist evaluation;
- Scheduled Daily deletion/rename/copy-style path transition is rejected;
- exact Daily add succeeds;
- second-file diff fails;
- wrong-date Daily fails;
- main-published overwrite fails;
- feature-branch `status: published` candidate with missing base target remains valid;
- Weekly/Presentation/Essay/Knowledge behavior outside Scheduled Daily remains unchanged;
- existing Plan 10–60 tests remain green.

## Task 14 — Final exact-head verification before PR

On the final 70A feature head require:

```text
pnpm test:content-automation
pnpm build
pnpm path:guard --mode pr --base <main-sha>
```

and the focused deletion/rename/path policy contracts.

Scope audit must show no generated artifacts and no content production changes.

Expected implementation surfaces:

```text
tools/path-guard/**
tools/content-automation/**
config/path-guard.yaml
config/daily-task-prompt.md
config/scheduled-task-prompt.md
package.json
.github/workflows/pr-preview-build.yml
```

Explicitly do not change:

```text
apps/**
packages/content-schema/**   unless an executable contract proves current Schema cannot express the approved design
content/**
dist/**
.github/workflows/pages-production.yml
.github/workflows/pr-preview-publish.yml
```

## 70A PR evidence requirements

PR body should record the TDD sequence, especially:

1. deletion/rename contract RED;
2. hardened Path Guard GREEN;
3. exact Scheduled Daily guard RED → GREEN;
4. published-base protection RED → GREEN;
5. report/metadata contract RED → GREEN;
6. final full `pnpm build`;
7. actual PR Preview Build run;
8. actual Trusted Preview publish + public smoke.

Do not claim any Preview or public status before the corresponding GitHub run has completed.

## Explicitly deferred to 70B

- ChatGPT Scheduled Task repository transport;
- GitHub branch creation/update calls;
- open-PR discovery and ownership matching;
- create/update-one-PR orchestration;
- RSS/network research execution;
- real Producer run reference capture;
- updating PR metadata after CI/Preview results.

## Explicitly deferred to 70C

- three consecutive real Daily cycles;
- same-day rerun drill against a real open PR;
- already-published no-write drill;
- explicit correction PR drill;
- Milestone G live-soak evidence and final Production closeout.
