# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-02
> 基线提交：`main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> 当前目标：Milestone E — Search & Share Ready / 50B Production Gate

## 1. 当前阶段判断

Orbis 已经完成：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily / Weekly / standalone Presentation 多形态发布；
- Archive / Slides / cadence / Homepage discovery；
- Daily-only stable date / latest / archive.json；
- Path Guard + CODEOWNERS + scheduled-agent governance；
- read-only PR Build → Trusted Preview → Public Smoke；
- governed GitHub Pages Production；
- Source / Author Registry + Referential Integrity + Registry-backed Reading UI；
- Production canonical / Preview noindex；
- Open Graph / Twitter Card；
- Production-only Sitemap identity；
- Production/Preview RSS identity；
- Slidev / alias canonical boundary；
- WebSite / Essay Article / Brief Article / Knowledge TechArticle JSON-LD 已合入 `main`。

Plan 50 当前状态：

```text
main SHA                         bb85751266f90ec25e56f087bd078a935d8f31cd
50A merge PR                     #21
50A Production Pages             33588705346   success
50B merge PR                     #22
50B merge time                   2026-09-02T07:03:38Z
50B post-merge Site Build        33601715928   success
50B main Artifact                9835467039
Artifact SHA-256                 eea4501fb7f88032aa920f140a955e5ac5d171afddbab14179a06eca181f65f3
50B Production Pages             pending exact-SHA deploy=true gate
```

Fresh main Build 已再次通过：

```text
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

因此 Milestone E 只剩 **50B exact-SHA Production Pages Build → Deploy → public Smoke**。在该 gate 通过前，不标记 Plan 50 / Milestone E Done。

## 2. 产品定义

Orbis 是一个面向长期积累的 Git-native、Agent-native 结构化技术知识发布系统：Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合和长期归档。

```text
发现与研究
    ↓
结构化内容
    ↓
可验证的内容身份与关系
    ↓
Reading / Presentation / RSS / Discovery
    ↓
Canonical / Share Identity
    ↓
Structured Data
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
 Reading          daily / weekly / talk
     └────────┬──────────┘
              ↓
         assemble-site
              ↓
 Canonical / OG / Twitter / Sitemap / RSS
              ↓
 WebSite / Article / TechArticle JSON-LD
              ↓
           dist/site
              ↓
    PR Preview / GitHub Pages
```

## 4. 能力状态

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| Monorepo / Build Foundation | Done | Astro + Slidev + pnpm Workspace |
| Structured Content | Done | Brief、Essay、Knowledge、Topic、Presentation、Source、Author |
| Daily Brief | Done / Mature | Reading、11 页 Slides、RSS、Previous/Next、Date/Latest/Archive |
| Weekly Brief | Done / First Release | Weekly Schema、Reading、7..11 页 Slides、RSS/Archive/Topic |
| Presentation Platform | Done | Descriptor、Template Registry、mixed build |
| Archive / Discovery / Navigation | Done / Mature | Homepage、Archive、Slides、cadence indexes、Related |
| Source / Author Identity | Done | canonical IDs、Registry、Referential Integrity、Governance |
| Registry-backed Reading UI | Done | AuthorByline、Source metadata、archived/unsourced contracts |
| SEO URL / Sharing Foundation | Done | canonical、Preview noindex、OG/Twitter、Sitemap、RSS、Slide/alias identity |
| Structured Data | Merged / Production Gate | WebSite、Essay Article + Author Registry、Brief Article、Knowledge TechArticle |
| Knowledge Lifecycle | Planned / Next | review/expiry tooling |
| Scheduled Automation | Planned | scheduled Agent PR orchestration |

## 5. Product Capability Roadmap

### Milestone A — Discoverable Orbis · Done
Plan 10，PR #8 / #9 / #10。

### Milestone B — Presentation Platform · Done
Plan 20，PR #11 / #12。

### Milestone C — Weekly Intelligence · Done
Plan 30，PR #13 / #14。

### Milestone D — Knowledge Identity · Done
Plan 40，PR #15 / #19。

### Milestone E — Search & Share Ready · Production Gate
Plan 50。

```text
50A SEO Foundation              Done · PR #21
  canonical / robots
  Open Graph / Twitter
  Sitemap
  RSS identity
  Slide / alias canonical
  Production exact-SHA deploy/smoke

50B Structured Data             Merged · PR #22 · Production Gate
  WebSite JSON-LD
  Essay Article + Author Registry
  Brief Article
  Knowledge TechArticle
  canonical consistency / Preview-safe validation
  fresh main Build success
  Production exact-SHA deploy/smoke pending
```

50B 继续消费 50A 已稳定的 Production canonical，没有创建第二套 URL identity。

### Milestone F — Durable Knowledge · Planned / Next
Plan 60。

只有 Plan 50 Production Gate 通过后，Milestone F 才正式成为 Current。

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
