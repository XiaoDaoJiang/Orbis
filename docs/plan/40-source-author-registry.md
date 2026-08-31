# 40 · Source & Author Registry

> 状态：Planned
> Roadmap Milestone：D — Knowledge Identity
> 建议优先级：P1
> 依赖：Plan 10；可与 Plan 30 并行

## 1. 目标

把当前内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，使 Orbis 的知识关系不再依赖拼写一致性。

核心目标不是“多建两个目录”，而是建立最小 Referential Integrity。

## 2. 当前问题

当前 Reference 已经包含：

- title；
- url；
- source（可选字符串）；
- supports；
- accessedAt。

Essay 也有 authors 字符串数组。

问题是：

- `source: github`、`source: GitHub`、`source: github-docs` 可以自由分叉；
- Author 没有稳定 profile；
- Topic、Source、Author 的关系无法在 CI 中整体校验；
- 聚合页无法可靠展示来源元数据和作者信息。

## 3. 新增内容实体

### 3.1 Sources

新增：

```text
content/sources/**
```

建议第一版 Schema：

```yaml
id: github
name: GitHub
homepage: https://github.com/
type: official
trustTier: primary
status: active
```

可选字段：

- feed；
- aliases；
- description。

`type` 与 `trustTier` 必须使用枚举，不使用自由文本。

### 3.2 Authors

新增：

```text
content/authors/**
```

建议第一版字段：

```yaml
id: xiaodaojiang
name: XiaoDaoJiang
url: https://github.com/XiaoDaoJiang
bio: ...
status: active
```

不需要第一版就建立复杂社交 profile。

## 4. 引用合同

Reference 保留具体 URL 和 title，因为引用的是具体材料，而不是只引用 Source Entity。

建议：

```yaml
references:
  - title: GitHub Pages custom workflows
    url: https://docs.github.com/...
    source: github
    supports: 支持 GitHub Actions Pages 构建模型
```

其中 `source` 一旦存在，必须解析到 `content/sources/<id>`。

Essay `authors` 同理必须解析到 Author Registry。

## 5. Referential Integrity

新增跨文件校验工具，至少验证：

- Topic ID 存在；
- Reference Source ID 存在；
- Author ID 存在；
- related Topic 存在；
- archived Source/Author 的使用策略明确；
- Registry ID 不重复。

建议把它作为 `pnpm content:validate` 的一部分，而不是另建人工流程。

## 6. 产品展示

第一阶段至少：

- Essay 展示 Author 名称和链接；
- Reference 可展示 Source 名称；
- Topic/Archive 仍按当前内容聚合。

可选但非本 Plan 必需：

```text
/sources/
/sources/:id/
/authors/:id/
```

如果没有真实浏览需求，先不创建 Source Directory UI。

## 7. 实现任务

1. 新增 `sourceSchema`、`authorSchema`；
2. 新增 `content/sources/**`、`content/authors/**`；
3. 注册对应 Content Collections 或共享 Loader；
4. 迁移现有 Reference source 字符串；
5. 迁移现有 Essay authors；
6. 新增 Referential Integrity validator；
7. 增加 missing source / author / topic 负向测试；
8. 在 Essay / Reference UI 使用 Registry metadata；
9. 更新 Agent Prompt：不得创造未注册 Source/Author ID；新 Registry 变更需要人工评审。

## 8. 非目标

- 自动信任评分模型；
- 来源真实性自动判定；
- Citation graph database；
- ORCID/Google Scholar 集成；
- 用户账号体系。

`trustTier` 只是编辑治理元数据，不代表机器自动证明来源可信。

## 9. 验收标准

- 所有已发布 Essay Author 都能解析到 Registry；
- 所有声明 `source` 的 Reference 都能解析到 Registry；
- 不存在悬空 Topic/Source/Author relation；
- 缺失 Registry ID 会使内容校验失败；
- Agent 默认不能修改 Sources/Authors；
- 现有 RSS、Brief、Slide 构建无回归。

## 10. 建议 PR 拆分

1. `feat: add source and author registries`
2. `feat: enforce content referential integrity`
