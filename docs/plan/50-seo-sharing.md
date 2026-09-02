# 50 · SEO & Sharing

> 状态：In Progress · 50A Done / 50B Current
> Roadmap Milestone：E — Search & Share Ready
> 当前基线：`main@16de75931c984f64cd1458769b6eb87bfa5fe572`
> 设计：[`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`](../superpowers/specs/2026-09-01-seo-sharing-design.md)
> 当前交付：50B Structured Data

## 1. 目标

让 Astro Reading 成为 Orbis 在公开网络中的稳定内容身份，并让搜索、社交分享、RSS 与结构化数据共享同一套可验证 URL contract。

Slidev 继续负责演示体验；Brief-derived Slides 不与对应 Reading 页面争夺 canonical identity。

## 2. 已批准核心设计

### Production

```text
canonical = production URL
og:url    = production URL
robots    = index,follow
```

### PR Preview

```text
canonical = corresponding production URL
og:url    = current raw.githack Preview URL
robots    = noindex,nofollow
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

Production run `33588705346` 精确部署 `16de75931c984f64cd1458769b6eb87bfa5fe572`，并通过：

```text
Build production artifact         success
Deploy to GitHub Pages            success
PASS /
PASS /latest/
PASS /archive.json
PASS /rss.xml
PASS /favicon.svg
PASS /2026/08/28/
```

同一 Production build 再次通过：

```text
SEO URL contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
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

## 5. 50B — Structured Data · Current

目标 PR：

```text
feat: add structured data for published content
```

范围：

- WebSite JSON-LD；
- Essay → `Article`；
- Brief → `Article`；
- Knowledge → `TechArticle`；
- Essay Author 从 Plan 40 Author Registry 解析并保持声明顺序；
- JSON-LD parse / canonical consistency / Preview-safe artifact tests。

50B 消费 50A URL contract，不重新定义 canonical。

## 6. JSON-LD Contract

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

## 7. Build Invariants

构建必须拒绝：

- JSON-LD 非合法 JSON；
- `url` 与 Production canonical 不一致；
- Preview JSON-LD URL 泄露 raw.githack / `preview-pr-*`；
- Essay Author 顺序或 Registry metadata 丢失；
- Brief / Knowledge 被伪造 author/publisher；
- 非公开内容进入公开 JSON-LD artifact；
- 50B 重新定义 50A canonical / Sitemap / RSS contract。

## 8. 非目标

- 动态 OG image；
- per-content image generation；
- SEO ranking promises；
- hreflang；
- Analytics / tracking；
- Source / Author directory；
- standalone Presentation JSON-LD detail page；
- 数据库 / CMS / 服务端 Runtime。

## 9. Plan 50 验收

50A 已满足：

- Production canonical / Preview noindex；
- OG / Twitter；
- Sitemap；
- RSS identity；
- Slides / alias canonical；
- Production Pages exact-SHA deploy/smoke。

50B 退出条件：

- 首页输出合法 `WebSite` JSON-LD；
- Essay 输出合法 `Article` + Registry Author；
- Brief 输出合法 `Article`，不伪造 author；
- Knowledge 输出合法 `TechArticle`，不伪造 author；
- JSON-LD URL 与 Production canonical 一致；
- Preview JSON-LD 不泄露 Preview identity；
- `pnpm build`、Trusted Preview、fresh main Build 与 Production Pages 均通过。

## 10. 当前 Gate

- [x] Plan 50 design approved；
- [x] 50A implementation plan；
- [x] 50A TDD implementation + PR #21；
- [x] PR #21 merged；
- [x] fresh main Site Build `33586301122`；
- [x] Production Pages `33588705346` exact-SHA Build → Deploy → public smoke；
- [x] mark 50A Done；
- [ ] 50B implementation plan；
- [ ] 50B TDD implementation + PR；
- [ ] 50B Production Pages verification；
- [ ] mark Milestone E / Plan 50 Done。
