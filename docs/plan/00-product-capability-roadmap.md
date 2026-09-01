# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-01
> 基线提交：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 当前目标：Milestone E — Search & Share Ready / Plan 50A

## 1. 当前阶段判断

Orbis 已经完成并进入稳定生产：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily Brief → Reading + `daily-v1` + RSS；
- Archive / Slides / Daily / Weekly Discovery 与跨内容导航；
- Homepage discovery；
- source-neutral Presentation Descriptor + Template Registry；
- standalone `talk-v1`；
- Weekly Schema、Reading、`weekly-v1`；
- Daily + Weekly + Talk mixed build；
- Daily-only `/YYYY/MM/DD/`、`/latest/` 与 `/archive.json`；
- Path Guard + CODEOWNERS + scheduled-agent governance；
- read-only PR Build → Trusted Preview → Public Smoke；
- governed GitHub Pages Production；
- Legacy publishing compatibility retirement；
- Plan 40 Source / Author Registry、Referential Integrity 与 Registry-backed Reading UI。

Plan 40 最终生产验证：

```text
main SHA                         0c867438fc6cac83b6f97b76cb55e29118b64b87
post-merge Site Build           33489504298   success
Production Pages run            33495089941   success
Build production artifact                         success
Deploy to GitHub Pages                            success
Public smoke                                      success
Latest structured Daily route                     /2026/08/28/
```

历史 `feat/*` / `refactor/*` 分支已清理，closeout Issue #20 已关闭。

## 2. 产品定义

Orbis 是一个面向长期积累的 Git-native、Agent-native 结构化技术知识发布系统：Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合和长期归档。

```text
发现与研究
    ↓
结构化内容
    ↓
可验证的内容身份与关系
    ↓
多种发布形态
    ├── Reading
    ├── Presentation
    ├── Topic / Source / Author metadata
    ├── Durable Knowledge
    └── RSS
```

## 3. 当前稳态架构

```text
RSS / Web / Primary Sources
             ↓
       Research Agent
             ↓
        content/**
             ↓
 @orbis/content-schema
             ↓
 Referential Integrity
 Topic / Source / Author
             ↓
     ┌───────┴─────────┐
     ↓                 ↓
  Astro Web      Presentation Platform
     ↓                 ↓
 Essays           Descriptor + Registry
 Briefs           daily / weekly / talk
 Topics                 ↓
 Knowledge           Slidev × N
     └────────┬──────────┘
              ↓
         assemble-site
              ↓
 /archive.json /latest/ /YYYY/MM/DD/
              ↓
           dist/site
              ↓
    PR Preview / GitHub Pages
```

Milestone E 在这条稳态构建图上增加公开网络身份，不新增服务端 Runtime：

```text
Structured Content + Registry
          ↓
SEO URL Contract
          ↓
Canonical / OG / Twitter / Sitemap
          ↓
JSON-LD
          ↓
Search / Share / Feed identity
```

## 4. 能力状态

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| Monorepo / Build Foundation | Done | Astro + Slidev + pnpm Workspace |
| Structured Content | Done | Brief、Essay、Knowledge、Topic、Presentation、Source、Author |
| Daily Brief | Done / Mature | Reading、11 页 Slides、RSS、Previous/Next、Date/Latest/Archive |
| Weekly Brief | Done / First Release | Weekly Schema、Reading、7..11 页 Slides、RSS/Archive/Topic |
| Standalone Presentation | Done / Basic | `content/presentations/**` + `talk-v1` |
| Presentation Platform | Done | Descriptor、Template Registry、mixed build |
| Archive / Discovery / Navigation | Done / Mature | Homepage、Archive、Slides、cadence indexes、Related |
| Topic | Done / Basic | Topic entity、relations、public aggregation |
| Knowledge | Done / Basic | status、reviewAt、Topic、References、Related |
| Source / Author Identity | Done | canonical IDs、Registry、Referential Integrity、Governance |
| Registry-backed Reading UI | Done | AuthorByline、Source metadata、archived/unsourced contracts |
| Production Pages | Done / Governed | explicit deploy gate + public smoke |
| SEO / Sharing | In Progress | approved design；50A planning current |
| Knowledge Lifecycle | Planned | review/expiry tooling |
| Scheduled Automation | Planned | scheduled Agent PR orchestration |

## 5. Product Capability Roadmap

### Milestone A — Discoverable Orbis · Done
Plan 10，PR #8 / #9 / #10。

### Milestone B — Presentation Platform · Done
Plan 20，PR #11 / #12。

### Milestone C — Weekly Intelligence · Done
Plan 30，PR #13 / #14。

### Milestone D — Knowledge Identity · Done
Plan 40。

- 40A Registry + Referential Integrity — PR #15；
- 40B Registry-backed Content UI — final main integration PR #19；
- main Build + Production Pages deploy/smoke verified；
- historical feature/refactor branches cleaned；
- Issue #20 completed.

### Milestone E — Search & Share Ready · In Progress
Plan 50。

Approved design:

`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`

Delivery split:

```text
50A SEO Foundation
  -> canonical URL contract
  -> Preview noindex / Production canonical
  -> Open Graph / Twitter
  -> static social image
  -> sitemap.xml
  -> RSS identity alignment
  -> Slide canonical boundary

50B Structured Data
  -> WebSite JSON-LD
  -> Essay Article + Author Registry
  -> Brief Article
  -> Knowledge TechArticle
```

### Milestone F — Durable Knowledge · Planned
Plan 60。

### Milestone G — Sustainable Automation · Planned
Plan 70。

## 6. 当前不建设

- 数据库 / CMS / 服务端 Runtime；
- 登录、收藏和个性化推荐；
- 可视化 Slide Editor；
- 自动信任评分；
- Citation graph database；
- Source / Author 独立目录与反向聚合；
- 动态 OG image 服务；
- 复杂搜索服务。
