# 40 · Source & Author Registry

> 状态：Done
> Roadmap Milestone：D — Knowledge Identity
> 完成基线：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 40A：PR #15
> 40B：最终 main integration PR #19
> 主分支验证：Orbis Site Build run `33489504298` Passed
> 生产验证：Orbis Pages Production run `33495089941` Build + Deploy + Smoke Passed
> Closeout：Issue #20 Completed；历史 `feat/*` / `refactor/*` 分支已清理

## 1. 目标

把内容中的自由字符串 Author / Source 引用升级为稳定实体和可验证关系，并让现有 Astro Reading 页面安全消费这些稳定身份。

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

## 2. 已锁定合同

1. Source / Author canonical ID 来自扁平文件名与 Astro `entry.id`；YAML 不重复声明 `id`。
2. ID 匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。
3. `Reference.source` 可省略；声明后必须解析到 Source Registry。
4. Essay `authors[]` 必须解析到 Author Registry。
5. Brief / Presentation / Essay / Knowledge Topics、Weekly trend Topics 与 Topic.related 必须解析。
6. archived Source / Author 保持历史引用合法。
7. Scheduled Content Agent 可以使用已注册 active ID，但不能创建或修改 Source / Author Registry。
8. 第一版只 enrich Reading UI，不新增 Source / Author directory/reverse aggregation。
9. direct `build:web` 对缺失 Author / Source 必须显式失败。
10. Slidev、RSS、Archive、Topic、Related Content 既有语义保持稳定。

## 3. Canonical Registry

```text
content/sources/astro.yaml          -> astro
content/sources/github.yaml         -> github
content/sources/slidev.yaml         -> slidev
content/authors/xiaodaojiang.yaml   -> xiaodaojiang
```

Source Required：`name`、`homepage`、`type`、`trustTier`、`status`。

Author Required：`name`、`status`；可选 `url`、`bio`。

`trustTier` 是编辑治理元数据，不是机器真实性评分。

## 4. 40A · Registry + Referential Integrity · Done

PR #15 merge commit：`4dc69ad2ac24d3e6b0c301b70809327aeae754ab`。

已提供：

- [x] `sourceSchema` / `authorSchema`；
- [x] canonical filename ID contract；
- [x] 初始 Source / Author Registry；
- [x] Astro Source / Author Collections；
- [x] Topic / Author / Source repository-wide relation validation；
- [x] invalid / duplicate / nested Registry rejection；
- [x] archived / unsourced compatibility；
- [x] scheduled-agent Registry write restriction；
- [x] Build + Trusted Preview。

## 5. 40B · Registry-backed Content UI · Done

Validated head：`56a89d2259b0489a61ca2a867a06740f5c2de2eb`。

Final main integration：PR #19 → `0c867438fc6cac83b6f97b76cb55e29118b64b87`。

已提供：

- [x] pure build-time Registry resolver；
- [x] `AuthorByline.astro`；
- [x] `ReferenceList.astro`；
- [x] Essay Author display/profile/status；
- [x] Source name/homepage/type/trust/status；
- [x] Daily / Weekly / Ad-hoc / Essay / Knowledge Reference consumption；
- [x] source-less Reference compatibility；
- [x] direct build missing-ID defense；
- [x] no Source / Author public routes；
- [x] RSS / Archive / Topic / Related / Slidev / Daily latest regressions green；
- [x] fresh PR Build / Artifact / Trusted Preview；
- [x] merge 后 Site Build。

## 6. Stacked Merge 恢复审计

```text
PR #15 -> main                         Done
PR #16 -> old feature base             Historical stacked merge only
stale duplicate PR #17                 Closed
Draft recovery PR #18                  Closed / superseded
PR #19 exact 40B head -> main          Done
```

PR #18 因 GitHub connector Ready-for-review GraphQL incompatibility 无法退出 Draft。恢复过程没有绕过 GitHub Draft 规则，而是关闭 #18，创建同 head / main base 的非 Draft #19，重新获得 fresh Build + Trusted Preview 后合并。

## 7. Production Closeout

Final production run：`33495089941`。

```text
Build production artifact      success
Deploy to GitHub Pages         success
Smoke /                        PASS
Smoke /latest/                 PASS
Smoke /archive.json            PASS
Smoke /rss.xml                 PASS
Smoke /favicon.svg             PASS
Smoke /2026/08/28/             PASS
```

Deployment payload 使用 exact main SHA `0c867438fc6cac83b6f97b76cb55e29118b64b87`。

## 8. Governance

`content-agent` Path Guard allowlist 不包含：

```text
content/sources/
content/authors/
```

Scheduled Agent 可以引用已注册 active ID，但不能自行创建、改名、archive 或修改 Registry。

## 9. 非目标

- 自动信任评分或事实真实性判定；
- Citation graph database；
- Source / Author reverse aggregation；
- Source / Author Directory UI；
- ORCID / Google Scholar；
- aliases 自动关系解析；
- Source metadata 注入 Slidev 或 RSS。

## 10. 完成条件

- [x] Source / Author Schema + canonical ID；
- [x] Topic / Source / Author referential integrity；
- [x] invalid / duplicate / nested Registry rejection；
- [x] archived identity 历史可解析；
- [x] Agent Registry governance；
- [x] Registry-backed Reading UI；
- [x] 40A / 40B 全部进入 `main`；
- [x] merge 后 Site Build；
- [x] Production Pages deploy；
- [x] Production public smoke；
- [x] historical feature/refactor branch cleanup；
- [x] Roadmap 进入 Plan 50。
