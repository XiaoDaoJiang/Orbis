# 90 · Merge-Gated Production Promotion

> 状态：In Progress · Real Daily Soak Gate
> Roadmap Milestone：I — Merge-Gated Production Promotion
> Design：[`2026-09-09-merge-gated-production-design.md`](../superpowers/specs/2026-09-09-merge-gated-production-design.md) · Approved
> Implementation base：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> Implementation branch：`feat/merge-gated-production-promotion`
> PR：#39 · merged
> Current main：`72e94158a93a2b552528b4887edb846abb523a6f`

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

## 3. 90A — Promotion Contract · Done

PR #39 实现：

- pure promotion eligibility policy；
- workflow contract tests；
- trusted `.github/workflows/pages-promote.yml`；
- `workflow_run` from `Orbis Site Build` only；
- exact `workflow_run.id` + `orbis-site` artifact download；
- current-main SHA equality gate；
- exactly-one merged PR → main provenance gate；
- source `merge_commit_sha == source SHA`；
- stale-main successful no-deploy；
- packaging 后、deploy 前再次检查 current main；
- deploy-job-only Pages/OIDC；
- no checkout / no rebuild in promotion workflow；
- existing dynamic public smoke contract；
- manual `Orbis Pages Production` retained unchanged as break-glass。

### TDD evidence

```text
RED Build                   34301462494 failure · expected missing eligibility.ts
Final PR Build              34301641815 success
Final head                  e47ba81663dc56be166657390a1c90ebcda83a6c
Preview Artifact            10085185214
Preview SHA-256             35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview Publish     34301843125 success
```

Focused contracts：

```text
Merge-gated Production eligibility policy contract passed
Merge-gated Production promotion workflow contract passed
```

### 90A acceptance

- [x] RED contract observed before implementation exists；
- [x] eligibility policy tests green；
- [x] workflow contract tests green；
- [x] full `pnpm build` green；
- [x] Trusted Preview green；
- [x] Human Review Gate reached；
- [x] no Production deployment from implementation PR；
- [x] Human merge — PR #39 → `72e94158a93a2b552528b4887edb846abb523a6f`。

## 4. 90B — Real-cycle Closeout · In Progress

### Proof 1 · implementation merge → automatic Production · Done

PR #39 Human merge 后没有手工触发 `Orbis Pages Production`。

```text
PR #39 merge commit         72e94158a93a2b552528b4887edb846abb523a6f
fresh main Site Build       34305469307 success
Site artifact               10086534242
Site artifact SHA-256       b002da24bf06f2dd890ebeefaa02207adbbd37bf0897cb29f51b2311cca70e51
Pages Promote               34305651335 success
Promoted Pages artifact     10086541959
Pages artifact SHA-256      4b40b803c1630af7ced51de12f78e645f401104aadac314f6d04d37f03ce2b1f
Production source SHA       72e94158a93a2b552528b4887edb846abb523a6f
Production latest           /2026/09/09/
```

Eligibility job proved：

```text
eligible=true
reason=eligible
source_sha=72e94158a93a2b552528b4887edb846abb523a6f
source_run_id=34305469307
```

Package job downloaded **exactly**：

```text
run-id     34305469307
artifact   orbis-site / 10086534242
SHA-256    b002da24bf06f2dd890ebeefaa02207adbbd37bf0897cb29f51b2311cca70e51
```

Deploy 前第二次 current-main recheck 仍确认：

```text
current main = source SHA = 72e94158a93a2b552528b4887edb846abb523a6f
```

Pages deployment payload：

```text
artifact_id          10086541959
pages_build_version  72e94158a93a2b552528b4887edb846abb523a6f
```

Public smoke：

```text
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/09/09/
```

最新 manual `Orbis Pages Production` 仍是 PR #38 后的 run `34299051576`、SHA `e639758d993dfdb60791f300c78a6319f1dfe54a`；#39 merge 后没有新的 workflow_dispatch Production run。因此这次是有效的 **no-second-click** automatic-promotion proof。

### Proof 2 · later real Scheduled Daily merge → automatic Production · Pending

Milestone I 仍需要一个**之后的真实 `automation/daily/*` PR**：

1. Scheduled Daily candidate 通过现有 guard / Build / Trusted Preview；
2. Human merge；
3. fresh main Site Build success；
4. `Orbis Pages Promote` 自动触发；
5. exact source run/SHA/artifact 被 promotion；
6. public smoke success；
7. 全程不手工 dispatch `Orbis Pages Production`。

只有这条真实 Daily soak proof 完成后，Milestone I 才标记 Done。

## 5. Failure semantics

```text
failed source Build                 deny
workflow_dispatch Site Build        deny
non-main source                     deny
stale source SHA                    stale-main / successful no-deploy
no merged PR provenance             deny
ambiguous merged PR provenance      deny
merge SHA mismatch                  deny
artifact missing                    fail closed
Pages deployment/smoke failure      fail
```

## 6. Current Gate

```text
Design Approved                       Done
      ↓
90A RED / GREEN                       Done
      ↓
PR Build + Trusted Preview            Done
      ↓
Human merge #39                       Done
      ↓
implementation automatic promotion   Done
      ↓
real Scheduled Daily soak proof      ← current
      ↓
Milestone I Done
```
