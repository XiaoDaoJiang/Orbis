# Repository Governance

Status: repository rules are defined here; settings-level enforcement is pending GitHub administration changes.

## Current observed state — 2026-08-31

- Default branch: `main`.
- Repository rulesets: none.
- `main` branch protection: disabled.
- CODEOWNERS is committed and covers application, configuration, tooling, workflow and content paths.
- `Orbis PR Preview Build / build-preview` now runs for every pull request, so it is safe to make this check required without path-filter deadlocks.
- The repository is currently maintained by a single owner. A required self-approval or required CODEOWNER approval would deadlock owner-authored pull requests, so approval count remains zero until another maintainer is added.

## Required `main` ruleset

Create one active branch ruleset targeting the default branch with these rules:

1. Require a pull request before merging.
2. Required approvals: `0` while Orbis has one maintainer.
3. Require all review conversations to be resolved before merge.
4. Require status check: `Orbis PR Preview Build / build-preview`.
5. Block force pushes.
6. Block branch deletion.
7. Prefer linear history and squash/rebase merges for small operational changes.
8. Do not bypass the ruleset for scheduled content agents.

When a second maintainer is active, raise required approvals to `1` and consider requiring CODEOWNER review for `.github/**`, `config/**`, `apps/**`, `packages/**`, `tools/**` and lockfiles.

## GitHub Pages environment

The production workflow already enforces `github.ref == refs/heads/main` before its deploy job can run and uses the `github-pages` environment. As defense in depth, configure that environment so deployments are limited to `main` (or to protected branches after the ruleset is enabled).

The production workflow must retain minimum deployment permissions only:

- `contents: read`
- `pages: write`
- `id-token: write`

## Content-agent boundary

`AGENTS.md` and `config/path-guard.yaml` are the executable contribution boundary:

- default automated content writes: Briefs, Essays and Knowledge;
- Topics require human review;
- generated Slidev sources and static outputs are never committed;
- scheduled content agents may not modify application, infrastructure, tooling or workflow files.

## Settings activation gate

The connected repository integration can inspect rulesets and branch protection but does not expose administration mutations for these settings. Therefore activation is an explicit repository-admin gate:

- Settings → Rules → Rulesets → create/enable the `main` ruleset above.
- Settings → Environments → `github-pages` → restrict deployment branches to `main` / protected branches.

After activation, verify the API reports `main` as protected or shows the active ruleset before the production Pages source is switched.
