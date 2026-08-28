# GitHub Pages Cutover Plan

Status: planned, not executed.

The current production Pages source must remain unchanged while the Astro + Slidev pipeline is validated. PR previews are intentionally published through isolated `preview-pr-*` branches and `raw.githack.com`; they do not change the repository Pages source.

## Entry gates

Cutover is allowed only after all of the following are true:

1. `pnpm-lock.yaml` is committed and CI uses `pnpm install --frozen-lockfile`.
2. At least two Briefs can coexist and the build discovers every published presentation without date-specific scripts.
3. `daily-v1` schema/template validation passes and every generated Daily deck has exactly 11 slides.
4. PR Preview has been validated on real pull requests, including rebuild and cleanup.
5. Path Guard and CODEOWNERS are active for generated/protected paths.
6. Existing public routes, `latest`, archive links, favicon, RSS and historical content have an explicit parity/redirect decision.

## Cutover sequence

1. Record the current Pages source, production URL, last known-good commit and rollback procedure.
2. Build `dist/site` from the future production branch with the same frozen lockfile used in PR CI.
3. Add a dedicated production workflow using `actions/upload-pages-artifact` + `actions/deploy-pages`; keep it disabled or non-triggering until the final switch.
4. Validate the production artifact offline and compare route inventory against the current site.
5. In Repository Settings → Pages, switch Source to **GitHub Actions** only during the cutover window.
6. Run the production workflow from the approved commit and validate `/`, Brief routes, `/slides/<id>/`, RSS, favicon, `latest`, archive links and mobile rendering.
7. Keep the old Pages source/branch untouched for the rollback window.

## Rollback

If any critical route, asset base path or historical link fails:

1. Stop the new Pages deployment workflow.
2. Restore the previous Pages source/settings.
3. Re-publish the recorded last known-good production commit if necessary.
4. Fix the pipeline on a PR Preview before attempting another cutover.

## Deliberately deferred

- No Pages settings are changed by the planning branch.
- No production deploy workflow is enabled yet.
- No deletion or rewrite of the existing `docs/` production artifacts is part of this phase.
