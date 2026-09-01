# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-01
> 基线提交：`main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`
> 当前目标：Milestone D — Knowledge Identity / Ordered Merge Gate

## 1. 当前阶段判断

Orbis 已经完成并合并到 `main`：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily Brief → Astro 阅读版 + 固定 11 页 `daily-v1` + RSS；
- Archive / Slides / Daily / Weekly Discovery 与跨内容导航；
- Homepage Latest Brief / Essay / Presentation / Knowledge / Topics discovery；
- source-neutral Presentation Descriptor + Template Registry；
- `content/presentations/**` + standalone `talk-v1`；
- Weekly 专属 Schema、Reading、`weekly-v1`；
- Daily + Weekly + Talk 同仓库自动发现、生成、构建与验证；
- `/YYYY/MM/DD/`、`/latest/`、生成型 `/archive.json` 的 Daily-only structured projection；
- Path Guard + CODEOWNERS + Agent 内容边界；
- read-only PR Build → trusted Preview Publish → Public Smoke；
- GitHub Pages Production Cutover；
- 原 `main:/docs` Legacy HTML/Archive 兼容层彻底退役。

Architecture Migration 与前三个 Product Capability Milestone 均已结束。

**Milestone D — Knowledge Identity 的全部实现已经完成并分别通过完整 Build 与 Public Preview，但尚未全部进入 `main`。** 当前不是继续设计新能力，而是执行有序合并：

```text
40A Registry + Referential Integrity
PR #15 · implementation complete · merge first
        ↓
40B Registry-backed Content UI
PR #16 · implementation complete · stacked on #15
        ↓
retarget #16 -> main · verify · merge
        ↓
main / Pages verification
        ↓
Plan 40 Done -> Plan 50
```

## 2. 产品定义

Orbis 不是新闻站、博客模板或 Slides 仓库，而是一个面向长期积累的技术内容与知识发布系统：

```text
发现与研究
    ↓
结构化内容
    ↓
可验证的内容身份与关系
    ↓
多种发布形态
    ├── 阅读版
    ├── 演示版
    ├── Topic / Source / Author metadata
    ├── 长期 Knowledge
    └── RSS
```

> Orbis 是一个 Git-native、Agent-native 的结构化技术知识发布系统：Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合和长期归档。

## 3. 稳态架构与待合并扩展

当前 `main` 的发布架构保持：

```text
RSS / Web / Primary Sources
             ↓
       Research Agent
             ↓
        content/**
             ↓
 @orbis/content-schema
             ↓
     ┌───────┴─────────┐
     ↓                 ↓
  Astro Web      Presentation Platform
     ↓                 ↓
 Essays           Descriptor + Registry
 Briefs           daily / weekly / talk
 Topics                 ↓
 Knowledge           Slidev × N
     └────────┬──────────┘
              ↓
         assemble-site
              ↓
 /archive.json /latest/ /YYYY/MM/DD/
              ↓
           dist/site
              ↓
    PR Preview / GitHub Pages
```

Plan 40 的两个已验证 PR 在 Schema 之后增加：

```text
@orbis/content-schema
        ↓
Referential Integrity
Topic / Source / Author
        ↓
Astro Registry Consumption
AuthorByline / ReferenceList
        ↓
existing Reading routes
```

核心约束：

- `content/**` 是唯一可发布内容源；
- Astro 与 Slidev 共享内容与设计合同，不共享 Runtime UI；
- AI/Agent 是 Content Contributor，不是 UI/Infra Maintainer；
- 生成文件永不反向成为内容源；
- 生产只发布经过完整 Build 和 Smoke 验证的 `dist/site`；
- Daily stable-date/latest contract 与通用 Brief/Presentation discovery contract 分离；
- Source / Author Registry 由人工治理，Scheduled Agent 只能引用已注册身份；
- Source / Author metadata 只 enrich 现有 Reading UI，不创建新的目录产品。

