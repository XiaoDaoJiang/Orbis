# Orbis Site V2 规划

> 状态：Proposal  
> 分支：`planning/astro-slidev-monorepo`  
> 目标：为 Orbis 规划一个以 Astro 为内容网站、以 Slidev 为演示渲染器的单仓库 Monorepo。

## 背景

Orbis 当前以静态 HTML 和 GitHub Pages 产物为主。下一阶段需要同时承载：

1. Blog / Essays；
2. Daily / Weekly；
3. Slides；
4. Topics；
5. 长期知识归档；
6. RSS 输入与输出。

本规划暂不把 Daily、Weekly 或任何主题设为固定品牌专栏。它们首先是内容类型与发布节奏，未来再根据真实内容积累决定栏目化方式。

## 推荐结论

采用以下架构：

```text
Orbis Monorepo
├── Astro：主站、博客、阅读版、主题、归档、SEO、RSS
├── Slidev：日报、周报与独立技术演示
├── Shared Content：Markdown / YAML / JSON 单一内容源
├── Shared Schema：内容校验与类型契约
├── Shared Brand：Logo、设计 Token、编辑规范
└── GitHub Actions：校验、构建、组装与 GitHub Pages 发布
```

核心原则：

- **同仓库、双应用**：Astro 与 Slidev 独立构建，不互相嵌入运行时；
- **单一内容源**：阅读版与演示版不复制维护内容；
- **共享品牌，不共享 UI 实现**：共享设计 Token 和资产，各应用维护自己的组件；
- **AI 只负责内容**：自动内容任务不得修改组件、样式、品牌资产和部署工作流；
- **构建产物不入源代码主路径**：由 GitHub Actions 生成并发布 Pages Artifact；
- **先兼容旧站，再切换发布源**：规划分支不影响当前 `main/docs` 站点。

## 规划文档

| 文档 | 内容 |
|---|---|
| [00-product-scope.md](./00-product-scope.md) | 产品边界、目标、非目标与内容能力 |
| [10-monorepo-architecture.md](./10-monorepo-architecture.md) | Monorepo 目录、应用职责和依赖边界 |
| [20-content-model.md](./20-content-model.md) | Blog、Brief、Slides、Topics、Knowledge、Sources 数据模型 |
| [30-routing-and-experience.md](./30-routing-and-experience.md) | 路由、阅读版、演示版、归档和兼容策略 |
| [40-build-rss-and-publishing.md](./40-build-rss-and-publishing.md) | 构建、RSS、GitHub Actions 与 Pages 发布链路 |
| [50-migration-roadmap.md](./50-migration-roadmap.md) | 从当前静态站迁移到 V2 的阶段计划 |
| [60-decisions-and-risks.md](./60-decisions-and-risks.md) | 已决定事项、待决问题、风险和验收条件 |

## 本分支不做什么

本分支只建立规划基线，不执行以下操作：

- 不切换当前 GitHub Pages 发布源；
- 不删除或迁移现有 `docs/` 页面；
- 不初始化 Astro / Slidev 依赖；
- 不确定最终品牌视觉与固定栏目；
- 不修改现有定时任务的生产发布路径。

规划评审通过后，再创建实现分支进入 Phase 1。
