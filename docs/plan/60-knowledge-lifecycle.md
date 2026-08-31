# 60 · Knowledge Lifecycle

> 状态：Planned
> Roadmap Milestone：F — Durable Knowledge
> 建议优先级：P2
> 依赖：Plan 40 Source & Author Registry 推荐先完成

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

当前缺少：

- Review 到期识别；
- needs-review 可视化；
- 更新历史/变更说明；
- 从 Brief/Essay 沉淀 Knowledge 的明确流程；
- 退役与替代关系；
- CI/Automation 中的生命周期提示。

## 3. 生命周期模型

建议明确以下状态语义：

```text
draft
  ↓
active
  ↓
needs-review
  ├──→ active       # 复查后确认/更新
  └──→ archived     # 已失效或被替代
```

`published` 可以继续作为兼容 PublicationStatus，但 Knowledge 应优先使用 `active / needs-review / archived` 语义。

## 4. Schema 扩展

建议增加可选字段：

```yaml
reviewAt: 2026-11-01
reviewIntervalDays: 90
supersedes:
  - old-entry-id
supersededBy: new-entry-id
changeNote: 更新了 MCP 生命周期和授权边界
```

不要求所有字段第一版同时存在；重点是定义稳定的 review contract。

## 5. Review Detection

新增构建期/工具层检测：

- `reviewAt < today` 且仍 active；
- needs-review 内容；
- archived 内容被 active 内容引用时的风险；
- supersedes / supersededBy 悬空关系。

第一阶段不要因为“到期”直接阻断整个生产 Build，避免日期问题导致站点无法发布。

建议分级：

```text
ERROR   结构或引用不合法
WARN    reviewAt 已过期
INFO    即将到期
```

CI 可以生成 Review Report；真正改变 status 仍由内容 PR 完成。

## 6. Web Experience

Knowledge Index 增加：

- Active；
- Needs Review；
- Recently Updated。

公开 Knowledge 页面显示：

- Published / Updated；
- Last reviewed / Next review；
- Status；
- Topics；
- References；
- Superseded notice（如存在）。

Archived 页面可以继续保持永久 URL，但清晰提示不再推荐作为当前结论。

## 7. Knowledge Promotion Workflow

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

## 8. 实现任务

1. 固化 Knowledge 状态语义；
2. 根据需要扩展 Schema；
3. 新增 `tools/knowledge-review-check` 或整合到 content validation；
4. 输出 machine-readable + human-readable review report；
5. 实现 overdue / due-soon / needs-review 检测；
6. 实现 supersedes relation validation；
7. 升级 Knowledge Index；
8. 升级 Knowledge Detail；
9. 更新 Agent 内容规范；
10. 添加时间边界测试，避免时区导致误判。

## 9. 非目标

- 自动修改 Knowledge 状态；
- LLM 自动判断事实是否仍真实；
- 自动删除 archived 内容；
- 数据库任务队列；
- 复杂审批系统。

## 10. 验收标准

- 到期 Knowledge 可以被稳定识别；
- 到期本身不会无理由阻断站点发布；
- needs-review / archived 在 UI 中有明确提示；
- supersedes relation 不允许悬空；
- Archived 页面保持稳定 URL；
- Agent 不会在无评审情况下自动把 Candidate 提升为长期有效 Knowledge；
- Review Report 可以在 CI 或本地命令中读取。

## 11. 建议 PR 拆分

1. `feat: add knowledge review lifecycle validation`
2. `feat: surface knowledge review status in web`
