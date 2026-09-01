# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-01
> 基线提交：`main@4dc69ad2ac24d3e6b0c301b70809327aeae754ab`
> 当前目标：Milestone D — Knowledge Identity / 40B Main Integration Recovery

## 1. 当前阶段判断

Orbis 已经完成并进入 `main`：

- Astro + Slidev pnpm Monorepo Foundation；
- Structured Content + Zod Schema；
- Daily Brief → Astro Reading + 固定 11 页 `daily-v1` + RSS；
- Archive / Slides / Daily / Weekly Discovery 与跨内容导航；
- Homepage Latest Brief / Essay / Presentation / Knowledge / Topics discovery；
- source-neutral Presentation Descriptor + Template Registry；
- `content/presentations/**` + standalone `talk-v1`；
- Weekly 专属 Schema、Reading、`weekly-v1`；
- Daily + Weekly + Talk 同仓库自动发现、生成、构建与验证；
- Daily-only `/YYYY/MM/DD/`、`/latest/` 与生成型 `/archive.json`；
- Path Guard + CODEOWNERS + scheduled-agent 内容边界；
- read-only PR Build → Trusted Preview Publish → Public Smoke；
- GitHub Pages Production Cutover；
- Legacy HTML / Archive compatibility 完全退役；
- Plan 40A Source / Author Registry + Topic / Source / Author Referential Integrity。

当前 `main` 为 `4dc69ad2`，即 PR #15 的 merge commit。Plan 40B 的实现与独立 Preview 已完成，但 stacked PR #16 在仍以旧 feature branch 为 base 时被合并，因此 GitHub 显示 #16 merged，而其 UI 变更没有进入 `main`。

当前恢复链路：

```text
40A / PR #15 -> main                  Done
40B / PR #16 -> old feature base      Merged, not delivered to main
stale duplicate PR #17                Closed
40B recovery / PR #18 -> main         Current
fresh Build + Trusted Preview         Required
merge #18 + verify main / Pages       Pending
Plan 40 Done -> Plan 50               Next
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
    ├── Reading
    ├── Presentation
    ├── Topic / Source / Author metadata
    ├── Durable Knowledge
    └── RSS
```

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
 Referential Integrity
 Topic / Source / Author
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

40B 在不改变内容身份和构建图的前提下，为 Astro Reading 增加：

```text
Essay authors[] -> AuthorByline
Reference.source -> ReferenceList Source metadata
```

核心约束：

- `content/**` 是唯一可发布内容源；
- Astro 与 Slidev 共享内容合同，不共享 Runtime UI；
- Agent 是 Content Contributor，不是 UI / Infra Maintainer；
- 生成文件不反向成为内容源；
- 生产只发布经过完整 Build 与 Smoke 的 `dist/site`；
- Daily latest/date contract 与通用 Brief/Presentation discovery 分离；
- Source / Author Registry 由人工治理；
- Source / Author metadata 只 enrich 现有 Reading UI，不建立目录产品。

## 4. 能力状态

| 能力 | 当前状态 | 已提供 |
|---|---|---|
| Monorepo / Build Foundation | Done | Astro + Slidev + pnpm Workspace |
| Structured Content | Done | Brief、Essay、Knowledge、Topic、Presentation、Source、Author |
| Daily Brief | Done / Mature | Reading、11 页 Slides、RSS、Previous/Next、Date/Latest/Archive |
| Weekly Brief | Done / First Release | Weekly Schema、Reading、7..11 页 Slides、RSS/Archive/Topic |
| Standalone Presentation | Done / Basic | `content/presentations/**` + `talk-v1` |
| Presentation Platform | Done | Descriptor、Template Registry、Daily/Weekly/Talk mixed build |
| Archive / Discovery / Navigation | Done / Mature | Homepage、Archive、Slides、cadence indexes、Related |
| Topic | Done / Basic | Topic entity、visibility、relations、public aggregation |
| Knowledge | Done / Basic | status、`reviewAt`、Topic、References、Related |
| RSS input | Partial | feeds + Agent contract；缺 Scheduled Orchestration |
| RSS output | Done | `/rss.xml` 聚合公开 Reading 内容 |
| Source / Author Registry 40A | Done on main | canonical IDs、Schema、Collections、Referential Integrity、Governance |
| Registry-backed Reading UI 40B | Integration Gate | 实现/Preview完成；PR #18 正在进入 main |
| SEO / Sharing | Partial | title/description/favicon/RSS discovery；缺 canonical/OG/Sitemap/JSON-LD |
| Knowledge Lifecycle | Planned | 缺 review/expiry tooling 与页面状态 |

