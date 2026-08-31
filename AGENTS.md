# Agent contribution boundary

Automated agents are content contributors, not UI or infrastructure maintainers.

## Allowed by default

- `content/briefs/**`
- `content/presentations/**`
- `content/essays/**`
- `content/knowledge/**`

Presentation decks are generated from structured Briefs or standalone `content/presentations/**`; scheduled agents must never commit generated Slidev files.

## Requires explicit human approval

- `content/topics/**`
- `config/**`

## Forbidden for scheduled content tasks

- `apps/**`
- `packages/**`
- `tools/**`
- `.github/**`
- root package, workspace or lock files
- generated HTML, CSS, JavaScript, Astro components, Vue components or Slidev sources

The enforceable allowlist for automated content changes is `config/path-guard.yaml` mode `content-agent`. This document and the guard configuration must stay consistent.
