# Orbis

Orbis is a static publishing monorepo that combines structured content, Astro pages, Slidev presentations, RSS, stable historical routes and GitHub-hosted previews.

## Workspace

- `apps/web` — Astro static site for Essays, Briefs, Topics and Knowledge.
- `apps/slides` — Slidev layouts and presentation templates.
- `packages/content-schema` — shared Zod schemas for structured content.
- `packages/design-tokens` — shared design tokens.
- `content` — source content maintained by humans and approved content agents.
- `tools` — validation, presentation generation, assembly, migration compatibility and build checks.
- `config/site.yaml` — production site/base configuration and compatibility inputs.

## Local build

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm build
```

The assembled static site is written to `dist/site/`.

`pnpm build` validates schemas and content, exercises the multi-presentation integration gate, generates Slidev sources, builds Astro and Slidev, assembles historical compatibility routes and runs final artifact checks.

## Publishing model

Pull requests build with read-only repository permissions. A trusted workflow publishes public PR previews from the successful build artifact without exposing a write token to PR code.

Production GitHub Pages deployment is staged but manual-only. `.github/workflows/pages-production.yml` defaults to `deploy=false`; a real deployment additionally requires execution from `main`.

See `docs/planning/github-pages-cutover.md` for the production cutover and rollback gates.

## Agent contribution boundary

Scheduled content agents may only change the allowlisted content paths enforced by `AGENTS.md` and `config/path-guard.yaml`. Generated HTML, Slidev sources and build artifacts are never committed.
