# 10 · Archive & Discovery Experience

> 状态：Done
> Roadmap Milestone：A — Discoverable Orbis
> 完成基线：PR #8 / #9 / #10
> 建议优先级：Completed

## 1. 目标

把“路由已经存在”的站点提升为“历史内容可以被人自然浏览、重新发现并继续探索”的内容产品。

本计划不改变内容 Source of Truth，不新增数据库，不实现服务端搜索。

## 2. 完成结果

### 10A — Archive & Discovery Indexes · Done

PR #8 `feat: add archive and discovery indexes` 已合并 `main`。

已提供：

- `/archive/`；
- `/slides/`；
- `/briefs/daily/`；
- `/briefs/weekly/`；
- Archive 的内容类型 / cadence / Topic 静态筛选；
- Brief / Essay / Knowledge 的共享公开可见性、归一化和时间排序规则；
- Topic 聚合的公开内容过滤；
- 动态 `site-check` 与 multi-presentation 边界验证。

### 10B — Cross-content Navigation & Related Content · Done

PR #9 `feat: add cross-content navigation and related content` 已合并 `main`。

已提供：

- published Daily Brief Previous / Next；
- Brief / Essay / Knowledge 的确定性 Topic-based Related Content；
- Related 使用 `kind + id` 自排除，并按 Topic overlap → 时间 → 稳定 tie-break 排序；
- `presentation.enabled: false` 时不输出 Slides 死链；
- Reading ↔ Slides 稳定双向导航；
- 非公开内容不进入 Related。

### 10C — Homepage Discovery · Done

PR #10 `feat: improve home discovery experience` 已合并 `main`。

已提供：

1. Orbis 定位与主要探索入口；
2. Latest Brief；
3. Latest Essay；
4. Latest Presentation；
5. Knowledge Updates；
6. Active Topics；
7. Archive / Slides / Daily / Weekly / Essays / Knowledge / RSS 主入口；
8. 确定性排序和公开可见性过滤；
9. Homepage artifact / Trusted Preview / public smoke 验证。

## 3. 稳定产品合同

### Archive 与分类入口

稳定路由：

```text
/archive/
/slides/
/briefs/daily/
/briefs/weekly/
```

Archive UI 使用构建期结构化 Collection，不读取手写清单或 generated artifact。

### Previous / Next

只在 `published + daily` Brief 序列中计算：

- Previous = 紧邻更早一期；
- Next = 紧邻更新一期；
- Weekly / ad-hoc 不进入 Daily 邻接序列。

### Related Content

第一版使用确定性 Topic overlap：

1. 候选只来自公开 Brief / Essay / Knowledge；
2. 排除当前内容自身，身份使用 `kind + id`；
3. 至少共享一个 Topic；
4. 共享 Topic 数量越多优先级越高；
5. 再按 `publishedAt` 新到旧；
6. 最后按稳定 title / kind / id tie-break；
7. 最多展示 3 条。

Standalone Presentation 当前不是通用 Related entity。

### Homepage

首页只使用现有结构化 Collection 和 discovery helpers，不维护手写 manifest。

Latest Brief 与 Latest Presentation 是两个独立概念；在 Plan 30 完成后，它们可以同时指向同一 Weekly，但 Daily `/latest/` 仍是独立的 Daily stable-route contract。

## 4. 实现分解

### 10A · Done

- [x] 提取公开内容排序与过滤工具；
- [x] 实现 Archive 静态页面；
- [x] 实现 Slides Index；
- [x] 实现 Daily / Weekly filter pages；
- [x] 修正 Topic 聚合公开可见性；
- [x] 将新路由加入 `site-check`；
- [x] 通过 PR Build / Trusted Preview / Public verification。

### 10B · Done

- [x] Daily adjacency；
- [x] Topic-related 查询；
- [x] Brief Previous / Next；
- [x] Brief / Essay / Knowledge Related Content；
- [x] Brief → Slides 条件显示；
- [x] Slidev → Reading 稳定回链；
- [x] 非公开 relation 边界验证；
- [x] 通过 PR Build / Trusted Preview / Public verification。

### 10C · Done

- [x] 更新首页信息架构；
- [x] Latest Brief / Essay / Presentation；
- [x] Knowledge Updates；
- [x] Active Topics；
- [x] Archive / Slides / Daily / Weekly / Essays / Knowledge / RSS 主入口；
- [x] 首页 artifact / Preview 验证。

## 5. 非目标

本计划不实现：

- 全文搜索；
- Algolia / Meilisearch；
- 数据库；
- 用户收藏；
- 个性化推荐；
- 复杂前端状态管理；
- Source / Author Registry；
- SEO / OG / Sitemap / JSON-LD。

## 6. 验收状态

- [x] `/archive/` 可以按内容类型、cadence、Topic 浏览历史内容；
- [x] `/slides/` 能列出公开 Presentation；
- [x] `/briefs/daily/` 与 `/briefs/weekly/` 均为稳定路由；
- [x] Topic 聚合不暴露 archived/unpublished 内容；
- [x] Daily Previous / Next 正确；
- [x] Related Content 只使用公开内容并确定性排序；
- [x] Reading ↔ Slides 双向可达；
- [x] 首页无需知道文件路径即可进入主要内容和 Archive；
- [x] 首页明确展示最新 Brief、Essay、Presentation 与 Knowledge Updates；
- [x] 首页公开内容排序由结构化数据决定；
- [x] 用户可从 Homepage、Archive、Topic、内容页持续发现内容；
- [x] Plan 10 三个 PR 均合并 `main` 并完成公网验证。

## 7. PR 记录

1. **10A · Done** — PR #8 `feat: add archive and discovery indexes`；
2. **10B · Done** — PR #9 `feat: add cross-content navigation and related content`；
3. **10C · Done** — PR #10 `feat: improve home discovery experience`。

Plan 10 / Milestone A 已关闭。