## 5. 当前成熟度

| 层级 | 评估 |
|---|---:|
| Monorepo / Build Foundation | 95% |
| Structured Content Architecture | 94% |
| Daily Brief Pipeline | 94% |
| Weekly Brief Pipeline | 85% |
| Presentation Platform | 90% |
| Astro + Slidev 双输出 | 95% |
| CI / Preview / Pages / Governance | 95% |
| Archive / Discovery / Navigation | 92% |
| Essay / Knowledge / Topic | 80% |
| Source / Author Identity + Integrity | 95% |
| Registry-backed Reading UI | 90% · implementation complete, main integration pending |
| RSS | 75% |
| SEO / Sharing | 30% |
| 完整 Orbis 内容产品 | 约 86% |

成熟度只用于路线判断，后续以真实内容规模、关系完整性、构建验证和日常使用体验替代主观百分比。

## 6. 已形成的产品闭环

### Daily

```text
Research -> Daily YAML -> dailyBriefSchema
  -> Reading / 11-slide Presentation
  -> Previous / Next / Related
  -> RSS / Topic / Archive
  -> Daily-only date / latest / archive.json
```

### Weekly

```text
Cross-time judgment -> Weekly YAML -> weeklyBriefSchema
  -> Weekly Reading / 7..11-slide Presentation
  -> RSS / Topic / Archive
  -> no Daily stable alias
```

### Standalone Presentation

```text
Presentation YAML -> presentationContentSchema
  -> PresentationDescriptor -> talk-v1 -> /slides/<slug>/
```

### Knowledge Identity

```text
Source / Author / Topic files
  -> canonical IDs
  -> repository-wide relation validation
  -> Author / Reference metadata in Reading UI
```

## 7. Product Capability Roadmap

### Milestone A — Discoverable Orbis · Done

Plan 10，PR #8 / #9 / #10。

### Milestone B — Presentation Platform · Done

Plan 20，PR #11 / #12。

### Milestone C — Weekly Intelligence · Done

Plan 30，PR #13 / #14。

### Milestone D — Knowledge Identity · Main Integration Gate

Plan 40。

- **40A Registry + Referential Integrity — Done on main，PR #15**：Source/Author canonical identity、Schema、Collections、Topic/Source/Author relation validation、Agent governance。
- **40B Registry-backed Content UI — Implementation/Preview complete**：Essay Author byline、Brief/Essay/Knowledge Source metadata、archived/unsourced/direct-build 语义。
- **Delivery recovery — PR #18 Current**：将 exact 40B head 正确集成到 `main`，重新执行 main-targeted Build 与 Trusted Preview。

退出前剩余：

1. PR #18 Build / Preview；
2. 合并 PR #18；
3. 验证 main / GitHub Pages；
4. 将 Plan 40 标记 Done。

### Milestone E — Search & Share Ready · Planned / Next

Plan 50。

目标：让 Astro Reading 成为公开网络中的 canonical 入口，并让 OG / JSON-LD 消费稳定的内容、Author 与 Source identity。

退出条件：canonical、Open Graph、Twitter Card、Sitemap、基础 JSON-LD 均由构建自动生成并验证。

### Milestone F — Durable Knowledge · Planned

Plan 60。让 Knowledge 具备待复查、过期、needs-review 与清晰更新路径。

### Milestone G — Sustainable Automation · Planned

Plan 70。让 Scheduled Agent 创建结构化内容分支/PR，经过 Guard/Preview，并保持最小权限和可观察失败。

## 8. 当前不建设

- 数据库 / CMS / 服务端 Runtime；
- 登录、收藏和个性化推荐；
- 可视化 Slide Editor；
- 自动信任评分或真实性判定；
- Citation graph database；
- Source / Author 独立目录与反向聚合；
- Source metadata 注入 Slidev 或 RSS；
- 复杂搜索服务。
