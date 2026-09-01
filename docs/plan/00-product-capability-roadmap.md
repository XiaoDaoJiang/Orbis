# 00 · Orbis Product Capability Roadmap

> 状态：Active
> 基线日期：2026-09-01
> 基线提交：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 当前目标：Milestone D — Knowledge Identity / Production Pages Verification

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
- Plan 40A Source / Author Registry + Topic / Source / Author Referential Integrity；
- Plan 40B Registry-backed Essay Author / Reference Source Reading UI。

Plan 40B 最终通过 PR #19 正确合并到 `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`。PR #19 使用 exact 40B head `56a89d2259b0489a61ca2a867a06740f5c2de2eb`，拥有独立 fresh PR Build、Artifact 与 Trusted Preview；合并后的主分支 `Orbis Site Build` run `33489504298` 也已成功。

当前只剩生产发布门：`pages-production.yml` 是显式 `workflow_dispatch`，只有 `deploy: true` 才执行 GitHub Pages deploy 与公网 smoke，因此在该门完成前 Milestone D 保持 In Progress。

恢复链路已经收口：

```text
40A / PR #15 -> main                  Done
40B / PR #16 -> old feature base      Historical stacked merge only
stale duplicate PR #17                Closed
Draft recovery PR #18                 Closed / superseded
final recovery PR #19 -> main         Done
main Site Build                        Passed
Production Pages deploy / smoke        Pending manual dispatch
Plan 40 Done -> Plan 50                Next
```

## 2. 产品定义

Orbis 是一个面向长期积累的 Git-native、Agent-native 结构化技术知识发布系统：Agent 负责发现、研究和生产受 Schema 约束的内容，Astro、Slidev 与 GitHub Actions 将同一知识源转化为阅读、演示、订阅、聚合和长期归档。

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

Plan 40B 在不改变内容身份和构建图的前提下，为 Astro Reading 增加：

```text
Essay authors[]    -> Author Registry -> AuthorByline
Reference.source   -> Source Registry -> ReferenceList metadata
```

核心约束继续保持：

- `content/**` 是唯一可发布内容源；
- Astro 与 Slidev 共享内容合同，不共享 Runtime UI；
- Agent 是 Content Contributor，不是 UI / Infra Maintainer；
- 生成文件不反向成为内容源；
- Daily latest/date contract 与通用 Brief/Presentation discovery 分离；
- Source / Author Registry 由人工治理；
- Source / Author metadata 只 enrich 现有 Reading UI，不建立目录产品；
- Production Pages 只通过受控 deploy workflow 发布。

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
| Registry-backed Reading UI 40B | Done on main | AuthorByline、Source metadata、archived/unsourced/direct-build contracts |
| Main Build after Plan 40 | Done | run `33489504298` passed |
| Production Pages verification | Pending | manual `pages-production.yml` deploy + smoke |
| SEO / Sharing | Partial | title/description/favicon/RSS discovery；缺 canonical/OG/Sitemap/JSON-LD |
| Knowledge Lifecycle | Planned | 缺 review/expiry tooling 与页面状态 |

## 5. Product Capability Roadmap

### Milestone A — Discoverable Orbis · Done
Plan 10，PR #8 / #9 / #10。

### Milestone B — Presentation Platform · Done
Plan 20，PR #11 / #12。

### Milestone C — Weekly Intelligence · Done
Plan 30，PR #13 / #14。

### Milestone D — Knowledge Identity · Production Verification Gate
Plan 40。

- **40A Registry + Referential Integrity — Done on main，PR #15**。
- **40B Registry-backed Content UI — Done on main，PR #19**。
- PR #16 仅保留 stacked merge 历史；#17、#18 已关闭并有恢复审计记录。
- `main@0c867438` Site Build 已通过。
- 剩余唯一退出条件：Production Pages `deploy: true` + smoke 成功。

### Milestone E — Search & Share Ready · Planned / Next
Plan 50。让 Astro Reading 成为公开网络中的 canonical 入口，并让 OG / JSON-LD 消费稳定的内容、Author 与 Source identity。

### Milestone F — Durable Knowledge · Planned
Plan 60。让 Knowledge 具备待复查、过期、needs-review 与清晰更新路径。

### Milestone G — Sustainable Automation · Planned
Plan 70。让 Scheduled Agent 创建结构化内容分支/PR，经过 Guard/Preview，并保持最小权限和可观察失败。

## 6. 当前不建设

- 数据库 / CMS / 服务端 Runtime；
- 登录、收藏和个性化推荐；
- 可视化 Slide Editor；
- 自动信任评分或真实性判定；
- Citation graph database；
- Source / Author 独立目录与反向聚合；
- Source metadata 注入 Slidev 或 RSS；
- 复杂搜索服务。
