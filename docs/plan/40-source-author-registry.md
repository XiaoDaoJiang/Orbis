# 40 · Source & Author Registry

> 状态：In Progress · Main Integration Done / Production Pages Verification Pending
> Roadmap Milestone：D — Knowledge Identity
> 当前基线：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 40A：PR #15 已合并 `main`
> 40B：最终通过 PR #19 正确合并 `main`
> 历史恢复：stacked PR #16 合并到旧 feature base；#17、#18 已关闭并保留审计记录
> 主分支验证：Orbis Site Build run `33489504298` Passed
> 下一动作：手动执行 `pages-production.yml`，`deploy: true` → GitHub Pages smoke → Plan 40 Done
> 建议优先级：P1
> 依赖：Plan 10、20、30 已完成

## 1. 目标

把内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，使 Orbis 的知识关系不再依赖拼写一致性，并让现有 Astro Reading 页面安全消费这些稳定身份。

```text
content/**
    ↓
per-file Schema
    ↓
Topic / Source / Author relation validation
    ↓
Registry-backed Reading UI
    ↓
Astro / Slidev / RSS / Archive
```

Plan 40 的两个交付层都已经进入 `main`：

- **40A Identity + Integrity**：PR #15；
- **40B Registry Consumption UI**：PR #19。

当前只剩 Production Pages deploy/smoke 门，因此暂不把整个 Milestone D 标记为 Done。

## 2. 已确认的产品合同

1. Source / Author canonical ID 来自扁平文件名与 Astro `entry.id`，YAML 不重复声明 `id`。
2. ID 必须匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。
3. `Reference.source` 可省略；一旦声明，必须解析到 Source Registry。
4. Essay `authors[]` 全量强校验，必须解析到 Author Registry。
5. Brief / Presentation / Essay / Knowledge 的 `topics[]`、Weekly `trendMovements[].topic` 与 Topic `related[]` 必须解析到 Topic Registry。
6. archived Source / Author 保持历史引用合法，不因状态变化破坏旧内容。
7. Scheduled Content Agent 可以使用已注册 active ID，但不能创建或修改 Source / Author Registry。
8. 第一版只 enrich 现有 Reading UI，不新增 `/sources/`、`/authors/` 路由或反向聚合。
9. 缺失 Author / Source 即使绕过 `content:validate` 直接执行 `build:web`，也必须显式失败。
10. Slidev、RSS、Archive、Topic、Related Content 的现有语义不因 Registry UI 改变。

## 3. Canonical Identity

```text
content/sources/astro.yaml          -> source ID: astro
content/sources/github.yaml         -> source ID: github
content/sources/slidev.yaml         -> source ID: slidev
content/authors/xiaodaojiang.yaml   -> author ID: xiaodaojiang
```

不允许嵌套 Registry 路径，也不允许同一 canonical ID 同时存在 `.yaml` 与 `.yml` 变体。

## 4. Source / Author Registry

Source Required：`name`、`homepage`、`type`、`trustTier`、`status`；可选 `feed`、`aliases`、`description`。

Author Required：`name`、`status`；可选 `url`、`bio`。

`trustTier` 是编辑治理元数据，不代表机器自动证明来源真实或可信。

Reference 继续保留具体材料 URL 与 title；`source` 只保存 Registry ID。没有 `source` 的 Reference 仍合法，UI 不得推断或伪造来源。

## 5. 40A · Registry + Referential Integrity · Done on main

PR #15 merge commit：`4dc69ad2ac24d3e6b0c301b70809327aeae754ab`。

已提供：

- [x] `sourceSchema` / `authorSchema`；
- [x] canonical filename ID contract；
- [x] 初始 Source：astro / github / slidev；
- [x] 初始 Author：xiaodaojiang；
- [x] Astro Source / Author Collections；
- [x] Brief / Presentation / Essay / Knowledge Topic relation；
- [x] Weekly trend Topic relation；
- [x] Topic.related 与 self-reference 校验；
- [x] Essay Author relation；
- [x] 顶层 / section / archivePick Source relation；
- [x] invalid / duplicate / nested Registry 负向合同；
- [x] archived 与 unsourced Reference 兼容；
- [x] scheduled-agent Registry 写入限制；
- [x] 完整 Build 与 Trusted Public Preview。

