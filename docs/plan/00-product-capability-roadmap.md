# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-03
> 基线提交：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> 当前目标：Milestone F — Durable Knowledge / Final Production Gate

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
- Knowledge lifecycle evaluator、supersession relation、review report；
- Knowledge lifecycle Index/Detail UI、stable needs-review/archived routes 与 replacement navigation。

Plan 60 当前状态：

```text
main SHA                         89c7f8fe6d5da972c0f54b1367df252aa00cf286
60A                              Done · PR #23
60B merge PR                     #24
60B merge time                   2026-09-03T05:50:21Z
60B post-merge Site Build        33720559711   success
60B main Artifact                9880102491
Artifact SHA-256                 89603fae5eb5be3d879fd682cfb381695f6406a6b9c6b47ba92a140d78ab895a
Plan 60 Production Pages         pending exact-SHA deploy=true gate
Plan 70                          next after gate
```

Fresh main Build 再次通过：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
Knowledge lifecycle Web adapter contract passed
Knowledge lifecycle fixed-date UI fixture contract passed
Knowledge lifecycle UI artifact contract passed
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

并执行真实 review report：

```text
Knowledge review report · 2026-09-03
current=1 due-soon=0 overdue=0 needs-review=0
OK verification-loop · status=active · review=2026-11-01 · current (59d)
```

因此 Milestone F 的代码与 main 集成已完成，只剩 exact-SHA Production Pages Build → Deploy → public Smoke。

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
 Knowledge Lifecycle UI
 current / attention / historical + replacement navigation
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
| Knowledge Lifecycle Contract | Done | review evaluator、supersededBy、derived supersedes、review report |
| Knowledge Lifecycle UI | Merged / Production Gate | lifecycle groups、status/health UI、stable historical routes、replacement navigation |
| Scheduled Automation | Planned / Next | scheduled Agent PR orchestration |

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

### Milestone F — Durable Knowledge · Production Gate
Plan 60。

```text
60A Knowledge Lifecycle Contract     Done · PR #23
60B Knowledge Lifecycle UI           Merged · PR #24
  Web lifecycle adapter reuses 60A logic
  lifecycle summary + Current / Attention / Historical
  explicit editorial status / derived review health
  stable needs-review / archived detail routes
  overdue / due-soon / archived notices
  replacement + inverse supersedes navigation
  fixed-date fixture + final artifact contracts
  fresh main Build success
  Production exact-SHA deploy/smoke pending
```

### Milestone G — Sustainable Automation · Planned / Next after gate
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
