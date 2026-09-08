# Agent contribution boundary

Automated agents are content contributors, not UI or infrastructure maintainers.

## Allowed by default

- `content/briefs/**`
- `content/presentations/**`
- `content/essays/**`
- `content/knowledge/**`

Presentation decks are generated from structured Briefs or standalone `content/presentations/**`; scheduled agents must never commit generated Slidev files.

Scheduled agents may reference existing Topic, Source and Author IDs that are already registered and active.

## Explicit published Daily corrections

A normal Scheduled Daily run must never enter correction mode automatically.

An explicit correction to an already-published Evidence V1 Daily uses branch identity:

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

and may modify exactly:

```text
content/briefs/YYYY-MM-DD.yaml
```

The candidate must remain `published` and Evidence V1. Existing correction history is append-only; existing stable section/fact/reference identities cannot be silently removed or renamed; factual mutations must be covered by newly appended correction provenance.

A frozen legacy Daily is not directly correctable through this branch contract. It must first undergo explicit human-reviewed full re-verification and Evidence V1 migration.

The enforceable correction contract is `pnpm evidence:daily:correction:guard`; full PR Build, Trusted Preview and human merge remain mandatory.

## Requires explicit human approval

- `content/topics/**`
- `content/sources/**`
- `content/authors/**`
- `config/**`

New or changed Source/Author Registry identities require explicit human review. Scheduled content tasks must not create, rename, archive or otherwise modify Registry entries.

## Forbidden for scheduled content tasks

- `apps/**`
- `packages/**`
- `tools/**`
- `.github/**`
- root package, workspace or lock files
- generated HTML, CSS, JavaScript, Astro components, Vue components or Slidev sources
- Source/Author Registry changes without explicit human review

The enforceable allowlist for automated content changes is `config/path-guard.yaml` mode `content-agent`. This document and the guard configuration must stay consistent.
