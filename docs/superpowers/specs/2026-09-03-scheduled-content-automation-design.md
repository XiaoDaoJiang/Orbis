# Scheduled Content Automation Design

> Status: Design Review
> Roadmap: Plan 70 · Milestone G — Sustainable Automation
> Production baseline for implementation: pending Plan 60 exact-SHA Production Gate for `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`

## 1. Goal

Turn the existing scheduled Daily prompt contract into a sustainable, least-privilege content automation loop without binding Orbis to a single Agent runtime.

```text
Scheduler / Producer
        ↓
structured Daily candidate
        ↓
automation/daily/YYYY-MM-DD
        ↓
content-only PR
        ↓
Repository automation guard
        ↓
existing full Build + Trusted Preview
        ↓
Human / policy review
        ↓
merge main
        ↓
existing governed Pages deployment
```

The Agent does not publish Pages, modify application code, or own production credentials.

## 2. Current foundation

Already available:

- `config/scheduled-task-prompt.md` as the external Scheduled Task entry contract;
- `config/daily-task-prompt.md` as the Daily editorial / source-verification contract;
- structured `content/briefs/YYYY-MM-DD.yaml` + Zod schema;
- `content-agent` Path Guard mode;
- protected generated paths;
- read-only PR Build;
- Trusted Preview publish + smoke;
- manual governed Production Pages workflow.

Plan 70 should reuse these boundaries instead of creating a second publishing system.

## 3. Audit findings that Plan 70 must correct

### 3.1 Generic content-agent authority is too broad for Scheduled Daily

Current `content-agent` allows:

```text
content/briefs/**
content/presentations/**
content/essays/**
content/knowledge/**
```

That is a valid generic Agent contribution boundary, but a Scheduled Daily producer only needs one target file under `content/briefs/**`.

Plan 70 therefore adds a separate, narrower automation contract rather than shrinking the existing generic mode.

### 3.2 Existing Daily prompt conflicts with published-content idempotency

Current Daily prompt says an existing same-date Daily should be updated.

Scheduled automation must instead distinguish:

```text
missing on main               → create candidate
open automation PR/branch     → update the same candidate branch
main has non-public candidate → explicit revision path
main has published Daily      → stop; correction workflow required
```

A Scheduled Daily run must never silently rewrite an already-published Daily on `main`.

### 3.3 Current Path Guard does not inspect deletion paths

The existing guard calls `git diff --name-only --diff-filter=ACMRTUXB`, which excludes deletions. Scheduled automation must treat delete/rename source paths as first-class changes.

Plan 70 hardens the guard to inspect all relevant old/new paths and proves deletion/rename behavior in integration tests.

## 4. Architecture decision

### 4.1 Fixed repository contract, replaceable Scheduler / Producer

Orbis owns:

- target-date and idempotency rules;
- exact allowed repository diff;
- PR metadata contract;
- validation / build / preview gates;
- correction boundary;
- machine-readable run result shape.

The first Scheduler / Producer is replaceable and must not leak provider-specific fields into content schema or build code.

### 4.2 Recommended first pilot: existing ChatGPT Scheduled Task

For the first three real Daily cycles, use the existing ChatGPT Scheduled Task prompt as the external Scheduler / Producer.

Reasons:

- already has the editorial and source-verification prompt contract;
- no new model API key stored in GitHub;
- no new workflow platform or database;
- fits Orbis' current minimal-infrastructure principle;
- repository enforcement remains provider-independent.

This is a pilot choice, not an architectural dependency. A later GitHub Actions + API producer or CLI agent may replace it without changing content schema or publishing pipeline.

## 5. Scheduled Daily identity

### Target date

The run receives an explicit `targetDate` in `YYYY-MM-DD`.

The scheduler resolves the date using `Asia/Shanghai`; repository scripts never infer the content date from runner-local timezone.

### Deterministic branch

```text
automation/daily/YYYY-MM-DD
```

This branch name is the idempotency key for an in-flight Daily candidate.

### Exact content path

```text
content/briefs/YYYY-MM-DD.yaml
```

A Scheduled Daily PR may modify exactly this target content path and nothing else.

## 6. New repository automation guard

Keep generic `content-agent` unchanged.

Add a Scheduled Daily-specific contract, conceptually:

```text
pnpm automation:daily:guard --base <sha> --target-date YYYY-MM-DD
```

It must verify:

- all changed old/new paths are inspected, including delete and rename;
- the only permitted content path is the exact target Daily path;
- no second Brief is modified;
- no `content/presentations/**`, Essay, Knowledge, Topic, Registry, config, app, package, tool, workflow, generated or dist path is changed;
- target filename equals `targetDate`;
- parsed Brief is `kind=brief`, `cadence=daily`, and `publishedAt=targetDate`;
- deletion of the target is forbidden;
- rename into/out of the target is forbidden;
- if base/main already contains the same target as published, the run is rejected as `correction-required`.

The regular PR Path Guard still runs as defense in depth.

## 7. Idempotency state machine

Repository-side decision helper returns one of:

```text
create-candidate
update-open-candidate
revision-required
already-published
correction-required
```

First pilot behavior:

1. main target missing → create deterministic automation branch / PR;
2. same automation branch + open PR exists → update that branch, never create a competing PR;
3. main has published Daily → stop successfully with `already-published`; no write;
4. any request to change an already-published Daily must enter the separate correction workflow;
5. concurrent/race cases are caught again by the PR automation guard against the current base.

