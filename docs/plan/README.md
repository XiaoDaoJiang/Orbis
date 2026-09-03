# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> 基线日期：2026-09-02
> 阶段：Product Capability Phase
> 当前目标：Plan 60 · 60B Knowledge Lifecycle UI

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**In Progress · 60B Current**
  - 60A Knowledge Lifecycle Contract：**Done** — PR #23
    - main：`f468a45049035bc7816a52225ca41f4f381b0ae6`
    - Site Build：`33614900003` Passed
    - Main Artifact：`9840548845`
    - Main Artifact SHA-256：`ca3f942db3466e0634da8e724a18e4c333d46ef274246dd8d5acf31d74101541`
    - Production Pages：`33616314496` Build + Deploy + public smoke Passed
    - Production Artifact：`9841106463`
    - Production Artifact SHA-256：`01f09455f6746494daf87105e3d4333cd49b922559303c0a676ee8b96a8ada94`
  - 60B Knowledge Lifecycle UI：**Current · Implementation**
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
Knowledge Lifecycle Contract · 60A Done
  ├── persisted editorial state
  ├── derived review health
  │   ├── current
  │   ├── due-soon
  │   └── overdue
  ├── supersededBy canonical edge
  ├── derived supersedes[]
  └── advisory review report
          ↓
Knowledge Lifecycle UI · 60B Current
```

60A 已在 exact `main@f468a45049035bc7816a52225ca41f4f381b0ae6` 完成生产验证。Production run `33616314496` 的 Build 与 Deploy 均 success；Pages deployment 明确记录 `pages_build_version=f468a45049035bc7816a52225ca41f4f381b0ae6`，并通过 `/`、`/latest/`、`/archive.json`、`/rss.xml`、favicon 与 `/2026/08/28/` 的公网 smoke。

因此 60A 已 Done，当前正式进入 60B Web UI，实现 lifecycle index/detail、review health 与 supersession navigation，同时继续保持 stable Knowledge URLs 与 60A 单一 lifecycle 逻辑来源。

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
  ├── 60A Contract             Done · PR #23
  └── 60B Web UI               Current · Implementation
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
