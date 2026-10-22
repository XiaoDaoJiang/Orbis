# ChatGPT Scheduled Daily Operations

## Purpose

This runbook covers the first Orbis Scheduled Daily provider adapter: the existing ChatGPT Scheduled Task named `Orbis AI Frontier Daily`.

The provider adapter is intentionally thin. Repository contracts remain authoritative.

## Canonical configuration

```text
Repository contract   config/scheduled-task-prompt.md
Daily editorial rules config/daily-task-prompt.md
Provider adapter      config/adapters/chatgpt-scheduled-daily.md
Repository            XiaoDaoJiang/Orbis
Timezone              Asia/Shanghai
```

Do not maintain a second copy of the Daily editorial prompt inside the ChatGPT task.

## Deterministic run identity

For `targetDate=YYYY-MM-DD`:

```text
branch      automation/daily/YYYY-MM-DD
contentPath content/briefs/YYYY-MM-DD.yaml
PR          one open PR from the deterministic branch to main
```

A same-day rerun must converge on the same branch and PR.

## Safe outcomes

Normal provider outcomes include:

- `candidate-created` — new deterministic candidate branch/PR created;
- `candidate-updated` — same owned candidate branch/PR updated;
- `already-published` — main already contains the published target; no write;
- `revision-required` — main contains a non-published target; stop normal automation;
- `blocked` — candidate ownership or repository state is ambiguous/conflicting;
- `failed` — a concrete execution stage failed.

A correction to already-published history is never started automatically. Explicit published Evidence V1 corrections use the separate [`Published Daily Correction Workflow`](./published-daily-correction.md).

## Failure inspection

Inspect in this order:

1. ChatGPT Scheduled Task run result and reported `failureStage`;
2. target `main` file state;
3. deterministic branch state;
4. open PR for the deterministic branch and automation marker;
5. PR Preview Build;
6. Scheduled Daily guard output;
7. full `pnpm build` result;
8. Trusted Preview publish/public smoke.

Do not resolve failures by expanding the task's repository or production authority.

### Separate discovery, production, integration and publication

- **Feed Discovery:** inspect `Orbis Feed Discovery Snapshot` and `runtime/feed-discovery/latest.json`. Workflow success proves snapshot refresh only. Check snapshot age (at most six hours at producer execution), `meetsMinimumFeeds`, non-empty items, per-feed transport and raw RSS status; inspect extracted links as well as counts.
- **Scheduled Producer:** inspect the existing ChatGPT task's enabled state, next run and recorded result. A task marked `completed` can still contain an Orbis `failed` outcome. Compare the result run ID and timestamps with the recorded run before attributing a failure. A working GitHub connector in an interactive conversation does not prove availability in Scheduled Runtime.
- **Candidate / PR:** inspect the exact deterministic branch, its target file and all PR states for that head. A committed candidate without a PR narrows the gap to after commit / before PR completion; it does not prove which transport request failed. Preserve it until ownership and current preflight state are verified.
- **Integration:** inspect individual Preview Publish jobs. A successful public preview and gate can coexist with a failed native Auto Merge request. Re-read the PR's merged state, exact head and merge commit before diagnosing a publication failure; another actor can merge while the request is in flight.
- **Publication:** inspect the exact merged-main SHA's Site Build and Pages Promote jobs, including deployed-route smoke checks. A YAML `status: published` alone is not deployment evidence.

### Recovery after a paused or transport-blocked producer

Open the existing `Orbis AI Frontier Daily` task and its linked run conversation. Check the pause state and the actual run result; provider metadata may not expose who paused it, why, or the full historical execution trace. If unavailable, request those records from the task owner rather than infer a historical cause from GitHub alone.

Before resuming the existing task, confirm its Scheduled Runtime can read the current repository contracts and snapshot and has the required branch/file/PR transport operations. Do not infer this from an interactive run or start a second scheduler.

Once runtime capability is restored, resolve a fresh explicit Asia/Shanghai `targetDate` and repeat normal preflight. Do not automatically backfill a gap, overwrite an old candidate, or regenerate a published Daily. Any preserved orphan candidate needs explicit review under its original identity.

## Disable / pause

If the provider starts producing duplicate PRs, wrong-date branches, unexpected files, or repeated transport failures, disable the existing ChatGPT task immediately and keep the repository contracts unchanged while diagnosing the adapter.

Do not create a second competing Daily scheduler as a workaround.

## Production authority

The ChatGPT task may create/update the deterministic content branch and PR only.

It must not:

- push directly to `main`;
- merge or self-approve the PR;
- dispatch GitHub Pages production deployment;
- obtain production Pages credentials;
- write generated site artifacts.

Production remains controlled by the existing human merge and governed Pages pipeline.

## Pilot evidence

70B is not complete merely because this adapter file exists. After the adapter PR is merged and the external task is migrated/enabled, the first eligible real run must prove:

```text
explicit targetDate
-> deterministic branch
-> exact Daily file
-> one PR
-> Scheduled Daily guard
-> full Build
-> Trusted Preview
```

If the first scheduled date is already published, `already-published` is a valid safe no-op but the next eligible candidate date is still required to prove transport.
