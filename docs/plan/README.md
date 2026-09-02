# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> 基线日期：2026-09-02
> 阶段：Product Capability Phase
> 当前目标：Plan 60 · 60A Production Gate

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**In Progress · 60A Production Gate**
  - 60A Knowledge Lifecycle Contract：**Merged / Production Gate** — PR #23
    - main：`f468a45049035bc7816a52225ca41f4f381b0ae6`
    - Site Build：`33614900003` Passed
    - Main Artifact：`9840548845`
    - Artifact SHA-256：`ca3f942db3466e0634da8e724a18e4c333d46ef274246dd8d5acf31d74101541`
    - Production Pages：exact-SHA `deploy=true` Pending
  - 60B Knowledge Lifecycle UI：**Planned / Next after 60A Production Gate**
- Plan 70 · Scheduled Content Automation：**Planned**

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
  ├── persisted editorial state
  ├── derived review health
  │   ├── current
  │   ├── due-soon
  │   └── overdue
  ├── supersededBy canonical edge
  ├── derived supersedes[]
  └── advisory review report
          ↓
Knowledge Lifecycle UI · 60B
```

60A 已合入 `main@f468a45049035bc7816a52225ca41f4f381b0ae6`。fresh Site Build `33614900003` 再次通过 lifecycle evaluator、supersession relation、review report 以及 Plan 10–50 全部既有合同；当前 `knowledge:review` 输出当前 Knowledge 为 `current (60d)`，并保持零退出。

当前只剩 governed Production Pages 对 exact main SHA 的 Build → Deploy → public Smoke。该 gate 通过后，60A 才标记 Done，并正式进入 60B Web UI 实现。

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
60 Knowledge Lifecycle         In Progress
  ├── 60A Contract             Merged / Production Gate
  └── 60B Web UI               Next after gate
        ↓
70 Scheduled Content Automation
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
