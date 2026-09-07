# Milestone H · Evidence Integrity Design

> Status: Design Review
> Roadmap: Milestone H — Evidence Integrity
> Baseline: `main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> Evidence: published Daily correction PR #33
> Scope entry: Daily first
> Constraint: 本设计批准前不创建 `Plan 80`，不修改 Schema，不扩大 Scheduled authority

## 1. Goal

Milestone H 解决的不是“让机器判断事实一定为真”，而是把 Orbis 已有的一手来源要求升级为**可执行的证据结构合同**：

```text
factual claim
    ↓ explicit binding
reference identity
    ↓ existing Source Registry
primary / secondary source
```

并把已发布内容的 correction 从 Git / PR 行为升级为正式、读者可见、机器可检查的内容语义：

```text
published Daily
    ↓ explicit correction
stable claim target
    ↓ correction evidence
reader-visible provenance
```

Milestone H 必须继续保持 Orbis 现有边界：

- Git-native；
- build-time validation；
- static publishing；
- Human Review；
- Agent 不拥有 merge / Pages authority；
- Source Registry 不由 Scheduled Agent 自动修改。

## 2. Problem proven by real usage

2026-09-07 Daily 首版把 OpenClaw `OPENCLAW_SUPERVISOR_MODE=external` 的首次版本归因到 `v2026.9.2`。随后 primary release evidence 证明该能力在 `v2026.7.2-beta.2` 已存在。

PR #33 的 correction workflow 正常完成：

```text
published main protection     passed
explicit correction branch    passed
exact one Daily diff           passed
Path Guard                     passed
full PR Build                  passed
Trusted Preview                passed
Human merge                    passed
fresh main Build               passed
```

因此真正的缺口不是 transport / CI / publishing，而是：

```text
facts[]              = free strings
section.references[] = reference objects
brief.references[]   = reference objects
Reference.supports   = human-readable free text
                       ↓
claim → evidence 没有稳定、机器可检查 edge
```

现有系统能验证 Source ID 是否存在，却不能验证：

- 某个 factual claim 是否有证据；
- claim 指向的 reference 是否存在；
- 一个 reference 是否只是“装饰性引用”而没有支撑任何 claim；
- correction 修改的是哪个稳定 claim；
- correction 是否附带新的明确证据。

## 3. Core design decisions

### 3.1 Daily first, not global content-model rewrite

Evidence V1 只首先覆盖 Daily。

原因：

- 真实缺口来自 Scheduled Daily；
- Daily 是目前唯一稳定自动生产的内容形态；
- Weekly / Ad-hoc / Presentation / Essay / Knowledge 不应因为一个 Daily 问题被强制一起重构；
- 后续其他 kind 可以复用 Evidence V1 primitives，但必须由真实需求触发。

因此不要修改现有 generic `briefSectionSchema` 来迫使 Weekly / Ad-hoc 同步迁移。

### 3.2 Evidence V1 uses one canonical Daily reference registry

Evidence-aware Daily 不再把完整 reference object 同时复制到 section 与 top-level。

推荐模型：

```yaml
evidenceVersion: 1

sections:
  - id: external-supervision
    layout: system-map
    title: Runtime 生命周期权限正在形成独立 Supervisor Boundary
    conclusion: ...
    facts:
      - id: external-supervisor-introduced
        text: OpenClaw v2026.7.2-beta.2 已加入 OPENCLAW_SUPERVISOR_MODE=external ...
        evidence:
          - openclaw-v2026-7-2-beta-2
      - id: later-upgrade-recovery
        text: OpenClaw v2026.9.2 继续强化 upgrade/recovery ...
        evidence:
          - openclaw-v2026-9-2
    limitations:
      - ...

references:
  - id: openclaw-v2026-7-2-beta-2
    title: OpenClaw v2026.7.2-beta.2
    url: https://github.com/openclaw/openclaw/releases/tag/v2026.7.2-beta.2
    source: github
    supports: external supervisor、restart handoff 与早期 Gateway/session recovery。
    accessedAt: 2026-09-07
  - id: openclaw-v2026-9-2
    title: OpenClaw v2026.9.2
    url: https://github.com/openclaw/openclaw/releases/tag/v2026.9.2
    source: github
    supports: 后续 upgrade、Gateway restart 与 reply recovery。
    accessedAt: 2026-09-07
