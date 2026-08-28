---
kind: knowledge
title: Verification Loop
summary: 让 Agent 通过执行、观察、验证和修复证明任务完成的闭环模式。
status: active
publishedAt: 2026-08-28
reviewAt: 2026-11-01
topics:
  - coding-agent
  - agent-harness
references: []
---

Verification Loop 不以“模型说已经完成”为结束条件，而以可观察的系统状态为依据。

典型闭环包括：

1. 实施修改；
2. 运行测试或业务验证；
3. 收集退出码、状态和证据；
4. 失败时重新计划并修复；
5. 通过后输出可审阅证据。

它是 Coding Agent 从代码生成工具走向可托付执行者的重要分界线。
