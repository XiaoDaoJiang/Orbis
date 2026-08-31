# 10 · Archive & Discovery Experience

> 状态：In Progress
> Roadmap Milestone：A — Discoverable Orbis
> 当前基线：`main@78a7371deaf82f1b9b0c07c41ac55728503f18f0`
> 当前子阶段：10C — Homepage Discovery
> 建议优先级：P0

## 1. 目标

把当前“路由已经存在”的站点提升为“历史内容可以被人自然浏览、重新发现并继续探索”的内容产品。

本计划不改变内容 Source of Truth，不新增数据库，不实现服务端搜索。

## 2. 当前状态

### 10A — Archive & Discovery Indexes · Done

PR #8 `feat: add archive and discovery indexes` 已合并 `main`。

已提供：

- `/archive/`；
- `/slides/`；
- `/briefs/daily/`；
- `/briefs/weekly/`，无 Weekly 时稳定 Empty State；
- Archive 的内容类型 / cadence / Topic 静态筛选；
- Brief / Essay / Knowledge 的共享公开可见性、归一化和时间排序规则；
- Topic 聚合的公开内容过滤；
- Briefs Daily / Weekly 导航；
- 全局 Archive / Slides 导航；
- 动态 `site-check` 与 multi-presentation 边界验证；
- read-only PR Build → Trusted Preview Publish → 公网验证。

### 10B — Cross-content Navigation & Related Content · Done

PR #9 `feat: add cross-content navigation and related content` 已合并 `main`。

已提供：

- published Daily Brief Previous / Next；
- Brief / Essay / Knowledge 的确定性 Topic-based Related Content；
- Related 使用 `kind + id` 自排除，并按 Topic overlap → 时间 → 稳定 tie-break 排序；
- `presentation.enabled: false` 时不再输出 Slides 死链；
- Slidev Cover 与 Extended Reading 页稳定回链 Astro Reading；
- `daily-v1` 继续严格保持 11 页；
- 单 Daily、双 Daily、非公开同 Topic 内容的动态边界验证；
- PR Build / Trusted Preview / Public verification 全部通过。

### 10C — Homepage Discovery · Current

当前只剩首页发现信息架构：

1. Orbis 定位；
2. Latest Brief；
3. Latest Essay；
4. Latest Presentation；
5. Knowledge updates；
6. Active Topics；
7. Archive / RSS 与主要内容入口。

## 3. 产品范围

### 3.1 Archive 与分类入口

状态：**10A Done**。

稳定路由：

```text
/archive/
/slides/
/briefs/daily/
/briefs/weekly/
```

Archive UI 使用构建期内容集合直接生成，不读取独立手写清单或 generated artifact。

### 3.2 内容导航

状态：**10B Done**。

Brief 已提供：

- 阅读版 → 演示版，仅在 Deck 实际启用时展示；
- 演示版 → 阅读版；
- Previous / Next Daily；
- Related by Topic。

Essay / Knowledge 已支持 Related by Topic。

#### Previous / Next 语义

只在 `published + daily` Brief 序列中计算：

- Previous = 紧邻的更早一期；
- Next = 紧邻的更新一期；
- 单条 Daily 时两个入口均不渲染；
- Weekly / ad-hoc 不进入 Daily 序列。

#### Related Content 语义

第一版使用确定性 Topic overlap，不引入推荐服务：

1. 候选只来自公开 Brief / Essay / Knowledge；
2. 排除当前内容自身，身份使用 `kind + id`；
3. 至少共享一个 Topic；
4. 共享 Topic 数量越多优先级越高；
5. Topic 数相同时按 `publishedAt` 新到旧排序；
6. 再相同按稳定 title / kind / id 排序；
7. 最多展示 3 条；
8. 无候选时不渲染空 Related 模块。

Presentation 当前仍是 Brief 的派生输出，不作为独立 Related entity。

### 3.3 阅读版 ↔ 演示版

状态：**10B Done**。

Astro 与 Slidev 继续共享内容与 URL contract，不共享 Runtime UI。

- Astro Brief 页只有在 `presentation.enabled === true` 时显示 Slides 链接；
- Slide Generator 根据 Brief slug 计算 `/briefs/<slug>/`；
- `daily-v1` 保持精确 11 页；
- Reading 回链位于 Cover 与最终 Extended Reading 页；
- 本阶段没有引入 Template Registry 或通用 Presentation Runtime。

### 3.4 首页升级

状态：**10C Current**。

