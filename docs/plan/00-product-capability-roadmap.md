# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-02
> 基线提交：`main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> 当前目标：Milestone F — Durable Knowledge / Plan 60 Design Review

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
- WebSite / Essay Article / Brief Article / Knowledge TechArticle JSON-LD。

Plan 50 最终状态：

```text
main SHA                         bb85751266f90ec25e56f087bd078a935d8f31cd
50A merge PR                     #21
50A Production Pages             33588705346   success
50B merge PR                     #22
50B merge time                   2026-09-02T07:03:38Z
50B post-merge Site Build        33601715928   success
50B main Artifact                9835467039
Main Artifact SHA-256            eea4501fb7f88032aa920f140a955e5ac5d171afddbab14179a06eca181f65f3
50B Production Pages             33603472306   success
Production Pages Artifact        9836095734
Production Artifact SHA-256      928b4f27d65a143dc0faa4d203e99ec40becc08dab9e92cbb8af073e9e39e481
```

Production run `33603472306` 精确 checkout / deploy `main@bb85751266f90ec25e56f087bd078a935d8f31cd`，Pages deployment 记录 `pages_build_version=bb85751266f90ec25e56f087bd078a935d8f31cd`。Build 与 Deploy 均 success，公网 smoke：

```text
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/08/28/
```

同一 Production build 再次通过：

```text
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

因此 **Milestone E — Search & Share Ready / Plan 50 已 Done**。当前正式进入 Milestone F / Plan 60 的设计阶段。

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
    ↓
Durable Knowledge Lifecycle
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
              ↓
    Knowledge Lifecycle · Plan 60
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
| Structured Data | Done | WebSite、Essay Article + Author Registry、Brief Article、Knowledge TechArticle |
| Knowledge Lifecycle | Current / Design Review | review、expiry、supersession、durable Knowledge UI |
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

### Milestone E — Search & Share Ready · Done
Plan 50，PR #21 / #22。

```text
50A SEO Foundation              Done · PR #21
  canonical / robots
  Open Graph / Twitter
  Sitemap
  RSS identity
  Slide / alias canonical

50B Structured Data             Done · PR #22
  WebSite JSON-LD
  Essay Article + Author Registry
  Brief Article
  Knowledge TechArticle
  canonical consistency / Preview-safe validation

Final Production Gate           Done
  main  bb85751266f90ec25e56f087bd078a935d8f31cd
  run   33603472306
  Build / Deploy / public smoke success
```

### Milestone F — Durable Knowledge · Current / Design Review
Plan 60。

下一步先锁定 Knowledge lifecycle 的产品语义与时间模型，再进入 Schema / tooling / UI 实现，不在设计未批准前开始代码修改。

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
