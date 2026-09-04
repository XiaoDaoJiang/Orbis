# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-04
> 基线提交：`main@1fcdc4caecc234af7ef2426e4c9d320513eb2efb`
> 当前目标：Milestone G — Sustainable Automation / 70B Review Gate

## 1. 当前阶段判断

Orbis 已完成：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily / Weekly / standalone Presentation 多形态发布；
- Archive / Slides / cadence / Homepage discovery；
- Daily-only stable date / latest / archive.json；
- Path Guard + CODEOWNERS + scheduled-agent governance；
- read-only PR Build → Trusted Preview → Public Smoke；
- governed GitHub Pages Production；
- Source / Author Registry + Referential Integrity + Registry-backed Reading UI；
- canonical / OG / Twitter / Sitemap / RSS / JSON-LD；
- Knowledge lifecycle contract + UI + exact-SHA Production closeout；
- Scheduled Daily repository-side least-privilege contract（Plan 70A）。

### Plan 60 / Milestone F · Done

```text
main SHA                    89c7f8fe6d5da972c0f54b1367df252aa00cf286
60A                          Done · PR #23
60B                          Done · PR #24
Production Pages             33734815132 success
Production Artifact          9885335098
Production Artifact SHA-256  7caba4bb2d7a82f02c084af036f219cb2d8484ad6ccbfd4724a7c29d5e168e55
```

### Plan 70A · Done

PR #25 已合并到：

```text
main                         1fcdc4caecc234af7ef2426e4c9d320513eb2efb
feature head                 f7a7c60daf766dafbca3e9b7cbee06c569bbb535
final PR Build               33738006368 success
Trusted Preview              33738176374 success
post-merge Site Build        33827357380 success
main Artifact                9920458469
main Artifact SHA-256        eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

70A 已建立：

- deletion / rename-safe Path Guard；
- explicit Asia/Shanghai `targetDate` contract；
- deterministic `automation/daily/YYYY-MM-DD` identity；
- exact `content/briefs/YYYY-MM-DD.yaml` guard；
- published-main overwrite / revision / correction boundary；
- provider-neutral decision + run report + PR metadata；
- read-only PR Preview 对 `automation/daily/**` 的 mandatory guard。

70A 不改变公开站点输出，所以 fresh main full Build 通过后无需额外 Production Pages deploy。

### Plan 70B · Review Gate

70B 不把 Provider 细节放回 repository core，而是增加薄 ChatGPT adapter。

```text
branch                       feat/chatgpt-scheduled-daily-adapter
PR                           #26 Ready for Review
final head                   515295cef40636a2300d5043d592fa8c6e2388a2
RED                          33827531033 adapter entry missing
final PR Build               33827615741 success
Preview Artifact             9920550137
Preview Artifact SHA-256     6ae074aab9863647bccdadbee63d2048cacd4b464f2c1edbdb80d88e212273d0
Trusted Preview              33827736463 success
```

70B Repository 侧只新增：

- thin `config/adapters/chatgpt-scheduled-daily.md`；
- focused adapter drift contract；
- provider operations runbook。

已确认现有 ChatGPT task `Agent 前沿资讯` 仍存在，Asia/Shanghai daily cadence，当前 disabled，但仍携带退役 `XiaoDaoJiang/ai-frontier` HTML 发布 prompt。该 task 不会被复制；#26 合并并通过 fresh main 后，才迁移并启用它。

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
Canonical / Share Identity / Structured Data
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
             ↓
 Astro Web + Presentation Platform
             ↓
 Canonical / SEO / RSS / JSON-LD
             ↓
 Knowledge Lifecycle
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
| Archive / Discovery | Done | Homepage、Archive、Slides、cadence indexes、Related |
| Source / Author Identity | Done | canonical IDs、Registry、Referential Integrity |
| SEO / Structured Data | Done | canonical、OG/Twitter、Sitemap、RSS、JSON-LD |
| Knowledge Lifecycle | Done | evaluator、supersession、review report、UI、stable historical routes |
| Scheduled Automation 70A | Done | exact Daily identity、idempotency decisions、least-privilege guard、PR metadata、Preview enforcement |
| Scheduled Automation 70B | Review Gate | thin ChatGPT adapter + connected GitHub transport contract |
| Scheduled Automation 70C | Next | real three-cycle soak + rerun/no-write/correction drills |

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

### Milestone G — Sustainable Automation · In Progress
Plan 70。

```text
70A Repository Contract          Done · PR #25
        ↓
70B ChatGPT Provider Adapter     Ready for Review · PR #26
        ↓
external task migration + first real transport proof
        ↓
70C three-cycle real validation
```

Design：`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`。

70A Plan：`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`。

70B Plan：`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`。

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
70A                           Done · PR #25
70B implementation           Complete
70B full PR Build            Passed · 33827615741
70B Trusted Preview          Passed · 33827736463
70B PR                       #26 Ready for Review
next                         human merge #26 → fresh main → migrate/enable existing ChatGPT task
```
