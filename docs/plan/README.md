# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@e639758d993dfdb60791f300c78a6319f1dfe54a`
> 阶段：Product Capability Phase
> 当前目标：**Milestone I · Merge-Gated Production Promotion — Design Review**

`docs/plan/` 保存 Orbis 稳态架构之上的产品能力 Roadmap 与实施状态。详细设计、TDD、PR、Artifact 与 Production 证据保留在对应 Plan / Design / Closeout 文档中；本 README 只维护当前入口和统一 Gate。

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

Two consecutive Daily cycles exposed repeated Production friction after human merge.

### 2026-09-08 · PR #37

```text
Human merge                 Done
main                        0eeb0648c889c8184e8a4dc90282a9f0c51f92fd
fresh Site Build            34208091062 success
Production                  still required separate manual action
```

### 2026-09-09 · PR #38

```text
Human merge                 Done
main                        e639758d993dfdb60791f300c78a6319f1dfe54a
fresh Site Build            34298769971 success
manual Production run       34299051576 success
Production latest           /2026/09/09/
```

The second manual Production approval no longer adds meaningful review information after a human has already merged a fully validated PR and the exact main SHA has passed a fresh Site Build.

## Milestone I selection

Post-H Roadmap Refresh selected:

**Milestone I — Merge-Gated Production Promotion**

Decision record：[`2026-09-09 · Product Capability Roadmap Refresh`](./2026-09-09-product-capability-roadmap-refresh.md)。

Design under review：[`Milestone I · Merge-Gated Production Promotion Design`](../superpowers/specs/2026-09-09-merge-gated-production-design.md)。

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
  source SHA proven from merged PR
        ↓
exact artifact promotion
        ↓
GitHub Pages deploy
        ↓
public smoke
```

## Authority boundary

Milestone I does **not** give Scheduled Agents Production authority.

```text
feature/*
    → Generic Path Guard

automation/daily/*
    → Generic Path Guard + Scheduled Daily guard

correction/daily/*
    → Generic Path Guard + Published Daily correction guard
```

Scheduled Daily remains PR-only. It cannot merge, write main, mutate Registry identities, or access Pages/OIDC credentials.

The new trust boundary is:

```text
Human merge
  ∧ fresh successful exact-main Build
  ∧ merged-PR provenance
  ∧ SHA still current main
      ↓
trusted Production promotion
```

The existing manual `Orbis Pages Production` workflow remains the initial break-glass / recovery path.

## Current Gate

```text
Milestone H · Done
      ↓
Post-H Product Capability Roadmap Refresh · Done
      ↓
Milestone I selected
      ↓
Merge-Gated Production Design Review        ← current
      ↓
Design approval
      ↓
implementation plan
      ↓
isolated implementation PR
      ↓
real merge → automatic exact-SHA promotion proof
      ↓
real Daily no-second-click proof
```

Do not create Plan 90 or an implementation branch before the detailed Milestone I design is accepted.

## Deferred candidates

These remain candidates, not authorized work:

- Static Full-text Search;
- Weekly Scheduled Automation;
- Source / Author Directory;
- remaining legacy Evidence migration as maintenance debt.

Automatic Registry mutation and multi-provider orchestration remain rejected for now because they add authority/complexity without stronger current evidence.

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准并正在实现；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 final main Build 已完成，exact-SHA Production 验证尚未完成；
- `Done`：对应计划要求的实现、main、Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
