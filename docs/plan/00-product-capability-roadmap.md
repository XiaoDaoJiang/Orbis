# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 当前实现基线：`main@fee254c81e899bc77c4671eda472071c390621a9`
> 当前阶段：**Milestone H — Evidence Integrity · Done**
> 当前 Gate：**Post-H Product Capability Roadmap Refresh**

## 1. 当前阶段判断

Orbis 已完成从基础发布架构到受控自动化、Evidence Integrity 与 published correction provenance 的完整稳态闭环。

已完成能力包括：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily / Weekly / standalone Presentation；
- Archive / Slides / cadence / Homepage discovery；
- stable Daily date / latest / archive.json；
- Path Guard + CODEOWNERS + agent governance；
- read-only PR Build → Trusted Preview → Public Smoke；
- governed GitHub Pages Production；
- Source / Author Registry + Referential Integrity；
- canonical / OG / Twitter / Sitemap / RSS / JSON-LD；
- Knowledge lifecycle contract + UI；
- least-privilege Scheduled Daily automation；
- deterministic same-day rerun / published no-write；
- explicit published correction workflow；
- Evidence V1 Daily claim → evidence integrity；
- reader-visible correction provenance；
- append-only published Daily correction guard；
- exact-main Production closeout for Milestone H。

Orbis 当前产品定义保持：

> 一个面向长期积累的 Git-native、Agent-native 结构化技术知识发布系统。Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合与长期归档；所有自动化 authority 通过 repository contracts、PR、Build、Preview 与 Human Review 明确收敛。

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

### Milestone G — Sustainable Automation · Done
Plan 70。

主要真实链路：

```text
Repository Contract
    ↓
ChatGPT Scheduled Daily Adapter
    ↓
3 consecutive stable cycles
    ↓
same-day rerun / idempotency
    ↓
published already-published / zero write
    ↓
explicit published correction
    ↓
Human merge
    ↓
fresh corrected main Build
```

最终 G 基线：

```text
main                         b3e793d0c5c7d55358933d4d25c4d77dafd8cd03
fresh Site Build             34090549723 success
Artifact                     10006713925
Artifact SHA-256             8c56125aea23914874a908550d98675f9d8218c820a7545ead9d2d13929b10af
```

### Milestone H — Evidence Integrity · Done
Plan 80，PR #34 / #35 / #36。

真实触发证据来自 published correction PR #33：现有 Source / Reference 存在，但具体 claim 与 evidence 没有机器可检查的精确 edge，correction 也只存在于 Git/PR 历史。

Milestone H 完成：

```text
80A Evidence Contract
    ↓
Evidence V1 Daily Schema
stable fact identity
claim → canonical reference edge
frozen legacy migration boundary
Scheduled Daily Evidence V1 enforcement
    ↓
80B Real Correction Provenance
2026-09-07 full re-verification
16 claims / 6 references / 1 correction
reader-visible evidence + correction UI
11-slide contract preserved
    ↓
80C Published Correction Guard
append-only correction history
factual mutation → correction provenance
legacy correction fail closed
branch-specific authority routing
    ↓
final main Build
    ↓
exact-main Production Pages
    ↓
public smoke
```

最终 H 生产证据：

```text
final main                    fee254c81e899bc77c4671eda472071c390621a9
fresh main Site Build         34179976055 success
main Artifact                 10038587455
main Artifact SHA-256         bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
Production run                34191412383 success
Production head_sha           fee254c81e899bc77c4671eda472071c390621a9
Pages Artifact                10042373095
Pages Artifact SHA-256        e0bed6d0c91b1fe095d42a807a73f1a8967a9d127c3babdcddc534d7412b45c9
Production URL                https://xiaodaojiang.github.io/Orbis/
```

Production workflow 内置 smoke 通过 `/`、`/latest/`、`/archive.json`、`/rss.xml`、`/favicon.svg`、`/2026/09/07/`。

Exact deployed artifact 进一步证明：

- 2026-09-07 Reading correction notice 存在；
- stable claim/ref anchors 存在；
- claim → evidence 与 correction → claim 链接存在；
- exactly 16 claim markers / 1 correction event；
- stable date alias 继续指向 11-page Slides；
- Reading canonical 保持 `/briefs/2026-09-07/`；
- archive latest = 2026-09-07；
- RSS / sitemap healthy。

