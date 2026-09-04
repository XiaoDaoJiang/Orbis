# ChatGPT Scheduled Daily Adapter

> Provider: ChatGPT Scheduled Task
> Repository: `XiaoDaoJiang/Orbis`
> Role: thin Scheduler / Producer transport adapter

This adapter is intentionally provider-specific and intentionally small. The repository-owned contract remains the source of truth.

## Bootstrap

For every run:

1. resolve the calendar date in **Asia/Shanghai** and set explicit `targetDate=YYYY-MM-DD`;
2. using the connected GitHub transport, read the current `main` versions of:
   - `config/scheduled-task-prompt.md`;
   - `config/daily-task-prompt.md`;
   - `config/feeds.yaml`;
   - `AGENTS.md`;
   - `config/path-guard.yaml`;
3. obey those repository contracts exactly; do not rely on a copied or cached editorial prompt;
4. never read from or write to the retired `XiaoDaoJiang/ai-frontier` repository.

Repository `main` is authoritative. If this adapter conflicts with `config/scheduled-task-prompt.md`, stop and report the conflict rather than widening permissions.

## Deterministic identity

For the resolved `targetDate`, use exactly:

```text
branch      = automation/daily/<targetDate>
contentPath = content/briefs/<targetDate>.yaml
```

The YAML `publishedAt` must equal `targetDate`.

Do not infer the date from the runner or browser local timezone.

## Preflight before research or write

Use the connected GitHub transport to inspect the integration base (`main`) and the deterministic candidate identity before generating content.

Check:

- whether `main` already contains `content/briefs/<targetDate>.yaml` and its publication status;
- whether `automation/daily/<targetDate>` already exists;
- whether an open PR already uses that exact head branch;
- when a PR exists, whether it carries the Orbis automation marker `<!-- orbis-content-automation:v1 -->` or otherwise clearly belongs to this deterministic Daily candidate.

Apply repository decision semantics:

```text
main target missing + no owned open candidate -> create candidate
main target missing + owned open candidate    -> update same branch / same PR
main target published                          -> already-published; no write
main target exists but non-published           -> revision-required; stop
conflicting/unowned candidate                  -> blocked; stop
```

A normal Scheduled Daily run must never enter correction mode automatically.

## Research and candidate generation

Only after preflight says the normal candidate flow is eligible, follow `config/scheduled-task-prompt.md` and `config/daily-task-prompt.md` for discovery, primary-source verification and structured Daily generation.

The first external information reads must follow the repository feed contract. This adapter does not duplicate the editorial/source-selection rules.

## Connected GitHub transport

Use the connected GitHub transport for repository mutations.

For a new candidate:

1. create `automation/daily/<targetDate>` from the current integration-base `main` SHA;
2. create exactly `content/briefs/<targetDate>.yaml` on that branch;
3. create exactly one PR from that branch to `main`.

For an owned open candidate:

1. keep the same deterministic branch;
2. update only `content/briefs/<targetDate>.yaml` on that branch;
3. update the same PR rather than creating another PR.

Before any update, re-read the current branch/file/PR state so GitHub optimistic-concurrency SHA requirements are respected.

The candidate diff must contain exactly the target Daily source. Do not use the transport to modify config, application code, tools, workflows, generated artifacts or any second content file.

## PR metadata

Use the provider-neutral `DailyAutomationReport` semantics defined by Orbis. The PR must identify:

- `targetDate`;
- canonical branch and content path;
- outcome;
- source and primary-source counts;
- validation/full-build states that were actually run;
- explicit unverified items.

Use the stable marker:

```html
<!-- orbis-content-automation:v1 -->
```

Do not claim GitHub CI or Trusted Preview success until those systems have actually completed successfully.

## Hard authority boundary

This adapter **must not direct-write `main`**.

This adapter **must not merge** pull requests, approve its own changes, or bypass human/policy review.

This adapter **must not invoke Production Pages**, workflow dispatch for production deployment, or acquire production deployment credentials.

Do not fall back to broader permissions when GitHub operations, validation, CI or Preview fail. Fail closed and report the concrete stage.

## Completion outcomes

A run ends as one of the repository-defined outcomes, including:

```text
candidate-created
candidate-updated
already-published
blocked
failed
```

`revision-required` and correction-required situations are reported as safe stops, not silently converted into normal writes.

The external ChatGPT task's responsibility ends at the candidate PR / observable CI boundary. Production publication remains governed by Orbis after human integration.
