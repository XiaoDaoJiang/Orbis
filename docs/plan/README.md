# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> 阶段：Product Capability Phase
> 当前目标：**Milestone I · Merge-Gated Production Promotion → Plan 90A Review Gate**

`docs/plan/` 保存 Orbis 稳态架构之上的产品能力 Roadmap 与实施状态。详细 Design、TDD、PR、Artifact 与 Production 证据保留在对应文档中；本 README 只维护当前入口与统一 Gate。

## 已完成能力阶段

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**Done** — PR #25 / #26 + stable cycles / drills
- Plan 80 · Evidence Integrity：**Done** — PR #34 / #35 / #36 + exact-SHA Production closeout

Milestone H closeout：[`2026-09-08 · Milestone H Evidence Integrity Closeout`](./2026-09-08-milestone-h-evidence-integrity-closeout.md)。

## Post-H real usage evidence

Two consecutive Daily cycles proved that the second manual Production click is repeated operational friction rather than a distinct review decision.

```text
2026-09-08 · PR #37
Human merge                 Done
main                        0eeb0648c889c8184e8a4dc90282a9f0c51f92fd
fresh Site Build            34208091062 success
manual Production           separately required

2026-09-09 · PR #38
Human merge                 Done
main                        e639758d993dfdb60791f300c78a6319f1dfe54a
fresh Site Build            34298769971 success
manual Production           34299051576 success
Production latest           /2026/09/09/
```

## Milestone I · Merge-Gated Production Promotion

Post-H Roadmap Refresh：**Done / Selected**  
Design：**Approved**  
Plan 90：**Review Gate**  
90A PR：**#39**  
Final 90A head：`e47ba81663dc56be166657390a1c90ebcda83a6c`

Decision record：[`2026-09-09 · Product Capability Roadmap Refresh`](./2026-09-09-product-capability-roadmap-refresh.md)  
Approved design：[`Milestone I · Merge-Gated Production Promotion`](../superpowers/specs/2026-09-09-merge-gated-production-design.md)  
Plan：[`90 · Merge-Gated Production Promotion`](./90-merge-gated-production-promotion.md)  
Implementation：[`Plan 90A implementation`](../superpowers/plans/2026-09-09-merge-gated-production-promotion.md)

### 90A validation

```text
RED PR Build                 34301462494 failure · expected missing eligibility capability
Final PR Build               34301641815 success
Preview Artifact             10085185214
Preview Artifact SHA-256     35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview Publish      34301843125 success
Preview                      https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-39/index.html
```

Exactly five implementation paths are changed; no content, Registry, Astro/Slidev, existing manual Production workflow, or Scheduled authority changes exist.

Target normal flow:

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
        ↓
exact main artifact
        ↓
trusted workflow_run eligibility
  source run success
  event = push
  branch = main
  source SHA = current main
  exactly one associated merged PR → main
  merge_commit_sha = source SHA
        ↓
exact artifact promotion
        ↓
pre-deploy current-main recheck
        ↓
GitHub Pages deploy
        ↓
public smoke
```

## Authority boundary

Milestone I does **not** grant Scheduled Agents Production authority.

```text
feature/*
    → Generic Path Guard

automation/daily/*
    → Generic Path Guard + Scheduled Daily guard

correction/daily/*
    → Generic Path Guard + Published Daily correction guard
```

Scheduled Daily remains PR-only. It cannot merge, write main, mutate Registry identities, or access Pages/OIDC credentials.

The Production trust boundary becomes:

```text
Human merge
  ∧ fresh successful exact-main Build
  ∧ exactly-one merged-PR provenance
  ∧ SHA still current main
      ↓
trusted Production promotion
```

Manual `Orbis Pages Production` remains the initial break-glass / recovery path.

## Current Gate

```text
Milestone H · Done
      ↓
Post-H Roadmap Refresh · Done
      ↓
Milestone I selected
      ↓
Design Approved
      ↓
90A RED / GREEN                    Done
      ↓
PR Build + Trusted Preview         Done
      ↓
Human Review                       ← current
      ↓
Human merge
      ↓
90B automatic exact-SHA promotion proof
      ↓
real Daily no-second-click proof
      ↓
Milestone I Done
```

**PR #39 合并后的第一条证明中不要手动触发 `Orbis Pages Production`。** 需要让新 `Orbis Pages Promote` 自己消费 fresh main Site Build artifact，才能证明第二次人工点击真正被移除。

## Deferred candidates

These remain candidates, not authorized work:

- Static Full-text Search；
- Weekly Scheduled Automation；
- Source / Author Directory；
- remaining legacy Evidence migration as maintenance debt。

Automatic Registry mutation and multi-provider orchestration remain rejected for now.

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准并正在实现；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 final main Build 已完成，exact-SHA Production 验证尚未完成；
- `Done`：对应计划要求的实现、main、Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
