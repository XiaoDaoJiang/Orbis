# 70 · Scheduled Content Automation

> 状态：In Progress · 70B Done / 70C Soak Active
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：Plan 60 · Done；automation design · Approved
> 设计：[`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`](../superpowers/specs/2026-09-03-scheduled-content-automation-design.md)
> 70A Implementation Plan：[`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)
> 70B Implementation Plan：[`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`](../superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md)

## 1. 目标

把 `config/scheduled-task-prompt.md` 与 `config/daily-task-prompt.md` 的执行合同升级为稳定、可观察、最小权限的 Scheduled Content Workflow。

```text
发现 / 研究
    ↓
生成 structured Daily candidate
    ↓
automation/daily/YYYY-MM-DD
    ↓
content-only PR
    ↓
Scheduled Daily Guard + Schema + full Build
    ↓
Trusted Preview
    ↓
Human / Policy Review
    ↓
merge main
    ↓
existing governed Pages pipeline
```

Repository Contract 固定；Scheduler / Producer 可替换。

## 2. 已批准边界

Scheduled Daily 只允许：

```text
content/briefs/<targetDate>.yaml
```

状态决策固定为：

```text
main missing target          → create candidate
open automation branch / PR → update same candidate
main published target        → no write / already-published
main non-public target       → revision-required
published correction         → explicit correction workflow only
```

Feature branch 上的 `status: published` 仅表示 publication candidate，不等于 Production 已发布。Deletion / rename / copy-style transition 在 Scheduled Daily 首版直接拒绝。

## 3. Repository-owned contract

Orbis 固定：

- explicit `targetDate`；
- exact diff boundary；
- deterministic branch / path identity；
- idempotency decision semantics；
- overwrite / correction boundary；
- provider-neutral PR metadata / run-report contract；
- Schema / full Build / Trusted Preview gates；
- Scheduler / Producer 无 Production Pages authority。

Scheduler 按 `Asia/Shanghai` 计算并显式传入：

```text
targetDate=YYYY-MM-DD
branch=automation/daily/YYYY-MM-DD
contentPath=content/briefs/YYYY-MM-DD.yaml
```

Repository tooling 不允许 system-clock fallback。分支名同时作为同日 candidate 的 idempotency key。

## 4. 70A — Scheduled Daily Repository Contract · Done

PR #25 已合并：

```text
feature head          f7a7c60daf766dafbca3e9b7cbee06c569bbb535
main                  1fcdc4caecc234af7ef2426e4c9d320513eb2efb
final PR Build        33738006368 success
Trusted Preview       33738176374 success
post-merge Site Build 33827357380 success
main Artifact         9920458469
Artifact SHA-256      eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

70A 建立 deletion/rename-safe change collection、strict target identity、exact-target guard、published-base protection、provider-neutral decision/report/PR metadata 与 mandatory read-only Preview guard。

## 5. 70B — ChatGPT Scheduled Daily Adapter · Done

PR #26 已合并，现有 ChatGPT Scheduled Task 已原地迁移并启用，不创建第二个 Scheduler。

```text
PR                           #26 merged
feature head                 515295cef40636a2300d5043d592fa8c6e2388a2
main after #26               6419b3dfeeb3caa7f3f577351728a0e8dd780d91
RED                          33827531033 adapter entry missing
final PR Build               33827615741 success
Trusted Preview              33827736463 success
post-merge Site Build        33845663516 success
main Artifact                9926441727
main Artifact SHA-256        a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0
```

External adapter state：

```text
Title       Agent 前沿资讯
Timezone    Asia/Shanghai
Cadence     daily
State       enabled
Bootstrap   current Orbis main / config/adapters/chatgpt-scheduled-daily.md
Legacy      XiaoDaoJiang/ai-frontier behavior removed
Notify      existing notification settings preserved
```

70B Repository 侧已实现：

- thin provider adapter；
- current-main contract bootstrap；
- explicit Asia/Shanghai `targetDate`；
- deterministic branch / exact file / exactly-one-PR transport；
- current branch / PR preflight and same-candidate convergence；
- no direct main write / auto merge / Production Pages deploy；
- provider-neutral report semantics；
- operations runbook and drift contract。

## 6. First real transport proof — PR #27 · Passed

首个 eligible real Scheduled Daily 生成：

```text
targetDate   2026-09-04
branch       automation/daily/2026-09-04
contentPath  content/briefs/2026-09-04.yaml
PR           #27
changed      exactly 1 content file
outcome      candidate-created
```

最终 same-tree head：

```text
f9bb8ef5f54cb1623ab582057d54e5507b0b299a
```

最终 merge ref：

```text
d91e8ac2aeca17bdac6a36eb78ce3ec989f605fa
parents:
  main  3c5cc91974cea388b87b779f3e367b4c114d7a6c
  head  f9bb8ef5f54cb1623ab582057d54e5507b0b299a
```

最终真实证据：

```text
PR Preview Build             33857483693 success
Preview Artifact             9930821104
Preview Artifact SHA-256     909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

最终 job 实际证明：

- PR integration base 正确解析为 `main@3c5cc91974cea388b87b779f3e367b4c114d7a6c`；
- generic Path Guard 只看到 `A content/briefs/2026-09-04.yaml`；
- Scheduled Daily Guard passed；
- ChatGPT adapter contract passed；
- Schema / `content:validate` passed；
- Astro / Slidev / assemble / site checks passed；
- `Weekly artifact real-date-order regression contract passed`；
- `Homepage latest Brief ordering passed: 2026-09-04`；
- `Daily latest isolation passed: Weekly=2026-09-01, Daily latest=2026-09-04`；
- Trusted Preview artifact download / publish / public smoke / URL comment 全部 passed。

因此 **70B first real transport proof 完成，70B Done**。

## 7. First-cycle hardening evidence

首个真实周期同时暴露了两处 repository infrastructure regression；修复均独立于 automation Daily branch，没有扩大 Scheduled Daily authority。

### PR #28 — Weekly artifact real-date-order regression

旧测试把“真实 Weekly 永远比真实 Daily 新”当成不变式。新 Daily `2026-09-04` 合法超过 Weekly `2026-09-01` 后触发失败。

```text
PR                           #28 merged
main after #28               2b93744c491466ff6ce06b28cd2bdefba0e9c79c
PR Build                     33852435264 success
Trusted Preview              33852562237 success
post-merge Site Build        33854389852 success
```

修复后 Homepage Latest Brief 按真实 publishedAt 排序，同时继续保持 `/latest/` 和 `archive.json.latest/issues` 为 Daily-only。

### PR #29 — PR Preview integration-base regression

旧 workflow checkout 新 merge ref，却把事件 payload 中陈旧的 `pull_request.base.sha` 传给 Guard，导致 base 前进后把已合并基础设施文件错误算入 candidate diff。

```text
PR                           #29 merged
main                         3c5cc91974cea388b87b779f3e367b4c114d7a6c
RED                          33854799672 missing merge-ref base contract
GREEN PR Build               33854859027 success
Trusted Preview              33855011922 success
post-merge Site Build        33857265076 success
main Artifact                9930724616
main Artifact SHA-256        1028492c557ae5309562430f2216ac9306b731e340f3e1adda0b203e7b450c0b
```

Guard 现在统一从 checked-out merge commit 的第一父节点解析 integration base：

```text
git rev-parse HEAD^1
```

PR Build 仍是 `contents: read`，没有 Production authority。

## 8. Automation Run Report

Repository contract：

```text
version
kind=daily
targetDate
branch
contentPath
outcome
sourceCount
primarySourceCount
validation
fullBuild
unverified[]
failureStage?
```

不记录 chain-of-thought、密钥、内部 prompt 或无必要抓取原文。

## 9. Correction Workflow

若 main 已存在 published Daily：

```text
Scheduled Daily → no write / already-published
```

事实错误进入显式 correction flow：

```text
correction/daily/YYYY-MM-DD/<reason-slug>
```

Scheduled Job 不自动进入 correction mode。

## 10. Preview / Publish Boundary

Automation PR：

```text
generic PR Path Guard
→ Scheduled Daily exact guard
→ full pnpm build
→ artifact
→ Trusted Preview
→ public smoke
```

Human / Policy Review 通过后才 merge main。Pages 继续由既有 governed Production workflow 管理；Scheduled Producer 不拥有 deploy 权限。

## 11. 70C — Real-cycle Validation · Soak Active

70C 已开始，但正式稳定周期从 **0/3** 计数。

PR #27 定义为 **Cycle 0 / transport proof**：它证明了真实外部 transport，但过程中发现并修复 #28 / #29 两个基础设施问题，因此不计入“三个连续无需基础设施手工修补的真实周期”。

70C 必须至少完成：

- [ ] Stable Cycle 1 / 3；
- [ ] Stable Cycle 2 / 3；
- [ ] Stable Cycle 3 / 3；
- [ ] same-day rerun / idempotency drill；
- [ ] published Daily `already-published` no-write drill；
- [ ] explicit correction workflow drill；
- [ ] 三个连续稳定周期内无需基础设施手工修补。

现有 Scheduled Task 继续保持 enabled。下一 eligible targetDate 若创建新 candidate，只有在不需要 repository infrastructure repair 且完整通过 Guard → Build → Trusted Preview 时，才记为 Stable Cycle 1。

## 12. 非目标

- Agent 自动 merge；
- Agent 直接部署 Pages；
- 首版同时接多个 Provider；
- 数据库任务队列；
- 新 CMS；
- 自动 Source / Author / Topic Registry mutation；
- 自动改写已发布历史；
- 将 Runtime 嵌入 Astro。

## 13. 验收标准

- Scheduled Daily 只能修改 exact `content/briefs/<targetDate>.yaml`；
- deletion / rename 不可绕过 guard；
- target date 显式使用 Asia/Shanghai；
- 同日 rerun 只有一个 deterministic branch / PR；
- main published Daily 永不被静默覆盖；
- correction 明确分流；
- full Build + Trusted Preview 为 mandatory gate；
- Scheduler / Producer 无 Production Pages write 权限；
- failure stage 可观察；
- 三个真实稳定周期无需基础设施调整；
- 替换 Producer 不修改 content Schema / Build Pipeline。

## 14. 当前 Gate

- [x] Plan 60 / Milestone F Done；
- [x] Plan 70 design approved；
- [x] 70A Done；
- [x] PR #26 merged；
- [x] external ChatGPT task migrated + enabled；
- [x] first eligible real transport proof — PR #27；
- [x] first-cycle hardening — PR #28 / #29；
- [x] 70B Done；
- [ ] 70C Stable Cycle 1 / 3；
- [ ] 70C Stable Cycle 2 / 3；
- [ ] 70C Stable Cycle 3 / 3；
- [ ] idempotency / no-write / correction drills。

**当前下一步：保持现有 Scheduled Task 运行，观察下一个 eligible Daily。若无需基础设施修补并完整通过 exact Guard → full Build → Trusted Preview，则记为 70C Stable Cycle 1 / 3。**
