# Plan 70B · ChatGPT Scheduled Daily Adapter Implementation Plan

> Status: Prepared
> Baseline: `main@1fcdc4caecc234af7ef2426e4c9d320513eb2efb`
> Depends on: Plan 70A merged + fresh main Build
> Design: `docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
> Proposed branch: `feat/chatgpt-scheduled-daily-adapter`
> Proposed PR: `feat: add ChatGPT scheduled daily adapter`

## Goal

Connect the existing ChatGPT Scheduled Task to Orbis as the first replaceable Scheduler / Producer adapter without moving provider-specific behavior into the repository core.

The adapter must reduce to:

```text
ChatGPT Scheduled Task
  -> read repository adapter entry
  -> read provider-neutral Scheduled Daily contract
  -> resolve Asia/Shanghai targetDate
  -> use connected GitHub transport
  -> create/update deterministic automation/daily/<date>
  -> write exactly content/briefs/<date>.yaml
  -> create/update exactly one PR
  -> repository guard / full Build / Trusted Preview
  -> human merge
```

The adapter never merges, never deploys Pages and never owns production credentials.

## Existing task migration

Reuse the existing ChatGPT task:

```text
Title: Agent 前沿资讯
Cadence: daily, Asia/Shanghai
Current state: disabled
Current prompt: obsolete XiaoDaoJiang/ai-frontier HTML publishing flow
```

Do not create a second competing Daily task.

70B migrates this task after the repository adapter PR is merged and verified.

## Task 1 — RED: provider adapter contract

Add an executable contract first, preferably:

- `tools/content-automation/chatgpt-adapter.test.ts`

Require a provider-specific adapter file, preferably:

- `config/adapters/chatgpt-scheduled-daily.md`

The contract must prove the adapter:

- names `XiaoDaoJiang/Orbis` as the only repository;
- loads `config/scheduled-task-prompt.md` from the current `main` before execution;
- treats repository config as the source of truth rather than duplicating the editorial prompt;
- uses `Asia/Shanghai` and explicit `targetDate`;
- uses canonical `automation/daily/<targetDate>` identity;
- uses connected GitHub transport for branch / file / PR operations;
- performs integration-base state inspection before writing;
- creates or updates exactly one owned PR for the deterministic branch;
- does not write `main` directly;
- does not merge PRs;
- does not dispatch Production Pages;
- does not reference `XiaoDaoJiang/ai-frontier` except in an explicit prohibition;
- does not duplicate full Daily editorial/source-selection rules already owned by repository config.

Expected RED: the provider adapter entry does not exist.

## Task 2 — GREEN: thin ChatGPT adapter entry

Create `config/adapters/chatgpt-scheduled-daily.md` as a thin provider adapter.

It should instruct the Scheduled Task to:

1. resolve `targetDate` using Asia/Shanghai;
2. fetch current `main` repository contract first;
3. inspect `main` target and deterministic branch / open PR state;
4. follow repository decision semantics;
5. perform research/generation only when the run is eligible;
6. create/update the deterministic branch using connected GitHub;
7. modify only the exact Daily target file;
8. create/update one PR using repository-rendered metadata semantics;
9. report CI / Preview only after they really exist;
10. stop at the PR/human-review boundary.

The adapter should not copy the long editorial prompt. It delegates those rules to `config/scheduled-task-prompt.md` and `config/daily-task-prompt.md`.

## Task 3 — RED/GREEN: adapter drift protection

Extend `test:content-automation` to include the adapter contract.

Tests should reject drift back to:

- old `ai-frontier` repository publishing;
- HTML generation;
- direct `main` writes;
- auto merge;
- Pages deployment;
- implicit local-date inference;
- non-deterministic branch names.

## Task 4 — repository runbook

Add a concise operations runbook, preferably:

- `docs/operations/chatgpt-scheduled-daily.md`

Document only operationally useful information:

- existing task identity and expected cadence;
- adapter entry path;
- repository contract path;
- deterministic branch / PR identity;
- safe outcomes: candidate-created, candidate-updated, already-published, revision-required, blocked, failed;
- how to disable the task;
- how to inspect a failed run;
- why the task must not be granted production deployment authority.

Do not place secrets, credentials or internal reasoning in the runbook.

## Task 5 — PR verification

On the 70B feature head require:

```text
pnpm test:content-automation
pnpm build
pnpm path:guard --mode pr --base <main-sha>
```

Trusted Preview must also remain green even though the adapter has no public UI output.

Scope should be limited to:

```text
config/adapters/**
tools/content-automation/**
docs/operations/**
package.json   # only when test wiring is required
```

Do not change:

```text
content/**
apps/**
packages/**
dist/**
.github/workflows/pages-production.yml
```

## Task 6 — external Scheduled Task migration after merge

Only after the 70B PR is merged and fresh main Build is green:

- update the existing `Agent 前沿资讯` task rather than creating a new one;
- replace the obsolete ai-frontier prompt with a thin bootstrap that reads `config/adapters/chatgpt-scheduled-daily.md` from Orbis `main` and executes it;
- preserve `Asia/Shanghai` daily cadence;
- enable the task;
- keep notifications configuration unchanged unless explicitly requested;
- record the resulting task ID/state as 70B evidence.

The external task bootstrap must not duplicate repository contracts. Repository `main` remains the source of truth.

## Task 7 — first real transport proof

The first eligible run must prove:

```text
explicit targetDate
-> deterministic branch
-> exact Daily file
-> one PR
-> Scheduled Daily CI guard
-> full Build
-> Trusted Preview
```

If the target date already exists as published on main, `already-published` is a valid no-write result but does not by itself prove branch/PR transport. Use the next eligible date for the first candidate transport proof.

## Acceptance criteria

- existing ChatGPT Scheduled Task is reused, not duplicated;
- external task bootstrap is thin and points only to Orbis main adapter;
- provider-specific behavior remains outside core content schema/build logic;
- deterministic one-branch / one-PR behavior is explicit;
- repository 70A guard remains authoritative;
- task cannot merge or deploy Pages;
- no obsolete ai-frontier publishing behavior remains active;
- full PR Build + Trusted Preview pass;
- first eligible real run proves GitHub transport before 70B is marked Done.

## Deferred to 70C

- three consecutive real cycles;
- same-day rerun drill against a real open candidate PR;
- published no-write drill as evidence;
- explicit correction PR drill;
- final Milestone G soak / closeout.
