# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 基线日期：2026-09-01
> 阶段：Product Capability Phase
> 当前目标：Plan 50A · SEO Foundation

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done**
  - 40A Registry + Referential Integrity：PR #15
  - 40B Registry-backed Content UI：最终通过 PR #19 正确进入 `main`
  - 历史 stacked/recovery：#16 为旧 feature-base merge；#17、#18 已关闭
  - merge 后 Site Build：run `33489504298` Passed
  - Production Pages：run `33495089941` Build + Deploy + public smoke 全部 Passed
  - 历史 `feat/*` / `refactor/*` 分支已清理；closeout Issue #20 已完成
- Plan 50 · SEO & Sharing：**In Progress · Design Approved / Planning 50A**
  - 正式设计：`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`
  - 50A SEO Foundation：Current
  - 50B Structured Data：Next
- Plan 60 · Knowledge Lifecycle：**Planned**
- Plan 70 · Scheduled Content Automation：**Planned**

## 当前产品基线

```text
Daily Brief
  -> Reading
  -> daily-v1 / 11 slides
  -> RSS / Archive / Topic
  -> Daily stable date / latest

Weekly Brief
  -> Weekly Reading
  -> weekly-v1 / 7..11 slides
  -> RSS / Archive / Topic
  -> 不占用 Daily stable route

Standalone Presentation
  -> talk-v1
  -> Slides discovery

Knowledge Identity
  -> Source / Author filename IDs
  -> Topic / Source / Author referential integrity
  -> Essay AuthorByline
  -> Registry-backed Reference metadata
  -> scheduled-agent Registry write restriction

Delivery
  -> read-only PR Build
  -> Trusted Preview Publish
  -> Public Smoke
  -> governed Production Pages deploy
```

Plan 40 的最终生产部署针对 `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`。Pages run `33495089941` 成功部署 exact SHA，随后 smoke `/`、`/latest/`、`/archive.json`、`/rss.xml`、`/favicon.svg` 与 `/2026/08/28/` 全部通过。

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
50 SEO & Sharing               In Progress
  ├── 50A SEO Foundation       Current
  └── 50B Structured Data      Next
        ↓
60 Knowledge Lifecycle
        ↓
70 Scheduled Content Automation
```

## 每个计划的统一交付规则

1. 通过独立分支和 PR 实现，不在一个 PR 中跨多个大 Workstream；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非后续有新的真实需求；
4. 新内容模型必须由 Schema 约束，并提供正反测试；
5. 新路由必须进入构建期 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 和公网 Preview；
7. 不提交生成 HTML、Slidev source 或 `dist/**`；
8. stacked PR 在前置 PR 合并后必须重新确认 base；
9. Production Pages 继续通过显式 deployment gate；
10. 完成后更新 Roadmap 状态。

## Plan 状态约定

- `Planned`：范围与验收已定义，尚未开始；
- `In Progress`：已有设计、实施分支或 PR；
- `Done`：全部计划 PR 已进入 `main`，并通过 Preview / 主分支 / 公网生产验证；
- `Deferred`：明确推迟，不作为当前缺陷。
