# GitHub Pages Cutover Plan

Status: **ready for settings-level governance and Pages source cutover; production deployment has not been executed.**

The Astro + Slidev foundation is merged, the trusted PR Preview lifecycle is proven end-to-end, the current public site has a recorded rollback baseline, and the exact production workflow has passed a `deploy=false` Pages dry run from `main`.

## Validation snapshot — 2026-08-31

| Gate | Status | Evidence / decision |
| --- | --- | --- |
| Foundation | PASS | PR #2 merged the Astro + Slidev foundation to `main`. |
| Frozen dependencies | PASS | Cloud CI and Pages dry run use `pnpm install --frozen-lockfile`. |
| Multiple Brief / Presentation builds | PASS | CI creates an ephemeral second Daily, builds and validates both decks, then removes the fixture before the final artifact. |
| Daily Schema + `daily-v1` | PASS | Daily requires 4 signals, 5 sections, 3–5 actions and exactly 11 slides. |
| Future Daily archive promotion | PASS | Ephemeral `2099-12-31` proves stable dated route, archive promotion and `/latest/` advancement. |
| Same-date history collision | PASS | Historical `2026-08-28` remains authoritative; structured content stays on `/briefs/2026-08-28/` and `/slides/2026-08-28/`. |
| Cleanup PR | PASS | PR #3 merged one post-foundation cleanup commit to `main`. |
| PR Preview lifecycle | PASS | PR #3 proved read-only build → trusted `workflow_run` publish → public HTTP smoke → bot comment → PR close → preview branch deletion. |
| Preview cleanup | PASS | `preview-pr-3` was deleted and the cleanup bot commented on PR #3; the branch then returned 404 from the GitHub API. |
| Repository governance definition | PASS | Exact solo-maintainer rules are recorded in `docs/planning/repository-governance.md`; the PR Preview check now runs for every PR. |
| Repository governance activation | PENDING — admin gate | Repository currently has no rulesets and `main` is not protected. Enable the documented ruleset and `github-pages` environment restriction in Settings. |
| Current public URL | PASS | Repository homepage/public Pages URL is `https://xiaodaojiang.github.io/Orbis/`. |
| Current production content source | PASS (content parity) | Public `/`, `/latest/`, `/archive.json`, both legacy dates and favicon are byte-identical to the corresponding files under `main:/docs`. |
| Current public baseline | PASS | All legacy routes audited; old production `/rss.xml` is currently 404, so RSS becoming 200 after cutover is additive. |
| Pages dry run | PASS | `Orbis Pages Production` run `33350530793` executed on `main` with `deploy=false`; build + Pages artifact upload succeeded and deploy job was skipped. |
| Pages dry-run artifact | PASS | Artifact `9743448941` (`github-pages`), SHA-256 `2c0a0311f113766fea7f7aa2aa2f23a743a2c3f35a12dbd13cb380722f039012`. |
| Pages source → GitHub Actions | PENDING — admin gate | Must be switched in Repository Settings → Pages after governance activation. |
| Production deployment | PENDING | Run only after the settings gates above are active. |

## Recorded pre-cutover production baseline

Public base: `https://xiaodaojiang.github.io/Orbis/`

Rollback content snapshot: `main` commit `58f81ddee8bc64132529527639de0f8289e08f29`, with the legacy public content under `docs/` left untouched.

| Route | Pre-cutover status | SHA-256 / note |
| --- | ---: | --- |
| `/` | 200 | `1d4c800de6a2a5241e1841f4a2367cccfc494af25ed4488009976398595ab565` |
| `/latest/` | 200 | `fed8969d90608212417e9bca314adbb8fab1b0a1b4c20e6b4bfb0d37b7a49d5a` |
| `/archive.json` | 200 | `cdc23a9cfad2a22254a886e72cf9ade4d1d542fa0231556802b35c331a0cdb34` |
| `/2026/08/28/` | 200 | `c547e6bcd8cbca43d71d8f0bc1e6bdeed39992bcd122b5e00e0b7b6f3b4c387b` |
| `/2026/08/27/` | 200 | `3dc3175da549cfab43921109fbec865c73102de60cc0ef27cb394e1ff92bce03` |
| `/rss.xml` | 404 | Legacy production does not publish RSS. |
| `/favicon.svg` | 200 | `436a6ac88eebbd0769271b44b078046db5178a343a9f422963fa9a6468041ac3` |

