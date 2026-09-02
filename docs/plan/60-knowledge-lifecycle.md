# 60 · Knowledge Lifecycle

> 状态：In Progress · 60A Merged / Production Gate
> Roadmap Milestone：F — Durable Knowledge
> 建议优先级：P2
> 基线：`main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> 依赖：Plan 40 Source & Author Registry · Done；Plan 50 SEO & Sharing · Done
> 设计：[`docs/superpowers/specs/2026-09-02-knowledge-lifecycle-design.md`](../superpowers/specs/2026-09-02-knowledge-lifecycle-design.md)

## 1. 目标

让 `content/knowledge/**` 从“另一类文章”升级为真正具有复查、更新、退役语义的长期知识层。

核心原则：**Knowledge 的价值来自持续维护，而不是永久发布后不再检查。**

## 2. 已批准核心模型

### Persisted Editorial State

源数据 `status` 表示编辑判断，不由日期自动改写：

```text
draft / published / active / needs-review / archived
```

`needs-review` 是显式 editorial state；`reviewAt` 到期不会自动把 `active` 改成 `needs-review`。

### Derived Review Health

构建/工具层根据显式 evaluation date 推导：

```text
current → due-soon → overdue
```

首版 due-soon threshold = 14 days，使用 UTC calendar-date 语义。

### Replacement Relation

唯一持久化 edge：

```yaml
supersededBy: replacement-knowledge-id
```

反向 `supersedes[]` 只从全体 Knowledge 自动推导，不在 source 中双写。

## 3. 60A — Knowledge Lifecycle Contract · Merged / Production Gate

PR #23 已于 `2026-09-02T09:34:57Z` 合并：

```text
PR                                #23 merged
implementation head               b0da8fa4e706459abf1eb39a365ea2d2ecb203a9
main                              f468a45049035bc7816a52225ca41f4f381b0ae6
post-merge Site Build             33614900003 success
main Artifact                     9840548845
main Artifact SHA-256             ca3f942db3466e0634da8e724a18e4c333d46ef274246dd8d5acf31d74101541
Production Pages                  pending exact-SHA deploy=true gate
```

60A 已落地：

- pure `evaluateReviewHealth`；
- explicit evaluation date；
- UTC/calendar-date validation；
- `current / due-soon / overdue`；
- `reviewAt` 缺失保持 unscheduled/current；
- editorial state 与 review health 分离；
- Knowledge Schema `supersededBy?`；
- missing replacement target → validation ERROR；
- self replacement → validation ERROR；
- inverse `supersedes[]` deterministic derivation；
- `knowledge:review` human-readable report；
- machine-readable `buildKnowledgeReviewReport` / JSON CLI；
- overdue / due-soon advisory，零退出；
- structure/relation invalid 继续由 `content:validate` fatal fail。

### TDD Evidence

RED 1 — run `33612906709`：

```text
Knowledge lifecycle helper must exist
```

GREEN 1 — run `33613130194`：full PR Build success。

RED 2 — run `33613368654`：

```text
Knowledge lifecycle evaluator contract passed
AssertionError: Knowledge schema must preserve supersededBy
```

GREEN 2 — run `33613680081`：full PR Build success。

RED 3 — run `33613960582`：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
AssertionError: Knowledge review report helper must exist
```

Final PR GREEN — run `33614266765`：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
```

Preview Artifact：

```text
ID       9840310311
SHA-256  ae00a521342d662c0646067966e51c76592ef025b6a2809f8d7791ee2fb79eb4
```

Trusted Preview smoke passed after the final artifact was published。

### Fresh main GREEN

Post-merge Site Build `33614900003` exact checkout：

```text
main@f468a45049035bc7816a52225ca41f4f381b0ae6
```

并再次通过：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

真实 source review report：

```text
Knowledge review report · 2026-09-02
current=1 due-soon=0 overdue=0 needs-review=0
OK verification-loop · status=active · review=2026-11-01 · current (60d)
```

## 4. 60B — Knowledge Lifecycle UI · Next after 60A Production Gate

60B 只消费 60A 已稳定的 lifecycle contract，不在 Astro 页面重新实现日期判断。

目标公开体验：

### Knowledge Index

- Current / Active Knowledge；
- Needs Review；
- Review Due Soon / Overdue 可视化；
- Recently Updated；
- archived 不与 current conclusions 混排。

### Knowledge Detail

显示：

- editorial status；
- review health；
- published / updated；
- next review；
- overdue / needs-review notice；
- archived notice；
- `supersededBy` replacement link；
- derived `supersedes[]` links；
- Topics / References / Related Content 保持现有能力。

### Stable URL Policy

- `active / published / needs-review / archived` Knowledge 的已有 detail URL 保持稳定；
- archived / superseded 页面不删除、不自动 redirect；
- 页面通过明确 notice 指向推荐 replacement；
- discovery/index 可降低 archived prominence，但不能破坏永久 URL。

## 5. Agent / Governance Boundary

Agent 可以：

- 发现 overdue / due-soon；
- 生成 review report；
- 提出修改 Knowledge 的 PR；
- 建议 `needs-review / archived / supersededBy`。

Agent 不可以仅因为日期变化而：

- 自动修改 `status`；
- 自动提交 source 变更；
- 自动删除 archived Knowledge；
- 未经评审把 Candidate 提升成长期有效结论。

## 6. 非目标

- LLM 自动判断事实仍然真实；
- 数据库任务队列；
- 复杂审批系统；
- 自动修改 Knowledge source；
- 双向 persisted supersession graph；
- 因 overdue 直接阻断发布；
- 60B 重写 Plan 60A lifecycle evaluator。

## 7. Plan 60 验收

60A 已满足：

- 到期可确定性识别；
- date health 与 editorial state 分离；
- due-soon / overdue 时间边界测试；
- missing/self replacement fatal validation；
- canonical one-way replacement edge；
- inverse supersedes derivation；
- review report 可由本地/CI读取；
- overdue advisory / zero exit；
- PR Preview 与 fresh main Build 全绿。

60A 尚未满足：

- `main@f468a45049035bc7816a52225ca41f4f381b0ae6` governed Production Pages exact-SHA Build → Deploy → public Smoke。

60B 尚未开始实现：

- Knowledge lifecycle index/detail UI；
- needs-review / due-soon / overdue / archived notices；
- replacement navigation；
- stable archived URL artifact contracts。

## 8. 当前 Gate

- [x] Plan 60 design approved；
- [x] 60A implementation plan；
- [x] 60A TDD implementation + PR #23；
- [x] PR #23 merged to `main@f468a45049035bc7816a52225ca41f4f381b0ae6`；
- [x] fresh main Site Build `33614900003` passed；
- [ ] Production Pages `deploy=true` for exact `f468a45049035bc7816a52225ca41f4f381b0ae6` + public smoke；
- [ ] mark 60A Done；
- [ ] enter 60B implementation。
