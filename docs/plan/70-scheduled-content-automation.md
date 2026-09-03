# 70 · Scheduled Content Automation

> 状态：Design Review · Current
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：Plan 60 · Done；approved automation design
> 设计：[`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`](../superpowers/specs/2026-09-03-scheduled-content-automation-design.md)
> 70A Implementation Plan：[`docs/superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)

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
- `content-agent` Path Guard；
- read-only PR Build；
- Trusted Preview publish + public smoke；
- governed manual Production Pages deploy；
- Plan 60 Durable Knowledge 完整生产闭环。

Plan 70 不重建第二套发布链。

## 3. Design Review 发现的现有合同缺口

### 3.1 Scheduled Daily 权限必须比 generic content-agent 更窄

当前 generic Agent allowlist 可以覆盖多个 content surface，但 Scheduled Daily 只需要一个精确目标：

```text
content/briefs/<targetDate>.yaml
```

因此保留 generic `content-agent`，额外建立 Scheduled Daily exact-target contract。

### 3.2 published-main overwrite 必须显式禁止

Scheduled automation 采用：

```text
main missing target          → create candidate
open automation branch / PR → update same candidate
main published target        → no write / already-published
published correction         → explicit correction workflow only
```

不得静默覆盖 main 上已发布 Daily。

### 3.3 deletion / rename 必须纳入强制防线

70A 必须让 old/new changed paths 都进入判断，并测试：

- target deletion fails；
- rename into target fails；
- rename out of target fails；
- protected/generated delete/rename cannot bypass guard。

## 4. 推荐架构

### Repository-owned contract

Orbis 固定：

- target-date 语义；
- exact diff boundary；
- idempotency；
- overwrite/correction boundary；
- PR metadata / run-report contract；
- Schema / full Build / Preview gates。

### Scheduler / Producer

首个真实 pilot 推荐继续使用现有 ChatGPT Scheduled Task，因为无需把新的模型 API key 加入 GitHub，也不引入数据库或任务平台。

它只是 pilot，不成为 Schema/Build 的供应商依赖。未来可以替换为 GitHub Actions + API Agent、Codex/CLI Agent 或其他 Runtime。

## 5. Scheduled Daily Identity

Scheduler 按 `Asia/Shanghai` 计算并显式传入：

```text
targetDate=YYYY-MM-DD
```

Repository tool 不依赖 runner 本地时区隐式决定内容日期。

固定分支：

```text
automation/daily/YYYY-MM-DD
```

固定内容路径：

```text
content/briefs/YYYY-MM-DD.yaml
```

分支名同时是同日 candidate 的 idempotency key。

## 6. 70A — Scheduled Daily Repository Contract

建议 PR：

```text
feat: add scheduled daily automation contracts and guards
```

Implementation Plan：[`2026-09-03-scheduled-content-automation-contracts.md`](../superpowers/plans/2026-09-03-scheduled-content-automation-contracts.md)

包含：

1. target-date parser / validation；
2. provider-neutral `DailyAutomationReport`；
3. idempotency decision helper；
4. exact-target Scheduled Daily guard；
5. deletion / rename-safe Path Guard hardening；
6. `scheduled-daily` guard config / mode；
7. published-main overwrite protection；
8. correction-required result；
9. automation PR metadata contract tests；
10. prompt 与新 idempotency 语义对齐；
11. PR Preview Build 对 `automation/daily/**` 强制执行 Scheduled Daily guard；
12. integration tests：合法 exact Brief diff pass，所有越权 / 删除 / rename / wrong-date / second-Brief diff fail。

70A 不接 Scheduler，不调用模型 API。

## 7. 70B — First Scheduler / Producer Integration

首个 pilot：

```text
Asia/Shanghai targetDate
→ discovery + source verification
→ structured Daily
→ automation/daily/<date>
→ create/update one PR
→ repository CI guard
→ full Build
→ Trusted Preview
```

必须满足：

- 同日重复运行收敛到同一个 branch / PR；
- 不直接 push main；
- 不自动 merge；
- 不触发 Pages deploy；
- 不拥有 Production token；
- PR body 使用 provider-neutral report metadata；
- CI/Preview 状态只能在真实完成后记录，不得预先声称成功。

若 ChatGPT Scheduled Task 无法稳定完成 GitHub/CI contract，则停止 pilot，转为 GitHub Actions + API/CLI Producer；不得以扩大权限兜底。

## 8. Automation Run Report

Repository contract 至少包含：

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

失败阶段至少区分：

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
Scheduled Daily → stop / already-published
```

事实错误需要单独：

```text
correction/daily/YYYY-MM-DD/<reason-slug>
```

Scheduled Job 不自动进入 correction mode。

## 10. Preview / Publish Boundary

Automation PR 继续复用正式 PR Pipeline：

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
- 已 published Daily overwrite protection drill；
- 1 次 correction workflow drill；
- 无基础设施手工修补即可完成三周期。

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
- full Build + Trusted Preview 仍为 mandatory gate；
- Scheduler / Producer 无 Production Pages write 权限；
- failure stage 可观察；
- 三个真实周期无需基础设施调整；
- 替换 Producer 不修改 content Schema / Build Pipeline。

## 14. 当前 Gate

- [x] Plan 60 / Milestone F Done；
- [x] Plan 70 initial roadmap；
- [x] existing prompt / guard / governance audit；
- [x] Design Review draft；
- [x] 70A Implementation Plan prepared；
- [ ] Design approval；
- [ ] 70A TDD implementation；
- [ ] 70B first Scheduler / Producer pilot；
- [ ] 70C three-cycle validation + correction drill。

**当前下一步：完成 Design Review 并确认设计；确认后立即进入 70A TDD implementation。**
