# GitHub Pages Cutover Record

Status: **COMPLETE — GitHub Actions production cutover executed and validated on 2026-08-31.**

Orbis now publishes the Astro + Slidev site through the validated GitHub Actions Pages workflow. The previous branch-based `main:/docs` site remains preserved as the rollback source during the rollback window.

## Final validation snapshot — 2026-08-31

| Gate | Status | Evidence / decision |
| --- | --- | --- |
| Foundation | PASS | PR #2 merged the Astro + Slidev foundation. |
| Cleanup / Preview lifecycle | PASS | PR #3 proved read-only build → trusted publish → public HTTP smoke → bot comment → close → preview branch deletion. |
| Repository governance definition | PASS | Solo-maintainer rules are recorded in `docs/planning/repository-governance.md`. |
| Repository governance activation | PASS | Ruleset `21895300` is active for `refs/heads/main`; deletion and non-fast-forward are blocked, PRs are required, conversation resolution is required, approvals are `0`, and required status check is `build-preview`. |
| Previous production source | PASS | GitHub legacy Pages run proved the old publisher checked out `main` and uploaded `./docs`. Public legacy routes were byte-identical to repository `docs/`. |
| Rollback snapshot | PASS | Legacy content remains preserved; recorded rollback commit is `58f81ddee8bc64132529527639de0f8289e08f29`. |
| Pages dry run | PASS | `Orbis Pages Production` run `33350530793` ran with `deploy=false`; build + Pages artifact upload succeeded and deployment was skipped. |
| Pages source → GitHub Actions | PASS (operational evidence) | Production run `33353098310` successfully executed `actions/configure-pages@v5` and `actions/deploy-pages@v4`. |
| `github-pages` deployment environment | PASS (operational evidence) | The production deploy job ran successfully from protected `main`. |
| Production build | PASS | Run `33353098310`, `main@2ced91510c6a3868a43b40b1853dc5498d276d9e`; frozen install, schema/content validation, N>1 integration gate, Astro, Slidev, assembly and artifact checks all succeeded. |
| Production Pages artifact | PASS | Artifact `9744261793` (`github-pages`), 375,885 bytes, SHA-256 `dee150fbd08afe1eb70f33113b8f02e3da2370c685540f48eb0de6f0bea95c29`. |
| Production deployment | PASS | Pages deployment for `2ced91510c6a3868a43b40b1853dc5498d276d9e` reported success in run `33353098310`. |
| Post-deploy route smoke | PASS | All 14 production routes/payloads passed public HTTP checks immediately after deployment. |
| RSS migration | PASS | Pre-cutover `/rss.xml` was 404; post-cutover `/rss.xml` is reachable and contains an `<rss` document. |

Production URL: `https://xiaodaojiang.github.io/Orbis/`

## Recorded pre-cutover production baseline

Previous source: `main:/docs`

Rollback commit: `58f81ddee8bc64132529527639de0f8289e08f29`

| Route | Pre-cutover status | SHA-256 / note |
| --- | ---: | --- |
| `/` | 200 | `1d4c800de6a2a5241e1841f4a2367cccfc494af25ed4488009976398595ab565` |
| `/latest/` | 200 | `fed8969d90608212417e9bca314adbb8fab1b0a1b4c20e6b4bfb0d37b7a49d5a` |
| `/archive.json` | 200 | `cdc23a9cfad2a22254a886e72cf9ade4d1d542fa0231556802b35c331a0cdb34` |
| `/2026/08/28/` | 200 | `c547e6bcd8cbca43d71d8f0bc1e6bdeed39992bcd122b5e00e0b7b6f3b4c387b` |
| `/2026/08/27/` | 200 | `3dc3175da549cfab43921109fbec865c73102de60cc0ef27cb394e1ff92bce03` |
| `/rss.xml` | 404 | Legacy production did not publish RSS. |
| `/favicon.svg` | 200 | `436a6ac88eebbd0769271b44b078046db5178a343a9f422963fa9a6468041ac3` |

The six existing legacy files above (excluding RSS) were compared byte-for-byte against repository `docs/` files and all hashes matched.

## Successful production route contract

The production deployment job verified all of the following against `https://xiaodaojiang.github.io/Orbis/` and every check passed:

- `/`
- `/latest/`
- `/archive.json`
- `/2026/08/28/`
- `/2026/08/27/`
- `/2026/08/27/payload-1.txt`
- `/2026/08/27/payload-2a.txt`
- `/2026/08/27/payload-2b.txt`
- `/2026/08/27/payload-3.txt`
- `/2026/08/27/payload-4.txt`
- `/briefs/2026-08-28/`
- `/slides/2026-08-28/`
- `/rss.xml`
- `/favicon.svg`

The smoke contract also validated that `archive.json` contains a non-empty issue list and `latest`, and that RSS contains an `<rss` document.

## Archive and route migration model

1. Every issue already present in legacy `docs/archive.json` remains authoritative for that historical date and is copied unchanged into the built archive.
2. Historical `/YYYY/MM/DD/` pages and relative payload assets remain available.
3. A new published Daily whose `publishedAt` is not already present in legacy history is added to the merged archive and gets a stable `/YYYY/MM/DD/` route to `/slides/<id>/`.
4. `archive.latest` and `/latest/` are generated from the newest merged issue.
5. If a structured Daily collides with a historical date, history wins; the structured version remains under `/briefs/<id>/` and `/slides/<id>/`.
6. Multiple new published Daily Briefs sharing the same non-legacy date fail the build.

## Production workflow safety boundary

`.github/workflows/pages-production.yml` remains manual-only after the first cutover.

- Every run installs frozen dependencies and executes the full `pnpm build` verification.
- It always uploads the candidate `dist/site` Pages artifact.
- `deploy=false` is a safe dry run.
- Deployment requires both `github.ref == 'refs/heads/main'` and `deploy=true`.
- Deployment uses the `github-pages` environment with `contents: read`, `pages: write`, and `id-token: write`.
- Successful deployment must also pass the public route smoke contract.

## Rollback

If a future critical historical route, payload, archive record or asset path fails:

1. Stop further GitHub Actions Pages deployments.
2. Switch Repository Settings → Pages back to the preserved branch-based source `main:/docs`.
3. Restore/re-publish rollback content snapshot `58f81ddee8bc64132529527639de0f8289e08f29` if required.
4. Fix through a PR Preview and repeat the dry-run + production smoke gates before another deployment.

## Post-cutover operating constraints

- Keep legacy `docs/` unchanged during the rollback window.
- Keep the active `main` ruleset and required `build-preview` check enabled.
- Do not bypass PR Preview validation for content/build changes.
- Treat a Pages deploy as successful only when both deployment and production route smoke checks pass.
- Future publishing automation should reuse this production workflow rather than introducing a second deployment path.
