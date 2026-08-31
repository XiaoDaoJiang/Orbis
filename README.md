# Orbis

Orbis is a structured static publishing monorepo for Essays, Briefs, Topics, Knowledge and interactive presentations.

## Architecture

- `apps/web` — Astro static site for reading, navigation, RSS and content routes.
- `apps/slides` — Slidev layouts and presentation templates.
- `packages/content-schema` — shared Zod schemas and content contracts.
- `packages/design-tokens` — shared visual tokens.
- `content` — the only source of publishable editorial content.
- `tools` — validation, presentation generation, assembly and artifact checks.
- `config/site.yaml` — production site/base, presentation and preview configuration.
- `docs` — architecture, governance and historical engineering records only; it is not a publishing source or build input.

## Content pipeline

```text
content/**
  -> schema/content validation
  -> Astro pages + RSS
  -> generated Slidev sources
  -> Slidev static builds
  -> structured archive/date/latest aliases
  -> dist/site
```

Published Daily Briefs are the source of truth for `/archive.json`, `/latest/` and stable `/YYYY/MM/DD/` routes. Generated HTML, generated Slidev sources and build artifacts are never committed.

## Local build

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm build
```

The validated static site is written to `dist/site/`.

`pnpm build` validates schemas and content, exercises the multi-presentation integration gate, generates Slidev sources, builds Astro and Slidev, assembles structured routes and runs final artifact checks.

## Publishing model

Pull requests build with read-only repository permissions. A trusted workflow publishes public PR previews from the successful build artifact without exposing a write token to PR code.

Production GitHub Pages publishes the validated `dist/site` artifact through GitHub Actions. `.github/workflows/pages-production.yml` is manual-only; `deploy=false` performs a safe production build/artifact dry run and a real deployment additionally requires execution from `main`.

See `docs/planning/architecture-steady-state.md` for the current architecture boundary and `docs/planning/github-pages-cutover.md` for the completed production migration record.

## Agent contribution boundary

Scheduled content agents are content contributors. They may update only the allowlisted structured content paths enforced by `AGENTS.md` and `config/path-guard.yaml`; they do not maintain UI, workflows, generated HTML, generated Slidev sources, archive files or deployment state.
