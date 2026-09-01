# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 基线日期：2026-09-01
> 阶段：Product Capability Phase
> 当前目标：Plan 40 · Production Pages Verification

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

当前不再进行 Foundation、Legacy Migration 或 Pages Cutover。架构基线由 `docs/planning/architecture-steady-state.md` 定义；本目录只规划如何在该基线上增加真实产品能力。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done**
  - 10A Archive & Discovery Indexes：PR #8
  - 10B Cross-content Navigation & Related Content：PR #9
  - 10C Homepage Discovery：PR #10
- Plan 20 · Presentation Platform：**Done**
  - 20A Presentation Descriptor + Template Registry：PR #11
  - 20B Standalone Presentation + `talk-v1`：PR #12
- Plan 30 · Weekly Brief：**Done**
  - 30A Weekly Schema + Reading：PR #13
  - 30B `weekly-v1` + Daily / Weekly / Talk mixed integration：PR #14
- Plan 40 · Source & Author Registry：**In Progress · Production Verification Gate**
  - 40A Registry + Referential Integrity：**Done on main**，PR #15
  - 40B Registry-backed Content UI：stacked PR #16 实现完成但合并到旧 feature base；最终通过 PR #19 正确进入 `main`
  - stale duplicate/recovery PR：#17、#18 已关闭并保留审计说明
  - `main@0c867438` 的 Orbis Site Build：**Passed**（run `33489504298`）
  - GitHub Pages production deploy/smoke：**Pending manual `pages-production.yml` dispatch**
- Plan 50 · SEO & Sharing：**Planned / Next after Plan 40 Production Verification**
- Plan 60 · Knowledge Lifecycle：**Planned**
- Plan 70 · Scheduled Content Automation：**Planned**

## 当前产品基线

`main` 已经具备四个稳定能力闭环：

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
```

Plan 40 的代码和 main 集成已经完成。40B 最终通过非 Draft recovery PR #19 将 exact validated head `56a89d2259b0489a61ca2a867a06740f5c2de2eb` 合并到 `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`；PR #19 自身的 read-only Build、Artifact 与 Trusted Preview 均通过，合并后的主分支 Site Build 也已通过。Plan 40 尚未标记 Done 的唯一原因是生产 `pages-production.yml` 采用显式 `workflow_dispatch` + `deploy: true` 门，需要完成 GitHub Pages deploy/smoke 后再关闭 Milestone D。

## 总体目标

Orbis 要从“架构完整的 Vertical Slice”推进为可长期使用的 Git-native、Agent-native 技术知识发布系统：

```text
发现 / 研究
    ↓
结构化内容
    ↓
Schema 与知识关系
    ↓
阅读 / 演示 / 订阅 / 聚合 / 归档
    ↓
PR Preview / Review / GitHub Pages
```

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
40 Source & Author Registry    Production Verification Gate
  ├── 40A / PR #15             Done on main
  ├── 40B stacked / PR #16     merged to wrong feature base
  ├── stale #17 / #18          Closed
  ├── final recovery / PR #19  Done on main
  ├── main Site Build          Passed
  └── Pages deploy / smoke     Pending manual dispatch
        ↓
50 SEO & Sharing               Next
        ↓
60 Knowledge Lifecycle
        ↓
70 Scheduled Content Automation
```

40 与 50 在架构上可以部分并行，但当前不提前启动 Plan 50：先完成显式 Production Pages deploy/smoke，让 Author / Source Reading UI 在生产站成为稳定合同，再让 canonical、Open Graph、Sitemap 与 JSON-LD 消费这些身份。

## 每个计划的统一交付规则

每个 Plan 都应：

1. 通过独立分支和 PR 实现，不在一个 PR 中跨多个大 Workstream；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非后续有新的真实需求；
4. 新内容模型必须由 Schema 约束，并提供正反测试；
5. 新路由必须进入构建期 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 和公网 Preview；
7. 不把生成 HTML、Slidev source 或 `dist/**` 提交到仓库；
8. stacked PR 必须在前置 PR 合并后确认 base，不能把“merged”状态误当成“已进入 main”；
9. Production Pages 继续通过显式 deployment gate，不以普通 main push 绕过；
10. 完成后更新本目录 Roadmap 状态，而不是继续维护临时迁移文档。

## Plan 状态约定

- `Planned`：范围与验收已定义，尚未开始；
- `In Progress`：已有实现分支或 PR，或代码虽进入 `main` 但计划要求的生产验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并通过对应 Preview / 主分支 / 公网验证；
- `Deferred`：明确推迟，不作为当前缺陷。
