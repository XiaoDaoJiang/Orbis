# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 当前实现基线：`main@72e94158a93a2b552528b4887edb846abb523a6f`
> 已完成阶段：**Milestone H — Evidence Integrity · Done**
> 当前阶段：**Milestone I — Merge-Gated Production Promotion · Real Daily Soak Gate**

## 1. 当前产品判断

Orbis 已完成结构化静态发布、Presentation、Discovery、Registry、SEO、Knowledge Lifecycle、Scheduled Daily 与 Evidence Integrity 的稳态能力。

Post-H 真实使用暴露的最高优先级缺口是重复的 Production 人工批准：

```text
PR Build + Trusted Preview
        ↓
Human merge
        ↓
fresh main Site Build
        ↓
manual Production dispatch
```

PR #37（2026-09-08）与 PR #38（2026-09-09）连续证明：Human merge 已经承担实际发布批准，但 green exact-main Build 后仍需要第二次手工 Production action。

因此 Post-H Roadmap Refresh 选择 **Milestone I — Merge-Gated Production Promotion**。

Design 已批准，Plan 90A 已通过 PR #39 实现并合并；第一条 automatic Production proof 已完成。

## 2. 已完成 Milestones

- Milestone A — Discoverable Orbis · Done · Plan 10
- Milestone B — Presentation Platform · Done · Plan 20
- Milestone C — Weekly Intelligence · Done · Plan 30
- Milestone D — Knowledge Identity · Done · Plan 40
- Milestone E — Search & Share Ready · Done · Plan 50
- Milestone F — Durable Knowledge · Done · Plan 60
- Milestone G — Sustainable Automation · Done · Plan 70
- Milestone H — Evidence Integrity · Done · Plan 80

Milestone H final production baseline：

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
Production                   34191412383 success
```

## 3. Post-H evidence that selected Milestone I

### 2026-09-08 · PR #37

```text
merge commit                 0eeb0648c889c8184e8a4dc90282a9f0c51f92fd
fresh main Site Build        34208091062 success
Production                   separately required
```

### 2026-09-09 · PR #38

```text
merge commit                 e639758d993dfdb60791f300c78a6319f1dfe54a
fresh main Site Build        34298769971 success
manual Production run        34299051576 success
Production latest            /2026/09/09/
```

结论：第二次 Production click 是重复操作摩擦，不是新的内容审查边界。

## 4. Milestone I — Merge-Gated Production Promotion

目标：

> **Human merge 成为正常发布流程的唯一人工 Production approval。**

目标链路：

```text
Scheduled / Human contribution
        ↓
read-only PR Build
        ↓
Trusted Preview
        ↓
Human merge
        ↓
Orbis Site Build · push/main
        ↓
exact `orbis-site` artifact
        ↓
trusted workflow_run promotion
        ↓
prove:
  source success
  source event = push
  source branch = main
  source SHA = current main
  exactly one merged PR → main
  merge_commit_sha = source SHA
        ↓
exact artifact promotion
        ↓
pre-deploy current-main recheck
        ↓
Pages deploy + public smoke
```

Scheduled Daily 仍然 PR-only，没有 merge / main / Pages / OIDC authority。

## 5. 90A implementation · Done

PR #39：`feat: add merge-gated Pages promotion`

```text
implementation head          e47ba81663dc56be166657390a1c90ebcda83a6c
RED Build                    34301462494 failure · expected
GREEN PR Build               34301641815 success
Preview artifact             10085185214
Preview SHA-256              35682907ce8f0ee6cf834840f646704763c875ef29ae7af49c347d2cc5356010
Trusted Preview              34301843125 success
merge commit                 72e94158a93a2b552528b4887edb846abb523a6f
```

实现 authority：

- `Orbis Site Build` 继续 read-only；
- `Orbis Pages Promote` 只由 Site Build `workflow_run` completed 触发；
- source 必须是 successful `push` to `main`；
- source SHA 必须仍是 current main；
- 必须 exactly one merged PR → main 且 merge SHA 一致；
- exact source run `orbis-site` 被 promotion；
- deploy 前再次检查 current main；
- Pages/OIDC 只在 deploy job；
- manual `Orbis Pages Production` 保留为 break-glass。

## 6. First automatic Production proof · Done

PR #39 Human merge 后没有手工触发 Production。

```text
current main                 72e94158a93a2b552528b4887edb846abb523a6f
fresh main Site Build        34305469307 success
Site artifact                10086534242
Site SHA-256                 b002da24bf06f2dd890ebeefaa02207adbbd37bf0897cb29f51b2311cca70e51
Orbis Pages Promote          34305651335 success
Pages artifact               10086541959
Pages SHA-256                4b40b803c1630af7ced51de12f78e645f401104aadac314f6d04d37f03ce2b1f
pages_build_version          72e94158a93a2b552528b4887edb846abb523a6f
Production latest            /2026/09/09/
```

Promotion eligibility：

```text
eligible=true
reason=eligible
source_run_id=34305469307
source_sha=72e94158a93a2b552528b4887edb846abb523a6f
```

Public smoke passed：

```text
/
/latest/
/archive.json
/rss.xml
/favicon.svg
/2026/09/09/
```

Latest manual `Orbis Pages Production` remains `34299051576@e639758d...`, before PR #39 merge, so the automatic proof is independent of manual Production。

## 7. Stale build protection

Promotion compares source SHA with current main at eligibility time and again immediately before deploy。

```text
merge A → Build A
merge B → main advances → Build B
Build A finishes later
```

Build A becomes `stale-main` and cannot deploy。

## 8. Remaining Milestone I acceptance

The implementation proof is complete, but Milestone I is not Done until one later real Scheduled Daily repeats the no-second-click path：

- `automation/daily/*` PR passes guard / Build / Trusted Preview；
- Human merge；
- fresh main Site Build；
- automatic `Orbis Pages Promote`；
- exact source SHA/artifact promotion；
- public smoke；
- no manual `Orbis Pages Production` dispatch。

## 9. Candidate status

| 能力 | 状态 | 判断 |
|---|---|---|
| Merge-Gated Production Promotion | **Selected / Soak** | first automatic proof Done；real Daily proof pending |
| Static Full-text Search | Deferred | 尚无更强真实检索失败证据 |
| Weekly Scheduled Automation | Deferred | 尚无稳定重复人工负担证据 |
| Source / Author Directory | Deferred | Registry 规模与浏览需求仍不足 |
| Legacy Evidence migration | Maintenance debt | 按真实 correction/reuse 需求推进 |
| Automatic Registry mutation | Reject for now | authority 增量过高 |
| Multi-provider orchestration | Reject for now | 当前无真实需求 |

## 10. 当前 Gate

```text
Milestone H · Done
      ↓
Post-H Roadmap Refresh · Done
      ↓
Milestone I Design Approved
      ↓
Plan 90A / PR #39 implementation           Done
      ↓
first automatic exact-SHA Production       Done
      ↓
real Scheduled Daily no-second-click       ← current
      ↓
Milestone I Done
```
