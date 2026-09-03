# 60 · Knowledge Lifecycle

> 状态：In Progress · 60A Done / 60B Current
> Roadmap Milestone：F — Durable Knowledge
> 建议优先级：P2
> 基线：`main@f468a45049035bc7816a52225ca41f4f381b0ae6`
> 依赖：Plan 40 Source & Author Registry · Done；Plan 50 SEO & Sharing · Done
> 设计：[`docs/superpowers/specs/2026-09-02-knowledge-lifecycle-design.md`](../superpowers/specs/2026-09-02-knowledge-lifecycle-design.md)
> 60B Plan：[`docs/superpowers/plans/2026-09-02-knowledge-lifecycle-ui.md`](../superpowers/plans/2026-09-02-knowledge-lifecycle-ui.md)

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

## 3. 60A — Knowledge Lifecycle Contract · Done

PR #23 已于 `2026-09-02T09:34:57Z` 合并并完成 exact-SHA Production Gate：

```text
PR                                #23 merged
implementation head               b0da8fa4e706459abf1eb39a365ea2d2ecb203a9
main                              f468a45049035bc7816a52225ca41f4f381b0ae6
post-merge Site Build             33614900003 success
main Artifact                     9840548845
main Artifact SHA-256             ca3f942db3466e0634da8e724a18e4c333d46ef274246dd8d5acf31d74101541
Production Pages                  33616314496 success
Production Artifact               9841106463
Production Artifact SHA-256       01f09455f6746494daf87105e3d4333cd49b922559303c0a676ee8b96a8ada94
```

Production deployment 明确记录：

```text
pages_build_version=f468a45049035bc7816a52225ca41f4f381b0ae6
```

公网 smoke：

```text
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/08/28/
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

RED 1 — run `33612906709`：`Knowledge lifecycle helper must exist`。

GREEN 1 — run `33613130194`：full PR Build success。

RED 2 — run `33613368654`：`Knowledge schema must preserve supersededBy`。

GREEN 2 — run `33613680081`：full PR Build success。

RED 3 — run `33613960582`：`Knowledge review report helper must exist`。

Final PR GREEN — run `33614266765`：evaluator / relation / report contracts 全绿。

Fresh main GREEN — run `33614900003`：60A 与 Plan 10–50 全部合同再次通过。

Final Production GREEN — run `33616314496`：Build + Deploy + public smoke success。

## 4. 60B — Knowledge Lifecycle UI · Current

60B 只消费 60A 已稳定的 lifecycle contract，不在 Astro 页面重新实现日期判断。

Implementation Plan 已固化：

`docs/superpowers/plans/2026-09-02-knowledge-lifecycle-ui.md`

### Architecture Boundary

Web adapter 直接复用：

```text
apps/web/src/lib/knowledge-lifecycle.ts
        ↓
tools/knowledge-lifecycle/lifecycle.ts
  ├── evaluateReviewHealth
  └── deriveSupersedes
```

静态构建边界提供显式 evaluation date：

```text
KNOWLEDGE_EVALUATION_DATE=<YYYY-MM-DD>  # fixture/test override
otherwise                               # normal build
UTC current calendar date
```

### Knowledge Index

目标：

- Current；
- Needs Review / Attention；
- Recently Updated；
- Historical / Archived；
- current / due-soon / overdue 可视化；
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

### Stable URL / Discovery Policy

```text
published / active   current public discovery
needs-review         stable public detail + attention UI
archived             stable public detail + historical UI
draft                not publicly addressable
```

不能简单把 archived 加入现有 `isPublicKnowledge()`，否则会污染 Related Content / Sitemap / RSS 等 current discovery surface。

60B 将单独定义 addressability 与 discovery 语义。

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
- 60B 重写 Plan 60A lifecycle evaluator；
- Scheduled review automation（Plan 70）。

## 7. Plan 60 验收

60A 已满足全部 Contract / Preview / main / Production 验收。

60B 待实现：

- Knowledge lifecycle index/detail UI；
- fixed-date current / due-soon / overdue / needs-review / archived fixture contract；
- addressable needs-review / archived stable routes；
- replacement / inverse supersedes navigation；
- lifecycle artifact contract；
- Trusted Preview；
- merge 后 fresh main Build；
- final Production Pages exact-SHA deployment / public smoke。

## 8. 当前 Gate

- [x] Plan 60 design approved；
- [x] 60A implementation plan；
- [x] 60A TDD implementation + PR #23；
- [x] PR #23 merged；
- [x] fresh main Site Build `33614900003` passed；
- [x] Production Pages `33616314496` exact-SHA Build + Deploy + public smoke；
- [x] 60A Done；
- [x] 60B implementation plan；
- [ ] create 60B feature branch；
- [ ] 60B RED / GREEN implementation；
- [ ] 60B merge + Production gate；
- [ ] Plan 60 / Milestone F Done。