## 8. Candidate publication semantics

The automated PR may contain `status: published` because branch / PR review is the publication approval boundary and Preview is intentionally public-but-noindex.

`status: published` in a feature branch does not mean Production has been published.

The producer must never claim production publication until merge + governed Pages deployment actually occurs.

## 9. Automation run report

Do not commit operational metadata into `content/**`.

Use a provider-neutral report model such as:

```ts
interface DailyAutomationReport {
  version: 1
  kind: 'daily'
  targetDate: string
  branch: string
  contentPath: string
  outcome: 'candidate-created' | 'candidate-updated' | 'already-published' | 'blocked' | 'failed'
  sourceCount: number
  primarySourceCount: number
  validation: 'passed' | 'failed' | 'not-run'
  fullBuild: 'passed' | 'failed' | 'not-run'
  unverified: string[]
  failureStage?: 'discovery' | 'verification' | 'generation' | 'schema' | 'guard' | 'git' | 'pr' | 'preview'
}
```

The report may be rendered into:

- human-readable PR body;
- a machine-readable HTML-comment / JSON block in the PR body;
- scheduler run output;
- later, an Actions artifact or job summary.

It must not contain chain-of-thought, credentials, raw prompt internals or unnecessary fetched source payloads.

## 10. PR metadata contract

Automation PRs must include:

- `AI FRONTIER · YYYY-MM-DD` / target date;
- deterministic branch and content path;
- source count and primary-source count;
- schema / content validation result;
- whether full build actually ran in producer environment;
- explicit unverified items;
- correction/revision reason when applicable;
- machine-readable `DailyAutomationReport` block.

CI / Trusted Preview results are added only after GitHub actually produces them; the producer must not pre-claim them.

## 11. Existing Preview pipeline reuse

Do not create an automation-specific site builder.

Automation PRs go through the normal read-only PR pipeline:

```text
checkout
→ frozen install
→ generic PR Path Guard
→ Scheduled Daily automation guard
→ full pnpm build
→ artifact
→ Trusted Preview publish
→ public smoke
```

The automation-specific guard may be conditionally activated by deterministic branch prefix `automation/daily/`.

## 12. Correction workflow

A Scheduled Daily run that sees a published main target exits without modifying it.

Corrections are explicit and separate:

```text
correction/daily/YYYY-MM-DD/<reason-slug>
```

A correction PR must state:

- what fact was wrong or materially incomplete;
- why historical content must change;
- source/evidence supporting the correction;
- whether title/summary/conclusions changed.

No scheduled job automatically enters correction mode.

## 13. Failure visibility

At minimum distinguish:

```text
discovery/feed failure
primary-source verification insufficient
generation failure
schema/content validation failure
automation guard failure
git/branch failure
PR creation/update failure
Preview Build failure
```

Failure should stop at the earliest safe stage. No fallback may widen write permissions.

## 14. Delivery slices

### 70A — Scheduled Daily Repository Contract

Proposed PR:

```text
feat: add scheduled daily automation contracts and guards
```

Includes:

- target-date parser / contract;
- idempotency decision helper;
- provider-neutral automation report model;
- Scheduled Daily exact-path guard;
- deletion/rename-safe Path Guard hardening;
- `config/path-guard.yaml` `scheduled-daily` mode or equivalent contract;
- automation guard integration tests;
- published-main overwrite protection;
- PR metadata contract tests;
- prompt alignment for published-main / correction semantics.

No scheduler integration and no model API.

### 70B — First Scheduler / Producer Integration

Proposed PR:

```text
feat: automate daily content branch and pull request
```

First pilot integrates the existing ChatGPT Scheduled Task with:

- explicit Asia/Shanghai target date;
- deterministic branch;
- create/update-one-PR behavior;
- repository contract invocation / CI enforcement;
- provider-neutral PR report metadata;
- no merge / no Pages deploy.

If the external scheduler cannot reliably satisfy these contracts, stop and choose a GitHub Actions + API/CLI producer before widening privileges.

### 70C — Real-cycle Validation

Proposed PR / evidence set:

```text
test: validate scheduled daily lifecycle end to end
```

Require at least three real consecutive Daily cycles plus one correction drill.

## 15. Acceptance criteria

- Scheduled Daily can only change exact `content/briefs/<targetDate>.yaml`;
- delete / rename bypasses are impossible;
- target date uses explicit Asia/Shanghai semantics;
- same-day rerun converges on one deterministic branch / PR;
- main published Daily is never silently overwritten;
- correction workflow is explicit and separate;
- normal Schema, full Build and Trusted Preview remain mandatory;
- Scheduler / Producer has no Pages deployment authority;
- failure stage is observable;
- three real cycles run without infrastructure edits;
- changing Producer does not require content Schema or build-pipeline changes.

## 16. Non-goals

- automatic PR merge;
- direct Pages deployment;
- multiple provider integrations in first release;
- database job queue;
- new CMS;
- persistent automation state outside Git / PR / run metadata;
- automatic Source/Author/Topic registry mutation;
- automatic Essay / Knowledge generation in the first Daily pilot;
- automatic correction of published history.

## 17. Current gate

Design may be reviewed while Plan 60 production closeout is pending.

Implementation must not start until:

1. Plan 60 Production Pages exact-SHA gate for `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286` succeeds;
2. this Design Review is approved.
