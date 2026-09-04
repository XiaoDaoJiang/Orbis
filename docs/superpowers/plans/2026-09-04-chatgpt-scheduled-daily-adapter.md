# Plan 70B · ChatGPT Scheduled Daily Adapter Implementation Plan

> Status: Live Gate — repository merged + existing task migrated/enabled; first real transport proof pending
> Repository baseline: `main@6419b3dfeeb3caa7f3f577351728a0e8dd780d91`
> Design: `docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
> Branch: `feat/chatgpt-scheduled-daily-adapter`
> PR: `#26 feat: add ChatGPT scheduled daily adapter` · merged

## Goal

Connect the existing ChatGPT Scheduled Task to Orbis as the first replaceable Scheduler / Producer adapter without moving provider-specific behavior into the repository core.

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

## Repository implementation · Done

### TDD evidence

RED:

```text
run 33827531033
AssertionError: ChatGPT Scheduled Daily adapter must exist
```

The run reached this RED only after the existing 70A Scheduled Daily contracts passed.

GREEN:

```text
final feature head       515295cef40636a2300d5043d592fa8c6e2388a2
PR Preview Build         33827615741 success
Preview Artifact         9920550137
Preview SHA-256          6ae074aab9863647bccdadbee63d2048cacd4b464f2c1edbdb80d88e212273d0
Trusted Preview Publish  33827736463 success
```

Merged integration:

```text
PR                       #26 merged
main                     6419b3dfeeb3caa7f3f577351728a0e8dd780d91
post-merge Site Build    33845663516 success
main Artifact            9926441727
main Artifact SHA-256    a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0
```

### Delivered repository scope

- `config/adapters/chatgpt-scheduled-daily.md`;
- `tools/content-automation/chatgpt-adapter.test.ts` wired into root automation validation;
- `docs/operations/chatgpt-scheduled-daily.md`;
- minimal `package.json` test wiring.

No changes to:

```text
content/**
apps/**
packages/**
dist/**
.github/workflows/**
```

No Production authority was added.

## Existing task migration · Done

The existing ChatGPT task was reused rather than duplicated:

```text
Title: Agent 前沿资讯
Timezone: Asia/Shanghai
Cadence: daily
State: enabled
Bootstrap: current XiaoDaoJiang/Orbis main / config/adapters/chatgpt-scheduled-daily.md
Notification settings: preserved
```

The obsolete active prompt that published HTML to `XiaoDaoJiang/ai-frontier` was replaced by a thin Orbis bootstrap. The task now loads current repository contracts on each run.

The external platform's opaque task ID is intentionally not committed to this public repository because it is not needed to operate or reproduce the Orbis contract.

## Live Gate — first real transport proof

70B is not Done until the first eligible Scheduled Daily run proves:

```text
explicit targetDate
-> deterministic automation/daily/<targetDate>
-> exact content/briefs/<targetDate>.yaml
-> exactly one owned PR
-> Scheduled Daily CI guard
-> full Build
-> Trusted Preview
```

For the real proof, capture:

- resolved `targetDate`;
- integration-base main SHA;
- branch name;
- exact content path;
- PR number;
- candidate outcome/report;
- CI run ID and conclusion;
- Preview artifact ID + digest;
- Trusted Preview publish/smoke run ID and conclusion.

If `main` already contains the target date as `published`, `already-published` is the correct safe no-write outcome but does **not** prove branch/PR transport. Wait for the next eligible date rather than weakening the contract.

## Acceptance criteria

- [x] existing ChatGPT Scheduled Task reused, not duplicated;
- [x] external task bootstrap points to Orbis main adapter;
- [x] provider-specific behavior remains outside core content schema/build logic;
- [x] deterministic one-branch / one-PR behavior is explicit;
- [x] repository 70A guard remains authoritative;
- [x] task cannot merge or deploy Pages;
- [x] no obsolete ai-frontier publishing behavior remains active;
- [x] full PR Build + Trusted Preview pass;
- [x] PR #26 merged + fresh main Build pass;
- [x] existing external task migrated + enabled;
- [ ] first eligible real run proves GitHub transport;
- [ ] 70B Done.

## Deferred to 70C

- three consecutive real cycles;
- same-day rerun drill against a real open candidate PR;
- published no-write drill as evidence;
- explicit correction PR drill;
- final Milestone G soak / closeout.
