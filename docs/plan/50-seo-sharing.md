# 50 · SEO & Sharing

> 状态：Done
> Roadmap Milestone：E — Search & Share Ready · Done
> 最终基线：`main@bb85751266f90ec25e56f087bd078a935d8f31cd`
> 设计：[`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`](../superpowers/specs/2026-09-01-seo-sharing-design.md)
> 最终交付：50A SEO Foundation + 50B Structured Data

## 1. 目标

让 Astro Reading 成为 Orbis 在公开网络中的稳定内容身份，并让搜索、社交分享、RSS 与结构化数据共享同一套可验证 URL contract。

Slidev 继续负责演示体验；Brief-derived Slides 不与对应 Reading 页面争夺 canonical identity。

## 2. 已批准核心设计

### Production

```text
canonical = production URL
og:url    = production URL
robots    = index,follow
JSON-LD   = production canonical identity
```

### PR Preview

```text
canonical = corresponding production URL
og:url    = current raw.githack Preview URL
robots    = noindex,nofollow
JSON-LD   = production canonical identity
```

Preview 可以分享和验收，但不成为长期搜索身份。

## 3. Canonical Taxonomy

Canonical public resources：

- `/`；
- Essay indexes/details；
- Brief indexes/details；
- Knowledge indexes/details；
- Topic indexes/details；
- `/archive/`；
- `/slides/`；
- standalone `talk-v1` deck。

Alias / non-primary：

- `/latest/` canonical → 当前 Daily Reading；
- `/YYYY/MM/DD/` canonical → 对应 Daily `/briefs/:id/`；
- alias 不进入 Sitemap。

Brief-derived Slides canonical → Astro Reading；standalone Talk self-canonical。

## 4. 50A — SEO Foundation · Done

PR #21 已合并并完成生产验证：

```text
main                              16de75931c984f64cd1458769b6eb87bfa5fe572
PR                                #21 merged
post-merge Site Build             33586301122 success
main Artifact                     9830214428
main Artifact SHA-256             ea1bc7092e23f31536a136a0cf6f48c78e398b5f3a2cbed4d27ff3f653ee31ed
Production Pages                  33588705346 success
Production Pages artifact         9831008743
Production artifact SHA-256       83cdb5f5495dc8658ee8e77768ecb2627a05753017a6d5d2b33910da8cf99d81
```

50A 已落地：

- SiteConfig metadata；
- Production/runtime URL helpers；
- BaseLayout canonical / robots / OG / Twitter；
- 1200×630 static social image；
- `/sitemap.xml`；
- Production/Preview RSS URL identity；
- Brief-derived Slide canonical → Reading；
- standalone Talk self-canonical；
- Daily/latest alias canonical；
- Preview noindex 与 Production URL 回归测试。

## 5. 50B — Structured Data · Done

PR #22 已于 `2026-09-02T07:03:38Z` 合并：

```text
PR                                #22 merged
main                              bb85751266f90ec25e56f087bd078a935d8f31cd
implementation head                04b89db28fff734ef496d06984622155efbd05f1
post-merge Site Build              33601715928 success
main Artifact                      9835467039
main Artifact SHA-256              eea4501fb7f88032aa920f140a955e5ac5d171afddbab14179a06eca181f65f3
Production Pages                   33603472306 success
Production Pages Artifact          9836095734
Production Artifact SHA-256        928b4f27d65a143dc0faa4d203e99ec40becc08dab9e92cbb8af073e9e39e481
```

50B 已落地：

- Homepage → Schema.org `WebSite`；
- Essay → `Article`；
- Brief → `Article`；
- Knowledge → `TechArticle`；
- Essay Author 从 Plan 40 Author Registry 解析并保持声明顺序；
- Author optional URL semantics；
- Essay/Knowledge `dateModified = updatedAt ?? publishedAt`；
- Brief / Knowledge 不伪造 author / publisher；
- `reviewAt` 不错误映射到 Schema.org；
- JSON-LD URL 与 Production canonical 一致；
- Preview JSON-LD 不泄露 raw.githack / `preview-pr-*`；
- script-safe JSON serialization；
- pure builder contract + final artifact contract。

50B 消费 50A URL contract，没有重新定义 canonical。

## 6. TDD / Verification Evidence

### RED 1

Run `33599571799`：旧能力先通过，新 contract 精确失败于：

```text
JSON-LD helper must exist
```

### Builder boundary correction

