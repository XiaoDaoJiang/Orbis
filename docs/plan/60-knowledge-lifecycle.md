# 60 · Knowledge Lifecycle

> 状态：Current · Design Review
> Roadmap Milestone：F — Durable Knowledge
> 建议优先级：P2
> 基线：`main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> 依赖：Plan 40 Source & Author Registry · Done；Plan 50 SEO & Sharing · Done

## 1. 目标

让 `content/knowledge/**` 从“另一类文章”升级为真正具有复查、更新、退役语义的长期知识层。

核心原则：**Knowledge 的价值来自持续维护，而不是永久发布后不再检查。**

## 2. 当前基础

Knowledge Schema 已经具备：

- `status`；
- `publishedAt`；
- `updatedAt`；
- `reviewAt`；
- topics；
- references。

当前 `publicationStatusSchema` 已包含 `draft / published / needs-review / archived / active`，而公开 Knowledge 目前只把 `published / active` 作为可发现内容；`needs-review / archived` 尚未形成稳定公开语义。

当前缺少：

- Review 到期识别；
- needs-review 可视化；
- 更新历史/变更说明；
- 从 Brief/Essay 沉淀 Knowledge 的明确流程；
- 退役与替代关系；
- CI/Automation 中的生命周期提示。

## 3. 当前设计问题

Plan 60 在实现前必须先锁定一个关键边界：

**`needs-review` 是作者显式维护的持久化状态，还是根据 `reviewAt` 与构建日期动态推导的状态？**

推荐方向：

```text
持久化 status        = active | archived | draft ...
review health         = current | due-soon | overdue
editorial flag        = needs-review（仅在人工明确判断需要复查时持久化）
```

也就是说，日期到期本身只产生 review health / warning，不自动改写 `status`。这样静态内容不会因为“今天是哪一天”而改变其源数据语义，也避免构建自动修改 Git 内容。

该边界需要在 Design Review 中确认后再进入 Schema / tooling 实现。

## 4. 生命周期模型

现有草案：

```text
draft
  ↓
active
  ↓
needs-review
  ├──→ active       # 复查后确认/更新
  └──→ archived     # 已失效或被替代
```

Design Review 建议改为把“发布状态”和“复查健康度”分开：

```text
Publication / Editorial State
  draft → active → archived
            ↕
       needs-review   # 显式 editorial state

Derived Review Health
  current → due-soon → overdue
```

`published` 继续作为兼容 PublicationStatus；Knowledge 新增能力不应要求第一版立即迁移全部历史内容。

## 5. Schema 扩展

现有建议字段：

```yaml
reviewAt: 2026-11-01
reviewIntervalDays: 90
supersedes:
  - old-entry-id
supersededBy: new-entry-id
changeNote: 更新了 MCP 生命周期和授权边界
```

不要求所有字段第一版同时存在。建议第一阶段优先：

- 保留现有 `reviewAt`；
- 新增 replacement relation（具体单向还是双向由设计确认）；
- `changeNote` / history 暂不强制进入 Schema；
- `reviewIntervalDays` 只有在明确需要自动计算下一次 review date 时再引入。

重点是先定义稳定、可验证、不会被日期自动改写的 review contract。

## 6. Review Detection

新增构建期/工具层检测：

- `reviewAt < today` 且内容仍为公开现行 Knowledge；
- `reviewAt` 即将到期；
- 显式 `needs-review` 内容；
- archived 内容被 active 内容引用时的风险；
- replacement relation 悬空或冲突。

第一阶段不要因为“到期”直接阻断整个生产 Build，避免日期问题导致站点无法发布。

建议分级：

```text
ERROR   结构或关系不合法
WARN    reviewAt 已过期 / explicit needs-review
INFO    即将到期
```

CI 可以生成 Review Report；真正改变 source status 仍由内容 PR 完成。

## 7. Web Experience

Knowledge Index 建议增加：

- Active；
- Needs Review；
- Recently Updated。

公开 Knowledge 页面显示：

- Published / Updated；
- Next review；
- Review health；
- Editorial status；
- Topics；
- References；
- Superseded / archived notice（如存在）。

Archived 页面可以继续保持永久 URL，但清晰提示不再推荐作为当前结论。

## 8. Knowledge Promotion Workflow

定义从短周期内容沉淀为长期知识的人工/Agent 辅助流程：

```text
Repeated Brief signals
      ↓
Essay / research evidence
      ↓
Candidate Knowledge
      ↓
Human review
      ↓
active Knowledge
      ↓
periodic review
```

Agent 可以提出 Knowledge PR，但不能自动把未经评审的内容标记为长期有效结论。

## 9. 实现任务（设计批准后）

1. 固化 Knowledge editorial state 与 derived review health 语义；
2. 根据最终 relation 设计扩展 Schema；
3. 新增 `tools/knowledge-review-check` 或整合到 content validation；
4. 输出 machine-readable + human-readable review report；
5. 实现 overdue / due-soon / needs-review 检测；
6. 实现 replacement relation validation；
7. 升级 Knowledge Index；
8. 升级 Knowledge Detail；
9. 更新 Agent 内容规范；
10. 添加时间边界测试，固定 UTC/calendar-date 语义，避免时区误判。

## 10. 非目标

- 自动修改 Knowledge 状态；
- LLM 自动判断事实是否仍真实；
- 自动删除 archived 内容；
- 数据库任务队列；
- 复杂审批系统；
- 因 reviewAt 到期而自动提交 source content 变更。

## 11. 验收标准

- 到期 Knowledge 可以被稳定识别；
- 到期本身不会无理由阻断站点发布；
- derived review health 与持久化 editorial state 不混淆；
- needs-review / archived 在 UI 中有明确提示；
- replacement relation 不允许悬空或自引用；
- Archived 页面保持稳定 URL；
- Agent 不会在无评审情况下自动把 Candidate 提升为长期有效 Knowledge；
- Review Report 可以在 CI 或本地命令中读取；
- 相同基准日期在不同时区得到相同检测结果。

## 12. 建议 PR 拆分

设计批准后建议两段：

1. `feat: add knowledge review lifecycle validation`
2. `feat: surface knowledge review status in web`

第一段负责 Schema / pure lifecycle evaluator / report / relation validation；第二段只消费已稳定的生命周期结果做 Web UI，不让日期判断散落在 Astro 页面中。
