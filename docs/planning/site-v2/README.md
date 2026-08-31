# Orbis Site V2 规划归档

> 状态：**ARCHIVED — 已实现并完成生产 Cutover**  
> 原规划分支：`planning/astro-slidev-monorepo`

本目录保存 Orbis 从旧静态 HTML / `main:/docs` 站点迁移到 Astro + Slidev Monorepo 的原始规划与验证记录。

这些文档用于解释历史决策，不再定义当前运行时架构；其中关于旧站兼容、迁移阶段和 `main:/docs` 的描述应按其历史时间点理解。

当前有效架构请阅读：

- [`../architecture-steady-state.md`](../architecture-steady-state.md) — 当前 Source of Truth、构建图、路由和 Agent 边界；
- [`../github-pages-cutover.md`](../github-pages-cutover.md) — 已完成的 GitHub Pages Cutover 记录；
- [`../repository-governance.md`](../repository-governance.md) — 当前仓库治理规则。

## 已落地的核心决策

- pnpm Workspace Monorepo；
- `apps/web` 使用 Astro；
- `apps/slides` 使用 Slidev；
- `content/**` 作为发布内容的单一结构化源；
- Zod Schema 约束内容合同；
- Daily `daily-v1` 固定 11 页语义；
- 多 Brief / Presentation 自动发现与构建；
- Path Guard + CODEOWNERS；
- read-only PR Build + trusted public Preview；
- GitHub Actions 发布 `dist/site` 到 Pages。

## 已退休的迁移策略

以下内容只属于迁移阶段，不再是当前架构：

- `main:/docs` 作为 Pages Source；
- 旧 HTML/payload 复制与 base-path rewrite；
- `docs/archive.json` 与 structured Brief 合并；
- Legacy date collision policy；
- 保留旧站作为常驻 rollback source。

Git 历史仍保留完整迁移证据，因此无需在当前主线继续携带旧运行时代码和静态站副本。
