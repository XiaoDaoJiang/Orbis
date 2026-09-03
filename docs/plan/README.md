# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> 基线日期：2026-09-03
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · Design Review

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
  - 60A Knowledge Lifecycle Contract：**Done** — PR #23
  - 60B Knowledge Lifecycle UI：**Done** — PR #24
  - main：`89c7f8fe6d5da972c0f54b1367df252aa00cf286`
  - Site Build：`33720559711` Passed
  - Production Pages：`33734815132` Passed
  - Production Artifact：`9885335098`
  - Artifact SHA-256：`7caba4bb2d7a82f02c084af036f219cb2d8484ad6ccbfd4724a7c29d5e168e55`
- Plan 70 · Scheduled Content Automation：**Design Review · Current**
  - repository contract / guard audit：Done
  - design draft：`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
  - 70A implementation plan：`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`
  - implementation：waiting for design approval

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
Knowledge Lifecycle Contract
          ↓
Knowledge Lifecycle UI
  ├── Current / Attention / Historical
  ├── review health + editorial status
  ├── stable needs-review / archived URLs
  └── replacement / supersedes navigation
          ↓
Scheduled Content Automation · Design Review
  ├── exact-date / exact-path Daily guard
  ├── idempotent automation branch / PR
  ├── published-main overwrite protection
  └── replaceable Scheduler / Producer
```

PR #24 已合并到 `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`。fresh Site Build `33720559711` 成功；随后 governed Production Pages run `33734815132` 对 exact main SHA 完成 Build → Deploy → public Smoke。Pages deployment 明确使用 `pages_build_version=89c7f8fe6d5da972c0f54b1367df252aa00cf286`，Production Artifact `9885335098`，并通过 `/`、`/latest/`、`/archive.json`、`/rss.xml`、`/favicon.svg`、`/2026/08/28/` 公网检查。

因此 Plan 60 / Milestone F — Durable Knowledge 正式 Done。当前产品目标切换到 Plan 70；Plan 70 已完成 Design Review 草案与 70A 实施计划，但在设计确认之前不启动实现分支。

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
10 Archive & Discovery          Done
        ↓
20 Presentation Platform       Done
        ↓
30 Weekly Brief                Done
        ↓
40 Source & Author Registry    Done
        ↓
50 SEO & Sharing               Done
        ↓
60 Knowledge Lifecycle         Done
  ├── 60A Contract             Done · PR #23
  └── 60B Web UI               Done · PR #24
        ↓
70 Scheduled Content Automation Current · Design Review
```

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
- `Design Review`：当前计划已成为产品目标，正在锁定语义与边界；
- `In Progress`：设计已批准，已有实施计划、分支或 PR；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并完成对应 Preview / main / Production 验证；
- `Deferred`：明确推迟。
