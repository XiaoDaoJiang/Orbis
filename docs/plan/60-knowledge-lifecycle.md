# 60 · Knowledge Lifecycle

> 状态：Production Gate · 60A Done / 60B Merged
> Roadmap Milestone：F — Durable Knowledge
> 建议优先级：P2
> 基线：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
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

## 4. 60B — Knowledge Lifecycle UI · Merged / Production Gate

PR #24 已于 `2026-09-03T05:50:21Z` 合并：

```text
PR                                #24 merged
implementation head               dc300dc567e7c9d3132e629b9a2768c4996fed3c
main                              89c7f8fe6d5da972c0f54b1367df252aa00cf286
post-merge Site Build             33720559711 success
main Artifact                     9880102491
main Artifact SHA-256             89603fae5eb5be3d879fd682cfb381695f6406a6b9c6b47ba92a140d78ab895a
Production Pages                  pending exact-SHA deploy=true gate
```

60B 已落地：

- Astro Web adapter 直接复用 60A `evaluateReviewHealth / deriveSupersedes`；
- `KNOWLEDGE_EVALUATION_DATE` 仅作为 deterministic fixture/test override；
- `published / active` 保持 current discovery；
- `needs-review / archived` 获得稳定可访问 detail URL，但不进入普通 current Related Content discovery；
- `draft` 仍不可公开访问；
- Knowledge Index 提供 lifecycle summary；
- Current / Needs Review & Attention / Recently Updated / Historical 分组；
- Knowledge Detail 显示 editorial status、review health、published/updated/review date；
- due-soon / overdue / needs-review / archived notice；
- `supersededBy` replacement link；
- inverse `supersedes[]` navigation；
- archived/superseded URL 保持 self-canonical，不自动 redirect；
- SEO / JSON-LD / Registry / RSS / Sitemap / Slides 既有行为保持合同保护。

### 60B TDD Evidence

RED 1 — run `33705834146`：

```text
Knowledge lifecycle Web adapter must exist
```

GREEN 1 — run `33706026761`：full PR Build success。

RED 2 — run `33706252791`：

```text
Knowledge index must expose Current section
```

GREEN 2 — run `33706449624`：fixed-date lifecycle UI fixture + full PR Build success。

RED 3 — run `33706749234`：

```text
Knowledge index must expose lifecycle summary
```

Final PR GREEN — run `33706946709`：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
Knowledge lifecycle Web adapter contract passed
Knowledge lifecycle fixed-date UI fixture contract passed
Knowledge lifecycle UI artifact contract passed
```

Final Preview Artifact：

```text
ID       9875569505
SHA-256  a590c06bf011e6390e11ce30aa672b7046d19407e47677f20676ff7ff9d85196
```

Trusted Preview 在 final artifact 之后重新发布并通过公网 smoke。

### Fresh main GREEN

Post-merge Site Build `33720559711` exact checkout：

```text
main@89c7f8fe6d5da972c0f54b1367df252aa00cf286
```

并再次通过：

```text
Knowledge lifecycle evaluator contract passed
Knowledge supersession relation contract passed
Knowledge review report contract passed
Knowledge lifecycle Web adapter contract passed
Knowledge lifecycle fixed-date UI fixture contract passed
Web SEO artifact contract passed
Registry-backed content UI artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
Knowledge lifecycle UI artifact contract passed
```

真实 Knowledge review report：

```text
Knowledge review report · 2026-09-03
current=1 due-soon=0 overdue=0 needs-review=0
OK verification-loop · status=active · review=2026-11-01 · current (59d)
```

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
- Scheduled review automation（Plan 70）。

## 7. Plan 60 验收

60A 已满足全部 Contract / Preview / main / Production 验收。

60B 已满足：

- lifecycle index/detail UI；
- fixed-date current / due-soon / overdue / needs-review / archived fixture contract；
- addressable needs-review / archived stable routes；
- replacement / inverse supersedes navigation；
- lifecycle artifact contract；
- Trusted Preview；
- merge 后 fresh main Build。

60B 尚未满足：

- `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286` governed Production Pages exact-SHA Build → Deploy → public Smoke。

## 8. 当前 Gate

- [x] Plan 60 design approved；
- [x] 60A implementation + PR #23 + Production gate；
- [x] 60A Done；
- [x] 60B implementation plan；
- [x] 60B feature branch + TDD implementation；
- [x] PR #24 Trusted Preview / artifact / scope audit；
- [x] PR #24 merged to `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`；
- [x] fresh main Site Build `33720559711` passed；
- [ ] Production Pages `deploy=true` for exact `89c7f8fe6d5da972c0f54b1367df252aa00cf286` + public smoke；
- [ ] Plan 60 / Milestone F Done；
- [ ] promote Plan 70 to Current / Design Review。
