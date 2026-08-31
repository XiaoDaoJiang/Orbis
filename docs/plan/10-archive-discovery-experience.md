# 10 · Archive & Discovery Experience

> 状态：Planned
> Roadmap Milestone：A — Discoverable Orbis
> 建议优先级：P0

## 1. 目标

把当前“路由已经存在”的站点提升为“历史内容可以被人自然浏览和重新发现”的内容产品。

本计划不改变内容 Source of Truth，不新增数据库，不实现服务端搜索。

## 2. 当前问题

目前已有：

- `/essays/`、`/briefs/`、`/topics/`、`/knowledge/`；
- `/briefs/:id/` 与 `/slides/:id/`；
- `/archive.json`；
- `/latest/` 与日期别名。

但还缺：

- 面向人的 `/archive/`；
- `/slides/` 演示索引；
- Daily / Weekly 筛选入口；
- Previous / Next；
- Related Content；
- Slide → Reading 的稳定回链；
- 首页对最新 Brief / Essay / Knowledge / Slide 的清晰信息架构。

## 3. 范围

### 3.1 新增路由

```text
/archive/
/slides/
/briefs/daily/
/briefs/weekly/
```

即使还没有 Weekly 内容，`/briefs/weekly/` 也应提供明确 Empty State，而不是 404。

### 3.2 Archive 数据模型

Archive UI 使用构建期内容集合直接生成，不读取独立手写清单。

至少支持以下维度：

- 时间；
- 内容类型；
- cadence；
- Topic；
- status（仅在适合公开时展示）。

第一版优先使用静态 HTML + 少量客户端筛选，不引入搜索服务。

### 3.3 Slides Index

`/slides/` 聚合所有可公开 Presentation：

- Brief 派生 Deck；
- 后续独立 Presentation；
- 显示类型、日期、Topic、对应阅读入口。

### 3.4 内容导航

Brief 至少增加：

- 阅读版 → 演示版；
- 演示版 → 阅读版；
- Previous / Next Daily；
- Related by Topic。

Essay / Knowledge 第一阶段至少支持 Related by Topic。

### 3.5 首页升级

首页调整为：

1. Orbis 定位；
2. Latest Brief；
3. Latest Essay；
4. Latest Presentation；
5. Knowledge updates；
6. Active Topics；
7. Archive / RSS 入口。

## 4. 实现任务

1. 提取可复用的内容排序与过滤工具；
2. 实现 Archive 静态页面；
3. 实现 Slides Index；
4. 实现 Daily / Weekly filter pages；
5. 为 Brief 计算 Previous / Next；
6. 为 Topic-based Related Content 建立共享查询方法；
7. 给 Slidev Deck 注入 Reading URL；
8. 更新首页信息架构；
9. 将新路由加入 `site-check`；
10. 为无内容、单条内容、多条内容编写边界测试。

## 5. 非目标

本计划不实现：

- 全文搜索；
- Algolia / Meilisearch；
- 数据库；
- 用户收藏；
- 个性化推荐；
-复杂前端状态管理。

## 6. 验收标准

- `/archive/` 可以按至少内容类型、cadence、Topic 浏览历史内容；
- `/slides/` 能列出所有已发布 Deck；
- `/briefs/daily/` 与 `/briefs/weekly/` 均为稳定路由；
- 每个 Daily Brief 能导航到 Previous / Next（存在时）；
- Brief 阅读版与演示版双向可达；
- Topic Related Content 不包含 archived/unpublished 内容；
- 首页无需知道文件路径即可进入各内容类型和 Archive；
- `pnpm build`、PR Preview、公网 route smoke 全部通过。

## 7. 建议 PR 拆分

可以拆成两个 PR：

1. `feat: add archive and content discovery routes`
2. `feat: add cross-content navigation and related content`

如果第一个 PR 已经足够小，也可以单 PR 完成全部范围。

## 8. 完成定义

只有代码合并 `main`，且公网 Preview/Production 可验证上述路由时，本 Plan 才标记为 Done。
