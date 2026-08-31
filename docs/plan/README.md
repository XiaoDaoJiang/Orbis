# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@f756822cd901ae680a6a37ae44a57df872e0cd44`
> 阶段：Product Capability Phase

`docs/plan/` 用于保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

当前不再进行 Foundation、Legacy Migration 或 Pages Cutover。架构基线由 `docs/planning/architecture-steady-state.md` 定义；本目录只规划如何在该基线上增加真实产品能力。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**In Progress**
  - 10A Archive & Discovery Indexes：**Done**，PR #8 已合并 `main`
  - 10B Cross-content Navigation & Related Content：**Current**
  - 10C Homepage Discovery：**Planned**
- Plan 20–70：**Planned**

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
10 Archive & Discovery
        ↓
20 Presentation Platform
        ↓
30 Weekly Brief
        ↓
40 Source & Author Registry
        ↓
50 SEO & Sharing
        ↓
60 Knowledge Lifecycle
        ↓
70 Scheduled Content Automation
```

其中 40、50 在 20 完成后可以与 30 并行；60、70 应建立在前面的内容合同稳定之后。

## 每个计划的统一交付规则

每个 Plan 都应：

1. 通过独立分支和 PR 实现，不在一个 PR 中跨多个大 Workstream；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非后续有新的真实需求；
4. 新内容模型必须由 Schema 约束，并提供正反测试；
5. 新路由必须进入构建期 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 和公网 Preview；
7. 不把生成 HTML、Slidev source 或 `dist/**` 提交到仓库；
8. 完成后更新本目录 Roadmap 状态，而不是继续维护临时迁移文档。

## Plan 状态约定

- `Planned`：范围与验收已定义，尚未开始；
- `In Progress`：已有实现分支或 PR；
- `Done`：已合并 main，并通过对应生产/公网验证；
- `Deferred`：明确推迟，不作为当前缺陷。