## 4. 原始需求与当前实现

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| 长期技术内容系统 | Done | Essay、Brief、Topic、Knowledge、Presentation 结构化内容 |
| `content/**` 单一来源 | Done | 发布不读取 Legacy `docs/**`，生成物不进 Git |
| Astro + Slidev 分层 | Done | `apps/web` / `apps/slides` 独立构建 |
| Shared Schema | Done | `packages/content-schema` + Zod |
| Shared Design Tokens | Done | Astro / Slidev 共用视觉 Token |
| Essay | Done / Basic | Markdown → `/essays/:id/` + Related |
| Daily Brief | Done / Mature | Reading + 11 页 Slidev + RSS + Date/Latest/Archive + Previous/Next |
| Weekly Brief | Done / First Release | 独立 Weekly Schema + Reading + 7..11 页 `weekly-v1` + RSS/Archive/Topic/Slides |
| Ad-hoc Brief | Partial | cadence/body contract 可表达，缺通用 Presentation 模板 |
| 独立 Presentation | Done / Basic | `content/presentations/**` + `talk-v1` + Slides/Home discovery |
| Presentation Platform | Done | Descriptor、Registry、Daily/Weekly/Talk 混合构建 |
| Topic | Done / Basic | Topic 实体与公开内容聚合 |
| Knowledge | Done / Basic | 状态、`reviewAt`、Topic、References、Related |
| RSS 输入 | Partial | `feeds.yaml` + Agent Contract，缺 Repository Scheduled Orchestration |
| RSS 输出 | Done | `/rss.xml` 聚合公开内容 |
| Archive / Discovery / Navigation | Done / Mature | Archive、Slides、cadence indexes、Homepage、Previous/Next、Related |
| PR Preview / Pages Governance | Done / Mature | read-only build、trusted publish、public smoke、protected main |
| SEO / Sharing | Partial | title/description/favicon/RSS discovery；缺 canonical/OG/Sitemap/JSON-LD |
| Source / Author Registry | Implementation Complete / Pending Merge | 40A canonical IDs + Integrity；40B Author/Source Reading metadata |
| Knowledge Review Workflow | Planned | Schema 有 `reviewAt`，缺生命周期工具和可视化 |

## 5. 当前成熟度

| 层级 | 评估 |
|---|---:|
| Monorepo / Build Foundation | 95% |
| Structured Content Architecture | 92% |
| Daily Brief Pipeline | 94% |
| Weekly Brief Pipeline | 85% |
| Presentation Platform | 90% |
| Astro + Slidev 双输出 | 95% |
| CI / Preview / Pages / Governance | 95% |
| Agent Content Boundary | 95% |
| Archive / Discovery / Navigation UX | 92% |
| Essay / Knowledge / Topic 基础 | 78% |
| RSS | 75% |
| SEO / Sharing | 30% |
| Source / Author Registry | 85% · implementation complete, merge pending |
| 完整 Orbis 内容产品 | 约 85% |

成熟度是路线判断，不是精确 KPI。后续应以真实内容规模、引用完整性、构建验证和日常使用体验替代主观百分比。

## 6. 已经具备的核心产品闭环

### Daily

```text
Research
   ↓
Daily YAML
   ↓
dailyBriefSchema
   ├── Reading
   ├── daily-v1 / 11 slides
   ├── Previous / Next / Related
   ├── RSS / Topic / Archive
   └── Daily-only date / latest / archive.json
```

### Weekly

```text
Cross-time judgment
   ↓
Weekly YAML
   ↓
weeklyBriefSchema
   ├── Weekly Reading
   ├── weekly-v1 / 7..11 slides
   ├── RSS / Topic / Archive
   └── no Daily stable alias
```

### Standalone Presentation

```text
Structured Presentation YAML
   ↓
presentationContentSchema
   ↓
PresentationDescriptor
   ↓
talk-v1
   ↓
/slides/<slug>/
```

### Knowledge Identity（已验证、待有序合并）

```text
content/sources + content/authors + topics
                 ↓
canonical filename IDs
                 ↓
repository-wide referential integrity
                 ↓
Essay Author byline + Reference Source metadata
```

这些路径共同证明 Orbis 的核心产品假设成立：**Agent 生产结构化知识，平台负责验证、关系、发现与多形态发布。**

