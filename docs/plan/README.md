# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> 基线日期：2026-09-03
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · 70A Review Gate

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
  - main：`89c7f8fe6d5da972c0f54b1367df252aa00cf286`
  - Site Build：`33720559711` Passed
  - Production Pages：`33734815132` Passed
  - Production Artifact：`9885335098`
  - Artifact SHA-256：`7caba4bb2d7a82f02c084af036f219cb2d8484ad6ccbfd4724a7c29d5e168e55`
- Plan 70 · Scheduled Content Automation：**In Progress**
  - design：Approved
  - 70A implementation plan：Prepared
  - 70A implementation：Complete on feature branch
  - PR：**#25 Ready for Review**
  - head：`f7a7c60daf766dafbca3e9b7cbee06c569bbb535`
  - final PR Build：`33738006368` Passed
  - Preview Artifact：`9886587297`
  - Preview Artifact SHA-256：`90f62f91865bc5fcb504c594d53a301fa12ff82657d4674a4789d883bcbc134d`
  - Trusted Preview Publish：`33738176374` Passed
  - next：human merge #25 → 70B Scheduler / Producer transport

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
  ├── 70A Repository Contracts · Ready for Review
  │   ├── deletion / rename-safe Path Guard
  │   ├── explicit targetDate + exact Daily identity
  │   ├── exact-target scheduled guard
  │   ├── published-main overwrite protection
  │   ├── provider-neutral run/PR metadata
  │   └── mandatory read-only PR Preview guard
  └── 70B Scheduler / Producer transport · Next after merge
```

Plan 60 / Milestone F 已通过 exact-SHA Production Pages Build → Deploy → public Smoke，正式 Done。

Plan 70 设计已确认。70A 已在 `feat/scheduled-daily-contracts` 完成 TDD 实现，PR #25 final head `f7a7c60daf766dafbca3e9b7cbee06c569bbb535` 通过完整 PR Build 与 Trusted Preview。Scope audit 未包含 `content/**`、`apps/**`、`packages/**`、`dist/**` 或 Production Pages workflow 变更。

当前唯一 gate 是 PR #25 的人工集成。70B 不在 70A merge 之前启动实现。

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
        ↓
70 Scheduled Content Automation In Progress
  ├── 70A Repository Contract  Ready for Review · PR #25
  ├── 70B Scheduler / Producer Next after #25 merge
  └── 70C Real-cycle Validation
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
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并完成对应 Preview / main / Production 验证；
- `Deferred`：明确推迟。