The six existing legacy files above (excluding RSS, which is absent) were also compared byte-for-byte against repository `docs/` files and all hashes matched. This establishes a concrete rollback content target even though the connected integration cannot read or mutate the Pages Settings source selector itself.

## Archive and route migration model

1. Every issue already present in legacy `docs/archive.json` remains authoritative for that historical date and is copied unchanged into the built archive.
2. Its historical `/YYYY/MM/DD/` page and relative payload assets remain available.
3. A new published Daily whose `publishedAt` is not already present in the legacy archive is appended to the merged archive and receives a stable `/YYYY/MM/DD/` route that redirects to its `/slides/<id>/` presentation.
4. The merged archive is sorted newest-first; `archive.latest` and `/latest/` are generated from the newest merged issue.
5. If a structured Daily uses a date already present in legacy history, the historical entry wins. The structured Brief remains on `/briefs/<id>/` and `/slides/<id>/` without replacing the old dated URL or archive record.
6. Multiple new published Daily Briefs sharing the same non-legacy date fail the build.

## Production route contract

The deployment job now performs public smoke checks after `actions/deploy-pages` returns. A production deployment is not considered successful unless these routes are reachable:

- `/`
- `/latest/`
- `/archive.json`
- `/2026/08/28/`
- `/2026/08/27/`
- all five `/2026/08/27/payload-*.txt` historical payloads
- `/briefs/2026-08-28/`
- `/slides/2026-08-28/`
- `/rss.xml`
- `/favicon.svg`

It also validates that `archive.json` has a non-empty issue list/latest value and that RSS contains an `<rss` document.

## Production workflow safety boundary

`.github/workflows/pages-production.yml` remains manual-only.

- Every run builds from frozen dependencies and executes the full `pnpm build` verification.
- It always uploads the candidate `dist/site` Pages artifact.
- `deploy=false` skips deployment; this behavior has been proven on `main`.
- Deployment requires both `github.ref == refs/heads/main` and `deploy=true`.
- Deployment uses the `github-pages` environment and only `contents: read`, `pages: write`, `id-token: write`.
- Successful deployment is followed by the production route smoke contract above.

## Remaining cutover sequence

Only settings-level gates remain before the first production deployment:

1. **Repository Governance:** Settings → Rules → Rulesets. Enable the `main` ruleset defined in `docs/planning/repository-governance.md`.
2. **Deployment environment:** Settings → Environments → `github-pages`. Restrict deployment branches to `main` / protected branches.
3. Verify the active ruleset reports `main` protected and the required check is `Orbis PR Preview Build / build-preview`.
4. **Pages source:** Settings → Pages → Build and deployment → Source → **GitHub Actions**.
5. Run **Orbis Pages Production** from `main` with `deploy=true`.
6. Require the deploy job and its post-deploy public smoke checks to pass.
7. Compare the public route matrix with the recorded pre-cutover baseline. Historical routes must remain available; RSS is expected to improve from 404 to 200.
8. Keep `docs/` and rollback commit `58f81ddee8bc64132529527639de0f8289e08f29` unchanged through the rollback window.

## Rollback

If any critical historical route, payload, asset base, archive record or production smoke check fails:

1. Stop further Pages deployments.
2. Switch Repository Settings → Pages back to the previous branch-based source targeting the preserved `docs/` content.
3. Restore/re-publish rollback content snapshot `58f81ddee8bc64132529527639de0f8289e08f29` if needed.
4. Fix the pipeline through a PR Preview and repeat the dry-run gates before attempting another cutover.

## Explicit safety constraints

- Do not delete or rewrite legacy `docs/` during the first cutover.
- Do not overwrite historical dated issues solely because a structured Brief has the same date.
- Do not run `deploy=true` until governance, environment restriction and Pages Source are explicitly enabled.
