# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-04
> 基线提交：`main@3c5cc91974cea388b87b779f3e367b4c114d7a6c`
> 当前目标：Milestone G — Sustainable Automation / 70C Soak Active

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
- ChatGPT Scheduler / Producer adapter + first real transport proof（70B）。

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
main Artifact                9920458469
main Artifact SHA-256        eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

70A 建立 deletion/rename-safe Path Guard、explicit target identity、exact Daily guard、published-main protection、provider-neutral decision/report metadata 与 mandatory read-only Preview enforcement。

### Plan 70B · Done

70B 把 provider-specific 行为限制在薄 ChatGPT adapter，不回写 repository core。

```text
PR                           #26 merged
feature head                 515295cef40636a2300d5043d592fa8c6e2388a2
main after #26               6419b3dfeeb3caa7f3f577351728a0e8dd780d91
RED                          33827531033 adapter entry missing
final PR Build               33827615741 success
Trusted Preview              33827736463 success
post-merge Site Build        33845663516 success
```

Existing Scheduled Task 已迁移并启用：

```text
Task                         Agent 前沿资讯
Timezone                     Asia/Shanghai
Cadence                      daily
State                        enabled
Bootstrap                    current Orbis main adapter
Notification settings        preserved
Competing second task        none
```

旧 `XiaoDaoJiang/ai-frontier` HTML 发布行为已从 active task prompt 中移除。

#### First real transport proof — PR #27

```text
targetDate                   2026-09-04
branch                       automation/daily/2026-09-04
content                      content/briefs/2026-09-04.yaml
changed files                exactly 1
outcome                      candidate-created
final head                   f9bb8ef5f54cb1623ab582057d54e5507b0b299a
merge ref                    d91e8ac2aeca17bdac6a36eb78ce3ec989f605fa
integration base             3c5cc91974cea388b87b779f3e367b4c114d7a6c
PR Preview Build             33857483693 success
Preview Artifact             9930821104
Artifact SHA-256             909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

Final logs proved：

- exact one-file Daily diff；
- Scheduled Daily Guard passed；
- current merge-ref integration base correctly resolved；
- Schema / content validation / Astro / Slidev / assembly / site artifact checks passed；
- `Weekly=2026-09-01, Daily latest=2026-09-04` ordering passed；
- Daily-only archive/latest semantics remained correct；
- Trusted Preview public smoke passed。

因此 **70B Done**。

#### First-cycle hardening

首个真实周期暴露并修复两处 repository regression：

```text
PR #28  weekly artifact real-date-order fix
         main → 2b93744c491466ff6ce06b28cd2bdefba0e9c79c
         fresh Site Build → 33854389852 success

PR #29  PR Preview integration-base fix
         main → 3c5cc91974cea388b87b779f3e367b4c114d7a6c
         fresh Site Build → 33857265076 success
         Artifact → 9930724616
         SHA-256 → 1028492c557ae5309562430f2216ac9306b731e340f3e1adda0b203e7b450c0b
```

两次修复均独立于 automation content branch，没有扩大 Scheduled Daily 或 Production authority。

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
| Scheduled Automation 70B | Done | ChatGPT adapter；task migrated/enabled；first real branch/file/PR/CI/Trusted Preview proof |
| Scheduled Automation 70C | Soak Active | 3-cycle stability + rerun/no-write/correction drills；stable count 0/3 |

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
70C Real-cycle Soak            Active · stable 0 / 3
        ↓
3 consecutive stable cycles
+ idempotency drill
+ already-published no-write drill
+ correction drill
        ↓
Milestone G Done
```

PR #27 是 **Cycle 0 / transport proof**。由于首周期需要 #28 / #29 基础设施 hardening，它不计入 70C 的三个连续稳定周期。

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
70B                           Done · PR #26 + real proof #27
first-cycle hardening         Done · PR #28 / #29
current main                  3c5cc91974cea388b87b779f3e367b4c114d7a6c
70C                           Soak Active · stable 0 / 3
next                          next eligible Daily → Stable Cycle 1 / 3 if no infrastructure repair
```

70C 仍需完成：

- [ ] Stable Cycle 1 / 3；
- [ ] Stable Cycle 2 / 3；
- [ ] Stable Cycle 3 / 3；
- [ ] same-day rerun / idempotency drill；
- [ ] published Daily `already-published` no-write drill；
- [ ] explicit correction workflow drill。
