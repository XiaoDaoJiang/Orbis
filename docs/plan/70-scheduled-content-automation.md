# 70 · Scheduled Content Automation

> 状态：In Progress · 70B Done / 70C Drills Gate
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

70B 已实现 thin provider adapter、current-main bootstrap、explicit Asia/Shanghai `targetDate`、deterministic branch / exact file / exactly-one-PR transport、same-candidate convergence、provider-neutral report，以及 no-direct-main / no-auto-merge / no-Production-Pages authority boundary。

## 6. First real transport proof — PR #27 · Passed

首个 eligible real Scheduled Daily：

```text
targetDate   2026-09-04
branch       automation/daily/2026-09-04
contentPath  content/briefs/2026-09-04.yaml
PR           #27
changed      exactly 1 content file
outcome      candidate-created
```

最终证据：

```text
final head                   f9bb8ef5f54cb1623ab582057d54e5507b0b299a
merge ref                    d91e8ac2aeca17bdac6a36eb78ce3ec989f605fa
integration base             3c5cc91974cea388b87b779f3e367b4c114d7a6c
PR Preview Build             33857483693 success
Preview Artifact             9930821104
Preview Artifact SHA-256     909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

最终 job 证明 exact one-file Daily diff、Scheduled Daily Guard、Schema / `content:validate`、Astro / Slidev / assemble / site checks、Weekly real-date-order、Daily-only archive/latest 与 Trusted Preview public smoke 全部通过。

因此 **70B Done**。

## 7. First-cycle hardening evidence

Cycle 0 暴露两处 repository infrastructure regression；修复均独立于 automation Daily branch，未扩大 Scheduled Daily authority。

### PR #28 — Weekly artifact real-date-order regression

```text
PR                           #28 merged
main after #28               2b93744c491466ff6ce06b28cd2bdefba0e9c79c
PR Build                     33852435264 success
Trusted Preview              33852562237 success
post-merge Site Build        33854389852 success
```

### PR #29 — PR Preview integration-base regression

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

Guard 现在从 checked-out merge commit 第一父节点解析 integration base：

```text
git rev-parse HEAD^1
```

PR Build 继续保持 `contents: read`，无 Production authority。

## 8. 70C — Three consecutive stable cycles · Passed 3/3

PR #27 定义为 **Cycle 0 / transport proof**，因为当日需要 #28 / #29 infrastructure hardening，不计入稳定周期。

之后连续三个真实 Scheduled Daily 都未要求 repository infrastructure repair，并最终通过 exact Guard → full Build → Trusted Preview。

### Stable Cycle 1 / 3 — 2026-09-05 · PR #30

```text
targetDate                   2026-09-05
branch                       automation/daily/2026-09-05
content                      content/briefs/2026-09-05.yaml
PR                           #30
changed files                exactly 1
head                         2ed5f620364612702c9ba657dea90f609921f47d
PR Preview Build             33933722915 success
Preview Artifact             9959459260
Artifact SHA-256             6b3bba0b8594dacdc93b66ec21cb33dfe61acb983850eb910b485c8da9c0c458
Trusted Preview public smoke passed
```

### Stable Cycle 2 / 3 — 2026-09-06 · PR #31

```text
targetDate                   2026-09-06
branch                       automation/daily/2026-09-06
content                      content/briefs/2026-09-06.yaml
PR                           #31
changed files                exactly 1
head                         cccbd9a7af9b0c816263981d6e80ea84516ffeee
PR Preview Build             34001239220 success
Preview Artifact             9979564620
Artifact SHA-256             8a1e5e2c972a13c0dfb9562a8b03846dbfb3424e1e8c4f0fb9663189ad06fcfa
Trusted Preview public smoke passed
```

### Stable Cycle 3 / 3 — 2026-09-07 · PR #32

```text
targetDate                   2026-09-07
branch                       automation/daily/2026-09-07
content                      content/briefs/2026-09-07.yaml
PR                           #32
changed files                exactly 1
final head                   9a52d4c064ed30baa2507ecda6b1820df0164dac
final PR Preview Build       34069576275 success
Preview Artifact             10000034839
Artifact SHA-256             e641c0703ce4ae95f29b1ce2d7984cac7a73ec54fb498d72f80f82cae73a5838
Trusted Preview public smoke passed
```

9/7 首次 candidate commit `8e62de0aa194499042f5cfea868dbea7721ecb19` 因内容 Source ID 不满足既有 Registry 合同而被现有 CI 拒绝；Producer 随后在**同一个 deterministic branch / 同一个 PR #32** 中只修改目标 Daily YAML，commit `9a52d4c064ed30baa2507ecda6b1820df0164dac` 后完整转绿。该过程没有 repository infrastructure repair，因此仍计为 Stable Cycle 3，同时证明了同一 candidate 的失败后收敛行为。

这两次提交发生在同一次 Scheduled Task 执行内，因此**不**冒充独立的 same-day rerun / idempotency drill。

## 9. Automation Run Report

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

## 10. Correction Workflow

若 main 已存在 published Daily：

```text
Scheduled Daily → no write / already-published
```

事实错误进入显式 correction flow：

```text
correction/daily/YYYY-MM-DD/<reason-slug>
```

Scheduled Job 不自动进入 correction mode。

## 11. Preview / Publish Boundary

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

## 12. 70C remaining drills

连续稳定周期已经完成 **3/3**。70C 现在只剩三个显式行为演练：

- [ ] same-day rerun / idempotency drill；
- [ ] published Daily `already-published` no-write drill；
- [ ] explicit correction workflow drill。

为了进入 published/no-write 与 correction 语义，至少需要一个 Daily candidate 先通过 Human / Policy Review 合并进入 `main`。当前 #27 / #30 / #31 / #32 均保持 open；Scheduled Producer 不自动 merge。

推荐集成顺序按日期推进：

```text
#27  2026-09-04
 ↓
#30  2026-09-05
 ↓
#31  2026-09-06
 ↓
#32  2026-09-07
```

因为四个 PR 最初都基于 `main@3c5cc91974cea388b87b779f3e367b4c114d7a6c` 生成，每次前一个 PR 合并后，下一个 PR 应在当前 main 上做 same-tree revalidation，再进入人工 merge gate；不得用旧 base 的绿色 CI 直接替代当前-main 集成验证。

## 13. 非目标

- Agent 自动 merge；
- Agent 直接部署 Pages；
- 首版同时接多个 Provider；
- 数据库任务队列；
- 新 CMS；
- 自动 Source / Author / Topic Registry mutation；
- 自动改写已发布历史；
- 将 Runtime 嵌入 Astro。

## 14. 验收标准

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

## 15. 当前 Gate

- [x] Plan 60 / Milestone F Done；
- [x] Plan 70 design approved；
- [x] 70A Done；
- [x] 70B Done；
- [x] Cycle 0 transport proof — PR #27；
- [x] first-cycle hardening — PR #28 / #29；
- [x] 70C Stable Cycle 1 / 3 — PR #30；
- [x] 70C Stable Cycle 2 / 3 — PR #31；
- [x] 70C Stable Cycle 3 / 3 — PR #32；
- [x] 三个连续稳定周期内无需 repository infrastructure repair；
- [ ] same-day rerun / idempotency drill；
- [ ] published Daily `already-published` no-write drill；
- [ ] explicit correction workflow drill。

**当前下一步：进入 Human / Policy integration gate。按 #27 → #30 → #31 → #32 日期顺序合并；每次 base 前进后对下一个 candidate 做 same-tree current-main revalidation。随后在已 published Daily 上执行 no-write 与 correction drills，并补齐独立 same-day rerun / idempotency 证据。**
