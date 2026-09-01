# 40 · Source & Author Registry

> 状态：In Progress · 40A Done / 40B Main Integration Recovery
> Roadmap Milestone：D — Knowledge Identity
> 当前基线：`main@4dc69ad2ac24d3e6b0c301b70809327aeae754ab`
> 40A：PR #15 已合并 `main`
> 40B：stacked PR #16 实现与 Preview 完成，但被合并到旧 feature base；PR #18 正在重新集成到 `main`
> 下一动作：PR #18 Build / Trusted Preview → 合并 → main / Pages 验证 → Plan 40 Done
> 建议优先级：P1
> 依赖：Plan 10、20、30 已完成

## 1. 目标

把内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，使 Orbis 的知识关系不再依赖拼写一致性。

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

Plan 40 分为两个独立交付层：

- **40A Identity + Integrity**：已经进入 `main`；
- **40B Registry Consumption UI**：实现和 Preview 已完成，当前只剩正确进入 `main` 的集成恢复。

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

## 4. Source Registry

Source Schema：

```yaml
name: GitHub
homepage: https://github.com/
type: official
trustTier: primary
status: active

# optional
feed: https://example.com/rss.xml
aliases:
  - github-docs
description: GitHub official product, repository and documentation source.
```

Required：

- `name`；
- `homepage`；
- `type`: `official | publisher | individual | community | aggregator`；
- `trustTier`: `primary | secondary | discovery`；
- `status`: `active | archived`。

Optional：`feed`、唯一 lowercase-kebab-case `aliases`、`description`。

`trustTier` 只是编辑治理元数据，不代表机器自动证明来源真实或可信。

## 5. Author Registry

Author Schema：

```yaml
name: XiaoDaoJiang
status: active

# optional
url: https://github.com/XiaoDaoJiang
bio: Orbis author and maintainer.
```

Required：`name`、`status: active | archived`。

Optional：`url`、`bio`。Author 不强制拥有公开 URL。

## 6. 引用合同

Reference 继续引用具体材料：

```yaml
references:
  - title: GitHub Pages custom workflows
    url: https://docs.github.com/...
    source: github
    supports: 支持 GitHub Actions Pages 构建模型
```

`source` 只是 Registry ID。没有 `source` 的 Reference 保持合法，也不得在 UI 中伪造 Source metadata。

## 7. 40A · Registry + Referential Integrity · Done on main

PR #15 已于 `main@4dc69ad2` 合并完成。

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

40A 的 `content:validate` 对全部结构化内容执行关系校验，不只检查 published 内容；错误包含内容路径、字段路径、关系类型和缺失 ID，并按稳定顺序聚合。

## 8. 40B · Registry-backed Content UI · Implementation Complete

40B head：`56a89d2259b0489a61ca2a867a06740f5c2de2eb`。

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
- [x] read-only Build、Artifact、Trusted Public Preview。

40B 明确不展示新的 section-level Astro citation 密度，不修改 Slidev Source metadata，也不改变 RSS / Archive / Topic 的内容身份。

## 9. Stacked Merge 偏差与恢复

原计划要求：

```text
merge PR #15 -> main
retarget PR #16 -> main
verify 16-file UI diff
merge PR #16 -> main
```

实际发生：PR #16 在 base 仍为 `feat/source-author-registry-integrity` 时被合并。GitHub 因此把 #16 标记为 merged，但只更新了旧 feature branch，`main` 仍停在 PR #15。

恢复路径：

```text
PR #15 -> main                         Done
PR #16 -> old feature base             Merged, but not delivered to main
stale duplicate PR #17                 Closed
PR #18: exact 40B head -> main          Current
fresh main-targeted Build / Preview     Required
merge PR #18                            Pending
main / Pages verification               Pending
```

PR #18 相对当前 `main` 的预期 diff 是 12 commits ahead / 1 merge commit behind、16 个 40B 文件；共同 merge-base 是已经进入 `main` 的 40A final head，因此不应重新引入 40A Schema 或 integrity 变更。

## 10. Agent Governance

`content-agent` Path Guard allowlist 不包含：

```text
content/sources/
content/authors/
```

Scheduled Agent 可以引用已注册 active ID，但不得自行创建、改名、archive 或修改 Registry。新增 Registry identity 需要人工评审。

## 11. 非目标

- 自动信任评分或事实真实性判定；
- Citation graph database；
- Source / Author 反向内容聚合；
- Source / Author Directory UI；
- ORCID / Google Scholar 集成；
- 用户账号体系；
- aliases 自动关系解析；
- Git-history-aware archived warning；
- Source metadata 注入 Slidev 或 RSS。

## 12. Plan 40 完成条件

### 已满足

- [x] Source / Author 严格 Schema 与 canonical ID；
- [x] Author、Source、Topic relation 完整性；
- [x] invalid / duplicate / nested Registry 使 Build 失败；
- [x] archived identity 历史可解析；
- [x] Agent 默认不能修改 Registry；
- [x] Registry-backed Author / Reference UI 已实现并通过独立 Preview；
- [x] unsourced / archived / linked / unlinked 展示语义明确；
- [x] 不新增 Registry 路由；
- [x] Daily / Weekly / Talk、RSS、Archive、Topic 无功能回归。

### 尚未满足

- [ ] PR #18 完成 fresh main-targeted Build 与 Trusted Preview；
- [ ] PR #18 合并 `main`；
- [ ] 合并后 `main` / GitHub Pages 验证；
- [ ] Roadmap 将 Plan 40 标记 Done，并推进 Plan 50。
