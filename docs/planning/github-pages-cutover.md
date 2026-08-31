# GitHub Pages Cutover Plan

Status: staged and validated, not executed.

The current production Pages source remains unchanged. The Astro + Slidev pipeline now has cloud build evidence, a real public PR Preview, multi-presentation integration coverage, and a compatibility bridge that preserves historical routes while allowing future structured Daily publications to advance the stable archive. Production deployment is staged in `.github/workflows/pages-production.yml`, but it is manual-only and deploys only when `deploy=true` is explicitly selected from `main`.

## Validation snapshot — 2026-08-31

| Gate | Status | Evidence / decision |
| --- | --- | --- |
| Frozen dependencies | PASS | `pnpm-lock.yaml` is committed; cloud CI uses `pnpm install --frozen-lockfile` and the lockfile passes pnpm supply-chain policy verification. |
| Multiple Brief / Presentation builds | PASS | CI creates an ephemeral second published `daily-v1` Brief, builds both decks with independent base paths, validates both, then removes the fixture before the final artifact. |
| Daily Schema + `daily-v1` | PASS | Daily requires 4 signals, 5 sections, 3–5 actions and `daily-v1`; every Daily deck is checked for exactly 11 slides. |
| Future Daily archive promotion | PASS | The N>1 gate publishes an ephemeral `2099-12-31` Daily, proves `/2099/12/31/` redirects to its Slidev deck, proves `archive.latest=2099-12-31` and `/latest/` advances, then cleans the fixture. |
| Same-date history collision | PASS | The real structured `2026-08-28` Brief collides with a historical issue date. CI proves the historical `/2026/08/28/` entry remains authoritative while the structured version stays on `/briefs/2026-08-28/` and `/slides/2026-08-28/`. |
| PR Preview build | PASS | PR #2 builds from a read-only token with Path Guard enabled. |
| Public Preview publish + HTTP smoke | PASS | The trusted publisher consumed the PR artifact, published `preview-pr-2`, then successfully fetched public `rss.xml` and `favicon.svg` before announcing the Preview. |
| Preview cleanup | PENDING | The cleanup workflow exists, but the full automatic close/delete cycle should be exercised on a disposable follow-up PR after the publisher workflow exists on `main`. |
| Path Guard + CODEOWNERS | PASS | Generated outputs are blocked from PR commits; content-agent writes are allowlisted; repository ownership rules cover the protected tree. |
| Legacy route parity | PASS (artifact) | The assembled artifact preserves `/2026/08/27/`, `/2026/08/28/` and the 2026-08-27 payload files. Legacy absolute `/ai-frontier/` asset references in copied HTML are rewritten to the runtime base. |
| Current Pages source/base recorded | PENDING | Before cutover, confirm Repository Settings → Pages and record the actual current source, public base URL, last known-good commit and rollback target. |

## Archive and route migration model

The cutover must preserve historical meaning while allowing future Daily publications to use the new structured pipeline.

1. Every issue already present in legacy `docs/archive.json` remains authoritative for that historical date and is copied unchanged into the built archive.
2. Its historical `/YYYY/MM/DD/` page and relative payload assets remain available.
3. A new published Daily whose `publishedAt` is **not** already present in the legacy archive is appended to the merged archive and receives a stable `/YYYY/MM/DD/` route that redirects to its `/slides/<id>/` presentation.
4. The merged archive is sorted newest-first; `archive.latest` and `/latest/` are generated from the newest merged issue.
5. If a structured Daily uses a date that already exists in legacy history, the historical entry wins. The structured Brief remains accessible through `/briefs/<id>/` and `/slides/<id>/`, but it does not replace the old dated URL or archive record.
6. Multiple new published Daily Briefs sharing the same non-legacy date are rejected as ambiguous.

This behavior is covered by the permanent N>1 cloud integration gate: the temporary future Daily promotes `latest`, while the current real `2026-08-28` collision preserves the historical issue. After the fixture is removed, the final artifact correctly returns to legacy `latest=2026-08-28`.

## Route decisions

| Route | Cutover behavior |
| --- | --- |
| `/` | New Astro home. |
| `/briefs/<id>/` | New structured reading route. |
| `/slides/<id>/` | New Slidev presentation route. |
| `/topics/`, `/knowledge/`, `/essays/`, `/rss.xml` | New Astro routes. |
| `/latest/` | Generated from the newest merged archive issue; advances automatically when a newer non-colliding Daily is published. |
| `/archive.json` | Generated as legacy issues + eligible new structured Daily issues, newest-first. |
| Existing `/YYYY/MM/DD/` legacy routes | Preserve historical HTML/assets exactly, except runtime base-path rewriting for absolute asset references. |
| New `/YYYY/MM/DD/` routes | Generated as stable redirects to the corresponding `/slides/<id>/` route. |
| `/2026/08/28/` specifically | Preserve the historical page. Do not redirect it to the new prototype Brief with the same date because their content is different. |

`config/site.yaml` owns runtime site paths and compatibility inputs. `tools/assemble-site` is the migration bridge: it assembles new Astro/Slidev outputs, copies archive-referenced historical issue directories, merges eligible future Daily issues into `archive.json`, creates their stable dated aliases and generates `/latest/` from the resulting archive.

## Staged production workflow

`.github/workflows/pages-production.yml` is intentionally manual-only and reads its production origin/base from `config/site.yaml`.

- Every run performs the same frozen install and `pnpm build` validation used by CI.
- It uploads `dist/site` using `actions/upload-pages-artifact`.
- The deploy job is skipped by default.
- Deployment requires both `deploy=true` and `github.ref == refs/heads/main`.
- The deploy job uses the `github-pages` environment and the minimum `pages: write` / `id-token: write` permissions.

This allows a dry-run artifact build after the workflow reaches `main`, before any Pages source switch.

## Remaining pre-cutover sequence

1. Review PR #2 and merge the foundation only after its required checks are green.
2. Once the Preview publisher is present on `main`, open a small disposable PR and verify the fully automatic chain: PR build → trusted publish → public HTTP smoke → PR comment.
3. Close that disposable PR and verify `preview-pr-*` cleanup actually deletes the branch.
4. In Repository Settings → Pages, record the current publishing source, public URL/base, custom-domain state if any, and the current last known-good production commit.
5. Add a deployment protection rule to the `github-pages` environment so only the default branch can deploy.
6. Run **Orbis Pages Production** with `deploy=false` from `main`; inspect the Pages artifact and route inventory.
7. Compare `/`, `/latest/`, `/archive.json`, both legacy dates, `/briefs/`, `/slides/`, RSS and favicon against the recorded route matrix.
8. During the cutover window, switch Repository Settings → Pages → Source to **GitHub Actions**.
9. Run **Orbis Pages Production** from `main` with `deploy=true` and validate the returned Pages URL.
10. Keep the previous Pages source and last known-good content untouched for the rollback window.

## Rollback

If any critical route, asset base path, archive entry or historical link fails:

1. Stop further Pages production deployments.
2. Restore the previously recorded Pages source/settings.
3. Re-publish the recorded last known-good production commit if necessary.
4. Fix the pipeline on a PR Preview and repeat the dry-run gates before another cutover.

## Explicit non-goals for the current PR

- Do not switch Repository Settings → Pages.
- Do not execute the `deploy=true` production job.
- Do not delete or rewrite the existing `docs/` historical source.
- Do not migrate an old dated issue onto a new Brief solely because their dates match.
