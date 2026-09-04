# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@6419b3dfeeb3caa7f3f577351728a0e8dd780d91`
> 基线日期：2026-09-04
> 阶段：Product Capability Phase
> 当前目标：Plan 70 · Scheduled Content Automation · 70B Live Gate

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
  - 70B ChatGPT Scheduled Daily Adapter：**Live Gate** — PR #26 merged
    - main：`6419b3dfeeb3caa7f3f577351728a0e8dd780d91`
    - post-merge Site Build：`33845663516` Passed
    - main Artifact：`9926441727`
    - Artifact SHA-256：`a72cb53f61b29fdfdf6a6737f4599b698bc9e5be6b7f1ecc47b2528dece184e0`
    - existing ChatGPT task：`Agent 前沿资讯`
    - scheduler state：enabled
    - timezone/cadence：Asia/Shanghai · daily
    - bootstrap：current Orbis `main` → `config/adapters/chatgpt-scheduled-daily.md`
    - notification settings：preserved
    - first real transport proof：pending

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
  │   ├── deletion / rename-safe Path Guard
  │   ├── explicit targetDate + exact Daily identity
  │   ├── exact-target Scheduled Daily guard
  │   ├── published-main overwrite protection
  │   ├── provider-neutral run/PR metadata
  │   └── mandatory read-only PR Preview guard
  ├── 70B ChatGPT Adapter · Live Gate
  │   ├── provider adapter merged to main
  │   ├── existing Scheduled Task migrated + enabled
  │   ├── connected GitHub one-branch / one-PR contract
  │   └── first eligible real transport proof pending
  └── 70C Real-cycle Validation
```

70A 已随 PR #25 合并，并在 fresh main 上通过完整 Site Build。

70B Repository 侧已随 PR #26 合并。PR Build `33827615741`、Trusted Preview `33827736463` 与 post-merge main Build `33845663516` 均通过；PR #26 只包含 ChatGPT adapter、focused contract、operations runbook 与 test wiring，没有修改 `content/**`、`apps/**`、`packages/**`、`dist/**` 或 workflows，也没有增加 Production authority。

现有 ChatGPT task `Agent 前沿资讯` 已原地迁移，不创建第二个 Scheduler。旧 `XiaoDaoJiang/ai-frontier` HTML 发布 prompt 已被替换为 Orbis thin bootstrap；task 已启用，继续使用 Asia/Shanghai daily cadence，并保持原通知配置。

70B 尚未 Done：必须由第一个 eligible real run 证明 `targetDate → automation/daily/<date> → exact Brief → exactly one PR → Scheduled Daily Guard → full Build → Trusted Preview`。若目标日期已在 main published，`already-published` 是合法 no-write 结果，但不能替代首次 branch/PR transport proof。

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
  ├── 70B ChatGPT Adapter      Live Gate · PR #26 merged / task enabled
  └── 70C Real-cycle Validation Next after first transport proof
```

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
- `Design Review`：当前计划已成为产品目标，正在锁定语义与边界；
- `In Progress`：设计已批准，已有实施计划、分支或 PR；
- `Review Gate`：实现、CI、Preview 已完成，等待人工集成；
- `Live Gate`：实现已进入 main、外部 adapter 已启用，等待真实运行证据；
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并完成对应 Preview / main / Production / real-run 验证；
- `Deferred`：明确推迟。
