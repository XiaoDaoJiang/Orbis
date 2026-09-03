# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-03
> 基线提交：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> 当前目标：Milestone G — Sustainable Automation / 70A Review Gate

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
- Knowledge lifecycle Index/Detail UI、stable needs-review/archived routes 与 replacement navigation；
- Plan 60 exact-SHA Production Pages closeout。

Plan 60 / Milestone F 当前状态：

```text
main SHA                         89c7f8fe6d5da972c0f54b1367df252aa00cf286
60A                              Done · PR #23
60B                              Done · PR #24
post-merge Site Build            33720559711 success
main Artifact                    9880102491
Production Pages                 33734815132 success
Production Artifact              9885335098
Production Artifact SHA-256      7caba4bb2d7a82f02c084af036f219cb2d8484ad6ccbfd4724a7c29d5e168e55
```

Production Pages 对 exact main SHA 完成 Build → Deploy → public Smoke，因此 Milestone F 正式 Done。

Plan 70 已完成设计确认并进入实施。70A Repository Contract 已在 PR #25 完成：

```text
feature head                     f7a7c60daf766dafbca3e9b7cbee06c569bbb535
PR                               #25 Ready for Review
final PR Build                   33738006368 success
Preview Artifact                 9886587297
Preview Artifact SHA-256         90f62f91865bc5fcb504c594d53a301fa12ff82657d4674a4789d883bcbc134d
Trusted Preview Publish          33738176374 success
```

70A 已建立：

- deletion / rename-safe Path Guard；
- explicit targetDate；
- exact Daily branch/path identity；
- exact-target Scheduled Daily guard；
- published-main overwrite / revision / correction boundary；
- provider-neutral decision + report + PR metadata；
- read-only PR Preview 中对 `automation/daily/**` 的 mandatory guard；
- real Git change-set security regression。

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
    ↓
Least-Privilege Scheduled Content Automation
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

Plan 70 只增加“候选内容进入仓库”的安全自动化，不改变 `content/** → dist/site` 发布图。

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
| Knowledge Lifecycle UI | Done | lifecycle groups、status/health UI、stable historical routes、replacement navigation |
| Scheduled Automation 70A | Ready for Review | exact Daily identity、idempotency decisions、least-privilege guard、PR metadata、Preview enforcement |
| Scheduled Automation 70B | Next | Scheduler / Producer transport + one-branch / one-PR orchestration |

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

### Milestone F — Durable Knowledge · Done
Plan 60，PR #23 / #24。

```text
60A Knowledge Lifecycle Contract     Done · PR #23
60B Knowledge Lifecycle UI           Done · PR #24
Production Pages                     33734815132 success
```

### Milestone G — Sustainable Automation · In Progress
Plan 70。

```text
70A Repository Contract
  explicit Asia/Shanghai targetDate contract
  deterministic automation/daily/YYYY-MM-DD identity
  exact content/briefs/YYYY-MM-DD.yaml guard
  deletion / rename-safe Path Guard
  published-main overwrite protection
  provider-neutral report / PR metadata
  mandatory read-only Preview guard
  full Build + Trusted Preview green
  → PR #25 Ready for Review

70B Scheduler / Producer transport
  → next after #25 merge

70C three-cycle real validation
  → after 70B
```

Design：`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`。

70A Implementation Plan：`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`。

## 6. 当前不建设

- 数据库 / CMS / 服务端 Runtime；
- 登录、收藏和个性化推荐；
- 可视化 Slide Editor；
- 自动信任评分；
- Citation graph database；
- Source / Author 独立目录与反向聚合；
- 动态 OG image 服务；
- 复杂搜索服务；
- Scheduled Agent 自动 merge / Pages deploy；
- 首版多 Provider 自动化平台。

## 7. 当前 Gate

```text
Plan 60 / Milestone F        Done
Plan 70 design               Approved
70A implementation           Complete
70A full PR Build            Passed · 33738006368
70A Trusted Preview          Passed · 33738176374
70A PR                       #25 Ready for Review
next                         human merge #25 → fresh main verification → 70B
```
