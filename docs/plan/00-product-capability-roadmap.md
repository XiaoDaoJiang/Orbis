# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-07
> 基线提交：`main@3c5cc91974cea388b87b779f3e367b4c114d7a6c`
> 当前目标：Milestone G — Sustainable Automation / 70C Drills Gate

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
- Scheduled Daily repository-side least-privilege contract（70A）；
- ChatGPT Scheduler / Producer adapter + first real transport proof（70B）；
- three consecutive no-infrastructure-repair Scheduled Daily cycles（70C stability 3/3）。

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

```text
PR                           #25 merged
main                         1fcdc4caecc234af7ef2426e4c9d320513eb2efb
final PR Build               33738006368 success
Trusted Preview              33738176374 success
post-merge Site Build        33827357380 success
```

### Plan 70B · Done

```text
PR                           #26 merged
main after #26               6419b3dfeeb3caa7f3f577351728a0e8dd780d91
final PR Build               33827615741 success
Trusted Preview              33827736463 success
post-merge Site Build        33845663516 success
```

Existing Scheduled Task：

```text
Task                         Agent 前沿资讯
Timezone                     Asia/Shanghai
Cadence                      daily
State                        enabled
Bootstrap                    current Orbis main adapter
Competing second task        none
```

First real transport proof：

```text
PR                           #27
Target                       2026-09-04
changed files                exactly 1
PR Preview Build             33857483693 success
Preview Artifact             9930821104
Artifact SHA-256             909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

Cycle 0 同时发现并通过 PR #28 / #29 修复两个 repository regression；两次修复均独立于 automation content branch，没有扩大 Scheduled Daily / Production authority。

### Plan 70C · Stability 3/3 Done

Cycle 0（PR #27）因需要 infrastructure hardening 不计入稳定周期。

随后：

```text
Stable Cycle 1 / 3
  date                       2026-09-05
  PR                         #30
  exact file                 content/briefs/2026-09-05.yaml
  PR Preview Build           33933722915 success
  Artifact                   9959459260
  SHA-256                    6b3bba0b8594dacdc93b66ec21cb33dfe61acb983850eb910b485c8da9c0c458
  Trusted Preview            public smoke passed

Stable Cycle 2 / 3
  date                       2026-09-06
  PR                         #31
  exact file                 content/briefs/2026-09-06.yaml
  PR Preview Build           34001239220 success
  Artifact                   9979564620
  SHA-256                    8a1e5e2c972a13c0dfb9562a8b03846dbfb3424e1e8c4f0fb9663189ad06fcfa
  Trusted Preview            public smoke passed

Stable Cycle 3 / 3
  date                       2026-09-07
  PR                         #32
  exact file                 content/briefs/2026-09-07.yaml
  final PR Preview Build     34069576275 success
  Artifact                   10000034839
  SHA-256                    e641c0703ce4ae95f29b1ce2d7984cac7a73ec54fb498d72f80f82cae73a5838
  Trusted Preview            public smoke passed
```

9/7 首次 candidate 因内容 Source ID 不满足既有 Registry contract 被拒绝，Producer 在同一 deterministic branch / PR 中修正目标 Daily 后转绿；没有 infrastructure repair，因此仍属于 Stable Cycle 3。该行为发生在同一 Scheduled Task run 内，不计作独立 rerun drill。

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
| Scheduled Automation 70A | Done | exact Daily identity、least-privilege guard、PR metadata、Preview enforcement |
| Scheduled Automation 70B | Done | ChatGPT adapter；task migrated/enabled；first real transport proof |
| Scheduled Automation 70C | Drills Gate | three stable cycles 3/3 done；rerun/no-write/correction pending |

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
70A Repository Contract        Done · PR #25
        ↓
70B ChatGPT Provider Adapter   Done · PR #26 + proof #27
        ↓
70C Stability                  Done · 3 / 3 (#30 / #31 / #32)
        ↓
same-day rerun / idempotency
+ already-published no-write
+ explicit correction
        ↓
Milestone G Done
```

## 6. 当前 integration / drills gate

四个 Daily candidate 当前仍在 Human / Policy Review 边界之外等待合并：

```text
#27  2026-09-04
#30  2026-09-05
#31  2026-09-06
#32  2026-09-07
```

推荐按日期顺序集成。由于它们最初均基于同一个 `main@3c5cc91974cea388b87b779f3e367b4c114d7a6c` 生成，每次前一个 PR 合并后，下一个 PR 必须基于新的 current main 做 same-tree revalidation，再进入人工 merge gate。

至少一个 Daily 进入 `main` 后，再完成：

- [ ] same-day rerun / idempotency drill；
- [ ] published Daily `already-published` no-write drill；
- [ ] explicit correction workflow drill。

这些演练全部完成后，Plan 70 / Milestone G 才可标记 Done。

## 7. 当前不建设

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
