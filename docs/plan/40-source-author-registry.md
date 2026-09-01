# 40 · Source & Author Registry

> 状态：In Progress · Implementation Complete / Ordered Merge Gate
> Roadmap Milestone：D — Knowledge Identity
> 当前基线：`main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`
> 当前实现：40A PR #15 + stacked 40B PR #16
> 下一动作：合并 #15 → 将 #16 retarget 到 `main` → 验证并合并 #16
> 建议优先级：P1
> 依赖：Plan 10、20、30 已完成

## 1. 目标

把当前内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，使 Orbis 的知识关系不再依赖拼写一致性。

核心目标不是“多建两个目录”，而是建立最小、可持续的 Knowledge Identity：

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

Plan 40 已完成全部实现与独立公网 Preview 验证，但尚未按顺序合并到 `main`，因此仍保持 In Progress。

## 2. 已确认并实现的产品决策

1. Source / Author canonical ID 来自扁平文件名与 Astro `entry.id`；YAML 不重复声明 `id`。
2. ID 统一匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。
3. `Reference.source` 可省略；一旦声明，必须解析到 Source Registry。
4. Essay `authors[]` 全量强校验，必须解析到 Author Registry。
5. Brief / Presentation / Essay / Knowledge 的 `topics[]`、Weekly `trendMovements[].topic` 与 Topic `related[]` 必须解析到 Topic Registry。
6. archived Source / Author 继续允许历史内容引用，不因状态变化破坏旧内容。
7. Scheduled Content Agent 可以使用已注册 active ID，但不能创建或修改 Source / Author Registry。
8. 第一版只 enrich 现有内容页，不新增 `/sources/`、`/authors/` 目录或详情路由。
9. 缺失 Author / Source 即使绕过 `content:validate` 直接执行 `build:web`，也必须显式失败而非降级为原始 ID。
10. Slidev、RSS、Archive、Topic 与 Related Content 不因 Registry UI 改变原有语义。

## 3. Canonical Identity

Registry 使用扁平目录：

```text
content/sources/astro.yaml          -> source ID: astro
content/sources/github.yaml         -> source ID: github
content/sources/slidev.yaml         -> source ID: slidev
content/authors/xiaodaojiang.yaml   -> author ID: xiaodaojiang
```

不允许：

```text
content/sources/github/docs.yaml
content/authors/team/xiaodaojiang.yaml
```

也不允许同一 ID 同时存在 `.yaml` 与 `.yml` 变体。

## 4. Source Registry

目录：

```text
content/sources/*.{yaml,yml}
```

第一版 Schema：

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

### 4.1 字段合同

Required：

- `name`；
- `homepage`；
- `type`：`official | publisher | individual | community | aggregator`；
- `trustTier`：`primary | secondary | discovery`；
- `status`：`active | archived`。

Optional：

- `feed`；
- `aliases`：唯一、同样使用 lowercase kebab-case；
- `description`。

`type` 描述来源形态，`trustTier` 只是编辑治理元数据，不代表机器自动证明可信。

## 5. Author Registry

目录：

```text
content/authors/*.{yaml,yml}
```

第一版 Schema：

```yaml
name: XiaoDaoJiang
status: active

# optional
url: https://github.com/XiaoDaoJiang
bio: Orbis author and maintainer.
```

Required：

- `name`；
- `status`：`active | archived`。

Optional：

- `url`；
- `bio`。

Author 不强制拥有公开 URL；身份核心是 canonical ID + name。

## 6. 引用合同

Reference 保留具体 URL 与标题，因为引用的是某份材料，而不是只引用来源实体：

```yaml
references:
  - title: GitHub Pages custom workflows
    url: https://docs.github.com/...
    source: github
    supports: 支持 GitHub Actions Pages 构建模型
```

`source` 只是 Registry ID，不嵌入整个 Source object。

没有 `source` 的 Reference 仍然合法，并在 Reading UI 中保持无 Source metadata：

```yaml
references:
  - title: Independent primary material
    url: https://example.com/material
    supports: 支持当前判断
```

## 7. Referential Integrity

### 7.1 校验范围

验证全部结构化内容，不只验证 `published`：

- Brief `topics[]`；
- Presentation `topics[]`；
- Essay `topics[]`；
- Knowledge `topics[]`；
- Weekly `trendMovements[].topic`；
- Topic `related[]`；
- Essay `authors[]`；
- 顶层 References；
- `sections[].references`；
- Daily / Ad-hoc `archivePicks`。

### 7.2 失败语义

构建期错误包含内容路径、字段路径、关系类型和缺失 ID，例如：

```text
Invalid relation: content/essays/example.md: authors[0] -> missing author "unknown-author"
Invalid relation: content/briefs/example.yaml: sections[1].references[0].source -> missing source "unknown-source"
Invalid relation: content/knowledge/example.md: topics[0] -> missing topic "unknown-topic"
Invalid relation: content/topics/example.yaml: related[0] -> topic "example" cannot reference itself
Duplicate registry ID: source "github"
```

独立错误按稳定顺序聚合后一次输出。

### 7.3 archived 策略

`status: archived` 表示不建议新内容继续采用，但 canonical identity 仍存在：

