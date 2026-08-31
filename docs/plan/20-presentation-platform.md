# 20 · Presentation Platform

> 状态：Planned
> Roadmap Milestone：B — Presentation Platform
> 建议优先级：P0

## 1. 目标

把当前以 `daily-v1` 为唯一真实实现的 Slide Generator，升级为支持多种 Presentation 来源与模板的稳定平台。

核心原则：**Slides 是输出通道，不是第二套内容源。**

## 2. 当前问题

当前已经具备：

- 自动发现多个 generated Deck；
- 多 Deck Slidev 构建；
- `/slides/<slug>/` 独立 Base Path；
- `daily-v1` 固定 11 页；
- N>1 集成验证。

但 Generator 实际只有：

```text
Brief(daily) -> daily-v1
```

Schema 虽然预留 `weekly-v1`、`talk-v1`，但未实现模板注册、独立 Presentation 内容源和统一生成接口。

## 3. 目标架构

```text
Brief / Presentation
        ↓
Presentation Descriptor
        ↓
Template Registry
   ├── daily-v1
   ├── weekly-v1   # Plan 30 实现
   └── talk-v1
        ↓
Generated Slidev Source
        ↓
Slidev Build × N
        ↓
/slides/<slug>/
```

## 4. 范围

### 4.1 Presentation Registry / Descriptor

定义统一生成描述：

- id / slug；
- title；
- publishedAt；
- topics；
- template；
- sourceKind；
- readingUrl（可选）；
- render payload。

Brief 和独立 Presentation 都先转换为 Descriptor，再进入模板。

### 4.2 Template Registry

把 `switch (template)` 改为显式 Registry：

```text
daily-v1 -> renderDailyV1
weekly-v1 -> renderWeeklyV1
 talk-v1 -> renderTalkV1
```

未知模板必须在生成阶段失败。

### 4.3 独立 Presentation 内容源

新增：

```text
content/presentations/**
```

以及对应 `presentationContentSchema`。

第一版独立 Presentation 至少包含：

- `kind: presentation`；
- title / summary；
- publishedAt / status；
- topics；
- sections；
- references；
- `template: talk-v1`。

### 4.4 `talk-v1`

实现一个通用技术分享模板，但不要复制 Daily 的固定 11 页结构。

第一版只需要稳定支持：

- Cover；
- Section / Content；
- Comparison / Architecture / Timeline / Metrics 等现有语义布局；
- References；
- Reading/Source links。

### 4.5 统一构建与索引

Brief 派生 Deck 和独立 Presentation 必须：

- 使用同一生成目录约定；
- 使用同一 `build-slides`；
- 进入 `/slides/` Index；
- 进入统一 artifact validation。

## 5. 实现任务

1. 新增 Presentation 内容 Schema；
2. 注册 Astro collection（如果需要阅读/索引元数据）；
3. 抽象 Presentation Descriptor；
4. 抽象 Template Registry；
5. 将 `daily-v1` 迁入 Registry，行为保持不变；
6. 新增 `talk-v1`；
7. 支持扫描 `content/presentations/**`；
8. 更新 multi-presentation test，构造 Daily + Talk 混合 Fixture；
9. 更新 `/slides/` 数据源；
10. 对 unsupported template / duplicate slug / invalid source 建负向测试。

## 6. 非目标

- 可视化 Slide Editor；
- 任意 HTML/Vue 注入；
- 用户自定义主题上传；
- 动态运行时模板；
- PPTX 导出；
- 本 Plan 不实现 Weekly 业务语义，Weekly 放在 Plan 30。

## 7. 验收标准

- 现有 Daily Deck 输出不发生回归；
- 一个仓库 Build 可同时生成至少 1 个 Daily + 1 个独立 Talk；
- 新增模板通过 Registry 注册，不需要修改 `build-slides`；
- `content/presentations/**` 通过 Schema 校验；
- 未知模板会在 Build 阶段明确失败；
- 所有 Deck 拥有独立 `/slides/<slug>/`；
- PR Preview 可以公开访问混合 Presentation；
- 不提交 generated Slidev source。

## 8. 建议 PR 拆分

1. `refactor: introduce presentation registry and descriptor`
2. `feat: add standalone presentations and talk-v1`

先做抽象再做新能力，避免把重构与新模板混成难评审的大 PR。
