# GitHub Pages Cutover Record

Status: **COMPLETE — GitHub Actions production cutover executed and validated on 2026-08-31.**

Orbis now publishes the Astro + Slidev `dist/site` artifact through GitHub Actions. The former branch-based `main:/docs` publisher is historical and is not part of the steady-state architecture.

## Production cutover evidence

- Foundation: Astro + Slidev monorepo merged through PR #2.
- Preview lifecycle: read-only PR build -> trusted publish -> public smoke -> cleanup validated through PR #3.
- Repository governance: ruleset `21895300` protects `main` and requires the `build-preview` check.
- Pages dry run: run `33350530793` completed with `deploy=false`.
- Production deployment: run `33353098310` deployed `main@2ced91510c6a3868a43b40b1853dc5498d276d9e` successfully.
- Production artifact: `9744261793`, SHA-256 `dee150fbd08afe1eb70f33113b8f02e3da2370c685540f48eb0de6f0bea95c29`.
- Public RSS migrated from the previous 404 state to a generated RSS document.
- Production URL: `https://xiaodaojiang.github.io/Orbis/`.

## Historical rollback evidence

The pre-cutover `main:/docs` source was captured and verified before migration. The recorded rollback commit is:

`58f81ddee8bc64132529527639de0f8289e08f29`

That commit remains the immutable historical rollback snapshot in Git history. The current branch no longer keeps a live duplicate of the old site solely for rollback purposes.

## Post-cutover architecture

Production is now defined by:

```text
content/**
  -> validation
  -> Astro + Slidev
  -> structured archive/date/latest assembly
  -> dist/site
  -> GitHub Actions Pages
```

The active build does not read or copy old `docs/**` HTML, payload files or archive metadata. Stable Daily routes are derived from published structured Briefs.

See `docs/planning/architecture-steady-state.md` for the active architecture contract.

## Production workflow safety boundary

`.github/workflows/pages-production.yml` remains manual-only.

- Every run installs frozen dependencies and executes the full `pnpm build` verification.
- It always uploads the candidate `dist/site` Pages artifact.
- `deploy=false` is a safe dry run.
- Deployment requires both `github.ref == 'refs/heads/main'` and `deploy=true`.
- Deployment uses the `github-pages` environment with `contents: read`, `pages: write`, and `id-token: write`.
- Post-deploy smoke checks are dynamic and validate root, latest, archive, RSS, favicon and the newest structured Daily route.

## Recovery

If a future production deployment is faulty:

1. stop further deployments;
2. fix the active structured/build pipeline through a PR and Preview Gate;
3. run a production dry run with `deploy=false`;
4. redeploy from protected `main` and require the public smoke contract to pass.

The historical pre-cutover commit may be inspected or restored manually for forensic recovery, but the old branch-based Pages architecture is no longer an active fallback mechanism.