```

关键语义：

- `references[]` 是一份 Daily 内唯一 canonical evidence registry；
- `references[].id` 在该 Daily 内唯一；
- `facts[].evidence[]` 只持久化 reference IDs；
- section 不再重复完整 `references[]` object；
- Reading / Slide adapters 从 evidence edge 派生 section source link；
- Source Registry 仍通过 `reference.source` 负责站点级来源 identity。

这延续 Orbis 已有原则：**只持久化 canonical edge，反向 / 展示关系由构建推导。**

### 3.3 `facts` keeps its name but becomes an object array

第一版不引入第二个 `claims[]` 字段，避免同时维护 `facts` 与 `claims` 两套语义。

Evidence V1：

```ts
interface EvidenceFact {
  id: string
  text: string
  evidence: string[]
}
```

其中：

- `id`：section-local stable claim identity；
- `text`：当前已发布 factual claim；
- `evidence`：1..n canonical Daily reference IDs。

稳定 claim address 使用组合 identity：

```text
<section.id>/<fact.id>
```

例如：

```text
external-supervision/external-supervisor-introduced
```

这样不需要在整个 Daily 内人为制造超长全局 claim ID，同时 correction 可以稳定定位。

### 3.4 `Reference.supports` remains human-readable, not relational authority

`supports` 保留，因为它对 Reviewer 和读者仍有价值。

但 Evidence V1 中：

```text
supports text      = explanation
fact.evidence IDs  = executable relation
```

Validator 不通过解析 `supports` 文本建立关系，也不让 LLM/regex 从自然语言推断 coverage。

### 3.5 Evidence coverage applies to factual `facts[]` only in V1

V1 的 machine-checkable coverage unit 是 section `facts[]`。

以下字段仍属于 synthesis / editorial output：

- `signals[].summary`；
- `section.conclusion`；
- `limitations[]`；
- `actions[]`；
- `project.summary`；
- `radar.note`。

Producer contract 必须规定：**这些 synthesis 字段不得引入未在 evidence-bound facts 中出现的新的关键外部事实。**

这是 editorial rule，不伪装成机器可以完整理解自然语言语义的 validator。

如果未来真实问题证明 signal/conclusion 本身需要独立 claim graph，再扩展 Evidence V2；V1 不做语义解析。

## 4. Proposed Schema primitives

概念结构：

```ts
const evidenceReferenceSchema = referenceSchema.extend({
  id: registryIdSchema,
}).strict()

const evidenceFactSchema = z.object({
  id: registryIdSchema,
  text: z.string().min(5),
  evidence: z.array(registryIdSchema).min(1),
}).strict()

const dailyEvidenceSectionSchema = z.object({
  id: registryIdSchema,
  layout: z.enum(['architecture', 'comparison', 'timeline', 'metrics', 'system-map']),
  title: z.string().min(3),
  conclusion: z.string().min(12),
  facts: z.array(evidenceFactSchema).min(1).max(4),
  limitations: z.array(z.string().min(5)).max(3).default([]),
}).strict()
```

Evidence V1 Daily 在 current Daily fields 基础上覆盖：

```ts
{
  evidenceVersion: 1,
  sections: DailyEvidenceSection[5],
  references: EvidenceReference[1..n],
  corrections?: DailyCorrection[]
}
```

`archivePicks` 继续使用现有 `archivePickSchema`，它不是本期 claim evidence registry 的组成部分。

## 5. Referential integrity rules

Schema 只验证单对象形状；claim/reference cross-edge 必须由 repository content validator 验证。

对 Evidence V1 Daily，以下全部 fatal：

1. duplicate `section.id`；
2. duplicate `fact.id` within a section；
3. duplicate `references[].id`；
4. `fact.evidence[]` 为空；
5. duplicate evidence ID on the same fact；
6. `fact.evidence[]` 指向不存在 reference；
7. top-level reference 没有被任何 fact 或 correction 使用；
8. reference 声明 `source` 但 Source Registry 不存在；
9. correction target 不存在；
10. correction evidence reference 不存在。

第 7 条刻意把“装饰性 bibliography”排除在 Evidence V1 的 canonical evidence registry 外。仅用于延伸阅读的链接应进入 `archivePicks` 或未来独立 reading list，而不是伪装成 claim evidence。

## 6. Correction provenance model

不要持久化 top-level `revisedAt` 与 correction list 两份会漂移的状态。

只持久化 correction events：

```yaml
corrections:
  - id: openclaw-supervisor-version
    correctedAt: 2026-09-07
    summary: 修正 external supervisor 首次版本归因，并区分 7.2 beta 与 9.2 的后续 recovery 改进。
    targets:
      - section: external-supervision
        fact: external-supervisor-introduced
      - section: external-supervision
        fact: later-upgrade-recovery
    evidence:
      - openclaw-v2026-7-2-beta-2
      - openclaw-v2026-9-2
