# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@72e94158a93a2b552528b4887edb846abb523a6f`
> 阶段：Product Capability Phase
> 当前目标：**Milestone I · Merge-Gated Production Promotion → Real Daily Soak Gate**

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

## Milestone I · Merge-Gated Production Promotion

Post-H Roadmap Refresh：**Done / Selected**  
Design：**Approved**  
Plan 90：**In Progress · Real Daily Soak Gate**  
90A PR：**#39 · merged**

Decision record：[`2026-09-09 · Product Capability Roadmap Refresh`](./2026-09-09-product-capability-roadmap-refresh.md)  
Approved design：[`Milestone I · Merge-Gated Production Promotion`](../superpowers/specs/2026-09-09-merge-gated-production-design.md)  
Plan：[`90 · Merge-Gated Production Promotion`](./90-merge-gated-production-promotion.md)  
Implementation：[`Plan 90A implementation`](../superpowers/plans/2026-09-09-merge-gated-production-promotion.md)

### Why this exists

Two consecutive Daily cycles proved that the second manual Production click was repeated operational friction rather than a distinct review decision：

```text
2026-09-08 · PR #37
Human merge                 Done
fresh Site Build            34208091062 success
manual Production           separately required

2026-09-09 · PR #38
Human merge                 Done
fresh Site Build            34298769971 success
manual Production           34299051576 success
```

Milestone I changes the normal trust boundary to：

```text
Human merge
  ∧ fresh successful exact-main Build
  ∧ exactly-one merged-PR provenance
  ∧ SHA still current main
      ↓
trusted Production promotion
```

Scheduled Daily remains PR-only and still cannot merge, write `main`, or access Pages/OIDC authority。

## 90A validation · Done

```text
RED PR Build                 34301462494 failure · expected missing eligibility capability
Final PR Build               34301641815 success
Final implementation head    e47ba81663dc56be166657390a1c90ebcda83a6c
Preview Artifact             10085185214
Preview Artifact SHA-256     35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview Publish      34301843125 success
PR #39 merge commit          72e94158a93a2b552528b4887edb846abb523a6f
```

## 90B proof 1 · implementation merge → automatic Production · Done

PR #39 merge 后没有手工触发 `Orbis Pages Production`。

```text
current main                 72e94158a93a2b552528b4887edb846abb523a6f
fresh Site Build             34305469307 success
Site artifact                10086534242
Site SHA-256                 b002da24bf06f2dd890ebeefaa02207adbbd37bf0897cb29f51b2311cca70e51
Orbis Pages Promote          34305651335 success
Pages artifact               10086541959
Pages SHA-256                4b40b803c1630af7ced51de12f78e645f401104aadac314f6d04d37f03ce2b1f
Production source SHA        72e94158a93a2b552528b4887edb846abb523a6f
Production latest            /2026/09/09/
```

Automatic promotion proved：

- eligibility = `true / eligible`；
- source run id = `34305469307`；
- exact `orbis-site` artifact `10086534242` was downloaded and digest verified；
- current `main` was checked again immediately before deploy；
- Pages `pages_build_version` = exact source SHA；
- public smoke passed `/`、`/latest/`、`/archive.json`、`/rss.xml`、`/favicon.svg`、`/2026/09/09/`。

The latest manual `Orbis Pages Production` run is still `34299051576@e639758d...`, which predates PR #39 merge. Therefore the first no-second-click Production proof is valid。

## Current Gate

```text
Milestone H · Done
      ↓
Post-H Roadmap Refresh · Done
      ↓
Milestone I Design Approved
      ↓
90A implementation + PR #39              Done
      ↓
first automatic exact-SHA Production     Done
      ↓
real Scheduled Daily no-second-click     ← current
      ↓
Milestone I Done
```

The next qualifying real `automation/daily/*` PR should be merged normally after Human Review, but **do not manually dispatch `Orbis Pages Production`**. The next acceptance proof is that its fresh main Site Build automatically promotes the exact artifact and completes public smoke。

## Deferred candidates

These remain candidates, not authorized work：

- Static Full-text Search；
- Weekly Scheduled Automation；
- Source / Author Directory；
- remaining legacy Evidence migration as maintenance debt。

Automatic Registry mutation and multi-provider orchestration remain rejected for now。

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准并正在实现 / soak；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 final main Build 已完成，exact-SHA Production 验证尚未完成；
- `Done`：对应计划要求的实现、main、Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
