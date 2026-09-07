# 70 · Scheduled Content Automation

> 状态：Done
> Roadmap Milestone：G — Sustainable Automation · Done
> 完成日期：2026-09-07
> 最终生产基线：`main@b3e793d0c5c7d55358933d4d25c4d77dafd8cd03`
> 依赖：Plan 60 · Done；automation design · Approved
> 设计：[`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`](../superpowers/specs/2026-09-03-scheduled-content-automation-design.md)
> 70A Implementation Plan：[`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)
> 70B Implementation Plan：[`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`](../superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md)

## 1. 结论

Plan 70 已完成 repository-owned Scheduled Content Automation 的合同、ChatGPT Scheduled Daily adapter、真实连续周期、同日重跑、已发布 no-write 与显式 correction 全链路验证。

最终状态：

```text
Repository Contract 固定
        ↓
Scheduler / Producer 可替换
        ↓
explicit Asia/Shanghai targetDate
        ↓
deterministic automation/daily/YYYY-MM-DD
        ↓
exact content/briefs/YYYY-MM-DD.yaml
        ↓
read-only PR Build
        ↓
Trusted Preview + public smoke
        ↓
Human / Policy Review
        ↓
merge main
        ↓
existing governed Pages pipeline
```

Scheduled Producer 从未获得 direct-main、auto-merge 或 Production Pages authority。

## 2. 已锁定状态语义

```text
main missing target          → create candidate
owned open candidate         → update same candidate
main published target        → already-published / zero write
main non-public target       → revision-required
published correction         → explicit correction workflow only
```

身份固定为：

```text
targetDate   = YYYY-MM-DD   # Asia/Shanghai
branch       = automation/daily/YYYY-MM-DD
contentPath  = content/briefs/YYYY-MM-DD.yaml
```

Repository tooling 不允许 system-clock fallback；同日 branch 是 candidate idempotency key。

## 3. 70A — Repository Contract · Done

PR #25 建立：

- deletion / rename / copy-safe change collection；
- strict targetDate / branch / path identity；
- exact one-Daily guard；
- published-base overwrite protection；
- provider-neutral decision / report / PR metadata；
- mandatory read-only PR Preview contract。

```text
PR                           #25 merged
feature head                 f7a7c60daf766dafbca3e9b7cbee06c569bbb535
main after merge             1fcdc4caecc234af7ef2426e4c9d320513eb2efb
final PR Build               33738006368 success
Trusted Preview              33738176374 success
post-merge Site Build        33827357380 success
Artifact                     9920458469
SHA-256                      eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

## 4. 70B — ChatGPT Scheduled Daily Adapter · Done

PR #26 将现有 ChatGPT Scheduled Task 原地迁移到 repository-owned adapter；没有创建第二个 Scheduler。

```text
PR                           #26 merged
feature head                 515295cef40636a2300d5043d592fa8c6e2388a2
main after merge             6419b3dfeeb3caa7f3f577351728a0e8dd780d91
RED                          33827531033 adapter entry missing
GREEN PR Build               33827615741 success
Trusted Preview              33827736463 success
post-merge Site Build        33845663516 success
Artifact                     9926441727
SHA-256                      a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0
```

External adapter 稳态：

```text
Title       Agent 前沿资讯
Timezone    Asia/Shanghai
Cadence     daily
State       enabled
Bootstrap   current Orbis main adapter
Legacy      XiaoDaoJiang/ai-frontier retired
```

## 5. Cycle 0 — First real transport proof

2026-09-04 / PR #27 完成真实 transport proof：

```text
targetDate                   2026-09-04
branch                       automation/daily/2026-09-04
content                      content/briefs/2026-09-04.yaml
changed files                exactly 1
outcome                      candidate-created
final head                   f9bb8ef5f54cb1623ab582057d54e5507b0b299a
PR Preview Build             33857483693 success
Artifact                     9930821104
SHA-256                      909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview              33857669310 success
```

Cycle 0 暴露两处 repository regression，并通过独立 PR 修复：

- PR #28：Weekly real-date-order regression；
- PR #29：PR Preview integration-base regression。

两次修复均未扩大 Scheduled Daily authority。因此 #27 作为 transport proof，不计入稳定 3-cycle。

## 6. 70C — Three consecutive stable cycles · Done 3/3

### Stable Cycle 1 / 3 — 2026-09-05 · PR #30

原始生产周期：

```text
branch                       automation/daily/2026-09-05
content                      content/briefs/2026-09-05.yaml
changed files                exactly 1
original head                2ed5f620364612702c9ba657dea90f609921f47d
PR Preview Build             33933722915 success
Artifact                     9959459260
SHA-256                      6b3bba0b8594dacdc93b66ec21cb33dfe61acb983850eb910b485c8da9c0c458
Trusted Preview              public smoke passed
```

#27 合并后进行 same-tree current-main revalidation：

```text
main                         13171f09a0f7ee700c48a0a16968ce65756dc10f
revalidation head            a91c8185cbe8f089c028482a57d2b5e2c1eba839
PR Preview Build             34077910480 success
Artifact                     10002731827
SHA-256                      e1bceeae9c512b1f5e2e632079d647028de6c507f91efed9c72ae8a94ddfcc4b
Trusted Preview              34078020466 success
```

随后 PR #30 由 Human 合并。

### Stable Cycle 2 / 3 — 2026-09-06 · PR #31

原始生产周期：

```text
branch                       automation/daily/2026-09-06
content                      content/briefs/2026-09-06.yaml
changed files                exactly 1
original head                cccbd9a7af9b0c816263981d6e80ea84516ffeee
PR Preview Build             34001239220 success
Artifact                     9979564620
SHA-256                      8a1e5e2c972a13c0dfb9562a8b03846dbfb3424e1e8c4f0fb9663189ad06fcfa
Trusted Preview              public smoke passed
```

#30 合并后 same-tree revalidation：

```text
main                         76637ada1de2337c9cc1a08b3d7a653432446ac8
revalidation head            e3813bd45a461ba2eaa5890eb93f1bdaf0a54318
PR Preview Build             34078356383 success
Artifact                     10002879166
SHA-256                      d692bfa3f15ad4aa2e38d027b864990ee126b70216635b483184b0cf47d1a5ed
Trusted Preview              34078494433 success
```

随后 PR #31 由 Human 合并。

### Stable Cycle 3 / 3 — 2026-09-07 · PR #32

原始周期首次 candidate 因 Source ID 不满足既有 Registry contract 被拒绝；Producer 在同一个 deterministic branch / PR 中只修改目标 Daily YAML 后转绿，没有 repository infrastructure repair。

```text
branch                       automation/daily/2026-09-07
content                      content/briefs/2026-09-07.yaml
changed files                exactly 1
first candidate              8e62de0aa194499042f5cfea868dbea7721ecb19
same-run corrected head      9a52d4c064ed30baa2507ecda6b1820df0164dac
PR Preview Build             34069576275 success
Artifact                     10000034839
SHA-256                      e641c0703ce4ae95f29b1ce2d7984cac7a73ec54fb498d72f80f82cae73a5838
Trusted Preview              public smoke passed
```

#31 合并后的最终 same-tree integration revalidation：

```text
main                         87d10f5f6924dfea65893672e02ef3671ad3f9e1
revalidation head            b092233168dabb947734fe0d078a44744f277257
PR Preview Build             34078845565 success
Artifact                     10003023924
SHA-256                      117413ee5b9a67c4dd02f6b7830b5491348ae0890c8d62cc5387b8fa91fb2a77
Trusted Preview              34078960227 success
```

随后 PR #32 由 Human 合并，`main` 前进到：

```text
6411076d1769b96f6e26b6fd5c6c005c78aad9e8
```

## 7. Same-day rerun / deterministic idempotency drill · Passed

2026-09-07 在 PR #32 尚为 owned open candidate 时，用户单独点击既有 Scheduled Task 的 `Run now`。

结果：

```text
targetDate                   2026-09-07
outcome                      candidate-updated
branch                       automation/daily/2026-09-07   reused
PR                           #32                           reused
content                      content/briefs/2026-09-07.yaml
new competing branch         0
new competing PR             0
```

独立 rerun evidence：

```text
rerun head                   1e3a3c0a5c43be2de17f6c7e99c7de1516f631f2
PR Preview Build             34076897189 success
Artifact                     10002401922
SHA-256                      62b1ad49c301a58efae7e80bd7553e73bb0612e648962bd659bc4cc9112eef48
Trusted Preview              public smoke passed
```

后续 same-tree integration revalidation 没有改变该 rerun 生成的 content tree，因此这是一条独立、真实的 producer idempotency drill，而不是 CI revalidation。

## 8. Published Daily `already-published` / zero-write drill · Passed

PR #32 合并后，`main` 已存在：

```text
content/briefs/2026-09-07.yaml
publishedAt: 2026-09-07
status: published
```

再次执行同一个 Scheduled Task，观察到：

```text
targetDate                   2026-09-07
outcome                      already-published
research / regeneration      not entered
validation / build / preview not run
main write                   0
branch write                 0
new branch                   0
new PR                       0
merge                        0
Production Pages             0
```

独立 GitHub 前后核验：

```text
main before/after            6411076d1769b96f6e26b6fd5c6c005c78aad9e8
9/7 automation branch        b092233168dabb947734fe0d078a44744f277257
open 9/7 automation PR       none
```

证明 preflight 在 published state 下 fail closed 到 no-write，而不是静默覆盖历史内容。

## 9. Explicit correction workflow drill · Passed

在已发布 2026-09-07 Brief 中发现真实可证实的版本归因问题：Brief 将 `OPENCLAW_SUPERVISOR_MODE=external` 的引入归因于 OpenClaw `v2026.9.2`；官方 `v2026.7.2-beta.2` 已明确加入该模式。修正因此没有人为制造错误。

显式 correction：

```text
branch                       correction/daily/2026-09-07/openclaw-supervisor-version
PR                           #33
base                         6411076d1769b96f6e26b6fd5c6c005c78aad9e8
head                         a73ef682ac4e3f7dacefe68dc0bd7706ec5296d7
changed files                exactly 1
  M content/briefs/2026-09-07.yaml
```

治理结果：

- normal Scheduled Daily 没有自动进入 correction；
- correction 使用独立命名 branch；
- generic Path Guard mandatory；
- Scheduled Daily exact guard 在 correction branch 上明确 skipped；
- full Build mandatory；
- Trusted Preview + public smoke mandatory；
- Human Review 后才 merge；
- correction producer 没有 direct-main / auto-merge / Production authority。

CI / Preview：

```text
PR Preview Build             34088014693 success
Artifact                     10005904775
SHA-256                      de54c7a5374e7806395f077b6fd26c0621b17da04da27446c6acc9931619ef2a
Trusted Preview              34088175467 success
public smoke                 passed
```

PR #33 由 Human 合并：

```text
merge / final main           b3e793d0c5c7d55358933d4d25c4d77dafd8cd03
fresh main Site Build        34090549723 success
main Artifact                10006713925
Artifact SHA-256             8c56125aea23914874a908550d98675f9d8218c820a7545ead9d2d13929b10af
```

最终 corrected `main` 上 2026-09-07 Daily 仍保持 `status: published`，同时版本归因与一手引用已修正。

## 10. Automation Run Report

Repository-owned provider-neutral report contract：

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

## 11. Preview / Publish Boundary

普通 Scheduled Daily：

```text
generic PR Path Guard
→ Scheduled Daily exact guard
→ full pnpm build
→ artifact
→ Trusted Preview
→ public smoke
→ Human / Policy Review
→ merge main
```

Published correction：

```text
explicit correction branch
→ generic PR Path Guard
→ correction-specific authority boundary
→ full pnpm build
→ artifact
→ Trusted Preview
→ public smoke
→ Human / Policy Review
→ merge main
```

Pages 继续由既有 governed Production workflow 管理；Scheduled Producer 与 correction producer 均不拥有 deploy authority。

## 12. 验收标准 · All Passed

- [x] Scheduled Daily 只能修改 exact `content/briefs/<targetDate>.yaml`；
- [x] deletion / rename / copy 不可绕过 guard；
- [x] targetDate 显式使用 Asia/Shanghai；
- [x] 同日 rerun 收敛到唯一 deterministic branch / PR；
- [x] main published Daily 不被 Scheduled Daily 静默覆盖；
- [x] published correction 明确分流；
- [x] full Build + Trusted Preview 为 mandatory gate；
- [x] Scheduler / Producer 无 Production Pages write 权限；
- [x] failure stage 可观察；
- [x] 三个真实稳定周期无需 repository infrastructure repair；
- [x] 替换 Producer 不修改 content Schema / Build Pipeline；
- [x] explicit correction 使用真实事实问题而非人为测试数据；
- [x] correction 合并后 fresh main Build 通过。

## 13. 最终 Gate

- [x] Plan 60 / Milestone F Done；
- [x] Plan 70 design approved；
- [x] 70A Repository Contract Done；
- [x] 70B ChatGPT Adapter Done；
- [x] Cycle 0 transport proof；
- [x] first-cycle hardening；
- [x] Stable Cycle 1 / 3；
- [x] Stable Cycle 2 / 3；
- [x] Stable Cycle 3 / 3；
- [x] same-day rerun / idempotency drill；
- [x] published Daily `already-published` no-write drill；
- [x] explicit correction workflow drill；
- [x] correction Human merge；
- [x] corrected main fresh Site Build。

**Plan 70 · Done。Milestone G — Sustainable Automation · Done。**

## 14. 后续

Plan 70 进入维护态。下一阶段先重新评估 Product Capability Roadmap，再定义新的 milestone / plan；不要在没有新设计与真实需求证据前继续扩大 Scheduler authority、引入多 Provider orchestration、数据库队列或 CMS。