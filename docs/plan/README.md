# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> 基线日期：2026-09-07
> 阶段：Product Capability Phase
> 当前目标：Milestone H · Evidence Integrity → **Plan 80 / 80A Evidence Contract · Planned**

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**Done**
  - 70A Repository Contract：**Done** — PR #25
  - 70B ChatGPT Scheduled Daily Adapter：**Done** — PR #26 + transport proof #27
  - 70C Real-cycle Validation：**Done** — stable cycles `3/3` + all behavior drills
- Product Capability Roadmap Refresh · 2026-09-07：**Done**
  - 选择：**Milestone H — Evidence Integrity**
  - Design：[`2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) — **Approved**
- Plan 80 · Evidence Integrity：**Planned**
  - 80A Evidence Contract：**Planned / next**
  - 80B Real Correction Provenance + Reading UI：**Blocked by 80A**
  - 80C Correction Guard + Closeout：**Blocked by 80B**

## Milestone G closeout

Plan 70 完成以下真实链路：

```text
Repository Contract
    ↓
ChatGPT Scheduled Daily Adapter
    ↓
Cycle 0 transport proof
    ↓
3 consecutive stable cycles
    ↓
same-day rerun / idempotency
    ↓
already-published / zero write
    ↓
explicit published correction
    ↓
Human merge
    ↓
fresh corrected main Build
```

### Stable cycles

```text
Stable 1/3  2026-09-05  PR #30
Stable 2/3  2026-09-06  PR #31
Stable 3/3  2026-09-07  PR #32
```

三个真实稳定周期均保持 exact one-Daily boundary，并在前一日期 PR 合并后通过 same-tree current-main revalidation；没有 repository infrastructure repair。

### Same-day rerun / idempotency · Passed

2026-09-07 在 PR #32 尚为 owned candidate 时，独立 `Run now` 收敛到同一：

```text
branch       automation/daily/2026-09-07
PR           #32
outcome      candidate-updated
new branch   0
new PR       0
```

验证：PR Preview Build `34076897189` success，Trusted Preview public smoke passed。

### Published no-write · Passed

PR #32 合并后再次执行相同 Scheduled Task：

```text
targetDate   2026-09-07
outcome      already-published
main write   0
branch write 0
new branch   0
new PR       0
merge        0
Production   0
```

独立 GitHub 前后状态保持：

```text
main         6411076d1769b96f6e26b6fd5c6c005c78aad9e8
9/7 branch   b092233168dabb947734fe0d078a44744f277257
open 9/7 PR  none
```

### Explicit correction · Passed

针对 2026-09-07 已发布 Brief 的真实 OpenClaw supervisor 版本归因问题，使用独立 correction flow：

```text
branch       correction/daily/2026-09-07/openclaw-supervisor-version
PR           #33
head         a73ef682ac4e3f7dacefe68dc0bd7706ec5296d7
changed      exactly 1 file
PR Build     34088014693 success
Artifact     10005904775
SHA-256      de54c7a5374e7806395f077b6fd26c0621b17da04da27446c6acc9931619ef2a
Preview      34088175467 success
```

Correction branch 只通过 generic Path Guard；Scheduled Daily exact guard 被明确 skipped，证明 correction 没有冒充普通 Scheduled Daily authority。

Human 合并 #33 后：

```text
main                      b3e793d0c5c7d55358933d4d25c4d77dafd8cd03
fresh Site Build          34090549723 success
main Artifact             10006713925
Artifact SHA-256          8c56125aea23914874a908550d98675f9d8218c820a7545ead9d2d13929b10af
```

因此 **Plan 70 Done / Milestone G Done**。

## Roadmap Refresh · 2026-09-07

Milestone G 完成后，没有按编号惯性创建 `Plan 80`，而是先基于完整稳态与真实使用证据刷新 Product Capability Roadmap。

最强真实证据来自 PR #33：Repository / Build / Preview / correction workflow 都按设计工作，但已发布 Daily 仍出现 factual attribution error。现有 Schema 能验证 Reference / Source 的存在与关系，却不能机器验证“哪条 factual claim 由哪条 reference 支撑”，correction 也主要只存在于 Git / PR 历史。

因此重新排序后选择：

```text
1. Evidence Integrity / Correction Provenance   Selected → Milestone H
2. Static Search / Full-text Retrieval          Defer · 缺少真实失败证据
3. Weekly Scheduled Automation                  Defer · 缺少重复人工负担证据
4. Source / Author Directory                    Defer
5. Registry auto-mutation / multi-provider      Reject for now
```

Milestone H Design 已于 2026-09-07 获人工批准：

- Daily-first `evidenceVersion: 1`；
- top-level canonical references；
- section-local stable fact identity；
- explicit fact → reference IDs；
- correction events + derived `lastCorrectedAt`；
- frozen legacy allowlist，禁止机械伪造历史 coverage；
- `2026-09-07.yaml` 作为第一份真实迁移 / correction fixture；
- new Scheduled Daily 必须 Evidence V1；
- correction-specific append-only guard；
- Reading 显示 evidence / correction，11 页 Slide contract 保持不变。

这不是 LLM 自动事实判定，也不引入 citation database、服务端 Runtime、自动 Registry mutation、auto-merge 或 Production authority。

## Milestone H · Plan 80

```text
80A Evidence Contract
    ↓
Evidence V1 Schema + frozen legacy boundary
    ↓
claim/reference integrity + report
    ↓
legacy/Evidence V1 renderer compatibility
    ↓
new Scheduled Daily Evidence V1 enforcement
    ↓
PR Build / Trusted Preview / Human Review

80B Real Correction Provenance + Reading UI
    ↓
2026-09-07 full re-verification / migration
    ↓
PR #33 correction provenance
    ↓
reader-visible evidence / correction

80C Correction Guard + Closeout
    ↓
append-only correction workflow contract
    ↓
main / Production / smoke
    ↓
Milestone H Done
```

当前只授权执行 **80A**。80B 必须等待 80A merge + fresh main Build；80C 必须等待 80B。

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
Knowledge Lifecycle · Done
          ↓
Scheduled Content Automation · Done
  ├── repository-owned contract
  ├── replaceable Scheduler / Producer
  ├── deterministic Daily identity
  ├── idempotent same-candidate convergence
  ├── published no-write protection
  ├── explicit correction boundary
  └── mandatory Build / Trusted Preview / Human Review
          ↓
Milestone H · Evidence Integrity
          ↓
80A Evidence Contract · Planned
```

## Roadmap

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
- [2026-09-07 · Product Capability Roadmap Refresh](./2026-09-07-product-capability-roadmap-refresh.md)
- [Milestone H · Evidence Integrity Design](../superpowers/specs/2026-09-07-evidence-integrity-design.md)
- [80 · Evidence Integrity](./80-evidence-integrity.md)
- [80A · Evidence Integrity Contract Implementation Plan](../superpowers/plans/2026-09-07-evidence-integrity-contract.md)
- [10 · Archive & Discovery Experience](./10-archive-discovery-experience.md)
- [20 · Presentation Platform](./20-presentation-platform.md)
- [30 · Weekly Brief](./30-weekly-brief.md)
- [40 · Source & Author Registry](./40-source-author-registry.md)
- [50 · SEO & Sharing](./50-seo-sharing.md)
- [60 · Knowledge Lifecycle](./60-knowledge-lifecycle.md)
- [70 · Scheduled Content Automation](./70-scheduled-content-automation.md)

## 推荐实施顺序

```text
10 Archive & Discovery           Done
20 Presentation Platform        Done
30 Weekly Brief                 Done
40 Source & Author Registry     Done
50 SEO & Sharing                Done
60 Knowledge Lifecycle          Done
70 Scheduled Content Automation Done
-- Roadmap Refresh              Done
H  Evidence Integrity           Approved
80A Evidence Contract           Planned / Next
80B Correction Provenance       Blocked by 80A
80C Correction Guard            Blocked by 80B
```

下一步是从执行时的 current `main` 创建 `feat/evidence-integrity-contract`，按 80A 计划先写 RED contract tests；不在 planning branch 上直接实现代码，也不先迁移生产内容。

## 每个计划的统一交付规则

1. 独立分支与 PR；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非出现新的真实需求；
4. 新内容模型与新关系必须有可执行合同；
5. 新公开输出必须进入 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 与 Trusted Preview；
7. 不提交 generated Slidev source 或 `dist/**`；
8. Production Pages 继续通过显式 deployment gate；
9. 完成后同步 Roadmap 状态。

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