## 7. 当前阶段核心问题

Milestone D 的产品与技术问题已经通过 PR #15 / #16 得到实现级回答：

1. Source / Author 使用文件名 canonical ID，而不是自由字符串变体；
2. Author、Source、Topic relation 在 CI 中整体验证；
3. Reference 同时保留具体材料 URL 和 Source Entity；
4. archived identity 保持历史可解析并在 UI 中显式显示；
5. Agent 只能使用已注册身份，Registry 写入仍需人工评审；
6. Essay / Brief / Knowledge 可以消费 Registry metadata，而不新增目录路由；
7. 直接绕过完整校验执行 `build:web` 时，缺失 ID 仍会明确失败。

当前唯一剩余问题是**交付顺序与主分支验证**，而不是功能设计：

```text
merge #15
retarget #16
verify #16
merge #16
verify main / Pages
```

## 8. Product Capability Roadmap

### Milestone A — Discoverable Orbis · Done

对应 Plan 10。PR #8 / #9 / #10 已合并。

退出结果：用户无需知道文件路径即可从 Homepage、Archive、Slides、cadence indexes、Topic 和内容页发现主要内容，并可通过 Previous / Next / Related 持续探索。

### Milestone B — Presentation Platform · Done

对应 Plan 20。PR #11 / #12 已合并。

退出结果：Brief 和 standalone Presentation 先统一进入 `PresentationDescriptor` / Template Registry；新增 Deck template 不需要修改 `build-slides`。

### Milestone C — Weekly Intelligence · Done

对应 Plan 30。PR #13 / #14 已合并。

退出结果：Weekly 拥有独立 Schema、跨周期语义 Reading、`weekly-v1`、RSS/Archive/Topic/Slides discovery，并与 Daily + Talk 在同一次 Build 中共存；Daily `/latest/` 与日期路由仍保持 Daily-only。

### Milestone D — Knowledge Identity · Implementation Complete / Merge Gate

对应 Plan 40。

实施状态：

- **40A Registry + Referential Integrity — implementation/Preview complete，PR #15**：文件名 canonical ID、Source/Author Schema、真实 Registry、Astro Collections、Topic/Source/Author 跨文件校验与 Agent 治理。
- **40B Registry-backed Content UI — implementation/Preview complete，stacked PR #16**：Essay Author byline、Brief/Essay/Knowledge Reference Source metadata、archived/unsourced 语义和直接 Web build 防御；不新增 Source/Author 目录路由。

退出前剩余：

1. 合并 PR #15；
2. 将 PR #16 retarget 到 `main`；
3. 验证 retarget 后 UI-only diff 和 CI；
4. 合并 PR #16；
5. 验证 `main` / GitHub Pages；
6. 将 Plan 40 标记 Done。

### Milestone E — Search & Share Ready · Planned / Next after Plan 40 Done

对应 Plan 50。

目标：使 Astro 阅读页成为公开网络中的 canonical 内容入口，并消费稳定的 Author / Source identity。

退出条件：canonical、OG、Twitter Card、Sitemap、基础 JSON-LD 均由构建自动生成并验证。

### Milestone F — Durable Knowledge · Planned

对应 Plan 60。

目标：让 Knowledge 真正具有“长期维护”生命周期。

退出条件：可以识别待复查、过期、needs-review 的知识，并提供清晰更新路径。

### Milestone G — Sustainable Automation · Planned

对应 Plan 70。

目标：把当前 Prompt Contract 变成稳定的受控 Scheduled Content Workflow。

退出条件：每日任务能创建内容分支/PR、通过 Guard/Preview、失败可观察，同时不拥有发布基础设施写权限。

## 9. 明确暂不建设

当前继续不建设：

- 数据库 / CMS / 服务端 Runtime；
- 登录、用户账户、收藏与个性化推荐；
- 可视化 Slide Editor；
- 自动信任评分或事实真伪判定系统；
- Citation graph database；
- Source / Author 独立目录与反向内容聚合；
- Source metadata 注入 Slidev 或 RSS；
- 复杂搜索服务。

这些能力只有在真实产品使用证据出现后才重新立项。
