---
kind: essay
title: Agent Harness 为什么成为系统竞争层
description: 当模型逐渐商品化，状态、权限、环境和验证开始决定真实任务完成率。
publishedAt: 2026-08-28
updatedAt: 2026-08-28
status: published
authors:
  - xiaodaojiang
topics:
  - agent-harness
  - coding-agent
featured: true
references:
  - title: Slidev Building and Hosting
    url: https://sli.dev/guide/hosting
    supports: 说明演示层可以独立构建和发布。
---

Agent Loop 很小，但生产 Agent 系统并不小。

一个最小循环只需要模型、动作、环境和观察；一旦任务运行时间变长，系统就必须处理状态持久化、权限、沙箱、失败恢复、验证和审计。此时，决定体验的已经不只是模型本身，而是模型外部的 Harness。

## 从循环到系统

Harness 的价值在于把不确定的模型行为包裹在可管理的工程边界中：

- 输入和上下文可以追溯；
- 工具具有权限和审计；
- 执行环境可以隔离；
- 失败可以恢复；
- 最终结果可以验证。

## 对内容系统的启发

同样的原则也适用于自动内容生产：AI 负责研究和表达，但 Schema、模板和 CI 应负责边界与一致性。Orbis V2 的原型就是对这条原则的直接实践。
