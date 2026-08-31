# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-08-31
> 基线提交：`main@d2f0235587c01558ced1492225c4e376bfb20c22`

## 1. 当前阶段判断

Orbis 已经完成：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily Brief → Astro 阅读版 + 11 页 Slidev + RSS；
- 多 Presentation 自动发现与构建；
- `/YYYY/MM/DD/`、`/latest/`、`/archive.json` 的 structured-only 派生；
- Path Guard + CODEOWNERS + Agent 内容边界；
- read-only PR Build → trusted Preview Publish → 公网 Smoke；
- GitHub Actions Pages Production Cutover；
- 原 `main:/docs` Legacy HTML/Archive 兼容层彻底退役。

因此项目已经结束 Architecture Migration，正式进入 **Product Capability Phase**。

## 2. 产品定义回顾

Orbis 不是新闻站、博客模板或 Slides 仓库，而是一个面向长期积累的技术内容与知识发布系统：

```text
发现与研究
    ↓
结构化内容
    ↓
多种发布形态
    ├── 阅读版
    ├── 演示版
    ├── Topic 聚合
    ├── 长期 Knowledge
    └── RSS
```

当前更精确的定义是：

> Orbis 是一个 Git-native、Agent-native 的结构化技术知识发布系统：Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合和长期归档。

## 3. 当前稳态架构

```text
RSS / Web / Primary Sources
             ↓
       Research Agent
             ↓
        content/**
             ↓
 @orbis/content-schema
             ↓
     ┌───────┴────────┐
     ↓                ↓
  Astro Web      Slide Generator
     ↓                ↓
 Essays              Slidev
 Briefs               ↓
 Topics           /slides/*
 Knowledge
 RSS
     └───────┬────────┘
             ↓
        assemble-site
             ↓
 /archive.json
 /latest/
 /YYYY/MM/DD/
             ↓
          dist/site
             ↓
   PR Preview / Pages
```

核心约束：

- `content/**` 是唯一可发布内容源；
- Astro 与 Slidev 共享内容与设计合同，不共享 Runtime UI；
- AI/Agent 是 Content Contributor，不是 UI/Infra Maintainer；
- 生成文件永不反向成为内容源；
- 生产只发布经过完整 Build 和 Smoke 验证的 `dist/site`。

## 4. 原始需求与当前实现

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| 长期技术内容系统 | Done | Essay、Brief、Topic、Knowledge 四类结构化内容 |
| `content/**` 单一来源 | Done | 发布不读取 `docs/**`，生成物不进 Git |
| Astro + Slidev 分层 | Done | `apps/web` / `apps/slides` 独立构建 |
| Shared Schema | Done | `packages/content-schema` + Zod |
| Shared Design Tokens | Done | Astro/Slidev 共用视觉 Token |
| Essay | Done / Basic | Markdown → `/essays/:id/` |
| Daily Brief | Done / Mature | YAML → 阅读 + 11 页 Slidev + RSS + Date/Latest/Archive |
| Weekly Brief | Planned | Schema/template 名称预留，但没有 Weekly 语义模型与 `weekly-v1` 实现 |
| Ad-hoc Brief | Partial | 基础 cadence 可表达，缺少通用 Presentation 模板 |
| 独立 Presentation | Planned | Slidev 基础设施已有，缺 `content/presentations/**` 与 `talk-v1` |
| Topic | Done / Basic | Topic 实体与 Essay/Brief/Knowledge 聚合 |
| Knowledge | Done / Basic | 状态、`reviewAt`、Topic、References |
| RSS 输入 | Partial | `feeds.yaml` + Agent Contract，缺 Repository Scheduled Orchestration |
| RSS 输出 | Done | `/rss.xml` 聚合已发布内容 |
| 阅读版 + 演示版双输出 | Done | 同一 Brief 单一事实源 |
| 永久日期 URL / Latest / Archive data | Done | 全部由 Daily Brief 动态派生 |
| 人类 Archive / Discovery UI | Planned | 只有 JSON 和基础列表页，缺 `/archive/`、`/slides/`、筛选/导航 |
| Agent 只修改内容 | Done | Prompt + AGENTS + Path Guard |
| 多 Deck Build | Done | 自动发现并逐个构建，已有 N>1 集成 Gate |
| PR Preview / Pages Governance | Done / Mature | read-only build、trusted publish、public smoke、protected main |
| SEO / Sharing | Partial | title/description/favicon/RSS discovery；缺 canonical/OG/Sitemap/JSON-LD |
| Source / Author Registry | Planned | 当前仍以字符串和内联 Reference 为主 |
| Knowledge Review Workflow | Planned | Schema 有 `reviewAt`，缺生命周期工具和可视化 |

## 5. 当前成熟度

| 层级 | 评估 |
|---|---:|
| Monorepo / Build Foundation | 95% |
| Structured Content Architecture | 90% |
| Daily Brief Pipeline | 90% |
| Astro + Slidev 双输出 | 90% |
| CI / Preview / Pages / Governance | 95% |
| Agent Content Boundary | 95% |
| Essay / Knowledge / Topic 基础 | 70% |
| RSS | 75% |
| Weekly / Ad-hoc / Talk | 20% |
| Archive / Discovery / Navigation UX | 40% |
| SEO / Sharing | 30% |
| Source / Author Registry | 10% |
| 完整 Orbis 内容产品 | 约 60–65% |

