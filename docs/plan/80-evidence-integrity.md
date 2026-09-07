# 80 · Evidence Integrity

> 状态：In Progress · 80B Review Gate
> Roadmap Milestone：H — Evidence Integrity
> 设计：[`docs/superpowers/specs/2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) · Approved
> 当前 main：`3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> 真实证据：published Daily correction PR #33
> 当前实施 Slice：80B — Real Correction Provenance + Reading UI · **Review Gate · PR #35**

## 1. 目标

让 Orbis 从“有引用的结构化内容”升级为“重要 factual claim 具有机器可检查 evidence binding 的结构化内容”，并把已发布 correction 升级为正式、读者可见、可审计的内容 provenance。

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

Plan 80 验证 evidence relation 的结构与完整性；**100% structural evidence coverage != 100% factual truth**。

## 2. 已批准核心合同

### Evidence V1 · Daily first

- 只先覆盖 Daily；Weekly / Ad-hoc / Presentation / Essay / Knowledge 不被强制迁移；
- `facts[]` 使用 `{ id, text, evidence[] }`；
- stable claim address 为 `<section.id>/<fact.id>`；
- top-level `references[]` 是 Daily 内唯一 canonical evidence registry；
- `facts[].evidence[]` 只存 reference IDs；
- Evidence V1 section 不再重复完整 reference objects；
- `Reference.supports` 保留 human-readable explanation，不承担 relation authority；
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
        fact: external-supervisor-mode
    evidence:
      - openclaw-v2026-7-2-beta-2
      - openclaw-v2026-9-2
```

派生：

```text
hasCorrections
lastCorrectedAt
correctionCount
```

## 3. 80A — Evidence Contract · Done

> 状态：**Done**
> PR：#34 merged
> Implementation head：`71a1b07cfca189c4a74ae3835c467bb73df0a72c`
> main merge commit：`3a7245aa907fedeb10141bbb05deb718c6fa7e7d`

80A 已完成：

- [x] Evidence V1 Daily Schema primitives；
- [x] `EvidenceFact` / `EvidenceReference` / `DailyCorrection`；
- [x] frozen legacy Daily allowlist；
- [x] deterministic claim/reference integrity evaluator；
- [x] stable error codes / field addresses；
- [x] human-readable + JSON evidence report；
- [x] referential integrity adapter 支持 frozen legacy / Evidence V1；
- [x] Web / Slidev dual-mode compatibility；
- [x] new Scheduled Daily candidate 必须 Evidence V1；
- [x] Scheduled guard 调用 evidence validator；
- [x] legacy-shaped Daily 拒绝伪 `evidenceVersion` / `corrections` metadata；
- [x] Evidence V1 renderer fixture 保持 11 页；
- [x] PR Build + Trusted Preview；
- [x] Human merge；
- [x] fresh main Build。

### 80A final validation

```text
PR                           #34
PR head                      71a1b07cfca189c4a74ae3835c467bb73df0a72c
PR Build                     34096309697 success
Preview Artifact             10008787225
Artifact SHA-256             5d1c1eaafbfab5cbaae0d479cc3a73d6fb9c5726cd673b01f59ddc27873ff535
Trusted Preview              passed
Human merge                  passed
main                         3a7245aa907fedeb10141bbb05deb718c6fa7e7d
fresh main Site Build        34098464587 success
main Artifact                10009585595
main Artifact SHA-256        661b64ec92e251ded54a5f68be30e1f9b9752c5460e47ecb973ab55ced5a89fd
```

80A 没有修改任何 `content/**`，因此 Evidence contract 与真实历史内容迁移保持独立 Review boundary。

## 4. 80B — Real Correction Provenance + Reading UI · Review Gate

> 状态：**Review Gate · PR #35**
> Implementation base：`main@3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> Branch：`feat/evidence-correction-provenance`
> Final head：`8092c6bfab06a768cfaed950aa26f72b2c365576`
> Implementation plan：[`2026-09-07-evidence-correction-provenance.md`](../superpowers/plans/2026-09-07-evidence-correction-provenance.md)

### 4.1 Real re-verification · Done

2026-09-07 全部五个 sections 在迁移前重新回查 primary evidence：

```text
workspace-trust          Gemini CLI v0.60.0 nightly release
deterministic-boundary   GitHub Agentic Workflows README
mcp-policy-plane         GitHub MCP Gateway README
egress-boundary          Agentic Workflow Firewall usage guide
external-supervision     OpenClaw v2026.7.2-beta.2 + v2026.9.2 releases
```

结果：没有发现第二个需要删除的事实错误，但若干 claim 被收窄到与 primary source 更精确一致，包括：

- `.lock.yml` compilation semantics；
- API proxy credential injection；
- Firewall URL-path / SSL Bump limitation；
- OpenClaw beta2 supervisor/recovery 与 v2026.9.2 later upgrade/reply recovery 的版本边界。

### 4.2 Full Daily Evidence V1 migration · Done

`content/briefs/2026-09-07.yaml` 已完整、原子迁移：

```text
mode                    evidence-v1
sections                5
factual claims          16
canonical references     6
corrections              1
Evidence errors          0
```

已完成：

- [x] `evidenceVersion: 1`；
- [x] 全部 16 facts 使用 stable fact IDs；
- [x] 全部 factual facts 显式绑定 evidence；
- [x] canonical top-level EvidenceReference 去重；
- [x] 无 unused canonical evidence reference；
- [x] 2026-09-07 从 frozen legacy debt 删除；
- [x] 其他 legacy Daily 不修改。

当前剩余 frozen legacy debt：

```text
content/briefs/2026-08-28.yaml
content/briefs/2026-09-04.yaml
content/briefs/2026-09-05.yaml
content/briefs/2026-09-06.yaml
```

### 4.3 PR #33 correction provenance · Done

已持久化真实 correction event：

```text
id            openclaw-supervisor-version
correctedAt   2026-09-07
```

Correction targets 使用 stable current fact identities，并绑定：

```text
openclaw-v2026-7-2-beta-2
openclaw-v2026-9-2
```

旧错误文本不复制进 content source；Git history 保留历史版本。

### 4.4 Reading Evidence / correction UI · Done

Evidence V1 Reading page 已提供：

- [x] stable claim anchors `#claim-<section-id>-<fact-id>`；
- [x] stable reference anchors `#ref-<reference-id>`；
- [x] per-fact Evidence links；
- [x] Source Registry enrichment 保持；
- [x] `已修正 · 2026-09-07` notice；
- [x] latest correction summary；
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

80B 没有新增第二 canonical route，也没有改变 archive/RSS/sitemap identity。

### 4.5 TDD Evidence

#### RED · Artifact-layer assumption exposed

```text
Run       34106180726
Head      ae2820b7811d4c00e414938cb52d46c10cb29e4f
Result    failure
```

RED 前所有核心合同均已通过：

```text
Schema / Evidence evaluator        passed
Reading UI pure contract           passed
11-slide Evidence renderer         passed
content:validate                    passed
2026-09-07 evidence-v1             claims=16 refs=6
Source/Topic/Author integrity      passed
Astro / Slidev                     passed
site/archive/latest                passed
```

唯一失败：artifact test 错把 `/2026/09/07/` 当 Reading HTML。真实产品合同是：

```text
/briefs/2026-09-07/  = Reading canonical
/2026/09/07/         = stable Slide redirect alias
```

因此修正测试层，不改产品路由。

#### GREEN · Final head

```text
PR                           #35
Head                         8092c6bfab06a768cfaed950aa26f72b2c365576
Read-only PR Build           34106452727 success
Preview Artifact             10012620633
Artifact SHA-256             f403fb89658edba98593667cf66b891afd0608f178a30f52eddbaed62e8043d8
Trusted Preview              passed
Public availability smoke    passed
PR state                     Ready for review
```

Final artifact contract 分层证明：

1. Reading HTML 含 correction notice、16 stable claims、Evidence links 与 ref anchors；
2. date alias 仍以 Reading 为 canonical，并 redirect 到 11 页 Daily presentation；
3. Preview path 不泄露进 canonical identity。

### 4.6 Authority boundary

80B 没有：

- 修改 Source / Author / Topic Registry identity；
- 迁移其他 legacy Daily；
- 扩大 Scheduled Daily authority；
- 实现 correction-specific append-only guard；
- auto-merge；
- direct main write；
- Production Pages deploy；
- 提交 generated source 或 `dist/**`。

### 80B current Gate

```text
PR #35 Build + Preview    Done
          ↓
Human Review              ← current
          ↓
Human merge
          ↓
fresh main Build
          ↓
80C may start
```

**PR #35 不自动 merge。**

## 5. 80C — Correction Guard + Production Closeout

> 状态：**Blocked by PR #35 Human merge + fresh main Build**

目标：把 correction provenance 变成不可绕过的 repository workflow contract，并完成 Milestone H 真实闭环。

### Planned scope

新增 correction-specific guard，概念入口：

```text
pnpm evidence:daily:correction:guard --base <integration-base>
```

必须验证：

- branch 只修改 exact one existing published Daily；
- changed Daily 必须 Evidence V1；
- correction events 相对 base 只能 append；
- 旧 correction 不能删除 / 改写；
- factual mutation 必须伴随新 correction event；
- correction target / evidence 必须解析；
- generic Path Guard + full validation + full Build 仍 mandatory；
- Scheduled Daily 永远不自动进入 correction flow。

80C closeout：

- correction guard unit / integration / behavior drills；
- PR Build；
- Trusted Preview；
- Human merge；
- fresh main Build；
- exact-SHA Production Pages（80B 已产生 public UI 变化）；
- public smoke；
- roadmap closeout。

## 6. 实施顺序

```text
80A Evidence Contract              Done
        ↓
PR #34 merge + fresh main Build    Done
        ↓
80B Real Correction Provenance     Review Gate · PR #35
        ↓
Human merge
        ↓
fresh main Build
        ↓
80C Correction Guard + Closeout
        ↓
append-only correction contract
        ↓
behavior drills
        ↓
main Build
        ↓
Production + public smoke
        ↓
Milestone H Done
```

## 7. Implementation branch policy

```text
feat/evidence-integrity-contract       # 80A · merged PR #34
feat/evidence-correction-provenance    # 80B · PR #35 Review Gate
feat/evidence-correction-guard         # 80C · blocked
```

每个 slice 必须独立 PR 到 `main`；前一 slice merge + fresh main Build 后才允许下一 slice，避免 stacked implementation 恢复复杂度。

## 8. Global non-goals

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

## 9. Milestone H Done 条件

- [x] Evidence V1 Daily Schema + relation contract integrated into main；
- [x] frozen legacy migration boundary integrated into main；
- [x] human / machine evidence report integrated into main；
- [x] new Scheduled Daily requires Evidence V1 on main；
- [ ] 2026-09-07 full real re-verification / migration integrated into main；
- [ ] PR #33 correction provenance integrated into main；
- [ ] Reading evidence links + correction notice integrated into main；
- [x] Slide count remains 11 in 80B PR validation；
- [ ] correction-specific append-only guard；
- [ ] legacy correction behavior verified；
- [x] RSS / archive / sitemap / JSON-LD regressions green in 80B PR；
- [x] 80A independently passed PR Build + Trusted Preview + fresh main Build；
- [x] 80B independently passed PR Build + Trusted Preview；
- [ ] 80C independently passes PR Build + Trusted Preview；
- [ ] fresh final main Build；
- [ ] exact-SHA Production Pages + public smoke for public Evidence UI；
- [x] no authority expansion through 80A / 80B；
- [ ] roadmap / planning closeout。

**当前下一动作：人工 Review / merge PR #35；合并后先验证 fresh main Build，之后才允许启动 80C。**
