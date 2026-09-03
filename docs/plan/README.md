# Orbis Product Capability Plans

> 状态：Active planning
> 基线：`main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`
> 基线日期：2026-09-03
> 阶段：Product Capability Phase
> 当前目标：Plan 60 · Production Gate；Plan 70 · Design Review

`docs/plan/` 保存 Orbis 在稳态架构之上的产品能力 Roadmap 与可执行计划。

## 当前推进状态

- Plan 10 · Archive & Discovery Experience：**Done** — PR #8 / #9 / #10
- Plan 20 · Presentation Platform：**Done** — PR #11 / #12
- Plan 30 · Weekly Brief：**Done** — PR #13 / #14
- Plan 40 · Source & Author Registry：**Done** — PR #15 / #19
- Plan 50 · SEO & Sharing：**Done** — PR #21 / #22
- Plan 60 · Knowledge Lifecycle：**Production Gate**
  - 60A Knowledge Lifecycle Contract：**Done** — PR #23
  - 60B Knowledge Lifecycle UI：**Merged / Production Gate** — PR #24
    - main：`89c7f8fe6d5da972c0f54b1367df252aa00cf286`
    - Site Build：`33720559711` Passed
    - Main Artifact：`9880102491`
    - Main Artifact SHA-256：`89603fae5eb5be3d879fd682cfb381695f6406a6b9c6b47ba92a140d78ab895a`
    - Production Pages：exact-SHA `deploy=true` Pending
- Plan 70 · Scheduled Content Automation：**Design Review**
  - repository contract / guard audit：Done
  - design draft：`docs/superpowers/specs/2026-09-03-scheduled-content-automation-design.md`
  - implementation：blocked until Plan 60 Production Gate + design approval

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
Knowledge Lifecycle Contract · 60A Done
          ↓
Knowledge Lifecycle UI · 60B Merged
  ├── Current / Attention / Historical
  ├── review health + editorial status
  ├── stable needs-review / archived URLs
  └── replacement / supersedes navigation
          ↓
Production Gate · pending exact main SHA
          ↓
Scheduled Content Automation · Design Review
  ├── exact-date / exact-path Daily guard
  ├── idempotent automation branch / PR
  ├── published-main overwrite protection
  └── replaceable Scheduler / Producer
```

PR #24 已于 `2026-09-03T05:50:21Z` 合并到 `main@89c7f8fe6d5da972c0f54b1367df252aa00cf286`。fresh Site Build `33720559711` 再次通过 60A/60B lifecycle contracts、fixed-date UI fixture、SEO/JSON-LD 与最终 Knowledge lifecycle artifact contract，并上传主 Artifact `9880102491`。

当前 Plan 60 只剩 governed Production Pages 对 exact main SHA 的 Build → Deploy → public Smoke。该 gate 通过后，Plan 60 / Milestone F 才标记 Done；Plan 70 已允许提前进行 Design Review，但不启动 implementation。

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
60 Knowledge Lifecycle         Production Gate
  ├── 60A Contract             Done · PR #23
  └── 60B Web UI               Merged · PR #24
        ↓
70 Scheduled Content Automation Design Review
  └── implementation waits for Plan 60 Production Gate
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
- `Production Gate`：实现与 main Build 已完成，但 exact-SHA Production Pages 验证尚未完成；
- `Done`：全部计划 PR 已进入 `main`，并完成对应 Preview / main / Production 验证；
- `Deferred`：明确推迟。
