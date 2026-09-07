# Orbis Product Capability Plans

> 状态：Active planning
> 当前实现基线：`main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> 基线日期：2026-09-07
> 阶段：Product Capability Phase
> 当前目标：Milestone H · Evidence Integrity → **Plan 80 / 80C Review Gate · PR #36**

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与实施状态。详细历史证据、设计推导和每个 Slice 的验证记录保留在对应 Plan / Design / Implementation Plan 中；本 README 只维护当前入口与统一 Gate，避免复制易过期的流水账。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**Done**
  - 70A Repository Contract：Done — PR #25
  - 70B ChatGPT Scheduled Daily Adapter：Done — PR #26 + transport proof #27
  - 70C Real-cycle Validation：Done — stable `3/3` + rerun / published no-write / explicit correction drill
- Product Capability Roadmap Refresh · 2026-09-07：**Done**
  - Selected：Milestone H — Evidence Integrity
  - Design：[`2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) — **Approved**
- Plan 80 · Evidence Integrity：**In Progress**
  - 80A Evidence Contract：**Done** — PR #34 merged + fresh main Build `34098464587`
  - 80B Real Correction Provenance + Reading UI：**Done** — PR #35 merged + fresh main Build `34108101313`
  - 80C Correction Guard + Production Closeout：**Review Gate** — PR #36

## Milestone H 当前闭环

```text
80A Evidence Contract
    Done
    ↓
Evidence V1 Daily Schema
claim → evidence relation
frozen legacy boundary
Scheduled Daily Evidence V1 enforcement
    ↓
80B Real Correction Provenance + Reading UI
    Done
    ↓
2026-09-07 full re-verification
16 stable factual claims
6 canonical references
PR #33 correction provenance
reader-visible correction / claim / reference anchors
11-slide contract preserved
    ↓
80C Correction Guard + Production Closeout
    Review Gate · PR #36
```

80C 当前已完成 implementation-side contract：

```text
correction/daily/YYYY-MM-DD/<slug>
        ↓
exact one published Evidence V1 Daily
        ↓
append-only immutable correction history
        ↓
factual mutation must have new correction target
        ↓
reference mutation must have explicit provenance
        ↓
shared Evidence Integrity validation
        ↓
Generic Path Guard + full Build + Trusted Preview
```

最终 80C PR 证据：

```text
PR                           #36
Base                         main@ebd38ef890ba3f3d40d03b754085cbd73a44a080
Head                         d8adc2e1d2468c63b8064ee45460b18851ea9742
Read-only PR Build           34109064068 success
Preview Artifact             10013666375
Artifact SHA-256             f52672691bcd7c6c2670789cfa92d2682b2aa5129a875c4da648c39a342d8347
Trusted Preview              passed
Public availability smoke    passed
PR state                     Ready for review
```

## 当前 Gate

```text
80C implementation Build + Preview   Done
                ↓
Human Review / merge PR #36          ← current
                ↓
fresh main Site Build
                ↓
verify correction guard on exact main SHA
                ↓
explicit exact-SHA Production Pages
                ↓
public HTTP smoke
                ↓
Plan 80 / Milestone H Done
```

Production closeout 不能在 PR #36 人工合并前开始，也不能由 Scheduled Daily 或 correction producer 自动触发。

## Evidence Integrity 的边界

Milestone H 验证的是 evidence relation 的结构、完整性与 correction provenance，不宣称机器自动证明事实真实性。

明确不做：

- LLM automatic fact judge；
- source truth score；
- citation graph / vector database；
- automatic historical rewrite；
- automatic Source / Author / Topic Registry mutation；
- Scheduled Agent auto-merge；
- automatic Production Pages deployment；
- global Evidence rewrite for all content kinds。

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

## Implementation branch policy

Planning branch 只保存 roadmap / design / implementation plan，不承载产品实现。

每个 Slice 必须从执行时的 current `main` 创建独立 feature branch，独立 PR 到 `main`；前一个 Slice merge 并 fresh main Build 后才允许启动后一个 Slice。

Plan 80 branches：

```text
feat/evidence-integrity-contract       # 80A · Done
feat/evidence-correction-provenance    # 80B · Done
feat/evidence-correction-guard         # 80C · Review Gate
```

Published Daily 的未来显式修正使用：

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

它与 `automation/daily/YYYY-MM-DD` Scheduled authority 严格隔离。

## 每个计划的统一交付规则

1. 独立分支与 PR；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非出现新的真实需求；
4. 新内容模型与新关系必须有可执行合同；
5. 新公开输出必须进入 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 与 Trusted Preview；
7. 不提交 generated Slidev source 或 `dist/**`；
8. Production Pages 继续通过显式 exact-SHA deployment gate；
9. Human merge 后必须 fresh main Build；
10. 完成后同步 Roadmap / Plan 状态。

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准，已有实施或验证进行中；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Live Gate`：实现已进入 main、外部 adapter 已启用，等待真实运行证据；
- `Soak Active`：正在累计连续真实运行证据；
- `Drills Gate`：稳定周期已满足，只剩显式行为演练 / integration closeout；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：对应计划要求的 Preview / main / Production / real-run / drills 验证全部完成；
- `Deferred`：明确推迟。
