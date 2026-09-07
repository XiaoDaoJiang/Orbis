# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-07
> 基线提交：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> 当前目标：Product Capability Roadmap Refresh → **Milestone H — Evidence Integrity · Recommended / Design Review Gate**

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

因此 Orbis 已经不再处于基础设施补齐阶段。Milestone G 完成后，下一步不能按编号惯性创建 `Plan 80`，而应先根据真实使用证据重新判断下一个值得建设的产品能力。

当前 Roadmap Refresh 决策记录：

- [`2026-09-07 · Product Capability Roadmap Refresh`](./2026-09-07-product-capability-roadmap-refresh.md)
- 推荐下一 Milestone：**Milestone H — Evidence Integrity**
- 当前 Gate：**Design Review**
- 设计批准前：**不创建 `Plan 80`，不改 Schema，不扩大 Scheduled authority**

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

最终验证基线：

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

Plan 70 保存完整 70A / 70B / 70C、rerun、published no-write 与 correction closeout 证据，本 Roadmap 不再重复所有 workflow run 明细。

## 3. Roadmap Refresh 的真实证据

Milestone G 完成后，当前最重要的新证据不是另一项基础设施缺失，而是 **PR #33 的真实 published correction**。

2026-09-07 Daily 首版把 OpenClaw `OPENCLAW_SUPERVISOR_MODE=external` 的引入归因到 `v2026.9.2`；随后一手 release 证据确认该能力在 `v2026.7.2-beta.2` 已经存在。

Correction workflow 本身工作正常：

```text
normal Scheduled Daily       already-published / zero write
correction branch            explicit correction/daily/...
changed files                exactly 1
Path Guard                   passed
Scheduled Daily exact guard  skipped by design
PR Build                     passed
Trusted Preview              passed
Human merge                  passed
fresh main Build             passed
```

这个真实事件说明：

```text
Repository / transport safety     已成熟
Reference / Source identity       已成熟
Primary-source requirement        已存在
Schema / Build / Preview          已成熟
                                  ↓
Claim 与 Evidence 的精确绑定      仍是缺口
Correction 的内容级 provenance    仍是缺口
```

当前 `facts[]` 仍是字符串数组；`references[]` 与 `Reference.supports` 能说明某个来源大致支撑什么，但没有机器可检查的 claim → reference edge。因此 build 能检查“Source ID 是否存在”，不能检查“具体 factual claim 是否绑定到了正确、明确的 evidence”。

这不是要让机器自动判断事实真假，而是要缩小人工 Review 的模糊区域，并让 correction 成为正式内容语义。

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

Roadmap Refresh 后，下一层建议演进为：

```text
Least-Privilege Scheduled Content Automation
    ↓
Claim-level Evidence Integrity
    ↓
Auditable Correction Provenance
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

下一 Milestone 也必须保持这个约束：Evidence Integrity 只能增强结构化内容合同、构建检查和 Reading UI，不建立新的服务端 authority。

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
| Claim → Evidence Integrity | Gap confirmed | Reference 存在，但 claim-level binding 尚不可机器检查 |
| Correction Provenance | Gap confirmed | correction workflow 已存在，但内容模型 / Reading UI 尚无正式修正语义 |
| Static Full-text Search | Candidate | 长期价值高，但暂无真实检索失败证据 |
| Weekly Scheduled Automation | Candidate | Weekly model 已存在，但暂无重复人工执行痛点证据 |

## 7. Roadmap Refresh 排序

| 候选 | 真实证据 | 核心契合度 | 可自动验收 | Authority 增量 | 决策 |
|---|---:|---:|---:|---:|---|
| Evidence Integrity / Correction Provenance | **高** | **高** | **高** | 低 | **Recommended** |
| Static Search / Full-text Retrieval | 低 | 高 | 高 | 低 | Defer |
| Weekly Scheduled Automation | 低 | 中高 | 高 | 中 | Defer |
| Source / Author Directory | 低 | 中 | 高 | 低 | Defer |
| Automatic Registry Mutation | 无 | 低 | 中 | **高** | Reject for now |
| Multi-provider orchestration | 无 | 低 | 中 | **高** | Reject for now |
| Citation graph database | 无 | 低 | 中 | 高 | Reject for now |
| Visual Slide Editor | 无 | 低 | 中 | 中 | Reject for now |

当前判断不是“Search 不重要”或“Weekly 不需要自动化”，而是它们尚未拥有比 PR #33 更强的真实使用证据。

## 8. 推荐下一 Milestone

### Milestone H — Evidence Integrity · Recommended

目标：让重要 factual claim 具有结构化、可审计、可检查的 evidence binding，并让 published correction 成为正式内容语义。

建议边界：

```text
H1 Claim → Evidence Contract
   - stable claim identity
   - explicit claim → reference binding
   - missing / dangling relation fatal validation
   - deterministic coverage report

H2 Correction Provenance
   - revision metadata
   - correction summary
   - corrected claim / section identity
   - evidence binding
   - stable canonical URL
   - reader-visible correction notice

H3 Review Artifact
   - human-readable evidence report
   - machine-readable evidence report
   - CI / Artifact contract checks
```

首轮应优先从 Daily 开始，因为真实缺口来自 Scheduled Daily；不要为了模型统一一次性重构所有 content kind。

## 9. Milestone H Design Review 必须回答

在批准实现前，先锁定以下语义：

1. factual claim 的稳定 identity 如何表达；
2. claim → reference edge 如何持久化；
3. `Reference.supports` 保留什么人类语义；
4. signals / sections / facts 哪些字段必须进入 evidence coverage；
5. correction 如何定位被修正 claim，而不复制整份内容；
6. correction metadata 如何进入 Reading UI，而不改变 canonical route；
7. 旧 Daily 如何兼容 / 迁移；
8. evidence validator 如何输出 machine-readable 与 human-readable report；
9. Slidev / RSS / archive / sitemap / JSON-LD 如何保持回归稳定；
10. 如何明确声明“结构可验证 ≠ 自动事实真实性判定”。

只有这些语义被批准后，才进入下一编号实施计划。

## 10. 当前非目标

以下仍保持非目标：

- Scheduled Agent 自动 merge / Pages deploy；
- 多 Provider orchestration platform；
- 数据库任务队列；
- 新 CMS；
- 服务端 Runtime；
- 自动改写已发布历史；
- 自动 Source / Author / Topic Registry mutation；
- LLM 自动 fact judge；
- 自动 Source trust scoring；
- 复杂搜索服务；
- Citation graph database；
- Embedding / Vector database；
- 可视化 Slide Editor。

Static full-text search 不是永久非目标；它保留为后续候选，等待真实检索需求出现后再进入 milestone 排序。

## 11. 下一步 Gate

```text
Milestone G · Done
      ↓
Product Capability Roadmap Refresh · Done
      ↓
Milestone H — Evidence Integrity · Recommended
      ↓
Design Review Gate
      ↓
锁定 claim identity / evidence binding / correction provenance
      ↓
Human approval
      ↓
才决定下一编号实施计划
```

**当前状态：不创建 `Plan 80`。下一步只推进 Milestone H 的 Design Review。**