首页作为 Plan 10 最后一块能力独立交付，不与 Presentation Platform 或 Weekly 工作混入同一 PR。

目标结构：

1. Orbis 定位与主要探索入口；
2. Latest Brief；
3. Latest Essay；
4. Latest Presentation；
5. Knowledge updates；
6. Active Topics；
7. Archive / Slides / Daily / Weekly / RSS 入口。

所有首页内容都必须来自现有结构化 Collection 和 10A/10B 已建立的 public visibility / discovery helpers，不维护手写首页清单。

## 4. 实现分解

### 10A · Done

- [x] 提取公开内容排序与过滤工具；
- [x] 实现 Archive 静态页面；
- [x] 实现 Slides Index；
- [x] 实现 Daily / Weekly filter pages；
- [x] 修正 Topic 聚合的公开可见性；
- [x] 将新路由加入 `site-check`；
- [x] 通过 PR Build / Trusted Preview / Public verification。

### 10B · Done

- [x] 在 `apps/web/src/lib/content-discovery.ts` 增加 Daily adjacency 查询；
- [x] 增加确定性 Topic-related 查询；
- [x] 为 Brief 阅读页增加 Previous / Next；
- [x] 为 Brief / Essay / Knowledge 增加 Related Content；
- [x] 修正 Brief → Slides 条件显示；
- [x] 给 `daily-v1` 注入稳定 Reading URL，不改变 11 页合同；
- [x] 扩展动态 `site-check` 验证 Reading ↔ Slides 与 relation 边界；
- [x] 通过 PR Build / Trusted Preview / Public verification。

### 10C · Current

- [ ] 更新首页信息架构；
- [ ] Latest Brief / Essay / Presentation；
- [ ] Knowledge updates；
- [ ] Active Topics；
- [ ] Archive / Slides / Daily / Weekly / RSS 主入口；
- [ ] 首页 artifact / Preview 验证。

## 5. 非目标

本计划不实现：

- 全文搜索；
- Algolia / Meilisearch；
- 数据库；
- 用户收藏；
- 个性化推荐；
- 复杂前端状态管理；
- Presentation Registry；
- `talk-v1`；
- `weekly-v1`；
- Weekly 专属语义模型；
- SEO / OG / Sitemap / JSON-LD。

## 6. 验收标准

### 10A · 已满足

- [x] `/archive/` 可以按内容类型、cadence、Topic 浏览历史内容；
- [x] `/slides/` 能列出当前所有已发布 Brief Deck；
- [x] `/briefs/daily/` 与 `/briefs/weekly/` 均为稳定路由；
- [x] Topic 聚合不暴露 archived/unpublished 内容；
- [x] 完整 `pnpm build`、PR Preview、Trusted Public Preview 验证通过。

### 10B · 已满足

- [x] 每个 Daily Brief 在邻居存在时能正确导航 Previous / Next；
- [x] 单条 Daily 不出现错误 Previous / Next；
- [x] Brief / Essay / Knowledge Related Content 只使用公开内容；
- [x] Related 排序为确定性的 Topic overlap → 时间 → 稳定 tie-break；
- [x] Brief 没有启用 Presentation 时不会输出 Slides 死链；
- [x] 启用 Presentation 的 Brief 阅读版与 Slidev 演示版双向可达；
- [x] `daily-v1` 继续保持 11 页；
- [x] 完整 `pnpm build`、PR Preview、公网验证通过。

### 10C · Milestone A 最终退出条件

- [ ] 首页无需知道文件路径即可进入主要内容类型和 Archive；
- [ ] 首页明确展示最新 Brief、Essay、Presentation 与 Knowledge updates；
- [ ] 首页公开内容排序由结构化数据决定，不依赖 Collection 返回顺序；
- [ ] 用户可从首页、Archive、Topic、内容页持续发现内容；
- [ ] Plan 10 所有能力合并 `main` 并完成公网验证。

## 7. PR 拆分

实际采用三个小 PR：

1. **10A · Done** — `feat: add archive and discovery indexes`，PR #8；
2. **10B · Done** — `feat: add cross-content navigation and related content`，PR #9；
3. **10C · Current** — `feat: improve home discovery experience`。

每个 PR 独立通过完整构建和 Preview，不把整个 Milestone A 一次实现。

## 8. 完成定义

当前 Plan 10 保持 **In Progress**。

只有 10C 合并 `main` 并完成公网 Preview/Production 验证后，10A、10B、10C 才全部完成，Plan 10 / Milestone A 才标记为 Done。
