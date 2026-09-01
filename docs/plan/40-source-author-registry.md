# 40 · Source & Author Registry

> 状态：In Progress
> Roadmap Milestone：D — Knowledge Identity
> 当前基线：`main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`
> 当前子阶段：40A — Registry + Referential Integrity
> 当前实现：PR #15
> 建议优先级：P1
> 依赖：Plan 10、20、30 已完成

## 1. 目标

把当前内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，使 Orbis 的知识关系不再依赖拼写一致性。

核心目标不是“多建两个目录”，而是建立最小、可持续的 Referential Integrity：

```text
content/**
    ↓
per-file Schema
    ↓
Topic / Source / Author relation validation
    ↓
Astro / Slidev / RSS / Archive
```

## 2. 已确认的产品决策

1. Source / Author canonical ID 来自扁平文件名与 Astro `entry.id`；YAML 不重复声明 `id`。
2. ID 统一匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。
3. `Reference.source` 可省略；一旦声明，必须解析到 Source Registry。
4. Essay `authors[]` 全量强校验，必须解析到 Author Registry。
5. Brief / Presentation / Essay / Knowledge 的 `topics[]`、Weekly `trendMovements[].topic` 与 Topic `related[]` 必须解析到 Topic Registry。
6. archived Source / Author 继续允许历史内容引用，不因状态变化破坏旧内容。
7. Scheduled Content Agent 可以使用已注册 active ID，但不能创建或修改 Source / Author Registry。
8. 第一版只 enrich 现有内容页，不新增 `/sources/`、`/authors/` 目录或详情路由。

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

没有 `source` 的 Reference 仍然合法：

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

构建期错误必须包含内容路径、字段路径、关系类型和缺失 ID，例如：

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
- 不要求批量重写旧内容；
- 第一版不实现基于 Git diff 的“新增 archived relation” warning。

## 8. Astro 与产品展示

Source / Author 注册为 Astro Content Collections，供构建期消费。

第一版不创建：

```text
/sources/
/sources/:id/
/authors/
/authors/:id/
```

40B 只在现有页面展示：

- Essay Author display name、可选 profile URL、状态；
- Reference Source name / type / trustTier / status；
- 无 source 的 Reference 保持原显示。

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

## 10. 实现拆分

### 40A — Registry + Referential Integrity · Current

PR #15：`feat: add source and author registry integrity`

范围：

- [x] `sourceSchema` / `authorSchema`；
- [x] canonical filename ID contract；
- [x] 初始 Source：astro / github / slidev；
- [x] 初始 Author：xiaodaojiang；
- [x] Astro Source / Author collections；
- [x] Topic / Source / Author 跨文件校验；
- [x] invalid / duplicate / nested / missing relation 负向合同；
- [x] archived 与 unsourced Reference 正向合同；
- [x] Agent governance；
- [ ] PR #15 合并 main。

40A 不修改 Reading UI，不新增 Source/Author 路由。

### 40B — Registry-backed Content UI · Next

建议 PR：

```text
feat: render registry-backed author and source metadata
```

范围：

- [ ] Essay Author byline；
- [ ] 共享 Reference rendering component；
- [ ] Daily / Weekly / Ad-hoc Reading Source metadata；
- [ ] Essay / Knowledge Reference Source metadata；
- [ ] archived 状态显示；
- [ ] unsourced Reference 兼容；
- [ ] artifact / Preview 验证；
- [ ] 不新增 Registry 路由。

40B 必须建立在已合并的 40A identity contract 上，不重新定义 canonical IDs 或校验规则。

## 11. 非目标

- 自动信任评分模型；
- 来源真实性自动判定；
- Citation graph database；
- Source/Author 反向内容聚合；
- Source/Author Directory UI；
- ORCID / Google Scholar 集成；
- 用户账号体系；
- aliases 自动关系解析；
- Git-history-aware archived warnings。

## 12. Plan 40 验收标准

### 40A

- Source / Author 有严格 Schema 和唯一 canonical ID；
- 所有 Essay Author 均可解析；
- 所有声明 `source` 的 Reference 均可解析；
- 所有 Topic relation 均可解析；
- invalid / duplicate / nested Registry identity 会使 Build 失败；
- archived identity 保持历史可解析；
- Agent 默认不能修改 Source / Author Registry；
- Daily / Weekly / Talk、RSS、Archive 与 Preview 无回归。

### 40B / Milestone D 最终退出条件

- Essay 使用 Registry Author metadata；
- Reading References 使用 Registry Source metadata；
- unsourced 与 archived 显示语义明确；
- 不存在悬空 Topic / Source / Author relation；
- 不新增无真实需求的 Source / Author 目录系统；
- Plan 40 所有 PR 合并 main 并完成公网验证。
