# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@fee254c81e899bc77c4671eda472071c390621a9`
> 阶段：Product Capability Phase
> 当前目标：Milestone H · Evidence Integrity → **Plan 80 / Production Gate**

`docs/plan/` 保存 Orbis 稳态架构之上的产品能力 Roadmap 与实施状态。详细设计、TDD、PR 与 Artifact 证据保留在对应 Plan / Design / Implementation Plan；本 README 只维护当前入口和统一 Gate。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**Done** — PR #25 / #26 + stable cycles / drills
- Product Capability Roadmap Refresh · 2026-09-07：**Done**
  - Selected：Milestone H — Evidence Integrity
  - Design：**Approved**
- Plan 80 · Evidence Integrity：**Production Gate**
  - 80A Evidence Contract：**Done** — PR #34 + fresh main Build
  - 80B Real Correction Provenance + Reading UI：**Done** — PR #35 + fresh main Build
  - 80C Correction Guard：**Done in main** — PR #36 merged
  - Production closeout：**Pending explicit Production Pages dispatch + public smoke**

## Milestone H 已进入 main

当前 final implementation SHA：

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
main Artifact                10038587455
Artifact SHA-256             bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
```

已进入 main 的能力：

```text
Evidence V1 Daily
    ↓
stable fact identity
    ↓
claim → canonical evidence edges
    ↓
reader-visible claim/ref anchors
    ↓
content-level correction provenance
    ↓
append-only published correction guard
```

其中 2026-09-07 已完成真实重新核验并迁移为：

```text
sections                5
factual claims         16
canonical references    6
corrections             1
slides                  11
```

## Authority isolation

```text
feature/*
    -> Generic Path Guard

automation/daily/*
    -> Generic Path Guard + Scheduled Daily guard

correction/daily/*
    -> Generic Path Guard + Published Daily correction guard
```

Scheduled Daily 永不自动进入 correction mode。Correction workflow 也不获得 direct-main、auto-merge、Registry mutation 或 Production Pages authority。

## 当前 Gate

```text
80A / 80B / 80C implementation   Done
            ↓
PR #36 Human merge               Done
            ↓
fresh final main Build           Done
            ↓
correction guard on exact main   Verified
            ↓
Orbis Pages Production
workflow_dispatch on main
inputs.deploy=true               ← current
            ↓
public HTTP smoke
            ↓
Plan 80 / Milestone H Done
```

Production workflow 保持显式人工/受控 authority；不会因为 merge、Scheduled Daily 或 correction producer 自动触发。

## Production closeout checklist

- [x] PR #36 human merge
- [x] final `main` exact SHA confirmed
- [x] fresh main Build success
- [x] final main artifact captured
- [x] correction guard verified on exact main
- [ ] `Orbis Pages Production` dispatch on `main` with `deploy=true`
- [ ] Production run `head_sha == fee254c81e899bc77c4671eda472071c390621a9`
- [ ] `/briefs/2026-09-07/` correction/evidence UI smoke
- [ ] `/2026/09/07/` stable Slides redirect smoke
- [ ] archive/latest/RSS/sitemap public smoke
- [ ] Plan 80 / Roadmap closeout to Done

## Roadmap / Plans

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
- [2026-09-07 · Product Capability Roadmap Refresh](./2026-09-07-product-capability-roadmap-refresh.md)
- [Milestone H · Evidence Integrity Design](../superpowers/specs/2026-09-07-evidence-integrity-design.md)
- [80 · Evidence Integrity](./80-evidence-integrity.md)
- [80A · Evidence Integrity Contract Implementation Plan](../superpowers/plans/2026-09-07-evidence-integrity-contract.md)
- [80B · Evidence Correction Provenance Implementation Plan](../superpowers/plans/2026-09-07-evidence-correction-provenance.md)
- [80C · Correction Guard + Production Closeout Implementation Plan](../superpowers/plans/2026-09-07-evidence-correction-guard.md)
- [10 · Archive & Discovery Experience](./10-archive-discovery-experience.md)
- [20 · Presentation Platform](./20-presentation-platform.md)
- [30 · Weekly Brief](./30-weekly-brief.md)
- [40 · Source & Author Registry](./40-source-author-registry.md)
- [50 · SEO & Sharing](./50-seo-sharing.md)
- [60 · Knowledge Lifecycle](./60-knowledge-lifecycle.md)
- [70 · Scheduled Content Automation](./70-scheduled-content-automation.md)

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准并正在实现；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 final main Build 已完成，exact-SHA Production 验证尚未完成；
- `Done`：对应计划要求的实现、main、Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
