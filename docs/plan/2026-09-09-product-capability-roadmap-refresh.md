# 2026-09-09 · Product Capability Roadmap Refresh

> Status: Done · next milestone selected
> Evidence baseline: `main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Previous milestone: H — Evidence Integrity · Done
> Selected next milestone: **I — Merge-Gated Production Promotion**

## Why refresh now

Milestone H closed the Evidence Integrity gap. The next decision is based on post-H real operating friction rather than plan-number inertia.

Two consecutive Daily cycles exposed the same publication gap:

```text
Scheduled Daily candidate
        ↓
PR Build + Trusted Preview
        ↓
Human merge
        ↓
fresh main Site Build
        ↓
manual Orbis Pages Production dispatch   ← repeated human step
        ↓
Production smoke
```

### Real evidence

#### 2026-09-08 · PR #37

- PR #37 merged to `main@0eeb0648c889c8184e8a4dc90282a9f0c51f92fd`;
- fresh main Site Build `34208091062` succeeded;
- the successful artifact already contained the 2026-09-08 Daily and advanced structured latest state;
- Production still remained on the previous SHA until a separate manual Production action was performed later.

This proved that merge + green main Build is not sufficient to publish under the current operating model.

#### 2026-09-09 · PR #38

- PR #38 merged to `main@e639758d993dfdb60791f300c78a6319f1dfe54a`;
- fresh Site Build `34298769971` succeeded;
- the operator again manually dispatched `Orbis Pages Production`;
- Production run `34299051576` succeeded on the exact same SHA;
- public smoke reported latest structured Daily `/2026/09/09/`.

This is the second consecutive cycle where the merge decision had already supplied the human approval signal, but an additional manual deployment approval was still required.

## Decision

Select **Milestone I — Merge-Gated Production Promotion**.

The product requirement is:

> Human merge becomes the single normal Production approval point. A successful exact-main Site Build may be promoted automatically only when the triggering SHA is still current main and can be proven to originate from a merged PR.

This is not Agent auto-publish. Scheduled producers still cannot merge, write main, mutate Registry identities, or hold Pages/OIDC permissions.

## Candidate comparison

| Candidate | New real evidence | User friction | Authority increase | Verifiability | Decision |
|---|---:|---:|---:|---:|---|
| Merge-Gated Production Promotion | **High · two consecutive Daily cycles** | **High / repeated** | Low if trusted promotion is isolated | **High** | **Selected → Milestone I** |
| Static Full-text Search | Low | Unknown | Low | High | Deferred |
| Weekly Scheduled Automation | Low | Low / unproven | Medium | High | Deferred |
| Source / Author Directory | Low | Low | Low | High | Deferred |
| Remaining legacy Evidence migration | Known debt, not new product friction | Low | Low | High | Maintenance backlog |
| Automatic Registry mutation | None | None | High | Medium | Reject for now |
| Multi-provider orchestration | None | None | High | Medium | Reject for now |

## Selected authority model

Normal production path:

```text
Scheduled / Human contribution
        ↓
read-only PR Build
        ↓
Trusted Preview
        ↓
Human merge                         ← only normal Production approval
        ↓
push-triggered Orbis Site Build
contents: read
        ↓
exact SHA artifact
        ↓
trusted workflow_run promotion
        ↓
prove:
  source run = push on main
  source run = success
  head SHA = current main SHA
  head SHA belongs to merged PR targeting main
        ↓
download exact source artifact
        ↓
GitHub Pages artifact
        ↓
Pages deploy
        ↓
public smoke
```

The promotion workflow, not PR code and not Scheduled Agent code, temporarily owns `pages: write` and `id-token: write`.

## Fail-closed cases

Promotion must not deploy when:

- source Site Build failed or was cancelled;
- source event is manual `workflow_dispatch` rather than a main push;
- source branch is not `main`;
- source SHA is no longer current `main` because a newer merge landed;
- source SHA cannot be associated with a merged PR targeting `main`;
- expected `orbis-site` artifact is missing;
- artifact upload / Pages deployment fails;
- public smoke fails.

A newer main Build may supersede a stale completed Build. Stale artifacts are never promoted merely because they passed earlier.

## Manual recovery boundary

The existing `Orbis Pages Production` manual workflow remains available as a break-glass / explicit recovery path during the first release. It is not the normal Daily publishing path after Milestone I.

Manual recovery must continue to build/validate before deployment and remain main-only.

## Non-goals

Milestone I does not add:

- Agent merge authority;
- Scheduled Agent Production credentials;
- direct pushes to main;
- auto-merge;
- automatic Source / Author / Topic Registry mutation;
- content correction authority changes;
- arbitrary branch deployment;
- deployment of PR Preview artifacts to Production;
- a general CI/CD orchestration platform.

## Acceptance direction

Milestone I is complete only after executable tests and real GitHub Actions evidence prove:

1. merged PR → fresh main Site Build → automatic exact-SHA Production promotion;
2. deployment source artifact is the successful Site Build artifact for that exact SHA;
3. stale successful main Build cannot deploy after main advances;
4. failed/cancelled Site Build cannot deploy;
5. manual Site Build dispatch cannot accidentally deploy;
6. non-PR/direct-push SHA fails closed;
7. Scheduled Daily still cannot merge or deploy;
8. Production public smoke passes;
9. one real Daily merge completes without a second manual Production click;
10. manual recovery workflow remains usable.

## Current gate

```text
Milestone H · Done
      ↓
Post-H evidence refresh · Done
      ↓
Milestone I selected
      ↓
Merge-Gated Production design          ← current
      ↓
human Design Review
      ↓
implementation plan / isolated PR
```

Do not create Plan 90 or implementation branches until the detailed Milestone I design is accepted.
