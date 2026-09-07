# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@3c5cc91974cea388b87b779f3e367b4c114d7a6c`
> 基线日期：2026-09-07
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · 70C Drills Gate

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**In Progress**
  - 70A Repository Contract：**Done** — PR #25
  - 70B ChatGPT Scheduled Daily Adapter：**Done** — PR #26 + transport proof #27
  - 70C Real-cycle Validation：**Drills Gate** — stable cycles `3/3`

## 70C stable-cycle evidence

Cycle 0 / transport proof：PR #27（2026-09-04）。该周期发现并修复 PR #28 / #29 两处 repository infrastructure regression，因此不计入稳定周期。

随后三个真实 Scheduled Daily 连续完成且无需 repository infrastructure repair：

```text
Stable 1/3  2026-09-05  PR #30
  branch     automation/daily/2026-09-05
  file       content/briefs/2026-09-05.yaml
  changed    exactly 1
  Build      33933722915 success
  Artifact   9959459260
  SHA-256    6b3bba0b8594dacdc93b66ec21cb33dfe61acb983850eb910b485c8da9c0c458
  Preview    trusted public smoke passed

Stable 2/3  2026-09-06  PR #31
  branch     automation/daily/2026-09-06
  file       content/briefs/2026-09-06.yaml
  changed    exactly 1
  Build      34001239220 success
  Artifact   9979564620
  SHA-256    8a1e5e2c972a13c0dfb9562a8b03846dbfb3424e1e8c4f0fb9663189ad06fcfa
  Preview    trusted public smoke passed

Stable 3/3  2026-09-07  PR #32
  branch     automation/daily/2026-09-07
  file       content/briefs/2026-09-07.yaml
  changed    exactly 1
  Build      34069576275 success
  Artifact   10000034839
  SHA-256    e641c0703ce4ae95f29b1ce2d7984cac7a73ec54fb498d72f80f82cae73a5838
  Preview    trusted public smoke passed
```

9/7 首次内容提交被既有 Registry contract 拒绝，Producer 随后在同一 deterministic branch / PR #32 中只修目标 Daily YAML 并转绿；没有基础设施修补，因此仍计 Stable Cycle 3。该行为发生在同一次 Scheduled Task run 内，不计作独立 same-day rerun drill。

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
Scheduled Content Automation · In Progress
  ├── 70A Repository Contract · Done
  ├── 70B ChatGPT Adapter · Done
  └── 70C Real-cycle Validation · Drills Gate
      ├── consecutive stable cycles 3 / 3 · Done
      ├── same-day rerun / idempotency · Pending
      ├── published no-write · Pending
      └── explicit correction · Pending
```

## 当前 integration gate

当前 Daily candidates 均为 open、content-only、mergeable：

```text
#27  2026-09-04
#30  2026-09-05
#31  2026-09-06
#32  2026-09-07
```

推荐按日期顺序进入 Human / Policy merge gate。四个 PR 最初均基于 `main@3c5cc91974cea388b87b779f3e367b4c114d7a6c` 生成，因此每次前一个 PR 合并后，下一个 PR 必须在新的 current main 上做 same-tree revalidation，再进入 merge；不得直接复用旧 base 的绿色 CI 作为 current-main 集成证明。

至少一个 Daily 进入 `main` 后，才能完成 published `already-published` no-write 与 explicit correction workflow drills。

## Roadmap

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
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
70 Scheduled Content Automation In Progress
  ├── 70A Repository Contract   Done · PR #25
  ├── 70B ChatGPT Adapter       Done · PR #26 / proof #27
  └── 70C Real-cycle Validation Drills Gate · stable 3/3
```

## 70C remaining gate

- [x] Stable Cycle 1 / 3 — PR #30
- [x] Stable Cycle 2 / 3 — PR #31
- [x] Stable Cycle 3 / 3 — PR #32
- [x] 三个连续稳定周期无需 repository infrastructure repair
- [ ] same-day rerun / idempotency drill
- [ ] published Daily `already-published` no-write drill
- [ ] explicit correction workflow drill

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
