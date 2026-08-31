# 30 · 路由与阅读体验

## 1. 路由原则

- 内容类型使用清晰稳定的路径；
- Daily / Weekly 是筛选维度，不急于作为固定品牌栏目；
- 每个公开内容有 canonical URL；
- 阅读版和演示版互相链接；
- 旧 URL 在迁移期保持兼容；
- GitHub Pages 子路径由统一 Base 配置处理，不在内容中硬编码。

## 2. 推荐路由

```text
/                                      首页

/essays/                               Blog / Essays 列表
/essays/:slug/                         Essay 正文

/briefs/                               全部 Brief
/briefs/:slug/                         Brief 阅读版
/briefs/daily/                         cadence=daily 的筛选页
/briefs/weekly/                        cadence=weekly 的筛选页

/slides/                               演示归档
/slides/:slug/                         Slidev 演示

/topics/                               Topic 列表
/topics/:slug/                         跨类型主题聚合

/knowledge/                            长期知识索引
/knowledge/:slug/                      知识条目

/archive/                              时间与类型归档
/about/                                项目说明
/rss.xml                               默认 RSS
```

其中 `/briefs/daily/` 和 `/briefs/weekly/` 只是内容筛选页，不意味着已经形成固定品牌专栏。

## 3. 首页信息架构

首页第一阶段建议包含：

1. 项目定位与最近更新；
2. 最新 Essay；
3. 最新 Brief；
4. 最新 Slides；
5. 活跃 Topics；
6. 长期知识更新；
7. RSS 订阅入口。

首页不按内容团队或固定栏目拆分，而按“最新、重点、长期价值”组织。

## 4. Brief 双形态

同一份 Brief 生成：

```text
/briefs/2026-08-28/           阅读版
/slides/2026-08-28/           演示版
```

阅读版适合：

- 手机；
- 搜索引擎；
- 引用和复制；
- 无障碍阅读；
- 长期归档。

演示版适合：

- 会议分享；
- 桌面浏览；
- 全屏演示；
- 逐页传播。

两者都显示：

- “阅读版 / 演示版”切换；
- 原始来源；
- Topic；
- 发布日期；
- 上一期 / 下一期或相关内容。

## 5. Slides URL

Slidev 构建时使用完整子路径 Base：

```text
/Orbis/slides/<slug>/
```

本地和未来自定义域名通过 `config/site.yaml` 推导，禁止在生成内容里直接写 `/Orbis/`。

## 6. Topic 聚合

Topic 页面聚合：

- Essays；
- Briefs；
- Presentations；
- Knowledge；
- 相关 Topics。

排序优先级：

1. `featured`；
2. 更新时间；
3. 内容状态；
4. 长期知识优先于过时快讯。

## 7. 长期归档

Archive 至少提供：

- 时间；
- 内容类型；
- cadence；
- Topic；
- 状态。

第一阶段使用构建期生成的静态筛选数据和轻量客户端交互，不引入数据库。

## 8. 旧站兼容

当前历史 URL 可能使用：

```text
/YYYY/MM/DD/
/latest/
```

迁移时建议：

```text
/YYYY/MM/DD/ → /slides/YYYY-MM-DD/
/latest/     → 最新 Brief 或最新 Slide 的稳定重定向页
```

GitHub Pages 不提供服务端重定向，可通过生成兼容 `index.html` 或客户端 `location.replace` 实现，并保留 canonical。

## 9. SEO 与分享

Astro 主站负责：

- canonical；
- title / description；
- Open Graph；
- Twitter Card；
- Sitemap；
- 结构化数据；
- RSS discover link。

Slidev 页面负责演示体验，但主要 SEO 入口应指向对应 Astro 阅读版。
