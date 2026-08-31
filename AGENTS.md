# Agent contribution boundary

Automated agents are content contributors, not UI or infrastructure maintainers.

## Allowed by default

- `content/essays/**`
- `content/briefs/**`
- `content/presentations/**`
- `content/knowledge/**`

## Requires explicit human approval

- `content/topics/**`
- `content/sources/**`
- `config/**`

## Forbidden for scheduled content tasks

- `apps/**`
- `packages/**`
- `brand/**`
- `design/**`
- `tools/**`
- `.github/**`
- root package or lock files

Scheduled content tasks must never generate HTML, CSS, JavaScript, Astro components, Vue components, Slidev layouts or GitHub workflows.
