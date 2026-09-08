# 80 · Evidence Integrity

> 状态：Production Gate
> Roadmap Milestone：H — Evidence Integrity
> Design：[`2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) · Approved
> Final implementation main：`fee254c81e899bc77c4671eda472071c390621a9`
> 真实触发证据：published Daily correction PR #33

## 1. 目标

让 Orbis 的 Daily 内容从“有引用”升级为“factual claim 与 evidence 具有机器可检查关系”，同时把 published correction 升级为正式、读者可见、可审计并由 repository guard 强制的 provenance。

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
reader-visible provenance
    ↓
append-only correction guard
```

Plan 80 验证 evidence / provenance 的结构、完整性与可审计性；**100% structural evidence coverage != 100% factual truth**。

## 2. 80A — Evidence Contract · Done

PR #34 建立并进入 main：

- Evidence V1 Daily Schema；
- stable `fact.id`；
- explicit `fact.evidence[]`；
- canonical top-level references；
- Evidence Integrity evaluator / report；
- frozen legacy Daily boundary；
- legacy / Evidence V1 renderer compatibility；
- new Scheduled Daily 必须 Evidence V1；
- 11-page Daily presentation contract 保持。

验证：

```text
PR              #34
PR Build        34096309697 success
Trusted Preview passed
merge           passed
fresh main      34098464587 success
```

## 3. 80B — Real Correction Provenance + Reading UI · Done

PR #35 对 `content/briefs/2026-09-07.yaml` 做完整真实重新核验并迁移，而不是机械把旧 section references 映射给全部 facts。

结果：

```text
sections                5
factual claims         16
canonical references    6
corrections             1
Evidence errors         0
slides                  11
```

已持久化 PR #33 的真实 correction：

```text
id            openclaw-supervisor-version
correctedAt   2026-09-07
```

Reading UI 已提供 stable claim/ref anchors、per-fact evidence links、`已修正` notice、correction history 与 correction → affected fact navigation。

Public identity 保持：

```text
Reading canonical       /briefs/2026-09-07/
Stable date alias       /2026/09/07/
Alias behavior          redirect → /slides/2026-09-07/
Daily slides            11
```

验证：

```text
PR              #35
PR Build        34106452727 success
Trusted Preview passed
merge           passed
main            ebd38ef890ba3f3d40d03b754085cbd73a44a080
fresh main      34108101313 success
```

## 4. 80C — Correction Guard · Done in main

PR #36 已建立 future published Daily correction contract：

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

该 branch 只能修改 exact：

```text
content/briefs/YYYY-MM-DD.yaml
```

Guard 强制：

- integration-base target 已存在、`published`、Evidence V1；
- candidate 保持相同 Daily identity；
- existing correction history 不可删除 / 编辑 / 重排；
- 至少 append 一个新 correction event；
- existing stable section / fact / reference identity 不可静默删除或改名；
- factual text/evidence mutation 必须由 newly appended correction target 覆盖；
- new factual claim 同样必须有新 provenance；
- canonical reference mutation 必须有 explicit correction evidence + affected fact targets；
- appended targets/evidence 继续经过正常 Evidence Integrity evaluator；
- legacy Daily correction fail closed，必须先独立人工复核迁移到 Evidence V1。

Authority 保持三路隔离：

```text
feature/*
    -> Generic Path Guard

automation/daily/*
    -> Generic Path Guard + Scheduled Daily guard

correction/daily/*
    -> Generic Path Guard + Published Daily correction guard
```

Scheduled Daily 永不自动进入 correction mode。

### 80C validation

```text
PR                           #36
Base                         main@ebd38ef890ba3f3d40d03b754085cbd73a44a080
Head                         d8adc2e1d2468c63b8064ee45460b18851ea9742
PR Build                     34109064068 success
Preview Artifact             10013666375
Artifact SHA-256             f52672691bcd7c6c2670789cfa92d2682b2aa5129a875c4da648c39a342d8347
Trusted Preview              passed
Human merge                  passed
Merge commit                 fee254c81e899bc77c4671eda472071c390621a9
```

## 5. Final main Gate · Passed

最终实现树已经稳定进入 main：

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
main Artifact                10038587455
Artifact SHA-256             bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
```

当前 main 的 `.github/workflows/pr-preview-build.yml` 已包含 `correction/daily/* → evidence:daily:correction:guard`，因此 correction contract 已进入最终 main，而不是只存在于 feature branch。

## 6. 当前 Production Gate

80A / 80B / 80C implementation、Human merge 与 final-main Build 均已完成。剩余最后一个显式 authority boundary：

```text
Orbis Pages Production
workflow_dispatch
ref = main
inputs.deploy = true
```

仓库 workflow 只有在：

```text
github.ref == refs/heads/main
&& inputs.deploy == true
```

时才运行 deploy job，并临时获得 `pages: write` + `id-token: write`。Merge、Scheduled Daily、correction producer 与 ordinary PR build 都不能自动部署 Production。

Production run 必须对应 exact current main：

```text
fee254c81e899bc77c4671eda472071c390621a9
```

## 7. Production closeout acceptance

完成显式 Production 后必须验证：

- [ ] Production workflow run `head_sha == fee254c81e899bc77c4671eda472071c390621a9`；
- [ ] `/briefs/2026-09-07/` 可见 correction notice；
- [ ] stable claim/ref anchors 与 evidence links 存在；
- [ ] canonical identity 不泄露 Preview URL；
- [ ] `/2026/09/07/` 继续跳转到 11-page Daily presentation；
- [ ] `/archive.json` healthy；
- [ ] `/latest/` healthy；
- [ ] `/rss.xml` healthy；
- [ ] `/sitemap.xml` healthy；
- [ ] Roadmap / Plan 80 / README closeout 为 Done。

## 8. Milestone H Done 条件

- [x] Evidence V1 Daily Schema + relation contract integrated into main；
- [x] frozen legacy migration boundary integrated into main；
- [x] evidence report integrated into main；
- [x] new Scheduled Daily requires Evidence V1；
- [x] 2026-09-07 full real re-verification / migration；
- [x] PR #33 correction provenance persisted；
- [x] Reading evidence / correction UI；
- [x] Daily remains 11 slides；
- [x] correction-specific append-only guard integrated into main；
- [x] legacy correction fail-closed behavior verified；
- [x] 80A / 80B / 80C independent PR Build + Trusted Preview；
- [x] fresh final main Build；
- [ ] exact-main Production Pages deployment；
- [ ] public Production smoke；
- [x] no Scheduled / merge / Registry / Production authority expansion；
- [ ] roadmap / planning closeout。

**当前状态：Production Gate。Milestone H 尚未标记 Done，直到显式 Production run 与 public smoke 完成。**