成熟度是路线判断，不是精确 KPI。后续应以真实路由、内容规模、构建验证和日常使用体验替代主观百分比。

## 6. 已经具备的核心产品闭环

当前最成熟的是 Daily Brief Vertical Slice：

```text
Research
   ↓
content/briefs/YYYY-MM-DD.yaml
   ↓
dailyBriefSchema
   ├── /briefs/<id>/        Astro 阅读版
   ├── /slides/<id>/        11 页 Slidev
   ├── /rss.xml
   ├── /YYYY/MM/DD/
   ├── /archive.json
   └── /latest/
```

它已经证明 Orbis 的核心产品假设成立：**Agent 只生产结构化知识，系统负责多形态发布。**

## 7. 下一阶段的核心问题

下一阶段不再回答“架构能不能工作”，而是回答：

1. 用户能否高效浏览和重新发现历史知识？
2. Slides 是否能从 Daily 专用能力升级为真正 Presentation Platform？
3. Weekly 是否能表达跨时间趋势，而不是 Daily 拼接？
4. Topic、Source、Author、Knowledge 之间能否形成稳定知识关系？
5. 内容能否被搜索引擎、社交分享和阅读器正确理解？
6. Knowledge 是否能被定期复查、更新和退役？
7. Daily 自动化是否能在不扩大 Agent 权限的前提下稳定持续运行？

## 8. Product Capability Roadmap

### Milestone A — Discoverable Orbis

对应 Plan 10。

目标：从“有内容页”变成“历史内容可浏览、可筛选、可继续探索”。

主要能力：

- `/archive/`；
- `/slides/`；
- `/briefs/daily/`、`/briefs/weekly/`；
- Previous / Next / Related；
- 阅读版 ↔ 演示版双向导航；
- 首页结构升级。

退出条件：用户不需要知道文件路径或日期即可找到历史内容。

### Milestone B — Presentation Platform

对应 Plan 20。

目标：把现有 Daily Slide Generator 抽象为支持多 Presentation 类型的平台。

主要能力：

- Template Registry；
- `content/presentations/**`；
- `talk-v1`；
- Brief 与独立 Presentation 统一进入 `/slides/`；
- 不同类型 Deck 的统一发现、构建和验证。

退出条件：新增一种 Deck 不再需要复制 Daily 专用生成逻辑。

### Milestone C — Weekly Intelligence

对应 Plan 30。

目标：实现真正的 Weekly Brief，而不是七份 Daily 拼接。

主要能力：

- Weekly 专属 Schema；
- 趋势变化、周期 Thesis、下周期 Watch；
- `weekly-v1`；
- Weekly 阅读页与筛选入口。

退出条件：一份 Weekly 可以从结构化数据独立生成阅读版、演示版和 RSS。

### Milestone D — Knowledge Identity

对应 Plan 40。

目标：从自由字符串引用升级到稳定 Source / Author 实体与引用完整性。

退出条件：内容中的 Author、Source、Topic 关系可被验证并用于聚合。

### Milestone E — Search & Share Ready

对应 Plan 50。

目标：使 Astro 阅读页成为公开网络中的 canonical 内容入口。

退出条件：canonical、OG、Twitter Card、Sitemap、基础 JSON-LD 均由构建自动生成并验证。

### Milestone F — Durable Knowledge

对应 Plan 60。

目标：让 Knowledge 真正具有“长期维护”生命周期。

退出条件：可以识别待复查、过期、needs-review 的知识，并提供清晰更新路径。

### Milestone G — Sustainable Automation

对应 Plan 70。

目标：把当前 Prompt Contract 变成稳定的受控 Scheduled Content Workflow。

退出条件：每日任务能创建内容分支/PR、通过 Guard/Preview、失败可观察，同时不拥有发布基础设施写权限。

## 9. 明确暂不建设

继续保持原 Non-goals：

- 在线 CMS；
- 数据库和动态 API；
- 登录、评论、点赞、用户画像；
- 在线 RAG/AI 问答；
- 多语言；
- 重型全文搜索服务；
- Turborepo/Nx 等任务编排器；
- 为假想规模提前建设复杂增量构建平台。

## 10. Roadmap 完成后的目标产品形态

当 10–70 全部完成后，Orbis 应具备以下完整飞轮：

```text
Feeds / Sources
      ↓
Agent Research
      ↓
Brief / Essay / Presentation / Knowledge
      ↓
Schema + Source/Topic/Author Integrity
      ↓
Astro Reading + Slidev Presentation + RSS
      ↓
Archive / Topic / Discovery / SEO / Sharing
      ↓
Knowledge Review
      ↓
新的研究与内容
```

此时 Orbis 才从“架构完整的内容 Vertical Slice”成长为可长期使用的个人技术知识发布系统。
