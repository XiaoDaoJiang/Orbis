# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@1fcdc4caecc234af7ef2426e4c9d320513eb2efb`
> 基线日期：2026-09-04
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · 70B Review Gate

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**In Progress**
  - design：Approved
  - 70A Repository Contract：**Done** — PR #25
    - main：`1fcdc4caecc234af7ef2426e4c9d320513eb2efb`
    - post-merge Site Build：`33827357380` Passed
    - main Artifact：`9920458469`
    - Artifact SHA-256：`eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01`
  - 70B ChatGPT Scheduled Daily Adapter：**Review Gate**
    - plan：`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`
    - branch：`feat/chatgpt-scheduled-daily-adapter`
    - PR：**#26 Ready for Review**
    - head：`515295cef40636a2300d5043d592fa8c6e2388a2`
    - RED：`33827531033` — adapter entry missing
    - final PR Build：`33827615741` Passed
    - Preview Artifact：`9920550137`
    - Preview Artifact SHA-256：`6ae074aab9863647bccdadbee63d2048cacd4b464f2c1edbdb80d88e212273d0`
    - Trusted Preview：`33827736463` Passed
    - external task migration：blocked until PR #26 merge + fresh main Build

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
  │   ├── deletion / rename-safe Path Guard
  │   ├── explicit targetDate + exact Daily identity
  │   ├── exact-target Scheduled Daily guard
  │   ├── published-main overwrite protection
  │   ├── provider-neutral run/PR metadata
  │   └── mandatory read-only PR Preview guard
  ├── 70B ChatGPT Adapter · Review Gate
  │   ├── thin provider adapter
  │   ├── connected GitHub one-branch / one-PR transport contract
  │   ├── adapter drift contract + operations runbook
  │   └── existing task migration after merge
  └── 70C Real-cycle Validation
```

70A 已随 PR #25 合并，并在 fresh `main@1fcdc4caecc234af7ef2426e4c9d320513eb2efb` 上通过完整 Site Build。由于 70A 只改变 Repository Contract / CI，不改变公开站点输出，因此不要求额外 Production Pages deploy。

70B Repository 侧也已完成：PR #26 final Build 与 Trusted Preview 均通过，scope 仅包含 ChatGPT adapter、focused contract、operations runbook 与 test wiring，没有修改 `content/**`、`apps/**`、`packages/**`、`dist/**` 或 workflows。

已确认现有 ChatGPT task `Agent 前沿资讯` 仍存在、当前 disabled、Asia/Shanghai daily cadence，但 prompt 仍指向已退役 `XiaoDaoJiang/ai-frontier` HTML 发布链。不会创建第二个任务；PR #26 合并并通过 fresh main 后才迁移并启用现有任务。

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
  ├── 70A Repository Contract  Done · PR #25
  ├── 70B ChatGPT Adapter      Review Gate · PR #26
  └── 70C Real-cycle Validation Next after task migration / first transport proof
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
