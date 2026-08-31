# Orbis Architecture Steady State

Status: **ACTIVE**

This document defines the post-cutover Orbis architecture after retirement of the original static HTML / `main:/docs` compatibility layer.

## Source of truth

Publishable content lives only under structured `content/**` sources.

- `content/briefs/**` — Daily, Weekly and ad-hoc Briefs.
- `content/essays/**` — long-form writing.
- `content/knowledge/**` — durable knowledge notes.
- `content/topics/**` — human-reviewed topic taxonomy.

`docs/**` contains engineering documentation only. It is not copied into `dist/site`, is not used to build archive metadata and is not a GitHub Pages source.

## Build graph

```text
content/**
  -> @orbis/content-schema validation
  -> Astro content routes + RSS
  -> generated Slidev sources
  -> Slidev static presentation builds
  -> structured Daily aliases/archive/latest
  -> dist/site
  -> GitHub Pages artifact
```

The repository never commits generated HTML, generated Slidev sources or `dist/**`.

## Daily route contract

Every published Daily Brief contributes one structured archive entry.

- `/briefs/<id>/` is the Astro reading route.
- `/slides/<id>/` exists when `presentation.enabled: true`.
- `/YYYY/MM/DD/` is generated from `publishedAt` and redirects to the presentation when enabled, otherwise to the Brief.
- `/archive.json` is derived from published Daily Briefs only.
- `/latest/` redirects to the newest published Daily route.
- Duplicate published Daily dates fail the build.

There is no legacy date collision policy because there is no second historical source of truth.

## Applications and packages

- `apps/web` owns the static content website, navigation and RSS.
- `apps/slides` owns presentation layouts, styling and templates.
- `packages/content-schema` owns field and structural contracts.
- `packages/design-tokens` owns shared visual tokens.
- `tools` owns deterministic validation, generation, assembly and artifact checks.

Astro and Slidev share content and design contracts, not runtime UI implementations.

## Agent boundary

Scheduled content agents are contributors to structured content only.

They do not:

- generate or commit HTML;
- maintain `archive.json` or `/latest/` files;
- modify Astro, Vue or Slidev implementation;
- modify GitHub Actions or Pages settings;
- commit generated Slidev sources or build artifacts.

`AGENTS.md` and `config/path-guard.yaml` are the enforceable boundary.

## Publishing boundary

PR code builds with read-only repository permissions. Trusted preview publication operates on the successful artifact. Production Pages deployment publishes the validated `dist/site` artifact through GitHub Actions and remains manual-only.

A deployment is considered successful only after the dynamic public smoke contract passes for the site root, RSS, archive, latest and the newest structured Daily route.

## Retired architecture

The following are intentionally no longer supported as active architecture:

- branch-based Pages publishing from `main:/docs`;
- hand-maintained `docs/index.html` or dated HTML pages;
- `docs/archive.json` as runtime metadata;
- copying historical HTML/payloads into the assembled site;
- rewriting `/ai-frontier` asset base paths;
- legacy-vs-structured date collision handling;
- scheduled agents publishing single-file HTML directly.

Historical migration evidence remains available in Git history and planning records, including the recorded rollback commit from the production cutover.