```

Derived metadata：

```text
hasCorrections    = corrections.length > 0
lastCorrectedAt   = max(corrections[].correctedAt)
correctionCount   = corrections.length
```

Correction rules：

- `id` 在 Daily 内唯一；
- `correctedAt >= publishedAt`；
- `summary` 必须非空且描述事实修正，而不是 Git 操作；
- `targets` 至少一个；
- target 使用 stable section/fact identity，不使用数组 index；
- `evidence` 至少一个；
- correction evidence 必须解析到 canonical Daily references；
- correction 不存 previous text；旧内容由 Git history 保留；
- correction 不存 PR number / workflow run / provider metadata；这些继续属于 repository provenance。

## 7. Published correction workflow contract

Milestone H 不扩大 correction producer authority，只增加更严格的验证。

未来 `correction/daily/YYYY-MM-DD/<reason>` PR 应运行独立 correction guard，概念命令：

```text
pnpm evidence:daily:correction:guard --base <integration-base>
```

Guard 应验证：

- correction branch 只修改 exact one existing published Daily；
- 不允许顺带修改 app/config/schema/workflow；
- changed Daily 必须是 Evidence V1；
- correction list 相对 base 只能 append 新 correction event，不删除历史 correction；
- 新 correction event target 必须存在；
- 新 correction evidence 必须存在；
- factual mutation 必须有 correction event；
- full `content:validate` 仍然 mandatory；
- generic Path Guard 仍然 mandatory。

如果需要修正 legacy Daily：

```text
legacy Daily
    ↓ explicit human-reviewed migration to Evidence V1
    ↓ correction event
    ↓ normal correction Build / Preview / Human Review
