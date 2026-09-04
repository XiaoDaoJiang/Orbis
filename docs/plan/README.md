# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@3c5cc91974cea388b87b779f3e367b4c114d7a6c`
> 基线日期：2026-09-04
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · 70C Soak Active

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Done** — PR #23 / #24
- Plan 70 · Scheduled Content Automation：**In Progress**
  - design：Approved
  - 70A Repository Contract：**Done** — PR #25
  - 70B ChatGPT Scheduled Daily Adapter：**Done** — PR #26 + first real proof PR #27
  - 70C Real-cycle Validation：**Soak Active** — stable cycles `0/3`

## 70B closeout evidence

Repository adapter：

```text
PR #26                      merged
main after #26              6419b3dfeeb3caa7f3f577351728a0e8dd780d91
post-merge Site Build       33845663516 success
main Artifact               9926441727
Artifact SHA-256            a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0
```

Existing external Scheduler：

```text
Title                       Agent 前沿资讯
State                       enabled
Timezone / cadence          Asia/Shanghai · daily
Bootstrap                   current Orbis main adapter
Competing second task       none
Legacy ai-frontier behavior removed
```

First real transport proof：

```text
targetDate                  2026-09-04
branch                      automation/daily/2026-09-04
content                     content/briefs/2026-09-04.yaml
PR                          #27
changed files               exactly 1
final head                  f9bb8ef5f54cb1623ab582057d54e5507b0b299a
final merge ref             d91e8ac2aeca17bdac6a36eb78ce3ec989f605fa
PR Preview Build            33857483693 success
Preview Artifact            9930821104
Artifact SHA-256            909a16ba162bc345a67f1808836a1c2b734cb187224f2aaaad395c8e2391256d
Trusted Preview             33857669310 success
outcome                     candidate-created
```

Final logs proved exact one-file Guard scope and the real content order:

```text
Weekly=2026-09-01
Daily latest=2026-09-04
```

with Weekly artifact, Homepage latest ordering, Daily-only archive/latest semantics and the complete build all passing.

## First-cycle hardening

Cycle 0 exposed two repository infrastructure regressions; both were fixed independently from the automation content branch and did not widen Scheduled Daily authority.

```text
PR #28  weekly real-date-order test fix
         → main 2b93744c491466ff6ce06b28cd2bdefba0e9c79c
         → Site Build 33854389852 success

PR #29  PR Preview integration-base fix
         → main 3c5cc91974cea388b87b779f3e367b4c114d7a6c
         → Site Build 33857265076 success
         → Artifact 9930724616
         → SHA-256 1028492c557ae5309562430f2216ac9306b731e340f3e1adda0b203e7b450c0b
```

PR #29 让 Guard 从 checked-out merge ref 的第一父节点解析 integration base，而不是使用可能陈旧的 `pull_request.base.sha`。PR Build 继续保持 `contents: read`，无 Production authority。

## 当前产品基线

```text
Structured Content + Registry
          ↓
Referential Integrity
          ↓
Reading / Presentation / RSS / Discovery
          ↓
SEO / Structured Data
          ↓
Knowledge Lifecycle · Done
          ↓
Scheduled Content Automation · In Progress
  ├── 70A Repository Contract · Done
  ├── 70B ChatGPT Adapter · Done
  │   ├── provider adapter merged
  │   ├── existing Scheduled Task migrated + enabled
  │   └── first real branch/file/PR/CI/Preview proof passed
  └── 70C Real-cycle Validation · Soak Active
      └── consecutive stable cycles: 0 / 3
```

PR #27 是 **Cycle 0 / transport proof**。由于它触发了 #28 / #29 两次基础设施修复，因此不计入 70C 所要求的三个连续稳定周期。

70C 从下一个 eligible Daily 开始计数：只有在无需 repository infrastructure repair 且完整通过 exact Guard → full Build → Trusted Preview 时，才记为 Stable Cycle 1。

## Roadmap

- [00 · Product Capability Roadmap](./00-product-capability-roadmap.md)
- [10 · Archive & Discovery Experience](./10-archive-discovery-experience.md)
- [20 · Presentation Platform](./20-presentation-platform.md)
- [30 · Weekly Brief](./30-weekly-brief.md)
- [40 · Source & Author Registry](./40-source-author-registry.md)
- [50 · SEO & Sharing](./50-seo-sharing.md)
- [60 · Knowledge Lifecycle](./60-knowledge-lifecycle.md)
- [70 · Scheduled Content Automation](./70-scheduled-content-automation.md)

## 推荐实施顺序

```text
10 Archive & Discovery          Done
        ↓
20 Presentation Platform       Done
        ↓
30 Weekly Brief                Done
        ↓
40 Source & Author Registry    Done
        ↓
50 SEO & Sharing               Done
        ↓
60 Knowledge Lifecycle         Done
        ↓
70 Scheduled Content Automation In Progress
  ├── 70A Repository Contract  Done · PR #25
  ├── 70B ChatGPT Adapter      Done · PR #26 / proof #27
  └── 70C Real-cycle Validation Soak Active · stable 0/3
```

## 70C remaining gate

- [ ] Stable Cycle 1 / 3
- [ ] Stable Cycle 2 / 3
- [ ] Stable Cycle 3 / 3
- [ ] same-day rerun / idempotency drill
- [ ] published Daily `already-published` no-write drill
- [ ] explicit correction workflow drill

## 每个计划的统一交付规则

1. 独立分支与 PR；
2. 不破坏 `content/** → dist/site` 单向构建图；
3. 不引入数据库、CMS 或服务端 Runtime，除非出现新的真实需求；
4. 新内容模型与新关系必须有可执行合同；
5. 新公开输出必须进入 Artifact 检查；
6. PR 必须通过 Path Guard、完整 `pnpm build` 与 Trusted Preview；
7. 不提交 generated Slidev source 或 `dist/**`；
8. Production Pages 继续通过显式 deployment gate；
9. 完成后同步 Roadmap 状态。

## Plan 状态约定

- `Planned`：尚未开始；
- `Design Review`：正在锁定语义与边界；
- `In Progress`：设计已批准，已有实施或验证进行中；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Live Gate`：实现已进入 main、外部 adapter 已启用，等待真实运行证据；
- `Soak Active`：首个真实闭环已完成，正在累计连续稳定运行与演练证据；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：对应计划所要求的 Preview / main / Production / real-run 验证全部完成；
- `Deferred`：明确推迟。