## 6. 40B · Registry-backed Content UI · Done on main

40B validated head：`56a89d2259b0489a61ca2a867a06740f5c2de2eb`。

最终 main integration：PR #19 → merge commit `0c867438fc6cac83b6f97b76cb55e29118b64b87`。

已实现并验证：

- [x] 纯 Astro build-time Registry resolver；
- [x] Author 声明顺序保持；
- [x] duplicate / unknown Web Registry ID 显式失败；
- [x] `AuthorByline.astro`；
- [x] `ReferenceList.astro`；
- [x] Essay Author 名称、optional profile 与 archived 状态；
- [x] Source 名称、homepage、type、trustTier、status；
- [x] Daily / Weekly / Ad-hoc 顶层 References；
- [x] Essay / Knowledge frontmatter References；
- [x] source-less Reference 不产生 synthetic metadata；
- [x] Knowledge 无 Reference 时不渲染空区块；
- [x] direct `build:web` missing Author / Source 防御；
- [x] 不新增 Source / Author 路由；
- [x] RSS、Archive、Topic、Related、Slidev 与 Daily latest 回归通过；
- [x] PR #19 fresh read-only Build、Artifact、Trusted Preview；
- [x] 合并后主分支 Orbis Site Build run `33489504298` 通过。

## 7. Stacked Merge 偏差与最终恢复

原计划要求 PR #15 合并后把 PR #16 retarget 到 `main`。实际 #16 在旧 feature base 上被合并，因此只更新了 `feat/source-author-registry-integrity`，没有进入 `main`。

最终恢复记录：

```text
PR #15 -> main                         Done
PR #16 -> old feature base             Historical stacked merge only
stale duplicate PR #17                 Closed
Draft recovery PR #18                  Closed / superseded
PR #19 exact 40B head -> main          Done
main Site Build                         Passed
Production Pages deploy / smoke         Pending manual workflow dispatch
```

PR #18 因 GitHub connector 的 Ready-for-review GraphQL schema incompatibility 无法退出 Draft；GitHub merge endpoint 正确拒绝 Draft PR。为保持治理边界，没有绕过 Draft 规则，而是关闭 #18，并创建同 head / 同 main base 的非 Draft PR #19，重新获得 fresh Build + Trusted Preview 后再合并。

## 8. Agent Governance

`content-agent` Path Guard allowlist 不包含：

```text
content/sources/
content/authors/
```

Scheduled Agent 可以引用已注册 active ID，但不得自行创建、改名、archive 或修改 Registry。新增 Registry identity 需要人工评审。

## 9. 非目标

- 自动信任评分或事实真实性判定；
- Citation graph database；
- Source / Author 反向内容聚合；
- Source / Author Directory UI；
- ORCID / Google Scholar 集成；
- 用户账号体系；
- aliases 自动关系解析；
- Git-history-aware archived warning；
- Source metadata 注入 Slidev 或 RSS。

## 10. Plan 40 完成条件

### 已满足

- [x] Source / Author 严格 Schema 与 canonical ID；
- [x] Author、Source、Topic relation 完整性；
- [x] invalid / duplicate / nested Registry 使 Build 失败；
- [x] archived identity 历史可解析；
- [x] Agent 默认不能修改 Registry；
- [x] Registry-backed Author / Reference UI；
- [x] unsourced / archived / linked / unlinked 展示语义明确；
- [x] 不新增 Registry 路由；
- [x] Daily / Weekly / Talk、RSS、Archive、Topic 无功能回归；
- [x] 40A / 40B 都已经进入 `main`；
- [x] merge 后主分支 Build 成功。

### 尚未满足

- [ ] 手动运行 `pages-production.yml`，输入 `deploy: true`；
- [ ] GitHub Pages deploy job 成功；
- [ ] Production smoke 通过 `/`、`/latest/`、`/archive.json`、`/rss.xml`、`/favicon.svg` 与 latest Daily route；
- [ ] Roadmap 将 Plan 40 标记 Done，并推进 Plan 50。