```

Scheduled Daily 永远不能自动进入这个流程。

## 8. Legacy migration boundary

### 8.1 Do not fabricate historical claim coverage

Milestone H 上线时，已经发布的旧 Daily 只有 section-level references，没有真实 persisted claim→reference edge。

禁止用以下方式“自动升级”历史：

```text
all facts in section → all existing section references
```

这种机械映射虽然能让 validator 变绿，却会把未经重新核验的历史内容错误标记为 claim-level evidence coverage。

### 8.2 Frozen legacy allowlist

设计采用**有限、冻结的 legacy allowlist**，而不是开放式双 Schema 兼容。

Implementation activation 时记录 exact pre-H legacy Daily paths。规则：

- allowlist 只包含 H 激活前已经发布且尚未重新核验的 Daily；
- 新 Daily 不得加入；
- Scheduled Daily candidate 必须 Evidence V1；
- legacy Daily 继续稳定渲染，但 evidence report 明确标记 `legacy-unverified`；
- 某个 legacy Daily 经人工重新核验迁移后，从 allowlist 删除；
- allowlist 最终可以归零并删除 legacy schema path。

这是显式 migration debt，不是永久 compatibility layer。

### 8.3 2026-09-07 is the first real migration fixture

Milestone H 首个真实 fixture 必须是：

```text
content/briefs/2026-09-07.yaml
```

迁移要求：

- 对该 Daily 全部 5 sections 的 factual facts 重新建立 stable fact IDs；
- 所有 facts 建立 explicit evidence bindings；
- references 归一为 canonical top-level EvidenceReference；
- 已发生的 OpenClaw correction 写入 `corrections[]`；
- correction targets 精确定位对应 fact IDs；
- 不改变已经修正后的 factual meaning；
- Reading / Slides 内容语义保持一致，仅增加 evidence / correction affordance。

不能只给 OpenClaw section 加 Evidence V1 而让同一 Daily 处于部分覆盖状态。

## 9. Evidence report

增加 pure evaluator + human/machine-readable report，概念输出：

```text
Daily 2026-09-07
mode                    evidence-v1
claims                  17
claims with evidence    17
references               8
unused references        0
corrections              1
last corrected           2026-09-07
```

Machine-readable shape：

```ts
interface DailyEvidenceReport {
  version: 1
  path: string
  publishedAt: string
  mode: 'evidence-v1' | 'legacy-unverified'
  claimCount: number
  boundClaimCount: number
  referenceCount: number
  unusedReferenceCount: number
  correctionCount: number
  lastCorrectedAt?: string
  errors: EvidenceIntegrityError[]
}
```

报告语义必须明确：

```text
100% evidence coverage
!=
100% factual truth
```

它只证明每个 persisted factual claim 都有明确、可审计的 evidence edge。

## 10. Reading UI

Evidence V1 Reading 页面应使关系真正可见，而不是只在 CI 中存在。

### Per-fact evidence

每个 fact 获得稳定 DOM anchor：

```text
#claim-<section-id>-<fact-id>
```

fact 后显示紧凑 evidence links / markers，链接到底部 canonical references。

Reference List 每项获得：

```text
#ref-<reference-id>
```

现有 Source Registry enrichment 继续复用。

### Correction notice

有 correction 时，在文章 header / body 起始区域显示：

```text
已修正 · <lastCorrectedAt>
<latest correction summary>
查看受影响事实
```

完整 correction history 可在同一页面展开 / 列出；不生成第二条 canonical route。

### Stable route

Correction 不改变：

- Daily URL；
- canonical URL；
- date identity；
- archive identity。

## 11. Slidev behavior

Evidence Integrity 不应迫使 11 页 Daily 模板扩页或增加复杂 citation layout。

`daily-v1` adapter：

- fact text 从 `fact.text` 渲染；
- section 的“原始来源”链接从该 section 第一个 fact 的第一个 evidence ref 派生；
- Extended Reading 使用 canonical top-level references；
- 不要求每个 slide fact 展示 citation marker；
- correction 不增加第 12 页；Reading URL 仍是完整 provenance 入口。

这样可以提升数据完整性，同时保持现有 presentation contract 稳定。

## 12. RSS / Archive / Sitemap / Structured Data

H 第一版不改变 route identity 或 feed identity。

必须保证：

- Daily ordering 不变；
- `/latest/` 不变；
- `/archive.json` identity 不变；
- RSS item identity 不变；
- Sitemap route set 不回归；
- JSON-LD existing required fields 不回归；
- corrected Daily canonical URL 不变。

`lastCorrectedAt` 是否映射到 JSON-LD `dateModified` 可以作为实现期小设计项；它不能成为引入全局 SEO 模型重构的理由。

## 13. Scheduled Daily contract after H activation

Scheduled Daily 的 repository authority 不变：仍只能修改 exact target Daily。

新增内容合同：

- target Daily 必须 `evidenceVersion: 1`；
- 5 sections 仍固定；
- each fact 必须 stable `id`；
- each fact 必须至少 1 evidence ref；
- all evidence refs 必须 resolve；
- unused canonical evidence refs fatal；
- primary-source editorial requirement 继续由 `daily-task-prompt.md` 明确；
- Scheduled guard 调用 Evidence Integrity validator；
- Agent 不得修改 legacy allowlist、Source Registry、Schema 或 correction history。

这只缩小错误空间，不扩大 Agent 权限。

## 14. Failure model

Milestone H 必须区分：

```text
SCHEMA_INVALID
DUPLICATE_CLAIM_ID
DUPLICATE_REFERENCE_ID
MISSING_EVIDENCE
DANGLING_EVIDENCE_REFERENCE
UNUSED_REFERENCE
MISSING_SOURCE_REGISTRY_ID
INVALID_CORRECTION_TARGET
INVALID_CORRECTION_EVIDENCE
CORRECTION_HISTORY_MUTATED
LEGACY_DAILY_NOT_ALLOWLISTED
```

错误输出包含 content path + stable field address，不能只报 generic Zod parse failure。

## 15. Delivery boundaries if design is approved

批准后再决定编号实施计划。设计建议未来 implementation 分为三个可独立验证的 slice，但当前不创建 Plan：

### Slice H1 — Evidence Contract

- Evidence V1 Schema primitives；
- frozen legacy boundary；
- claim/reference integrity evaluator；
- human/machine report；
- Daily renderer / Slide adapter dual-mode support；
- Scheduled Daily prompt + guard 要求 Evidence V1；
- unit / integration / artifact tests。

### Slice H2 — Real Correction Provenance

- migrate and re-verify `2026-09-07.yaml` to Evidence V1；
- persist PR #33 correction provenance；
- Reading per-fact evidence markers；
- correction notice/history；
- real fixture artifact checks。

### Slice H3 — Correction Guard + Closeout

- correction-specific append-only guard；
- legacy correction behavior test；
- fresh PR Build / Trusted Preview；
- main Build；
- exact-SHA Production Pages if public UI changed；
- public smoke；
- roadmap closeout。

## 16. Acceptance criteria

Design implementation is acceptable only when：

1. every Evidence V1 Daily fact has stable identity；
2. every Evidence V1 Daily fact has >= 1 explicit evidence edge；
3. dangling claim/reference relations fail validation；
4. unused canonical evidence references fail validation；
5. Source Registry integrity continues to apply；
6. legacy Daily cannot be silently treated as evidence-covered；
7. new Scheduled Daily candidates cannot use legacy shape；
8. `2026-09-07.yaml` is re-verified and reaches 100% structural evidence coverage；
9. PR #33 correction is represented by stable correction provenance；
10. Reading UI exposes evidence links and correction notice；
11. Daily 11-slide count stays unchanged；
12. historical / canonical URLs stay unchanged；
13. RSS / archive / sitemap / JSON-LD regressions remain green；
14. correction branch cannot remove prior correction history；
15. PR Build + Trusted Preview pass；
16. fresh main Build passes；
17. public UI changes receive exact-SHA Production + smoke；
18. no new merge / deploy / Registry mutation authority is granted to Agent。

## 17. Explicit non-goals

Milestone H does not build：

- LLM automatic fact judge；
- source truth score；
- automatic Source / Author / Topic Registry mutation；
- citation graph database；
- vector / embedding database；
- semantic search service；
- server-side review runtime；
- automatic rewrite of published history；
- automatic correction；
- Scheduled Agent auto-merge；
- Pages deploy authority；
- global Evidence rewrite for Weekly / Essay / Knowledge / Presentation。

## 18. Design review decisions to approve

Milestone H implementation should not start until the following decisions are approved as one set：

1. **Daily-first Evidence V1**，不全局重构 content kinds；
2. **top-level canonical references + fact evidence IDs**，取消 Evidence V1 section reference object duplication；
3. **section-local fact ID + composite address**；
4. **machine coverage only for factual facts[]**，synthesis 不伪装成可语义验证；
5. **correction events as the only persisted revision provenance**，`lastCorrectedAt` derived；
6. **frozen legacy allowlist**，禁止自动伪造历史 claim coverage；
7. **2026-09-07 full Daily migration as first real fixture**；
8. **new Scheduled Daily must Evidence V1**；
9. **correction-specific append-only guard**；
10. **Reading shows evidence/correction，Slide count stays 11**。

**Current gate: Design Review. No `Plan 80` exists or is authorized by this document.**
