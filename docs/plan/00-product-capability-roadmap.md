# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-02
> 基线提交：`main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> 当前目标：Milestone F — Durable Knowledge / 60A Production Gate

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
- Sitemap / RSS / Slidev canonical identity；
- WebSite / Essay Article / Brief Article / Knowledge TechArticle JSON-LD；
- Knowledge lifecycle evaluator、supersession relation 与 review report 已进入 `main`。

Plan 60 当前状态：

```text
main SHA                         f468a45049035bc7816a52225ca41f4f381b0ae6
60A merge PR                     #23
60A merge time                   2026-09-02T09:34:57Z
60A post-merge Site Build        33614900003   success
60A main Artifact                9840548845
Artifact SHA-256                 ca3f942db3466e0634da8e724a18e4c333d46ef274246dd8d5acf31d74101541
60A Production Pages             pending exact-SHA deploy=true gate
60B Knowledge Lifecycle UI       next after gate
```

Fresh main Build 再次通过：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

并执行真实 review report：

```text
Knowledge review report · 2026-09-02
current=1 due-soon=0 overdue=0 needs-review=0
OK verification-loop · status=active · review=2026-11-01 · current (60d)
```

因此 Milestone F 已进入实施阶段，但 60A 仍需 exact-SHA Production Pages Build → Deploy → public Smoke 后才能标记 Done。

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
 Topic / Source / Author / Knowledge replacement
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
 Knowledge Lifecycle
  editorial state + review health + report
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
| Structured Data | Done | WebSite、Essay Article + Author Registry、Brief Article、Knowledge TechArticle |
| Knowledge Lifecycle Contract | Merged / Production Gate | review evaluator、supersededBy、derived supersedes、review report |
| Knowledge Lifecycle UI | Planned / Next | status/health UI、replacement notices、stable archived routes |
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

### Milestone F — Durable Knowledge · In Progress
Plan 60。

```text
60A Knowledge Lifecycle Contract     Merged · PR #23 · Production Gate
  editorial state / review health separation
  deterministic UTC review evaluator
  due-soon / overdue advisory semantics
  supersededBy canonical relation
  derived supersedes[]
  machine/human readable review report
  fresh main Build success
  Production exact-SHA deploy/smoke pending

60B Knowledge Lifecycle UI           Next after 60A gate
  Knowledge index lifecycle groups
  editorial status / review health presentation
  archived / superseded notices
  replacement navigation
  artifact contracts
```

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
