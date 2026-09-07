# Orbis Product Capability Roadmap Refresh · 2026-09-07

> 状态：Decision Record
> 基线：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> Planning branch：`planning/product-capability-roadmap`
> 前置：Milestone G — Sustainable Automation · Done
> 结论：推荐下一 Milestone 为 **Milestone H — Evidence Integrity**；本轮不创建 `Plan 80`

## 1. 为什么现在必须先 refresh，而不是直接编号下一个 Plan

Milestone A–G 已经让 Orbis 形成完整稳态：

```text
Structured Content + Registry
          ↓
Referential Integrity
          ↓
Reading / Presentation / RSS / Discovery
          ↓
SEO / Structured Data
          ↓
Knowledge Lifecycle
          ↓
Scheduled Content Automation
          ↓
Build / Trusted Preview / Human Review
```

此时继续按编号惯性扩功能，会把“可能有价值”误当成“现在最值得建设”。

下一阶段只接受有真实证据的能力缺口，并要求：

1. 缺口已经在真实 Orbis 使用中出现；
2. 缺口属于 Orbis 核心职责，而不是外部工具更适合承担；
3. 新能力可以保持 Git-native / build-time / least-privilege 架构；
4. 验收能够被自动化检查，而不是只靠主观体验；
5. 不因为解决局部问题而扩大 Agent authority。

## 2. 当前最强真实证据

### 2.1 Scheduled Daily 已证明生产与发布边界稳定

Milestone G 已通过：

- real transport proof；
- consecutive stable cycles `3/3`；
- same-day rerun / deterministic convergence；
- published `already-published` zero-write；
- explicit correction flow；
- Human merge；
- corrected-main Build。

因此当前主要瓶颈已经不是“Agent 能不能安全地产出候选内容”。

### 2.2 PR #33 暴露了内容层的真实缺口

2026-09-07 Daily 已发布后，发现 OpenClaw `OPENCLAW_SUPERVISOR_MODE=external` 的首次版本归因错误：首版把能力归因到 `v2026.9.2`，一手 release 证据证明 `v2026.7.2-beta.2` 已经存在该能力。

Correction workflow 工作正常，但这个事件证明：

```text
primary source requirement     存在
Reference.source integrity     存在
supports 自由文本说明          存在
Schema / Build / Preview       全部通过
                               ↓
具体 factual claim 仍可能错误归因
```

换言之，Orbis 现在能验证“引用是否合法存在”，但不能验证“哪一条事实声明具体由哪一个引用支撑”。

### 2.3 当前 Schema 的结构性缺口

现有 Daily section：

```text
facts[]          = string[]
references[]     = Reference[]
Reference.supports = free text
```

这意味着：

- Fact 没有稳定 claim identity；
- Fact 与 Reference 之间没有机器可检查 edge；
- `supports` 是面向人的说明，不是结构化 coverage contract；
- Build 可以发现 missing Source ID，却不能发现“引用存在但支撑错了 claim”；
- correction 目前主要存在于 Git / PR 历史，内容模型没有 reader-visible correction provenance。

这正好与 Orbis “形成可验证工程判断”的产品目标相交。

## 3. 候选能力重新排序

| 候选 | 真实使用证据 | Orbis 核心契合度 | 可自动验收 | Authority 增量 | 决策 |
|---|---:|---:|---:|---:|---|
| Evidence Integrity / Correction Provenance | **高** — PR #33 | **高** | **高** | 低 | **推荐下一 Milestone** |
| Static Search / Full-text Retrieval | 低 — 尚无真实检索失败反馈 | 高 | 高 | 低 | Defer |
| Weekly Scheduled Automation | 低 — 尚无重复人工 Weekly 痛点证据 | 中高 | 高 | 中 | Defer |
| Source / Author Directory | 低 | 中 | 高 | 低 | Defer |
| Automatic Registry Mutation | 无，且与现有治理边界冲突 | 低 | 中 | **高** | Reject for now |
| Multi-provider orchestration | 无，且当前明确非目标 | 低 | 中 | **高** | Reject for now |
| Citation graph database | 无，复杂度远超当前需求 | 低 | 中 | 高 | Reject for now |
| Visual Slide Editor | 无 | 低 | 中 | 中 | Reject for now |

### Search 为什么不是现在

Static search 与长期知识积累高度匹配，且历史规划已经考虑过 Pagefind 一类静态方案；但当前没有真实证据表明用户已经因为找不到内容而受阻。

