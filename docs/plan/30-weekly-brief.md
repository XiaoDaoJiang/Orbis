# 30 · Weekly Brief

> 状态：Planned
> Roadmap Milestone：C — Weekly Intelligence
> 建议优先级：P1
> 依赖：Plan 20 Presentation Platform

## 1. 目标

实现真正表达跨时间变化的 Weekly Brief，而不是把多份 Daily 内容简单拼接。

Weekly 需要回答：

- 这一周什么变化最重要？
- 哪些方向持续升温或降温？
- 出现了什么新变量？
- 哪些判断被新的证据修正？
- 下一个周期应该继续观察什么？

## 2. 目标内容模型

Weekly 继承 Brief 基础字段，并增加：

```yaml
kind: brief
cadence: weekly
publishedAt: 2026-09-06
status: published
period:
  from: 2026-08-31
  to: 2026-09-06
weeklyThesis: 本周最重要的系统变化
trendMovements:
  - topic: agent-harness
    direction: rising
    summary: ...
nextPeriodWatch:
  - title: ...
    reason: ...
presentation:
  enabled: true
  template: weekly-v1
```

`trendMovements.direction` 第一版建议限制为：

- `rising`；
- `stable`；
- `cooling`；
- `new-variable`。

## 3. 范围

### 3.1 Weekly Schema

新增并验证：

- period；
- weeklyThesis；
- trendMovements；
- nextPeriodWatch；
- Weekly 专用数量边界。

不要强迫 Weekly 复用 Daily 固定 4 signals / 5 sections。

### 3.2 Weekly 阅读页

`/briefs/:id/` 根据 cadence 使用语义差异化展示：

- period；
- weeklyThesis；
- trend movements；
- 本周重点 sections；
- next period watch；
- references。

尽量共享组件与查询逻辑，不复制完整页面。

### 3.3 `weekly-v1`

通过 Plan 20 的 Template Registry 注册。

页面结构应围绕趋势和周期判断设计，不预先把页数锁死为 11；第一版可以定义一个清晰上限并由 Schema/Template Test 固定。

### 3.4 Discovery

Weekly 自动进入：

- `/briefs/`；
- `/briefs/weekly/`；
- `/archive/`；
- `/rss.xml`；
- `/slides/`（presentation enabled 时）；
- Topic 聚合。

Daily 专属 `/YYYY/MM/DD/`、`/latest/` 继续只由 Daily 驱动，Weekly 不抢占 Daily latest contract。

## 4. 实现任务

1. 新增 `weeklyBriefSchema`；
2. 加正向/负向 Schema tests；
3. 扩展 Brief 阅读页；
4. 实现 `weekly-v1`；
5. 将 Weekly 纳入 Presentation Registry；
6. 更新 RSS/Archive/Topic/Slides 聚合测试；
7. 创建一份最小真实 Weekly Fixture 或示例内容；
8. 验证 Daily 与 Weekly 同仓库共存；
9. 验证 `/latest/` 仍按 Daily 语义运行。

## 5. 非目标

- 自动从 Daily 机械合并生成 Weekly；
- 自动总结所有过去七天内容；
- 周报品牌化栏目系统；
- 月报；
- 趋势预测模型。

未来可以让 Agent 读取本周 Daily 作为输入，但最终 Weekly 必须是独立结构化判断。

## 6. 验收标准

- Weekly 有独立 Schema，不能被 Daily Schema 误接受；
- Weekly 不依赖固定 4 signals / 5 sections；
- `weekly-v1` 可独立构建；
- Daily + Weekly + Talk 可在同一次 Build 中共存；
- Weekly 出现在所有正确的 Web/RSS/Topic/Archive/Slides 入口；
- Weekly 不改变 Daily `/latest/` 与日期路由语义；
- PR Preview 能访问阅读版和演示版。

## 7. 建议 PR

`feat: add weekly brief model and weekly-v1 presentation`

如果变更过大，可先提交 Schema + Reading，再提交 Template + Integration。
