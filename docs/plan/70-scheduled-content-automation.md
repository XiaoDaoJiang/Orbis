# 70 · Scheduled Content Automation

> 状态：In Progress · 70A Done / 70B Live Gate
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：Plan 60 · Done；automation design · Approved
> 设计：[`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`](../superpowers/specs/2026-09-03-scheduled-content-automation-design.md)
> 70A Implementation Plan：[`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)
> 70B Implementation Plan：[`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`](../superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md)

## 1. 目标

把当前 `config/scheduled-task-prompt.md` 与 `config/daily-task-prompt.md` 的执行合同，升级为稳定、可观察、最小权限的 Scheduled Content Workflow。

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

## 2. 当前基础

仓库已经具备：

- `config/scheduled-task-prompt.md`；
- `config/daily-task-prompt.md`；
- `content/briefs/YYYY-MM-DD.yaml` Structured Daily；
- deletion / rename-safe Path Guard；
- Scheduled Daily exact-target guard；
- provider-neutral automation decision/report contract；
- `automation/daily/**` mandatory PR guard；
- read-only PR Build；
- Trusted Preview publish + public smoke；
- governed manual Production Pages deploy；
- ChatGPT thin provider adapter；
- enabled existing Scheduled Task pilot。

Plan 70 不重建第二套发布链。

## 3. 已批准设计边界

### 3.1 Scheduled Daily 权限比 generic content-agent 更窄

Scheduled Daily 只允许：

```text
content/briefs/<targetDate>.yaml
```

Generic `content-agent` 保留给更广的 reviewed Agent contribution；Scheduled Daily 使用独立 exact-target contract。

### 3.2 published-main overwrite 显式禁止

```text
main missing target          → create candidate
open automation branch / PR → update same candidate
main published target        → no write / already-published
main non-public target       → revision-required
published correction         → explicit correction workflow only
```

Feature branch 上的 `status: published` 是 publication candidate，不等于 Production 已发布。

### 3.3 deletion / rename 进入强制防线

Path Guard 检查 relevant old/new paths；Scheduled Daily 首版直接拒绝 delete / rename / copy-style transition。

## 4. Repository-owned contract

Orbis 固定：

- explicit `targetDate`；
- exact diff boundary；
- deterministic branch / path identity；
- idempotency decision semantics；
- overwrite/correction boundary；
- provider-neutral PR metadata / run-report contract；
- Schema / full Build / Preview gates。

Scheduler / Producer 只负责生成候选和调用这些合同，不拥有生产权限。

## 5. Scheduled Daily Identity

Scheduler 按 `Asia/Shanghai` 计算并显式传入：

```text
targetDate=YYYY-MM-DD
branch=automation/daily/YYYY-MM-DD
contentPath=content/briefs/YYYY-MM-DD.yaml
```

Repository tooling 不允许 system-clock fallback。分支名同时是同日 candidate 的 idempotency key。

## 6. 70A — Scheduled Daily Repository Contract · Done

PR #25 已合并：

```text
feature head          f7a7c60daf766dafbca3e9b7cbee06c569bbb535
main                   1fcdc4caecc234af7ef2426e4c9d320513eb2efb
final PR Build         33738006368 success
Trusted Preview        33738176374 success
post-merge Site Build  33827357380 success
main Artifact          9920458469
main Artifact SHA-256  eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

70A 已实现 deletion/rename-safe change collection、strict target identity、exact-target guard、published-base protection、provider-neutral decision/report/PR metadata 与 mandatory read-only Preview guard。

## 7. 70B — ChatGPT Scheduled Daily Adapter · Live Gate

PR #26 已于 `2026-09-04T06:44:56Z` 合并：

```text
PR                           #26 merged
feature head                 515295cef40636a2300d5043d592fa8c6e2388a2
main                         6419b3dfeeb3caa7f3f577351728a0e8dd780d91
RED                          33827531033 adapter entry missing
final PR Build               33827615741 success
Preview Artifact             9920550137
Preview Artifact SHA-256     6ae074aab9863647bccdadbee63d2048cacd4b464f2c1edbdb80d88e212273d0
Trusted Preview              33827736463 success
post-merge Site Build        33845663516 success
main Artifact                9926441727
main Artifact SHA-256        a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0
```

70B Repository 侧已实现：

- `config/adapters/chatgpt-scheduled-daily.md` 薄 provider adapter；
- 每次运行先读取 Orbis `main` 当前 repository contract；
- explicit Asia/Shanghai `targetDate`；
- integration-base / deterministic branch / open PR preflight；
- connected GitHub branch + exact file + exactly-one-PR transport contract；
- provider-neutral report/PR metadata 继续由 70A 定义；
- 禁止 direct main write / auto merge / Production Pages deploy；
- 禁止恢复已退役 `XiaoDaoJiang/ai-frontier`；
- focused adapter drift test；
- `docs/operations/chatgpt-scheduled-daily.md` 运维 runbook。

### External ChatGPT task migration · Done

复用现有 task，不创建第二个 Scheduler：

```text
Title       Agent 前沿资讯
Timezone    Asia/Shanghai
Cadence     daily
State       enabled
Bootstrap   Orbis main / config/adapters/chatgpt-scheduled-daily.md
Legacy      XiaoDaoJiang/ai-frontier behavior removed from active prompt
Notify      existing notification settings preserved
```

外部 task bootstrap 只负责读取当前 Orbis adapter / repository contract 并使用 connected GitHub transport。公共 Roadmap 不记录外部平台 opaque task ID，避免把非必要平台标识提交到公开仓库。

### 70B TDD / Integration Evidence

```text
RED               33827531033  ChatGPT Scheduled Daily adapter must exist
GREEN PR Build    33827615741  success
Trusted Preview   33827736463  success
main merge        #26 → 6419b3dfeeb3caa7f3f577351728a0e8dd780d91
fresh main Build  33845663516  success
Scheduler         existing task migrated + enabled
```

### 70B remaining Live Gate

70B 尚未标记 Done。第一个 eligible real run 必须证明：

```text
explicit targetDate
→ deterministic automation/daily/<date>
→ exact content/briefs/<date>.yaml
→ exactly one PR
→ Scheduled Daily Guard
→ full Build
→ Trusted Preview
```

如果该日期已经在 main 以 `published` 存在，`already-published` 是正确 no-write 行为，但不能单独完成首次 transport proof；继续等待下一个 eligible targetDate。

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

事实错误进入：

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

## 11. 70C — Real-cycle Validation

70C 在首次 real transport proof 后开始累计正式 soak evidence，必须至少：

- 连续 3 次真实 Daily cycle；
- 同日 rerun / idempotency drill；
- 已 published Daily no-write drill；
- 1 次 explicit correction workflow drill；
- 三周期内无需基础设施手工修补。

## 12. 非目标

- Agent 自动 merge；
- Agent 直接部署 Pages；
- 首版同时接多个 Provider；
- 数据库任务队列；
- 新 CMS；
- 自动 Source / Author / Topic Registry mutation；
- 首个 Daily pilot 自动生成 Essay / Knowledge；
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
- 三个真实周期无需基础设施调整；
- 替换 Producer 不修改 content Schema / Build Pipeline。

## 14. 当前 Gate

- [x] Plan 60 / Milestone F Done；
- [x] Plan 70 design approved；
- [x] 70A Done；
- [x] PR #26 merged to main；
- [x] post-merge fresh main Build `33845663516`；
- [x] external ChatGPT task migrated；
- [x] external ChatGPT task enabled；
- [ ] first eligible real transport proof；
- [ ] 70B Done；
- [ ] 70C three-cycle validation + correction drill。

**当前下一步：等待启用后的第一个 eligible Scheduled Daily run；检查 deterministic branch / exact Brief / exactly-one-PR / CI / Trusted Preview，并以真实证据决定 70B 是否 Done、是否开始 70C soak。**