因此它应保持高价值候选，但不应抢在已经发生的事实 / 证据完整性问题之前。

### Weekly Automation 为什么不是现在

Weekly content model 已存在，但目前真实稳定运行的是 Scheduled Daily。没有证据证明 Weekly 的人工执行已经形成重复负担，因此暂不扩大 Scheduler authority。

## 4. 推荐下一 Milestone

# Milestone H — Evidence Integrity

目标不是让机器“判断事实一定为真”，而是让每个重要 factual claim 都具有**结构化、可审计、可检查的 evidence binding**，并让 correction 成为正式的知识发布语义，而不是只存在于 Git 历史。

核心目标：

```text
Claim
  ↓ explicit evidence binding
Reference
  ↓ registry identity
Source

Published content
  ↓ correction metadata
Revision provenance
  ↓ reader-visible notice
Human review
```

## 5. Milestone H 建议边界

### H1 · Claim → Evidence Contract

优先从 Daily 开始，不一次性重构所有 content kind。

设计阶段必须解决：

- 如何给 factual claim 提供稳定 identity；
- 如何让 claim 明确关联 1..n 个 reference；
- 如何避免只用 `supports` 自由文本承担机器关系；
- 如何生成 deterministic evidence coverage report；
- 如何保持 Source Registry 作为引用来源 identity，而不引入 citation database。

首个 contract 应能使以下情况直接 validation fail：

- claim 指向不存在的 reference；
- factual claim 没有 evidence binding；
- reference 声明 Source ID 但 registry 无法解析；
- correction 声明修改 claim，但 claim identity 不存在。

### H2 · Correction Provenance

把已经真实发生的 correction 从 workflow 行为升级为内容语义。

至少应支持：

- `revisedAt` 或等价 revision metadata；
- correction summary；
- 被修正 claim / section 的稳定定位；
- 新证据引用；
- Reading UI 的“已修正”提示与修正摘要；
- canonical URL 保持稳定，不因为 correction 生成第二份内容。

Correction producer 仍然只提出独立 PR，不获得自动 merge / deploy authority。

### H3 · Review Artifact

Build / CI 生成 human-readable + machine-readable evidence report，例如：

```text
Daily 2026-09-07
claims                  17
claims with evidence    17
unbound claims           0
dangling evidence        0
corrections              1
```

报告验证的是 evidence structure / coverage，不冒充事实真实性评分。

## 6. 明确非目标

Milestone H 不做：

- LLM 自动 fact judge；
- 自动判断某个来源“真实”；
- 自动给 Source 评分；
- 自动创建 / 修改 Source Registry；
- 自动修正已发布历史；
- citation graph database；
- embedding / vector database；
- 服务端 search / review runtime；
- Scheduled Agent 自动 merge；
- Production Pages authority 扩张。

## 7. 建议验收标准

只有满足以下条件，Milestone H 才值得进入实现计划：

1. 新 Daily factual claims 达到 100% machine-checkable evidence coverage；
2. missing / dangling claim-reference relation 在 `pnpm validate` 或专用 validator 中 fatal fail；
3. Source Registry relation integrity 继续复用现有 contract；
4. 至少用 2026-09-07 OpenClaw correction 作为真实 fixture，证明旧错误可以被精确定位并表达为 correction provenance；
5. Reading UI 显示修正提示，但历史 canonical URL 不变；
6. Slidev / RSS / archive / sitemap / JSON-LD 既有合同不回归；
7. PR Build + Trusted Preview 通过；
8. merge 后 fresh main Build 通过；
9. 如涉及公开页面变化，再执行 exact-SHA Production Pages + public smoke；
10. Agent authority 不扩大到 Registry mutation、auto-merge 或 Production deploy。

## 8. 下一步 Gate

本 refresh 只决定 **问题方向与 Milestone**，不自动创建 `Plan 80`。

正确顺序：

```text
Roadmap Refresh
    ↓
Milestone H — Evidence Integrity · recommended
    ↓
Design Review：锁定 claim identity / evidence binding / correction metadata
    ↓
批准设计
    ↓
再决定是否创建下一编号实施计划
```

在设计被批准前：

- 不创建 `80-*.md`；
- 不改 content schema；
- 不改 Daily producer；
- 不扩 scheduled authority；
- 不把 Search / Weekly automation 混入本 Milestone。

**Roadmap refresh 结论：下一个值得建设的能力不是更多自动化，而是让已经自动化生产出来的知识更可验证、更可审计、更容易被正确修正。**
