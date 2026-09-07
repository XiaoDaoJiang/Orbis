# 80 · Evidence Integrity

> 状态：In Progress · 80C Review Gate
> Roadmap Milestone：H — Evidence Integrity
> 设计：[`docs/superpowers/specs/2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) · Approved
> 当前 main：`ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> 真实证据：published Daily correction PR #33
> 当前实施 Slice：80C — Correction Guard + Production Closeout · **Review Gate · PR #36**

## 1. 目标

让 Orbis 从“有引用的结构化内容”升级为“重要 factual claim 具有机器可检查 evidence binding 的结构化内容”，并把 published correction 升级为正式、读者可见、可审计且 repository-enforced 的 provenance。

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
    ↓
append-only repository guard
```

Plan 80 验证 evidence / provenance 的结构与完整性；**100% structural evidence coverage != 100% factual truth**。

## 2. 已批准核心合同

### Evidence V1 · Daily first

- Daily 使用 `evidenceVersion: 1`；
- factual `facts[]` 使用 `{ id, text, evidence[] }`；
- stable claim address 为 `<section.id>/<fact.id>`；
- top-level `references[]` 是 Daily 内 canonical evidence registry；
- `facts[].evidence[]` 只存 reference IDs；
- Evidence V1 section 不重复完整 reference objects；
- `Reference.supports` 只承担 human-readable explanation；
- Source identity 继续复用现有 Source Registry。

### Correction provenance

只持久化 correction events，不双写 `revisedAt`：

```yaml
corrections:
  - id: openclaw-supervisor-version
    correctedAt: 2026-09-07
    summary: ...
    targets:
      - section: external-supervision
        fact: external-supervisor-mode
    evidence:
      - openclaw-v2026-7-2-beta-2
      - openclaw-v2026-9-2
```

Existing correction history 在 80C 后成为 append-only repository contract。

## 3. 80A — Evidence Contract · Done

> PR：#34 merged
> Implementation head：`71a1b07cfca189c4a74ae3835c467bb73df0a72c`
> main merge commit：`3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> fresh main Build：`34098464587` success

已完成：

- [x] Evidence V1 Daily Schema primitives；
- [x] `EvidenceFact` / `EvidenceReference` / `DailyCorrection`；
- [x] frozen legacy Daily allowlist；
- [x] deterministic claim/reference integrity evaluator；
- [x] human-readable + JSON evidence report；
- [x] legacy / Evidence V1 validation + rendering compatibility；
- [x] new Scheduled Daily candidate 必须 Evidence V1；
- [x] Scheduled guard 调用 evidence validator；
- [x] Evidence V1 Daily 保持 11 页；
- [x] PR Build + Trusted Preview + Human merge + fresh main Build。

80A 没有修改 `content/**`，合同层与真实历史迁移保持独立 Review boundary。

## 4. 80B — Real Correction Provenance + Reading UI · Done

> PR：#35 merged
> Implementation base：`main@3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> Final head：`8092c6bfab06a768cfaed950aa26f72b2c365576`
> main merge commit：`ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> fresh main Build：`34108101313` success
> main Artifact：`10013259615`
> main Artifact SHA-256：`1a5925bbea154e3f6ec5a06585498779467f53266a38c5ed09a22b06d17b5dae`

### 4.1 Real re-verification

2026-09-07 全部五个 sections 在迁移前重新回查 primary evidence：

```text
workspace-trust          Gemini CLI v0.60.0 nightly release
deterministic-boundary   GitHub Agentic Workflows README
mcp-policy-plane         GitHub MCP Gateway README
egress-boundary          Agentic Workflow Firewall usage guide
external-supervision     OpenClaw v2026.7.2-beta.2 + v2026.9.2 releases
```

没有发现第二个 delete-level factual error；若干 claim 被收窄到与 primary source 更精确一致。

### 4.2 Full Daily Evidence V1 migration

```text
content                  content/briefs/2026-09-07.yaml
mode                     evidence-v1
sections                 5
factual claims           16
canonical references      6
corrections               1
Evidence errors           0
```

2026-09-07 已从 frozen legacy debt 删除；其他 legacy Daily 保持不变。

### 4.3 PR #33 correction provenance

已持久化真实 correction event：

```text
id            openclaw-supervisor-version
correctedAt   2026-09-07
```

Correction targets 使用 stable current fact identity，并绑定 OpenClaw beta2 / v2026.9.2 canonical evidence。

### 4.4 Reader-visible Evidence UI

已提供：

- [x] stable claim anchors `#claim-<section-id>-<fact-id>`；
- [x] stable reference anchors `#ref-<reference-id>`；
- [x] per-fact Evidence links；
- [x] Source Registry enrichment；
- [x] `已修正 · 2026-09-07` notice；
- [x] correction history；
- [x] correction → affected fact navigation；
- [x] legacy Daily Reading compatibility。

Public identity 保持：

```text
Reading canonical       /briefs/2026-09-07/
Stable date alias       /2026/09/07/
Date alias behavior     redirect → /slides/2026-09-07/
Daily slides            11
```

### 4.5 Final 80B validation

```text
PR                           #35
Head                         8092c6bfab06a768cfaed950aa26f72b2c365576
Read-only PR Build           34106452727 success
Preview Artifact             10012620633
Artifact SHA-256             f403fb89658edba98593667cf66b891afd0608f178a30f52eddbaed62e8043d8
Trusted Preview              passed
Human merge                  passed
fresh main Site Build        34108101313 success
```

## 5. 80C — Correction Guard + Production Closeout · Review Gate

> 状态：**Review Gate · PR #36**
> Implementation base：`main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> Branch：`feat/evidence-correction-guard`
> Final head：`d8adc2e1d2468c63b8064ee45460b18851ea9742`
> Implementation plan：[`2026-09-07-evidence-correction-guard.md`](../superpowers/plans/2026-09-07-evidence-correction-guard.md)

### 5.1 Published correction branch contract

Future explicit corrections use:

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

and may modify exactly:

```text
content/briefs/YYYY-MM-DD.yaml
```

The target on integration base must already be `published` and Evidence V1. Frozen legacy Daily correction fails closed and requires separate full human-reviewed Evidence V1 migration first.

### 5.2 Append-only provenance

80C implementation enforces：

- existing correction events cannot be deleted / edited / reordered；
- candidate must append at least one new correction event；
- existing stable section / fact / reference identities cannot silently disappear or be renamed；
- factual text/evidence mutation requires a newly appended correction target；
- newly added factual claim also requires new correction provenance；
- changed canonical reference requires appended correction evidence plus targets for all affected facts；
- appended correction targets/evidence resolve through the normal Evidence Integrity evaluator。

### 5.3 Authority routing

PR Preview Build keeps branch-specific authority isolated：

```text
feature/*                 -> Generic Path Guard

automation/daily/*        -> Generic Path Guard + Scheduled Daily guard

correction/daily/*        -> Generic Path Guard + Published Daily correction guard
```

Scheduled Daily never automatically enters correction mode。

### 5.4 Behavior drills / TDD · Done

Final full Build proves：

```text
Scheduled + correction workflow contract         passed
Published Daily correction policy                passed
Legacy published correction fail-closed          passed
Published Daily correction real-Git integration  passed
Evidence V1 11-slide renderer                    passed
Evidence provenance UI artifact                  passed
```

Real temporary-Git integration covers valid correction、history rewrite、untracked factual mutation、extra path and dangling correction target。

### 5.5 Final 80C PR validation

```text
PR                           #36
Base                         main@ebd38ef890ba3f3d40d03b754085cbd73a44a080
Head                         d8adc2e1d2468c63b8064ee45460b18851ea9742
Read-only PR Build           34109064068 success
Preview Artifact             10013666375
Artifact SHA-256             f52672691bcd7c6c2670789cfa92d2682b2aa5129a875c4da648c39a342d8347
Trusted Preview              passed
Public availability smoke    passed
PR state                     Ready for review
```

80C implementation PR 不修改 `content/**`、Registry identities、generated source、`dist/**`、merge policy 或 Production authority。

## 6. 当前 Gate / Production closeout

```text
80A Evidence Contract                  Done
        ↓
80B Real Correction Provenance         Done
        ↓
80C Correction Guard implementation    Review Gate · PR #36
        ↓
Human Review / merge                   ← current
        ↓
fresh main Site Build
        ↓
verify correction guard on exact main SHA
        ↓
explicit exact-SHA Production Pages
        ↓
public HTTP smoke
        ↓
Milestone H Done
```

PR #36 不自动 merge。Production Pages 也不由 Agent / Scheduled producer 自动触发。

## 7. Production verification after PR #36 merge

因为 80B 已改变公开 Reading 页面，80C merge 后必须从最终 exact main SHA 完成显式 Production closeout：

1. fresh `main` Site Build + artifact；
2. exact-SHA Production Pages workflow；
3. `/briefs/2026-09-07/`：correction notice、claim/ref anchors、canonical identity；
4. `/2026/09/07/`：保持 redirect 到 11-page Daily Slides；
5. archive / latest / RSS / sitemap public smoke；
6. Roadmap / Plan 80 / README closeout。

## 8. Implementation branch policy

```text
feat/evidence-integrity-contract       # 80A · Done / PR #34
feat/evidence-correction-provenance    # 80B · Done / PR #35
feat/evidence-correction-guard         # 80C · Review Gate / PR #36
```

每个 slice 独立 PR 到 `main`，前一 slice merge + fresh main Build 后才启动下一 slice。

## 9. Global non-goals

Plan 80 不做：

- LLM automatic fact judge；
- source truth score；
- citation graph / vector database；
- semantic search service；
- automatic correction generation；
- automatic historical rewrite；
- automatic Source / Author / Topic Registry mutation；
- global Evidence rewrite for Weekly / Essay / Knowledge / Presentation；
- Scheduled Agent auto-merge；
- automatic Pages deployment authority。

## 10. Milestone H Done 条件

- [x] Evidence V1 Daily Schema + relation contract integrated into main；
- [x] frozen legacy migration boundary integrated into main；
- [x] human / machine evidence report integrated into main；
- [x] new Scheduled Daily requires Evidence V1 on main；
- [x] 2026-09-07 full real re-verification / migration integrated into main；
- [x] PR #33 correction provenance integrated into main；
- [x] Reading evidence links + correction notice integrated into main；
- [x] Slide count remains 11；
- [x] correction-specific append-only guard implemented and PR-validated；
- [x] legacy correction fail-closed behavior verified；
- [x] RSS / archive / sitemap / JSON-LD regressions green；
- [x] 80A independently passed PR Build + Trusted Preview + fresh main Build；
- [x] 80B independently passed PR Build + Trusted Preview + fresh main Build；
- [x] 80C independently passed PR Build + Trusted Preview；
- [ ] PR #36 Human merge；
- [ ] fresh final main Build；
- [ ] exact-SHA Production Pages + public smoke；
- [x] no authority expansion through implementation；
- [ ] roadmap / planning closeout。

**当前下一动作：人工 Review / merge PR #36；合并后先验证 fresh main Build，再执行显式 exact-SHA Production Pages 与 public smoke。**
