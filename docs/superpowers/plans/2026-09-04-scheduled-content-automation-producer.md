# Plan 70B · First Scheduler / Producer Integration Implementation Plan

> Status: Prepared — implementation starts only after PR #25 merges and fresh `main` verification is green
> Planning baseline: `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> Design: `docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
> 70A: PR #25 · `feat: add scheduled daily automation contracts and guards`
> Proposed implementation branch after gate: `feat/scheduled-daily-producer-integration`
> Proposed PR: `feat: automate daily content branch and pull request`

## Goal

Connect the approved provider-neutral repository contract to the first real external Scheduler / Producer without giving that Producer production authority.

First pilot remains the existing ChatGPT Scheduled Task. Repository-owned logic decides what is allowed; the external Scheduler resolves `targetDate`, performs research, writes one deterministic candidate branch, and creates or updates exactly one PR.

```text
ChatGPT Scheduled Task
  -> explicit Asia/Shanghai targetDate
  -> current main / candidate state discovery
  -> repository-owned producer action plan
  -> research + structured Daily generation
  -> automation/daily/YYYY-MM-DD
  -> exact content/briefs/YYYY-MM-DD.yaml
  -> one PR
  -> existing read-only Build + Scheduled Daily guard
  -> Trusted Preview
  -> human merge only
  -> governed Pages remains separate
```

70B does **not** auto-merge and does **not** trigger Production Pages.

## Preconditions

Before any 70B feature implementation:

1. PR #25 is merged into `main`;
2. fresh `Orbis Site Build` succeeds on the exact merge SHA;
3. 70A repository contracts are available from `main`;
4. no Scheduled Task is activated against a baseline that lacks the 70A guard.

A fresh Production Pages deploy is not required for repository-only 70B development unless the merge changes published site output; Plan 70C owns live-cycle production evidence.

## Architecture boundary

### Repository owns

- exact `targetDate` / branch / content path identity;
- base publication decision semantics;
- candidate ownership semantics;
- interrupted-run recovery policy;
- provider-neutral action plan;
- exact diff / Schema / Preview gates;
- PR metadata/report contract.

### External Scheduler / Producer owns

- resolving the current `targetDate` in `Asia/Shanghai`;
- network research and first-party verification;
- GitHub state reads;
- executing the approved action plan through repository transport;
- candidate content generation;
- GitHub branch/file/PR writes limited to the deterministic candidate;
- reporting only operations actually completed.

### Explicitly forbidden

- direct push to `main`;
- automatic merge;
- Production Pages workflow dispatch;
- provider-specific fields in content Schema;
- fallback to a wider branch/path permission when any step fails;
- creating a second same-day branch or PR because recovery is inconvenient.

## Task 1 — RED: producer orchestration plan contract

Add first:

- `tools/content-automation/producer-plan.test.ts`

Require a pure repository-owned planner, conceptually:

```ts
type CandidateBranchState = 'missing' | 'exists'
type CandidatePrState = 'none' | 'owned-open' | 'conflicting-open' | 'multiple-open'

type ProducerPlanInput = {
  target: DailyTarget
  baseStatus: string | null
  branchState: CandidateBranchState
  prState: CandidatePrState
  branchDiffSafe?: boolean
}

type ProducerAction =
  | 'create-branch-and-pr'
  | 'update-open-pr'
  | 'recover-pr-from-safe-branch'
  | 'already-published'
  | 'revision-required'
  | 'blocked'
```

The test must prove at minimum:

```text
base missing + no branch + no PR                -> create-branch-and-pr
base missing + deterministic branch + owned PR -> update-open-pr
base missing + branch exists + no PR + safe diff -> recover-pr-from-safe-branch
base missing + branch exists + no PR + unsafe diff -> blocked
conflicting open candidate                     -> blocked
multiple matching open PRs                     -> blocked
base published                                 -> already-published
base non-public existing target                -> revision-required
```

Expected RED: 70A has `decideDailyAutomation()` but no complete producer action planner for GitHub branch / PR recovery state.

## Task 2 — GREEN: implement provider-neutral producer planner

Create:

- `tools/content-automation/producer-plan.ts`

It should compose existing 70A helpers rather than duplicate them:

```text
resolveDailyTarget
+ decideDailyAutomation
+ normalized remote candidate state
= executable ProducerAction
```

The planner must not import GitHub SDKs, ChatGPT APIs, network clients, environment credentials or system time.

Interrupted candidate recovery is allowed only when the deterministic branch can be proven safe: its diff against the current integration base contains only the exact target Daily path. Otherwise return `blocked`.

## Task 3 — RED/GREEN: candidate ownership discovery contract

Add focused tests, preferably:

- `tools/content-automation/candidate-state.test.ts`
- `tools/content-automation/candidate-state.ts`

The repository helper only normalizes externally supplied remote facts; it does not call GitHub.

Required normalized facts include:

```text
integration base SHA
canonical automation branch exists?
zero / one / multiple open PRs for that exact head branch
open PR base branch
open PR head branch
branch diff verified exact-target?
```

Ownership rules:

- only the exact `automation/daily/<targetDate>` branch can be owned by this Scheduled Daily;
- an open PR must target `main` and use that exact head branch;
- multiple matching open PRs are a blocked invariant violation;
- an unrelated PR must never be adopted;
- a stale deterministic branch with unsafe diff must never be repaired by broad deletion or force reset inside the Scheduled Task.

