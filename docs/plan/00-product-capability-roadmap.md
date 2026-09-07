# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-07
> 基线提交：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> 当前目标：Milestone G — Sustainable Automation · Done / 下一阶段规划

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
- ChatGPT Scheduler / Producer adapter + real transport proof（70B）；
- three consecutive no-infrastructure-repair Scheduled Daily cycles（70C stability 3/3）；
- same-day rerun / deterministic idempotency；
- published Daily `already-published` zero-write protection；
- explicit published correction workflow + Human merge + corrected-main Build。

## 2. 已完成 Milestones

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
main SHA                    89c7f8fe6d5da972c0f54b1367df252aa00cf286
Production Pages            33734815132 success
Production Artifact         9885335098
Artifact SHA-256            7caba4bb2d7a82f02c084af036f219cb2d8484ad6ccbfd4724a7c29d5e168e55
```

### Milestone G — Sustainable Automation · Done
Plan 70。

```text
70A Repository Contract        Done · PR #25
        ↓
70B ChatGPT Provider Adapter   Done · PR #26 + proof #27
        ↓
70C Stability                  Done · 3 / 3 (#30 / #31 / #32)
        ↓
same-day rerun / idempotency  Passed
        ↓
already-published no-write     Passed
        ↓
explicit correction            Passed · PR #33
        ↓
Human correction merge         Passed
        ↓
corrected main Build           Passed
        ↓
Milestone G Done
```

最终生产基线：

```text
main                         b3e793d0c5c7d55358933d4d25c4d77dafd8cd03
fresh Site Build             34090549723 success
Artifact                     10006713925
Artifact SHA-256             8c56125aea23914874a908550d98675f9d8218c820a7545ead9d2d13929b10af
```

## 3. Milestone G 关键证据

### 70A · Repository Contract

```text
PR                           #25 merged
main after merge             1fcdc4caecc234af7ef2426e4c9d320513eb2efb
PR Build                     33738006368 success
Trusted Preview              33738176374 success
post-merge Site Build        33827357380 success
```

### 70B · ChatGPT Scheduled Daily Adapter

```text
PR                           #26 merged
main after merge             6419b3dfeeb3caa7f3f577351728a0e8dd780d91
PR Build                     33827615741 success
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

### Cycle 0 / transport proof

```text
PR                           #27
Target                       2026-09-04
changed files                exactly 1
PR Preview Build             33857483693 success
Artifact                     9930821104
SHA-256                      909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

Cycle 0 发现并通过 PR #28 / #29 修复两个 repository regression；修复独立于 automation candidate，因此不计稳定 cycle。

### 70C · Stable 3/3

```text
Stable Cycle 1 / 3
  date                       2026-09-05
  PR                         #30
  exact file                 content/briefs/2026-09-05.yaml
  original Build             33933722915 success
  current-main revalidation  34077910480 success

Stable Cycle 2 / 3
  date                       2026-09-06
  PR                         #31
  exact file                 content/briefs/2026-09-06.yaml
  original Build             34001239220 success
  current-main revalidation  34078356383 success

Stable Cycle 3 / 3
  date                       2026-09-07
  PR                         #32
  exact file                 content/briefs/2026-09-07.yaml
  original Build             34069576275 success
  current-main revalidation  34078845565 success
```

所有 current-main revalidation 使用 same-tree commit，仅刷新 merge ref / CI，不改变 Producer content。

### Same-day rerun / idempotency · Passed

独立用户 `Run now` 在 owned open candidate 上收敛到同一 branch / PR：

```text
targetDate                   2026-09-07
outcome                      candidate-updated
branch                       automation/daily/2026-09-07
PR                           #32
new competing branch         0
new competing PR             0
PR Preview Build             34076897189 success
Artifact                     10002401922
SHA-256                      62b1ad49c301a58efae7e80bd7553e73bb0612e648962bd659bc4cc9112eef48
```

### Published `already-published` / zero write · Passed

PR #32 合并后再次运行：

```text
targetDate                   2026-09-07
outcome                      already-published
main write                   0
branch write                 0
new branch                   0
new PR                       0
merge                        0
Production Pages             0
```

前后独立核验：

```text
main                         6411076d1769b96f6e26b6fd5c6c005c78aad9e8
9/7 automation branch        b092233168dabb947734fe0d078a44744f277257
open 9/7 automation PR       none
```

### Explicit correction · Passed

真实事实修正：2026-09-07 Brief 对 OpenClaw `OPENCLAW_SUPERVISOR_MODE=external` 的首次版本归因不准确。正常 Scheduled Daily 已先证明 published no-write；历史修改随后显式分流到 correction branch。

```text
branch                       correction/daily/2026-09-07/openclaw-supervisor-version
PR                           #33
head                         a73ef682ac4e3f7dacefe68dc0bd7706ec5296d7
changed files                exactly 1
PR Preview Build             34088014693 success
Artifact                     10005904775
SHA-256                      de54c7a5374e7806395f077b6fd26c0621b17da04da27446c6acc9931619ef2a
Trusted Preview              34088175467 success
Human merge                  b3e793d0c5c7d55358933d4d25c4d77dafd8cd03
fresh main Build             34090549723 success
```

Correction 只经过 generic Path Guard；Scheduled Daily exact guard 在 correction branch 上明确 skipped，保持 authority separation。

## 4. 产品定义

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

## 5. 当前稳态架构

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

Scheduled Content Automation 只负责“候选内容进入仓库”的受控入口，不改变 `content/** → dist/site` 发布图，也不拥有 Production deploy authority。

## 6. 能力状态

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| Monorepo / Build Foundation | Done | Astro + Slidev + pnpm Workspace |
| Structured Content | Done | Brief、Essay、Knowledge、Topic、Presentation、Source、Author |
| Daily Brief | Done / Mature | Reading、11 页 Slides、RSS、Previous/Next、Date/Latest/Archive |
| Weekly Brief | Done / First Release | Weekly Schema、Reading、Slides、RSS/Archive/Topic |
| Presentation Platform | Done | Descriptor、Template Registry、mixed build |
| Archive / Discovery | Done | Homepage、Archive、Slides、cadence indexes、Related |
| Source / Author Identity | Done | canonical IDs、Registry、Referential Integrity |
| SEO / Structured Data | Done | canonical、OG/Twitter、Sitemap、RSS、JSON-LD |
| Knowledge Lifecycle | Done | evaluator、supersession、review report、UI、stable historical routes |
| Scheduled Automation 70A | Done | exact Daily identity、least-privilege guard、PR metadata、Preview enforcement |
| Scheduled Automation 70B | Done | ChatGPT adapter；task migrated/enabled；real transport proof |
| Scheduled Automation 70C | Done | stable 3/3；rerun；published no-write；explicit correction |

## 7. 当前产品基线

```text
Structured Content + Registry
          ↓
Referential Integrity
          ↓
Reading / Presentation / RSS / Discovery
          ↓
SEO / Structured Data
          ↓
Knowledge Lifecycle · Done
          ↓
Scheduled Content Automation · Done
```

Orbis 当前已形成一个完整、最小权限、可审计的 Git-native 内容生产与发布闭环。

## 8. 下一阶段

Milestone G 完成后，不自动假设下一个实现主题，也不直接创建 Plan 80。

下一轮 Product Capability Planning 应先回答：

1. 当前真实使用中最明显的能力缺口是什么；
2. 缺口是否应在 Orbis 内解决，还是由外部工具承担；
3. 是否需要新的 content model、workflow authority 或 UI；
4. 是否有足够真实证据支持增加复杂度；
5. 新 milestone 的验收标准能否被自动化验证。

在新的设计得到批准前，以下内容仍保持非目标：

- Scheduled Agent 自动 merge / Pages deploy；
- 多 Provider orchestration platform；
- 数据库任务队列；
- 新 CMS；
- 服务端 Runtime；
- 自动改写已发布历史；
- 自动 Source / Author / Topic Registry mutation；
- 复杂搜索服务；
- Citation graph database；
- 可视化 Slide Editor。

**当前状态：Milestone G — Sustainable Automation · Done。下一步进入新的 Product Capability discovery / roadmap refresh。**