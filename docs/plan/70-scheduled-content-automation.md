# 70 · Scheduled Content Automation

> 状态：In Progress · 70A Ready for Review
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：Plan 60 · Done；automation design · Approved
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
- generic `content-agent` Path Guard；
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

Path Guard 必须检查所有 relevant old/new paths；Scheduled Daily 首版直接拒绝 delete / rename / copy-style transition。

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

## 6. 70A — Scheduled Daily Repository Contract · Ready for Review

PR：**#25 — `feat: add scheduled daily automation contracts and guards`**

Feature head：

```text
f7a7c60daf766dafbca3e9b7cbee06c569bbb535
```

### 已实现

- deletion / rename-safe Git change collector：`git diff --name-status -z --find-renames`；
- pure Path Guard policy 同时检查 rename/copy old/new path；
- real Git deletion + rename integration contract；
- strict/calendar-valid `targetDate`；
- canonical Daily branch / content path；
- `dailyBriefSchema` candidate identity + `publishedAt === targetDate`；
- provider-neutral decision vocabulary：

```text
create-candidate
update-open-candidate
revision-required
already-published
correction-required
blocked
```

- exact-target Scheduled Daily guard；
- normal Scheduled Daily 禁止已有 base target 修改；
- published base 强制 correction workflow；
- provider-neutral `DailyAutomationReport`；
- deterministic PR metadata renderer；
- prompt idempotency/correction semantics 对齐；
- `scheduled-daily` static defense-in-depth mode；
- `automation/daily/**` PR 强制执行 Scheduled Daily guard；
- PR Build 权限仍为 `contents: read`。

### 70A TDD Evidence

```text
RED   33735129142  Path Guard change-set helper must exist
GREEN 33735264662  hardened Path Guard full build success
RED   33735504985  Scheduled Daily target helper must exist
GREEN 33735633293  target identity full build success
RED   33737385058  existing Daily M path incorrectly accepted
RED   33737859984  PR Preview did not yet activate Scheduled Daily guard
GREEN 33738006368  final full PR Preview Build success
```

Final Preview Artifact：

```text
ID       9886587297
SHA-256  90f62f91865bc5fcb504c594d53a301fa12ff82657d4674a4789d883bcbc134d
```

Trusted Preview Publish：

```text
run      33738176374
status   success
```

并已完成：

- trusted artifact download；
- preview branch publish；
- public availability smoke；
- PR preview URL comment。

Public Preview：

```text
https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-25/index.html
```

### Scope audit

70A 只修改：

```text
.github/workflows/pr-preview-build.yml
config/daily-task-prompt.md
config/path-guard.yaml
config/scheduled-task-prompt.md
package.json
tools/content-automation/**
tools/path-guard/**
```

未修改：

```text
content/**
apps/**
packages/**
dist/**
.github/workflows/pages-production.yml
.github/workflows/pr-preview-publish.yml
```

因此 70A 已满足 feature implementation、full Build、Trusted Preview 与 scope/security audit；当前只剩人工 merge gate。

## 7. 70B — First Scheduler / Producer Integration · Next after #25 merge

首个 pilot 继续推荐使用现有 ChatGPT Scheduled Task，但 Repository Contract 保持 provider-neutral。

目标：

```text
Asia/Shanghai targetDate
→ discovery + primary-source verification
→ structured Daily
→ resolve deterministic automation branch
→ create/update exactly one PR
→ render provider-neutral metadata
→ repository CI guard
→ full Build
→ Trusted Preview
```

70B 必须满足：

- 同日重复运行收敛到同一个 branch / PR；
- 不直接 push main；
- 不自动 merge；
- 不触发 Pages deploy；
- 不拥有 Production token；
- 不把 provider-specific fields 写入 content Schema；
- CI/Preview 状态只在真实完成后记录；
- 若现有 ChatGPT Scheduled Task 无法稳定满足合同，则切换 transport / Producer，不扩大权限兜底。

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
- [x] existing prompt / guard / governance audit；
- [x] 70A Implementation Plan；
- [x] 70A TDD implementation；
- [x] 70A final full Build；
- [x] 70A Trusted Preview + public smoke；
- [x] PR #25 scope/security audit；
- [x] PR #25 Ready for Review；
- [ ] PR #25 merged to main；
- [ ] post-merge main Build / Production gate as required；
- [ ] 70B first Scheduler / Producer pilot；
- [ ] 70C three-cycle validation + correction drill。

**当前下一步：人工合并 PR #25；合并后验证 fresh main，再启动 70B。**
