# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> 基线日期：2026-09-02
> 阶段：Product Capability Phase
> 当前目标：Plan 60 · Knowledge Lifecycle · Design Review

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
  - main：`bb85751266f90ec25e56f087bd078a935d8f31cd`
  - Site Build：`33601715928` Passed
  - Main Artifact：`9835467039`
  - Production Pages：`33603472306` Build + Deploy + public smoke Passed
  - Production Artifact：`9836095734`
- Plan 60 · Knowledge Lifecycle：**Current · Design Review**
- Plan 70 · Scheduled Content Automation：**Planned**

## 当前产品基线

```text
Structured Content + Registry
          ↓
Referential Integrity
          ↓
Reading / Presentation / RSS / Discovery
          ↓
SEO URL Contract
  ├── Production canonical
  ├── Preview noindex + Preview share URL
  ├── Open Graph / Twitter
  ├── Sitemap
  ├── RSS identity
  └── Slide / alias canonical
          ↓
Structured Data
  ├── WebSite
  ├── Essay Article + Author Registry
  ├── Brief Article
  └── Knowledge TechArticle
          ↓
Knowledge Lifecycle · Plan 60
  ├── review contract
  ├── overdue / due-soon detection
  ├── lifecycle relationships
  └── durable Knowledge UI
```

Plan 50 最终生产验证针对 exact `main@bb85751266f90ec25e56f087bd078a935d8f31cd`：Production run `33603472306` 成功构建并部署 GitHub Pages；Pages deployment 明确使用 `pages_build_version=bb85751266f90ec25e56f087bd078a935d8f31cd`，并 smoke `/`、`/latest/`、`/archive.json`、`/rss.xml`、favicon 与 `/2026/08/28/`。

同一 Production build 再次通过 `SEO URL contract`、`JSON-LD builder contract`、`Web SEO artifact contract`、`Assembled SEO canonical contract` 与 `Structured data artifact contract`。因此 Milestone E / Plan 50 已关闭。

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
60 Knowledge Lifecycle         Current · Design Review
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
- `Design Review`：当前计划已成为产品目标，正在锁定语义与边界，尚未进入实现；
- `In Progress`：设计已批准，已有实施计划、分支或 PR；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并完成对应 Preview / main / Production 验证；
- `Deferred`：明确推迟。
