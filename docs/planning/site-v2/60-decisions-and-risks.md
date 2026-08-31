# 60 · 决策、风险与验收条件

## 1. 已建议采纳的决策

| ID | 决策 | 原因 |
|---|---|---|
| D-01 | 单仓库 Monorepo | 内容、品牌、Schema 和发布链路需要一致演化 |
| D-02 | Astro 作为主站 | 适合内容集合、阅读页、归档、Topic、SEO 与 RSS |
| D-03 | Slidev 作为独立演示应用 | 保留成熟演示能力，避免 Astro 自研完整演示运行时 |
| D-04 | Astro 与 Slidev 不互相嵌套 | 降低 Vite、路由、样式与 Hydration 耦合 |
| D-05 | pnpm Workspace，暂不上 Turborepo | 当前规模下优先简单透明 |
| D-06 | 内容、Schema、Token 共享；UI 实现不共享 | 保持品牌一致，同时避免跨框架组件耦合 |
| D-07 | Daily / Weekly 是 Brief cadence | 暂不把发布节奏固化成品牌栏目 |
| D-08 | GitHub Actions 发布 Pages Artifact | 构建产物不由 AI 或人工直接维护 |
| D-09 | AI 默认只修改内容目录 | 将展示、品牌和部署稳定性留给代码与 CI |
| D-10 | RSS 同时支持输入与输出 | 形成发现和订阅闭环 |

## 2. 待确认问题

### 品牌与 IP

- Orbis 的正式 Tagline；
- Logo 是否沿用现有资产还是重新设计；
- 代码、内容和品牌资产是否使用不同许可；
- 是否配置自定义域名。

### 内容

- Blog 对外显示名称使用 Blog、Essays 还是 Writing；
- Knowledge 的公开范围；
- Weekly 的形成条件：固定周期还是有内容才发布；
- 是否允许手工独立 Presentation 使用原生 Slidev Markdown。

### 技术

- Astro 的最终版本与 Node 支持策略；
- 是否第一阶段引入 MDX；
- 搜索采用 Pagefind 还是延后；
- Slidev 多 Deck 全量构建可接受的规模上限；
- 是否生成 Atom / JSON Feed。

## 3. 主要风险

### R-01 · 两个框架导致维护成本增加

缓解：明确职责边界、共享 Schema/Token、禁止跨应用源代码依赖。

### R-02 · 同一内容为阅读版和演示版服务时表达密度冲突

缓解：内容模型分离 `summary / details / speakerNote`，但不复制核心事实和引用。

### R-03 · 每个 Slidev Deck 单独构建导致时间增长

缓解：先全量构建；规模增长后使用内容 hash、缓存和变更集增量构建。

### R-04 · AI 修改 UI 或工作流造成品牌漂移

缓解：AGENTS.md、CODEOWNERS、Path Guard、Schema 和 PR 审核。

### R-05 · RSS 聚合内容失真

缓解：RSS 仅用于发现，最终内容必须回查一手来源并保存引用用途。

### R-06 · GitHub Pages 子路径错误

缓解：所有 Base URL 从 `site.yaml` / 环境变量推导；CI 对构建后的绝对路径和 404 做检查。

### R-07 · 旧链接失效

缓解：迁移清单、兼容页面、canonical 和发布前链接验证。

### R-08 · 过早建设固定栏目与复杂功能

缓解：以内容类型和 cadence 建模；搜索、CMS、多语言等在有真实需求后再加。

## 4. Foundation 验收条件

实现分支达到以下条件才可以进入内容迁移：

- [ ] `pnpm install` 和 `pnpm build` 在干净环境通过；
- [ ] Astro 与 Slidev 都能独立开发和构建；
- [ ] 内容 Schema 有单元测试和失败样例；
- [ ] Astro 和 Slidev 使用同一套设计 Token；
- [ ] 应用之间不存在源码级循环依赖；
- [ ] 自动内容任务的允许路径已定义；
- [ ] 构建产物目录不作为内容源；
- [ ] Pages 尚未从当前生产站切换。

## 5. Vertical Slice 验收条件

- [ ] 一份真实 Brief 同时生成阅读版和演示版；
- [ ] 两种页面引用同一组事实和来源；
- [ ] 演示 Base Path 在 GitHub Pages 子路径正常；
- [ ] Topic 与 Archive 自动生成；
- [ ] RSS 输出包含该内容；
- [ ] 旧链接有兼容策略；
- [ ] 自动内容任务无需写 HTML、CSS、Vue 或 Astro 文件。

## 6. 评审建议

规划评审重点不是目录是否“看起来完整”，而是确认四条边界：

1. 内容和展示是否真正分离；
2. Astro 与 Slidev 是否职责清晰；
3. Daily / Weekly 是否保持为可演进的内容节奏；
4. 当前静态站能否安全渐进迁移。
