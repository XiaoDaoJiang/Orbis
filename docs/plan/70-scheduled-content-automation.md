# 70 · Scheduled Content Automation

> 状态：In Progress · 70A Done / 70B In Progress
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：Plan 60 · Done；automation design · Approved
> 设计：[`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`](../superpowers/specs/2026-09-03-scheduled-content-automation-design.md)
> 70A Implementation Plan：[`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)
> 70B Implementation Plan：[`docs/superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md`](../superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md)

## 1. 目标

把当前 `config/scheduled-task-prompt.md` 与 `config/daily-task-prompt.md` 的执行合同，升级为稳定、可观察、最小权限的 Scheduled Content Workflow。

目标不是让 Agent 直接发布站点，而是自动完成：

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
- Plan 60 Durable Knowledge 完整生产闭环。

Plan 70 不重建第二套发布链。

## 3. 已批准设计边界

### 3.1 Scheduled Daily 权限比 generic content-agent 更窄

Scheduled Daily 只允许一个精确目标：

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
```

Repository tooling 不允许 system-clock fallback。

固定分支：

```text
automation/daily/YYYY-MM-DD
```

固定内容路径：

```text
content/briefs/YYYY-MM-DD.yaml
```

分支名同时是同日 candidate 的 idempotency key。

## 6. 70A — Scheduled Daily Repository Contract · Done

PR #25 已于 `2026-09-04T01:51:45Z` 合并：

```text
PR                    #25 merged
feature head          f7a7c60daf766dafbca3e9b7cbee06c569bbb535
main                   1fcdc4caecc234af7ef2426e4c9d320513eb2efb
final PR Build         33738006368 success
Trusted Preview        33738176374 success
post-merge Site Build  33827357380 success
main Artifact          9920458469
main Artifact SHA-256  eec5edee0c1891921611aad73fd99b54097c816b7ba02e8fc028d43a92734b01
```

70A 已实现：

- deletion / rename-safe Git change collector：`git diff --name-status -z --find-renames`；
- pure Path Guard policy 同时检查 rename/copy old/new path；
- real Git deletion + rename integration contract；
- strict/calendar-valid `targetDate`；
- canonical Daily branch / content path；
- `dailyBriefSchema` candidate identity + `publishedAt === targetDate`；
- provider-neutral decision vocabulary；
- exact-target Scheduled Daily guard；
- normal Scheduled Daily 禁止已有 base target 修改；
- published base 强制 correction workflow；
- provider-neutral `DailyAutomationReport`；
- deterministic PR metadata renderer；
- prompt idempotency/correction semantics 对齐；
- `scheduled-daily` static defense-in-depth mode；
- `automation/daily/**` PR 强制执行 Scheduled Daily guard；
- PR Build 权限仍为 `contents: read`。

70A 没有改变公开站点输出，因此 fresh main full Build 通过后无需单独触发 Production Pages deploy。

## 7. 70B — ChatGPT Scheduled Daily Adapter · In Progress

Implementation Plan：[`2026-09-04-chatgpt-scheduled-daily-adapter.md`](../superpowers/plans/2026-09-04-chatgpt-scheduled-daily-adapter.md)

Feature branch：

```text
feat/chatgpt-scheduled-daily-adapter
```

PR：**#26 — `feat: add ChatGPT scheduled daily adapter`** · Draft / TDD

首个 Provider Adapter 复用现有 ChatGPT Scheduled Task，而不是创建第二个任务。

已确认现有任务：

```text
Title       Agent 前沿资讯
Timezone    Asia/Shanghai
Cadence     daily
State       disabled
Legacy      still points to XiaoDaoJiang/ai-frontier HTML publishing
```

70B 的边界：

```text
ChatGPT Scheduled Task
  ↓
thin provider adapter
  ↓
current Orbis main repository contract
  ↓
connected GitHub transport
  ↓
deterministic branch + exactly one PR
  ↓
70A repository guard / Build / Trusted Preview
```

Provider-specific GitHub transport 只存在于薄 adapter；不写入 content Schema、Astro、Build core。

### 70B RED 1

PR Build `33827531033` 在全部 70A contracts 通过后精确失败：

```text
AssertionError: ChatGPT Scheduled Daily adapter must exist
```

随后开始 GREEN：

- `config/adapters/chatgpt-scheduled-daily.md`；
- `docs/operations/chatgpt-scheduled-daily.md`；
- focused adapter drift contract。

### 外部任务迁移 Gate

在 PR #26 合并 + fresh main Build 之前，不修改/启用外部 ChatGPT task。

合并后：

1. 更新现有 `Agent 前沿资讯` task；
2. prompt 缩减成读取 Orbis main `config/adapters/chatgpt-scheduled-daily.md` 的 bootstrap；
3. 保持 Asia/Shanghai daily cadence；
4. 启用 task；
5. 不改变通知设置，除非显式要求；
6. 第一个 eligible real run 必须证明 deterministic branch + exact Daily + one PR transport。

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

失败阶段至少：

```text
discovery
verification
generation
schema
guard
git
pr
preview
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

Correction PR 必须说明错误/遗漏、reason、新的一手证据以及核心结论是否变化。Scheduled Job 不自动进入 correction mode。

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

必须至少：

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
- [x] 70A TDD implementation；
- [x] PR #25 merged to main；
- [x] post-merge main Build `33827357380`；
- [x] 70A Done；
- [x] 70B Implementation Plan；
- [x] 70B feature branch + Draft PR #26；
- [x] 70B adapter RED evidence `33827531033`；
- [ ] 70B adapter final full Build + Trusted Preview；
- [ ] PR #26 Ready / merged；
- [ ] external ChatGPT task migrated + enabled；
- [ ] first eligible real transport proof；
- [ ] 70C three-cycle validation + correction drill。

**当前下一步：完成 PR #26 GREEN / Trusted Preview；合并后迁移并启用现有 ChatGPT Scheduled Task。**
