# 90 · Merge-Gated Production Promotion

> 状态：In Progress
> Roadmap Milestone：I — Merge-Gated Production Promotion
> Design：[`2026-09-09-merge-gated-production-design.md`](../superpowers/specs/2026-09-09-merge-gated-production-design.md) · Approved
> Implementation base：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Implementation branch：`feat/merge-gated-production-promotion`

## 1. 目标

把正常发布流程从两次人工批准收敛为一次 Human merge，同时保持 Scheduled Agent、PR code 和普通 Build 无 Production authority。

```text
PR Build + Trusted Preview
        ↓
Human merge                    ← normal Production approval
        ↓
Orbis Site Build
        ↓
exact green main artifact
        ↓
trusted eligibility gate
        ↓
exact artifact promotion
        ↓
GitHub Pages + public smoke
```

## 2. Authority invariant

Milestone I 不授权：

- auto-merge；
- Scheduled Daily direct-main；
- Scheduled Daily Pages/OIDC；
- PR artifact 直接部署 Production；
- arbitrary branch deploy；
- direct push 自动发布；
- Registry mutation；
- automatic rollback。

正常 Production authority 仍来自 Human PR merge。

## 3. 90A — Promotion Contract · In Progress

实现内容：

- pure promotion eligibility policy；
- workflow contract tests；
- `.github/workflows/pages-promote.yml`；
- trusted `workflow_run` from `Orbis Site Build`；
- exact `workflow_run.id` artifact download；
- current-main SHA equality gate；
- exactly-one merged PR → main provenance gate；
- stale-main successful no-deploy；
- deploy-job-only Pages/OIDC；
- existing public smoke contract；
- manual `Orbis Pages Production` retained as break-glass。

### 90A acceptance

- [ ] RED contract observed in read-only PR Build before implementation exists；
- [ ] eligibility policy tests green；
- [ ] workflow contract tests green；
- [ ] full `pnpm build` green；
- [ ] Trusted Preview green；
- [ ] Human Review Gate reached；
- [ ] no Production deployment from implementation PR。

## 4. 90B — Real-cycle Closeout · Blocked by 90A Human merge

90A merge 后验证：

- fresh main Site Build automatically triggers `Orbis Pages Promote`；
- source run SHA == deployed Pages source SHA；
- source artifact is the exact `orbis-site` artifact from the triggering run；
- no manual `Orbis Pages Production` dispatch is needed；
- public smoke passes；
- one later real Scheduled Daily Human merge repeats the same flow；
- stale/failure cases remain no-deploy；
- then Milestone I Done。

## 5. Failure semantics

```text
failed source Build                 deny
workflow_dispatch Site Build        deny
non-main source                     deny
stale source SHA                    stale-main / successful no-deploy
no merged PR provenance             deny
ambiguous merged PR provenance      deny
artifact missing                    fail closed
Pages deployment/smoke failure      fail
```

## 6. Manual recovery

`Orbis Pages Production` remains available during the initial rollout as the explicit break-glass path. It is not the normal Daily publication path after Milestone I is proven.

## 7. Current Gate

```text
Design Approved
      ↓
90A RED contracts                 ← current
      ↓
GREEN promotion implementation
      ↓
PR Build + Trusted Preview
      ↓
Human Review
      ↓
Human merge
      ↓
90B automatic promotion proof
      ↓
real Daily no-second-click proof
      ↓
Milestone I Done
```