完整记录：[`2026-09-08 · Milestone H Evidence Integrity Closeout`](./2026-09-08-milestone-h-evidence-integrity-closeout.md)。

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
 Evidence Integrity (Daily)
             ↓
 Astro Web + Presentation Platform
             ↓
 Canonical / SEO / RSS / JSON-LD
             ↓
 Knowledge Lifecycle
             ↓
           dist/site
             ↓
 PR Preview / governed GitHub Pages
```

Published corrections use a separate repository authority path:

```text
correction/daily/YYYY-MM-DD/<slug>
        ↓
exact one published Evidence V1 Daily
        ↓
append-only correction provenance
        ↓
Generic Path Guard + correction guard
        ↓
Build + Trusted Preview + Human merge
```

Scheduled Daily remains isolated and never enters correction mode automatically.

## 4. Capability status

| 能力 | 当前状态 | 当前说明 |
|---|---|---|
| Monorepo / Build Foundation | Done | Astro + Slidev + pnpm Workspace |
| Structured Content | Done | Brief / Essay / Knowledge / Topic / Presentation / Source / Author |
| Daily Brief | Done / Mature | Reading / 11 Slides / RSS / Date / Latest / Archive |
| Weekly Brief | Done / First Release | Weekly Schema / Reading / Slides / RSS / Archive / Topic |
| Presentation Platform | Done | Descriptor / Template Registry / mixed build |
| Archive / Discovery | Done | Homepage / Archive / Slides / cadence / Related |
| Source / Author Identity | Done | canonical IDs / Registry / Referential Integrity |
| SEO / Structured Data | Done | canonical / OG / Twitter / Sitemap / RSS / JSON-LD |
| Knowledge Lifecycle | Done | evaluator / supersession / review report / UI |
| Scheduled Automation | Done | least privilege / deterministic identity / stable cycles / no-write / explicit correction |
| Claim → Evidence Integrity | Done | Evidence V1 / validator / report / Scheduled enforcement |
| Correction Provenance | Done | real 2026-09-07 migration + Reading UI |
| Published Correction Guard | Done | append-only repository contract + Production closeout |
| Static Full-text Search | Candidate / Deferred | 尚未重新评估 post-H 真实检索摩擦 |
| Weekly Scheduled Automation | Candidate / Deferred | 尚未重新评估 post-H 重复人工负担 |
| Source / Author Directory | Candidate / Deferred | 尚未重新评估真实浏览需求 |

## 5. Authority model

当前明确隔离：

```text
feature/*
    → Generic Path Guard

automation/daily/*
    → Generic Path Guard + Scheduled Daily guard

correction/daily/*
    → Generic Path Guard + Published Daily correction guard
```

仍不授权：

- direct `main` write；
- Scheduled Agent auto-merge；
- automatic Production Pages deployment；
- automatic Source / Author / Topic Registry mutation；
- automatic correction generation；
- automatic historical rewrite；
- LLM automatic fact judge / truth score。

## 6. Post-H candidate set

Milestone H 完成后，不按编号惯性直接创建 Plan 90。下一轮首先重新做 Product Capability Roadmap Refresh。

保留候选：

| 候选 | 上一轮状态 | Post-H 需要的新证据 |
|---|---|---|
| Static Full-text Search | Deferred | 用户是否已经真实遇到“知道内容存在但找不到”的检索失败 |
| Weekly Scheduled Automation | Deferred | Weekly 是否已经形成稳定、重复、可自动化的人工作业负担 |
| Source / Author Directory | Deferred | Source/Author registry 是否已有足够规模与真实浏览需求 |
| Legacy Evidence migration | Migration debt | 旧 Daily 是否因为 correction / reuse / discovery 需要逐份重新核验 |
| Evidence V2 for synthesis fields | Deferred | `signals/conclusion` 是否出现独立 claim provenance 的真实需求 |

继续 Reject for now：

- automatic Registry mutation；
- multi-provider orchestration platform；
- citation graph database；
- vector / embedding database；
- visual Slide editor；
- server-side review runtime。

## 7. 当前下一步 Gate

```text
Milestone H · Done
      ↓
Post-H Product Capability Roadmap Refresh   ← current
      ↓
inspect real usage after Evidence Integrity
      ↓
collect concrete friction / repeated manual work
      ↓
re-rank candidate capabilities
      ↓
select next milestone only with evidence
      ↓
Design Review
      ↓
Plan / isolated PR slices
```

下一阶段先做 roadmap refresh，不直接编码，也不预设下一项一定是 Search 或 Weekly Automation。
