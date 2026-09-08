# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@fee254c81e899bc77c4671eda472071c390621a9`
> 阶段：Product Capability Phase
> 当前目标：**Milestone H · Evidence Integrity — Done → Post-H Product Capability Roadmap Refresh**

`docs/plan/` 保存 Orbis 稳态架构之上的产品能力 Roadmap 与实施状态。详细设计、TDD、PR、Artifact 与 Production 证据保留在对应 Plan / Design / Closeout 文档中；本 README 只维护当前入口和统一 Gate。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**Done** — PR #25 / #26 + stable cycles / drills
- Product Capability Roadmap Refresh · 2026-09-07：**Done**
- Plan 80 · Evidence Integrity：**Done**
  - 80A Evidence Contract：Done — PR #34
  - 80B Real Correction Provenance + Reading UI：Done — PR #35
  - 80C Correction Guard + Production Closeout：Done — PR #36 + Production run `34191412383`

## Milestone H final evidence

```text
final main                    fee254c81e899bc77c4671eda472071c390621a9
fresh main Site Build         34179976055 success
main Artifact                 10038587455
main Artifact SHA-256         bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
Production run                34191412383 success
Production head_sha           fee254c81e899bc77c4671eda472071c390621a9
Pages Artifact                10042373095
Pages Artifact SHA-256        e0bed6d0c91b1fe095d42a807a73f1a8967a9d127c3babdcddc534d7412b45c9
Production URL                https://xiaodaojiang.github.io/Orbis/
```

Production Build、Deploy 与 workflow 内置 public smoke 全部成功；latest structured Daily path 为 `/2026/09/07/`。

Exact deployed artifact 进一步验证：

```text
2026-09-07 claims             16
canonical references           6
corrections                    1
Reading correction notice      present
claim/ref anchors              present
claim → evidence links         present
correction → claim links       present
stable date alias              → slides/2026-09-07/
Reading canonical              /briefs/2026-09-07/
archive latest                 2026-09-07
RSS / sitemap                  healthy
slides                         11
```

完整 closeout：[`2026-09-08 · Milestone H Evidence Integrity Closeout`](./2026-09-08-milestone-h-evidence-integrity-closeout.md)。

## 当前产品基线

```text
Structured Content + Registry
          ↓
Referential Integrity
          ↓
Reading / Presentation / RSS / Discovery
          ↓
SEO / Structured Data
          ↓
Knowledge Lifecycle
          ↓
Scheduled Content Automation
          ↓
Evidence V1 Daily
          ↓
claim → evidence integrity
          ↓
reader-visible correction provenance
          ↓
append-only published correction guard
```

Authority 继续严格隔离：

```text
feature/*
    → Generic Path Guard

automation/daily/*
    → Generic Path Guard + Scheduled Daily guard

correction/daily/*
    → Generic Path Guard + Published Daily correction guard
```

Scheduled Daily 永不自动进入 correction mode；merge、Registry mutation 与 Production Pages 仍不属于 Agent authority。

## Roadmap / Plans

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
- [2026-09-07 · Product Capability Roadmap Refresh](./2026-09-07-product-capability-roadmap-refresh.md)
- [Milestone H · Evidence Integrity Design](../superpowers/specs/2026-09-07-evidence-integrity-design.md)
- [80 · Evidence Integrity](./80-evidence-integrity.md)
- [80A · Evidence Integrity Contract Implementation Plan](../superpowers/plans/2026-09-07-evidence-integrity-contract.md)
- [80B · Evidence Correction Provenance Implementation Plan](../superpowers/plans/2026-09-07-evidence-correction-provenance.md)
- [80C · Correction Guard + Production Closeout Implementation Plan](../superpowers/plans/2026-09-07-evidence-correction-guard.md)
- [2026-09-08 · Milestone H Closeout](./2026-09-08-milestone-h-evidence-integrity-closeout.md)
- [10 · Archive & Discovery Experience](./10-archive-discovery-experience.md)
- [20 · Presentation Platform](./20-presentation-platform.md)
- [30 · Weekly Brief](./30-weekly-brief.md)
- [40 · Source & Author Registry](./40-source-author-registry.md)
- [50 · SEO & Sharing](./50-seo-sharing.md)
- [60 · Knowledge Lifecycle](./60-knowledge-lifecycle.md)
- [70 · Scheduled Content Automation](./70-scheduled-content-automation.md)

## 下一步 Gate

```text
Milestone H · Done
      ↓
Post-H Product Capability Roadmap Refresh   ← current
      ↓
re-check real usage evidence / friction
      ↓
select next milestone only if evidence justifies it
      ↓
Design → Plan → isolated implementation PRs
```

不要因为编号自然递增而直接创建 Plan 90。之前 Deferred 的 Static Full-text Search、Weekly Scheduled Automation、Source / Author Directory 仍只是候选，下一轮要重新基于 Milestone H 之后的真实使用证据排序。

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准并正在实现；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 final main Build 已完成，exact-SHA Production 验证尚未完成；
- `Done`：对应计划要求的实现、main、Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
