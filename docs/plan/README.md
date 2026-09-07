# Orbis Product Capability Plans

> 状态：Active planning
> 当前 main：`3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> 基线日期：2026-09-07
> 阶段：Product Capability Phase
> 当前目标：Milestone H · Evidence Integrity → **Plan 80 / 80B Review Gate · PR #35**

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

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
  - 70C Real-cycle Validation：Done — stable `3/3` + rerun / published no-write / correction drill
- Product Capability Roadmap Refresh · 2026-09-07：**Done**
  - Selected：Milestone H — Evidence Integrity
  - Design：[`2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) — **Approved**
- Plan 80 · Evidence Integrity：**In Progress**
  - 80A Evidence Contract：**Done** — PR #34 merged + fresh main Build `34098464587`
  - 80B Real Correction Provenance + Reading UI：**Review Gate** — PR #35
  - 80C Correction Guard + Closeout：**Blocked by PR #35 merge + fresh main Build**

## Milestone G closeout

Plan 70 已完成完整真实链路：

```text
Repository Contract
    ↓
ChatGPT Scheduled Daily Adapter
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

真实稳定周期：PR #30 / #31 / #32；真实 correction：PR #33。

因此 **Plan 70 / Milestone G：Done**。

## Roadmap Refresh 决策

Milestone G 完成后没有按编号惯性扩功能，而是根据真实使用证据重新排序。PR #33 证明现有 Repository / Build / Preview / correction workflow 能安全工作，但旧 Daily 模型仍缺少 claim → evidence 的机器可检查关系。

选择：

```text
1. Evidence Integrity / Correction Provenance   Selected → Milestone H
2. Static Search / Full-text Retrieval          Defer
3. Weekly Scheduled Automation                  Defer
4. Source / Author Directory                    Defer
5. Registry auto-mutation / multi-provider      Reject for now
```

Milestone H 的核心不是自动判断事实真假，而是：

```text
stable factual claim
        ↓
explicit evidence edge
        ↓
canonical reference
        ↓
Source Registry

published correction
        ↓
stable claim target
        ↓
reader-visible provenance
```

**100% structural evidence coverage != 100% factual truth.**

## Plan 80 · Evidence Integrity

### 80A · Evidence Contract — Done

PR #34 已完成并进入 main：

```text
PR head                  71a1b07cfca189c4a74ae3835c467bb73df0a72c
PR Build                 34096309697 success
Preview Artifact         10008787225
Trusted Preview          passed
main                     3a7245aa907fedeb10141bbb05deb718c6fa7e7d
fresh main Site Build    34098464587 success
main Artifact            10009585595
main Artifact SHA-256    661b64ec92e251ded54a5f68be30e1f9b9752c5460e47ecb973ab55ced5a89fd
```

已落地：Evidence V1 Schema、stable fact IDs、canonical reference IDs、claim/reference validator、frozen legacy debt、human/JSON report、legacy/Evidence renderer compatibility、new Scheduled Daily Evidence V1 enforcement、11-slide regression。

### 80B · Real Correction Provenance + Reading UI — Review Gate

PR #35 以 exact `main@3a7245aa...` 为 base，对真实 2026-09-07 Daily 完成：

- 五个 sections 重新回查 primary evidence；
- 全 Daily 原子迁移为 Evidence V1；
- 16 factual claims；
- 6 canonical references；
- Evidence errors = 0；
- 2026-09-07 从 frozen legacy debt 删除；
- PR #33 correction 持久化为 `openclaw-supervisor-version`；
- Reading stable claim / reference anchors；
- per-fact evidence links；
- `已修正 · 2026-09-07` notice + correction history；
- stable date alias / canonical Reading / 11-slide presentation 合同保持。

TDD：

```text
RED    34106180726
       核心 Evidence / Schema / Astro / Slidev / site 均通过；
       新 artifact test 误把 date redirect alias 当 Reading HTML → failure

GREEN  34106452727 success
Head   8092c6bfab06a768cfaed950aa26f72b2c365576
Artifact 10012620633
SHA-256 f403fb89658edba98593667cf66b891afd0608f178a30f52eddbaed62e8043d8
Trusted Preview + public smoke passed
```

PR #35 当前：**Ready for review / mergeable=true**。不自动 merge。

### 80C · Correction Guard + Closeout — Blocked

80C 必须等待：

```text
PR #35 Human merge
        ↓
fresh main Build
        ↓
80C may start
```

计划新增 correction-specific append-only guard，保证：

- correction branch 只改 exact one published Evidence V1 Daily；
- correction history 只能 append；
- 已有 correction 不得删除/改写；
- factual mutation 必须伴随新 correction event；
- target / evidence 必须解析；
- generic Path Guard + full Build + Trusted Preview 仍 mandatory；
- Scheduled Daily 永远不自动进入 correction flow。

最终 closeout 还需要 fresh final main Build、exact-SHA Production Pages 与 public smoke。

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
          ↓
Evidence Integrity
  ├── 80A Contract · Done
  ├── 80B Real Provenance · Review Gate
  └── 80C Correction Guard · Blocked
```

## Roadmap

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
- [2026-09-07 · Product Capability Roadmap Refresh](./2026-09-07-product-capability-roadmap-refresh.md)
- [Milestone H · Evidence Integrity Design](../superpowers/specs/2026-09-07-evidence-integrity-design.md)
- [80 · Evidence Integrity](./80-evidence-integrity.md)
- [80A · Evidence Integrity Contract Plan](../superpowers/plans/2026-09-07-evidence-integrity-contract.md)
- [80B · Evidence Correction Provenance Plan](../superpowers/plans/2026-09-07-evidence-correction-provenance.md)
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
80A Evidence Contract           Done
80B Correction Provenance       Review Gate · PR #35
80C Correction Guard            Blocked by 80B
```

**当前下一动作：人工 Review / merge PR #35；合并后先验证 fresh main Build，再启动 80C。**

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
