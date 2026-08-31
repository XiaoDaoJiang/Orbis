# 20 · 内容模型与 Schema

## 1. 建模原则

- 内容类型与品牌栏目分离；
- 阅读版与演示版共享事实、判断和引用；
- 所有公开内容具有稳定 ID、slug、发布日期和状态；
- Topic 与 Source 使用注册表，避免自由文本不断分叉；
- Schema 负责结构约束，Prompt 只负责内容质量；
- 构建产物不能反向成为内容源。

## 2. Collection 设计

```text
content/
├── essays/          # Markdown
├── briefs/          # YAML
├── presentations/   # YAML 或 Markdown frontmatter
├── topics/          # YAML
├── knowledge/       # Markdown
├── authors/         # YAML
└── sources/         # YAML
```

## 3. Essays

用于 Blog / Essays。

```yaml
id: agent-harness-as-system-layer
kind: essay
title: Agent Harness 为什么成为系统竞争层
description: 从模型调用走向运行时、状态与验证系统
publishedAt: 2026-08-28
updatedAt: 2026-08-28
status: published
authors:
  - xiaodaojiang
topics:
  - agent-harness
  - coding-agent
featured: true
references: []
```

正文使用 Markdown。第一阶段禁止在普通 Essay 中嵌入任意 MDX 组件，避免内容层侵入 UI。

## 4. Briefs

Daily / Weekly 使用统一 `Brief` 基础模型，通过 `cadence` 判别：

```yaml
id: 2026-08-28
kind: brief
cadence: daily        # daily | weekly | ad-hoc
publishedAt: 2026-08-28
status: published

title: Harness 正在成为模型之外的能力层
summary: 从高信号变化到可验证的工程判断

topics:
  - agent-harness
  - mcp

signals: []
sections: []
projects: []
actions: []
references: []
archivePicks: []

presentation:
  enabled: true
  template: daily-v1
```

### Daily 约束

- `signals` 固定 4 项；
- `sections` 3～5 项；
- `projects` 允许 CLONE / READ / TEST / WATCH；
- `actions` 3～5 项；
- 演示模板默认 11 页。

### Weekly 约束

Weekly 继承 Brief 基础字段，并增加：

```yaml
cadence: weekly
period:
  from: 2026-08-24
  to: 2026-08-30
weeklyThesis: 本周最重要的系统变化
trendMovements: []
nextPeriodWatch: []
presentation:
  enabled: true
  template: weekly-v1
```

周报不是日报拼接，必须表达持续升温、出现新变量、降温与下周观察。

### Ad-hoc

用于不属于固定节奏的专题简报。它避免在项目早期把 Daily / Weekly 固化为品牌栏目。

## 5. Presentations

Slides 是输出通道，但仍需要支持独立技术演示：

```yaml
id: understanding-agent-harness
kind: presentation
title: Understanding Agent Harness
publishedAt: 2026-09-01
topics:
  - agent-harness
template: talk-v1
sections: []
references: []
```

Brief 的演示由 Brief 数据生成；独立 Presentation 则从 `presentations/` 生成。两者最终都进入 `/slides/`。

## 6. Topics

```yaml
id: agent-harness
name: Agent Harness
description: 管理模型、工具、上下文、状态、权限和验证的运行层
aliases:
  - harness
  - agent-runtime-harness
status: active
related:
  - coding-agent
  - agent-runtime
```

Topic 页面跨 Collection 聚合，不要求内容文件按 Topic 建目录。

## 7. Knowledge

长期知识条目强调复用和复查：

```yaml
id: verification-loop
kind: knowledge
title: Verification Loop
status: active
reviewAt: 2026-11-01
topics:
  - agent-evaluation
  - coding-agent
sources: []
```

建议状态：

- `draft`；
- `active`；
- `needs-review`；
- `archived`。

## 8. Sources 与引用

Source Registry 保存稳定元数据：

```yaml
id: simon-willison
name: Simon Willison's Weblog
homepage: https://simonwillison.net/
feed: https://simonwillison.net/atom/everything/
type: expert-blog
trustTier: secondary-high
```

内容中的引用仍保存具体 URL、标题、发布时间和用途：

```yaml
references:
  - title: Stateless MCP has recaptured my interest
    url: https://simonwillison.net/2026/Jul/31/stateless-mcp/
    source: simon-willison
    supports: MCP 轻量连接边界的判断
    accessedAt: 2026-08-28
```

## 9. 内容与 UI 的契约

内容可以声明有限的语义布局：

```yaml
layout: architecture   # architecture | comparison | timeline | metrics | system-map
```

但不得包含：

- HTML；
- CSS class；
- Vue / Astro Component 名称；
- JavaScript；
- 任意像素尺寸或绝对定位；
- 未进入白名单的布局类型。

## 10. AI 写入边界

自动内容任务默认只允许修改：

```text
content/essays/**
content/briefs/**
content/presentations/**
content/knowledge/**
```

Topic、Source、品牌与配置变更应通过人工评审或单独 PR 完成。
