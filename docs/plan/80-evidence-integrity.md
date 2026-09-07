# 80 · Evidence Integrity

> 状态：Planned
> Roadmap Milestone：H — Evidence Integrity
> 设计：[`docs/superpowers/specs/2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) · Approved
> 基线：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> 真实证据：published Daily correction PR #33
> 首个实施 Slice：80A — Evidence Contract

## 1. 目标

让 Orbis 从“有引用的结构化内容”升级为“重要 factual claim 具有机器可检查 evidence binding 的结构化内容”，并把已发布 correction 升级为正式的内容 provenance。

```text
factual fact
    ↓ stable identity
fact.evidence[]
    ↓
canonical Daily reference
    ↓
existing Source Registry
```

以及：

```text
published Daily
    ↓ explicit correction event
stable section/fact target
    ↓ evidence
reader-visible correction provenance
```

Plan 80 不判断事实自动为真；它验证的是 evidence relation 的结构、完整性和可审计性。

## 2. 为什么现在做

Milestone G 已经证明 Scheduled Daily 的 transport、idempotency、Build、Preview、published no-write 和 explicit correction workflow 稳定。

PR #33 真实暴露了剩余缺口：OpenClaw external supervisor 的首次版本归因错误可以在现有 Schema / Build / Preview 下通过，因为当前：

```text
facts[]              = string[]
section.references[] = Reference[]
brief.references[]   = Reference[]
Reference.supports   = free text
```

存在来源不等于具体 claim 已经与来源建立可检查关系。

## 3. 已批准核心合同

### Evidence V1 · Daily first

只先改 Daily，不强迫 Weekly / Ad-hoc / Presentation / Essay / Knowledge 同步迁移。

Evidence-aware Daily：

```yaml
evidenceVersion: 1

sections:
  - id: external-supervision
    facts:
      - id: external-supervisor-introduced
        text: OpenClaw v2026.7.2-beta.2 已加入 ...
        evidence:
          - openclaw-v2026-7-2-beta-2

references:
  - id: openclaw-v2026-7-2-beta-2
    title: OpenClaw v2026.7.2-beta.2
    url: ...
    source: github
    supports: ...
```

稳定 claim address：

```text
<section.id>/<fact.id>
```

### Canonical evidence registry

- `references[]` 是 Daily 内唯一 canonical evidence registry；
- `facts[].evidence[]` 只存 reference IDs；
- Evidence V1 section 不再重复完整 reference object；
- `Reference.supports` 保持 human-readable explanation，不承担 relation authority；
- Source identity 继续使用现有 Source Registry。

### Correction provenance

只持久化 correction events，不双写 `revisedAt`：

```yaml
corrections:
  - id: openclaw-supervisor-version
    correctedAt: 2026-09-07
    summary: ...
    targets:
      - section: external-supervision
        fact: external-supervisor-introduced
    evidence:
      - openclaw-v2026-7-2-beta-2
```

派生：

```text
hasCorrections
lastCorrectedAt
correctionCount
```

## 4. 80A — Evidence Contract

> 状态：Planned / next implementation slice

目标：先建立可执行合同与迁移边界，不先扩 UI 或 correction workflow authority。

### Scope

- Evidence V1 Daily Schema primitives；
- `EvidenceFact` / `EvidenceReference` / `DailyCorrection`；
- frozen legacy Daily allowlist；
- Evidence V1 claim/reference integrity validator；
- stable error codes / field addresses；
- human-readable + machine-readable evidence report；
- existing referential integrity adapter 支持 legacy / Evidence V1 两种已批准模式；
- Daily Reading / Slide renderer 的最小 dual-mode compatibility；
- Scheduled Daily contract 更新为新 candidate 必须 Evidence V1；
- Scheduled Daily guard 调用 evidence validator；
- unit / integration / artifact regression tests。

### 80A 不做

- 不迁移全部历史 Daily；
- 不展示 correction notice；
- 不实现 correction-specific append-only guard；
- 不自动修改 Source Registry；
- 不增加 auto-merge / Pages 权限。

### Frozen legacy boundary

H activation 时将 exact pre-H Daily path 固定为 migration debt：

```text
content/briefs/2026-08-28.yaml
content/briefs/2026-09-04.yaml
content/briefs/2026-09-05.yaml
content/briefs/2026-09-06.yaml
content/briefs/2026-09-07.yaml
```

Weekly `2026-09-01-weekly.yaml` 不属于 Daily Evidence V1 legacy allowlist。

规则：

- 新 Daily 永远不能加入 allowlist；
- legacy Daily 可继续渲染，但 report 为 `legacy-unverified`；
- 经人工重新核验迁移后从 allowlist 删除；
- 不允许机械 `fact -> all section references` 伪造 claim-level coverage。

## 5. 80B — Real Correction Provenance + Reading UI

> 状态：Blocked by 80A

目标：用真实 2026-09-07 correction 把 Evidence V1 从结构合同推进到用户可见产品能力。

### Scope

- 对 `content/briefs/2026-09-07.yaml` 全部 5 sections 做真实重新核验；
- 所有 factual facts 建立 stable IDs；
- 所有 facts 达到 explicit evidence coverage；
- canonical top-level EvidenceReference 去重；
- 持久化 PR #33 OpenClaw correction event；
- correction target 精确指向稳定 fact address；
- Reading UI 每个 fact 增加 stable anchor + evidence markers；
- Reference List 增加 stable ref anchor；
- 页面显示 latest correction notice / history；
- canonical route / archive identity 不改变；
- Slidev 仍保持 11 页。

### 80B 实质验收

```text
2026-09-07
mode                    evidence-v1
claims                  N
claims with evidence    N
unused references       0
corrections              1
```

必须明确：`100% evidence coverage != 100% factual truth`。

## 6. 80C — Correction Guard + Production Closeout

> 状态：Blocked by 80B

目标：把 correction provenance 变成不可绕过的 repository workflow contract，并完成 Milestone H 真实闭环。

### Scope

新增 correction-specific guard，概念入口：

```text
pnpm evidence:daily:correction:guard --base <integration-base>
```

验证：

- branch 只修改 exact one existing published Daily；
- changed Daily 必须 Evidence V1；
- correction events 对 base 只能 append；
- 旧 correction 不能删除 / 改写；
- factual mutation 必须伴随新 correction event；
- correction target / evidence 必须解析；
- generic Path Guard + full validation + full Build 仍 mandatory；
- Scheduled Daily 永远不自动进入 correction flow。

Closeout：

- PR Build；
- Trusted Preview；
- Human merge；
- fresh main Build；
- public UI 变化后的 exact-SHA Production Pages；
- public smoke；
- roadmap closeout。

## 7. 预计实施顺序

```text
80A Evidence Contract
    ↓
Schema primitives
    ↓
Legacy boundary
    ↓
Evidence integrity evaluator + report
    ↓
Renderer compatibility
    ↓
Scheduled Daily Evidence V1 enforcement
    ↓
PR Build / Trusted Preview / Human Review

80B Real Correction Provenance
    ↓
2026-09-07 full re-verification + migration
    ↓
Reading evidence / correction UI
    ↓
Artifact regression
    ↓
PR Build / Trusted Preview / Human Review

80C Correction Guard + Closeout
    ↓
append-only correction contract
    ↓
workflow / behavior drills
    ↓
main Build
    ↓
Production + smoke
    ↓
Milestone H Done
```

## 8. Implementation branch policy

Planning branch 继续只保存 roadmap / design / plan。

代码实现必须从当前 `main` 创建独立 feature branch，不直接在 `planning/product-capability-roadmap` 上混入 implementation。

推荐：

```text
feat/evidence-integrity-contract       # 80A
feat/evidence-correction-provenance    # 80B
feat/evidence-correction-guard         # 80C
```

每个 slice 独立 PR 到 `main`，前一 slice 合并并 fresh main Build 后再启动下一 slice，避免 stacked implementation 分支重新出现 Plan 40 时的恢复复杂度。

## 9. TDD / validation policy

80A 从 contract tests 开始，不先改实现。

RED / GREEN 应至少覆盖：

- Evidence V1 valid fixture；
- duplicate fact ID；
- duplicate reference ID；
- missing evidence；
- dangling evidence ID；
- unused reference；
- missing Source Registry ID；
- invalid correction target；
- invalid correction evidence；
- legacy Daily allowlisted；
- non-allowlisted legacy Daily rejected；
- new Scheduled Daily legacy shape rejected；
- Weekly / Ad-hoc existing schema isolation；
- Daily 11-page Slidev regression；
- archive / latest / RSS / sitemap / structured-data regressions。

## 10. Failure model

稳定错误类别：

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

错误必须包含 content path 与 stable field / claim address。

## 11. Global non-goals

Plan 80 不做：

- LLM automatic fact judge；
- source truth score；
- citation graph database；
- vector / embedding database；
- semantic search service；
- server-side review runtime；
- automatic correction；
- automatic historical rewrite；
- automatic Source / Author / Topic Registry mutation；
- global Evidence rewrite for Weekly / Essay / Knowledge / Presentation；
- Scheduled Agent auto-merge；
- Pages deploy authority。

## 12. Milestone H Done 条件

- [ ] Evidence V1 Daily Schema + relation contract；
- [ ] frozen legacy migration boundary；
- [ ] human / machine evidence report；
- [ ] new Scheduled Daily requires Evidence V1；
- [ ] 2026-09-07 full real re-verification / migration；
- [ ] PR #33 correction provenance persisted；
- [ ] Reading evidence links + correction notice；
- [ ] Slide count remains 11；
- [ ] correction-specific append-only guard；
- [ ] legacy correction behavior verified；
- [ ] RSS / archive / sitemap / JSON-LD regressions green；
- [ ] 80A / 80B / 80C independently pass PR Build + Trusted Preview；
- [ ] fresh final main Build；
- [ ] exact-SHA Production Pages + public smoke for final public UI；
- [ ] no authority expansion；
- [ ] roadmap / planning closeout。

**当前下一动作：进入 80A — Evidence Contract 的实施计划与 TDD，不启动 80B / 80C。**