## Task 4 — RED/GREEN: Scheduled Task transport prompt contract

Extend the existing prompt contract tests rather than adding provider details to content Schema.

Preferred files:

- update `config/scheduled-task-prompt.md`
- update/add `tools/content-automation/prompt-contract.test.ts`

The launcher contract must require this exact safe order:

```text
1. resolve explicit Asia/Shanghai targetDate
2. read current repository contract files from main
3. read exact main target path
4. inspect deterministic branch
5. discover open PR ownership for that exact branch
6. normalize remote facts
7. apply repository producer decision / plan
8. only if plan allows write: research + verify + generate Daily
9. create/update deterministic branch target only
10. create/update exactly one PR using repository metadata contract
11. stop; CI/Preview are repository-owned follow-up gates
```

The prompt must explicitly say that a Scheduled Task may report producer-local validation/full-build only if actually executed. GitHub CI / Trusted Preview are not pre-claimed.

Do not encode secrets, account IDs or transport-specific credentials in the repository prompt.

## Task 5 — GREEN: root contract wiring

Update `package.json` so the new producer-plan / candidate-state contracts are part of the existing content-automation test suite.

Expected focused command remains conceptually:

```text
pnpm test:content-automation
```

A normal non-automation PR must remain unaffected.

No new workflow write permission is added. `.github/workflows/pr-preview-build.yml` stays read-only and continues to enforce the 70A Scheduled Daily guard for real `automation/daily/**` PRs.

## Task 6 — TDD / security regression before final 70B PR GREEN

Prove at minimum:

- same-day rerun never creates a second branch;
- same-day rerun with one owned open PR selects update;
- deterministic branch left by an interrupted run can recover to one PR only after exact-target diff proof;
- unsafe stale branch blocks;
- multiple matching PRs block;
- published main target is a successful no-write outcome;
- non-public main target requires revision path;
- correction is never entered automatically;
- 70A delete / rename / exact-target guard tests remain green;
- Plan 10–60 full Build remains green.

## Task 7 — 70B repository PR

After PR #25 merge + fresh main verification:

```text
branch: feat/scheduled-daily-producer-integration
PR:     feat: automate daily content branch and pull request
```

Expected repository scope:

```text
tools/content-automation/producer-plan.ts
tools/content-automation/producer-plan.test.ts
tools/content-automation/candidate-state.ts
tools/content-automation/candidate-state.test.ts
tools/content-automation/prompt-contract.test.ts
config/scheduled-task-prompt.md
package.json
```

Avoid unless an executable contract proves necessary:

```text
content/**
apps/**
packages/**
.github/workflows/pages-production.yml
.github/workflows/pr-preview-publish.yml
dist/**
```

Final PR evidence must include RED -> GREEN sequence, exact-head full PR Build, Preview Artifact, Trusted Preview publish/smoke and scope audit.

## Task 8 — activate the external ChatGPT Scheduled Task only after repository 70B is merge-ready

Use the existing task when one already exists; do not create a duplicate Daily scheduler.

Operational activation sequence:

1. privately inspect existing Scheduled Tasks;
2. locate the Orbis / AI Frontier Daily task by intent;
3. preserve its existing cadence unless the user explicitly asks to change it;
4. replace its runtime instruction with a minimal launcher that says to read and obey current `XiaoDaoJiang/Orbis/config/scheduled-task-prompt.md` from `main` on every run;
5. keep the Scheduler responsible for `Asia/Shanghai` `targetDate` resolution;
6. require GitHub repository transport to use the deterministic branch / one-PR contract;
7. prohibit merge and Pages dispatch;
8. do not embed a copied full repository prompt into the scheduled task, so future repository contract changes take effect without task drift.

The task itself is operational state, not a publishable repository artifact.

If there is no existing task, create exactly one daily task using the currently approved cadence; if cadence cannot be recovered, pause activation rather than inventing a new execution time.

## Task 9 — activation verification

Before calling 70B complete, verify:

- exactly one active Scheduled Daily task exists for this Orbis flow;
- its launcher points to the current Orbis repository contract;
- no old `XiaoDaoJiang/ai-frontier` repository is referenced;
- it cannot merge or deploy Pages;
- repository `main` contains the merged 70A/70B contracts;
- the next real run will target deterministic `automation/daily/<targetDate>`.

Do not manufacture a fake Daily or run a production correction merely to prove activation.

Actual consecutive Daily runs belong to 70C.

## 70B acceptance criteria

- remote GitHub state maps deterministically to one repository-owned ProducerAction;
- interrupted runs have a safe recovery path without broad branch mutation;
- same-day reruns converge on one branch / one PR;
- published-main no-write is preserved;
- producer transport cannot widen repository permissions;
- repository CI / Trusted Preview remain authoritative;
- exactly one external Scheduled Task is active and reads the live repository contract each run;
- no automatic merge / Pages authority exists;
- changing the external Producer later does not require content Schema or Astro/Slidev changes.

## Explicitly deferred to 70C

- three consecutive real Daily cycles;
- a real same-day rerun drill against an open candidate PR;
- a real already-published no-write drill;
- one explicit correction workflow drill;
- final Milestone G soak evidence and closeout.