Run `33599754021` 暴露 pure `tsx` test 不应直接依赖 Vite-only YAML raw import。Builder 改为显式接受 validated SiteConfig，不引入 Node/Vite 特例。

### GREEN 1

Run `33599931293`：

```text
JSON-LD builder contract passed
```

### RED 2

Run `33600187919`：builder 与 50A 全绿，最后只失败于：

```text
Homepage must emit JSON-LD
```

### Final PR GREEN

Run `33600661082`：

```text
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

Final Preview Artifact：

```text
ID       9835075964
SHA-256  0ae5e3663e4a09f7d7cfd8d5f64b53071e6eab6e9c5693f5bd8818c04f98b249
```

Trusted Preview public smoke passed after the final artifact was published。

### Fresh main GREEN

Post-merge Site Build `33601715928` 精确 checkout：

```text
main@bb85751266f90ec25e56f087bd078a935d8f31cd
```

并再次通过：

```text
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

Fresh main Artifact：

```text
ID       9835467039
Size     1,073,366 bytes
SHA-256  eea4501fb7f88032aa920f140a955e5ac5d171afddbab14179a06eca181f65f3
```

### Final Production GREEN

Governed Production run `33603472306` 精确 checkout / deploy：

```text
main@bb85751266f90ec25e56f087bd078a935d8f31cd
pages_build_version=bb85751266f90ec25e56f087bd078a935d8f31cd
```

Production Build 与 Deploy 均 success，同一 build 再次通过：

```text
SEO URL contract passed
JSON-LD builder contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
Structured data artifact contract passed
```

Production Pages smoke：

```text
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/08/28/
```

Production Artifact：

```text
ID       9836095734
Size     1,008,219 bytes
SHA-256  928b4f27d65a143dc0faa4d203e99ec40becc08dab9e92cbb8af073e9e39e481
```

## 7. JSON-LD Contract

只使用现有真实 Schema 字段：

- Site → `WebSite`；
- Essay → `Article`；
- Brief → `Article`；
- Knowledge → `TechArticle`。

Essay Author 从 Author Registry 得到 `name` 与可选 `url`。

明确不伪造：

- Brief / Knowledge author；
- Source publisher；
- standalone Talk Reading page；
- `reviewAt` → Schema.org date；
- 未存在的 organization/publisher identity。

JSON-LD 中的页面 URL 必须与页面 Production canonical 一致，即使在 Preview Build 中也是如此。

## 8. Build Invariants

构建必须拒绝：

- JSON-LD 非合法 JSON；
- `url` 与 Production canonical 不一致；
- Preview JSON-LD URL 泄露 raw.githack / `preview-pr-*`；
- Essay Author 顺序或 Registry metadata 丢失；
- Brief / Knowledge 被伪造 author/publisher；
- 非公开内容进入公开 JSON-LD artifact；
- 50B 重新定义 50A canonical / Sitemap / RSS contract。

## 9. 非目标

- 动态 OG image；
- per-content image generation；
- SEO ranking promises；
- hreflang；
- Analytics / tracking；
- Source / Author directory；
- standalone Presentation JSON-LD detail page；
- 数据库 / CMS / 服务端 Runtime。

## 10. Plan 50 验收 · Done

全部满足：

- Production canonical / Preview noindex；
- OG / Twitter；
- Sitemap；
- RSS identity；
- Slides / alias canonical；
- 50A Production Pages exact-SHA deploy/smoke；
- 首页合法 `WebSite` JSON-LD；
- Essay 合法 `Article` + Registry Author；
- Brief 合法 `Article`，不伪造 author；
- Knowledge 合法 `TechArticle`，不伪造 author；
- JSON-LD URL 与 Production canonical 一致；
- Preview JSON-LD 不泄露 Preview identity；
- 50B PR Preview / Artifact / fresh main Build 全绿；
- `main@bb85751266f90ec25e56f087bd078a935d8f31cd` governed Production Pages exact-SHA Build → Deploy → public Smoke 全绿。

## 11. Final Gate

- [x] Plan 50 design approved；
- [x] 50A implementation + PR #21；
- [x] 50A Production Pages verification；
- [x] 50B implementation plan；
- [x] 50B TDD implementation + PR #22；
- [x] PR #22 merged to `main@bb85751266f90ec25e56f087bd078a935d8f31cd`；
- [x] fresh main Site Build `33601715928` passed；
- [x] Production Pages `33603472306` exact-SHA Build → Deploy → public smoke；
- [x] mark Milestone E / Plan 50 Done；
- [x] promote Plan 60 to Current / Design Review。