- 历史 Source 引用继续通过；
- 历史 Essay Author 继续通过；
- Reading UI 显示明确 archived 标记；
- 不要求批量重写旧内容；
- 第一版不实现基于 Git diff 的“新增 archived relation” warning。

## 8. Registry-backed Reading UI

40B 已实现构建期 Registry 消费：

```text
Essay authors[]
    ↓
AuthorByline
    ↓
name + optional profile + status

Reference.source
    ↓
ReferenceList
    ↓
Source name + homepage + type + trustTier + status
```

已覆盖：

- Essay Author byline；
- Daily / Weekly / Ad-hoc 顶层 References；
- Essay frontmatter References；
- Knowledge frontmatter References；
- active / archived Author；
- linked / unlinked Author；
- active / archived Source；
- unsourced Reference；
- 直接 `build:web` 时 unknown Author / Source 明确失败。

未新增：

```text
/sources/
/sources/:id/
/authors/
/authors/:id/
```

Section-level References 继续用于事实依据、关系校验和 Slide rendering，本轮没有增加新的 Astro 展示密度。

## 9. Agent Governance

`content-agent` Path Guard allowlist 不加入：

```text
content/sources/
content/authors/
```

Agent Contract 明确：

- 可以使用已经注册并 active 的 ID；
- 不得自行创建、改名、archive 或修改 Registry；
- 新 Registry identity 必须进入人工评审；
- generated Slidev / Web artifact 继续禁止提交。

## 10. 实现与验证状态

### 40A — Registry + Referential Integrity · Implementation Complete

PR #15：`feat: add source and author registry integrity`

- [x] `sourceSchema` / `authorSchema`；
- [x] canonical filename ID contract；
- [x] 初始 Source：astro / github / slidev；
- [x] 初始 Author：xiaodaojiang；
- [x] Astro Source / Author collections；
- [x] Topic / Source / Author 跨文件校验；
- [x] invalid / duplicate / nested / missing relation 负向合同；
- [x] archived 与 unsourced Reference 正向合同；
- [x] Agent governance；
- [x] 完整 `pnpm build`；
- [x] Trusted Public Preview；
- [ ] 合并 PR #15 到 `main`。

Final head：`97056620da87f9f2e939f6f45f07c62185d4c4c1`。

### 40B — Registry-backed Content UI · Implementation Complete / Stacked

PR #16：`feat: render registry-backed author and source metadata`

- [x] 纯 Web Registry resolver；
- [x] Essay Author byline；
- [x] 共享 Reference rendering component；
- [x] Daily / Weekly / Ad-hoc Reading Source metadata；
- [x] Essay / Knowledge Reference Source metadata；
- [x] archived 状态显示；
- [x] linked / unlinked Author；
- [x] unsourced Reference 兼容；
- [x] direct `build:web` missing-ID defense；
- [x] artifact / Preview 验证；
- [x] 不新增 Registry 路由；
- [ ] PR #15 合并后将 #16 retarget 到 `main`；
- [ ] 确认 retarget 后 diff / CI；
- [ ] 合并 PR #16 到 `main`。

Final stacked head：`56a89d2259b0489a61ca2a867a06740f5c2de2eb`。

## 11. 有序合并协议

Plan 40 不能把 stacked PR #16 直接先合并到 feature base。正确顺序：

```text
1. Merge PR #15 -> main
2. Retarget PR #16 from feat/source-author-registry-integrity to main
3. Confirm GitHub recalculates #16 as the 16-file UI-only diff
4. Confirm/re-run latest CI and Trusted Preview if GitHub emits a new merge base
5. Merge PR #16 -> main
6. Verify main/Pages, mark Plan 40 Done, advance to Plan 50
```

## 12. 非目标

- 自动信任评分模型；
- 来源真实性自动判定；
- Citation graph database；
- Source/Author 反向内容聚合；
- Source/Author Directory UI；
- ORCID / Google Scholar 集成；
- 用户账号体系；
- aliases 自动关系解析；
- Git-history-aware archived warnings；
- Source metadata 注入 Slidev 或 RSS。

## 13. Plan 40 验收状态

### 已满足

- [x] Source / Author 有严格 Schema 和唯一 canonical ID；
- [x] 所有 Essay Author 均可解析；
- [x] 所有声明 `source` 的 Reference 均可解析；
- [x] 所有 Topic relation 均可解析；
- [x] invalid / duplicate / nested Registry identity 会使 Build 失败；
- [x] archived identity 保持历史可解析并可显示；
- [x] Agent 默认不能修改 Source / Author Registry；
- [x] Essay 使用 Registry Author metadata；
- [x] Reading References 使用 Registry Source metadata；
- [x] unsourced 与 archived 显示语义明确；
- [x] 不新增 Source / Author 目录系统；
- [x] Daily / Weekly / Talk、RSS、Archive 与 Preview 无回归；
- [x] 40A 与 40B 均完成独立 Public Preview。

### 尚未满足

- [ ] PR #15 合并 `main`；
- [ ] PR #16 retarget 并合并 `main`；
- [ ] 合并后主分支 / GitHub Pages 最终验证；
- [ ] Plan 40 标记 Done 并推进 Plan 50。
