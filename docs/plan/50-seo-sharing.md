# 50 · SEO & Sharing

> 状态：In Progress · 50A Merged / Production Gate
> Roadmap Milestone：E — Search & Share Ready
> 当前基线：`main@16de75931c984f64cd1458769b6eb87bfa5fe572`
> 设计：[`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`](../superpowers/specs/2026-09-01-seo-sharing-design.md)
> 生产依赖：50A exact main SHA 必须完成 Production Pages Build → Deploy → public Smoke
> 当前交付：50A SEO Foundation · Production Gate
> 后续交付：50B Structured Data

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

现有 PR Build 通过 `SITE_ORIGIN` / `SITE_BASE` 注入 runtime Preview URL，因此 Plan 50 复用现有 SiteConfig / Astro runtime contract，不新增第二套 URL 配置。

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

Brief-derived Slides：

- canonical → Astro Reading；
- 不作为独立 sitemap canonical。

Standalone Talk：

- 无 fake Reading page；
- deck self-canonical；
- 可进入 Sitemap。

## 4. Metadata Contract

`BaseLayout.astro` 作为 Astro `<head>` 单一 renderer，50A 已负责：

- title / description；
- canonical；
- robots；
- Open Graph；
- Twitter Card；
- RSS discovery。

50B 将在同一边界加入 JSON-LD，不重新定义 canonical。

50A 输出：

```text
og:title
og:description
og:url
og:type
og:image
og:locale
og:site_name
twitter:card = summary_large_image
twitter:title
twitter:description
twitter:image
```

第一版使用静态 1200×630 Brand Social Image；不做 per-content 动态生成。

## 5. Sitemap

50A 已输出单个 `/sitemap.xml`，由 structured content + 明确 route taxonomy 构建，不扫描 `dist/site` 猜 canonical。

排除：

- non-public content；
- `/latest/`；
- 日期 alias；
- Brief-derived Slide duplicates；
- Preview URL；
- RSS / assets。

Preview build 中 sitemap `<loc>` 始终是 Production URL。

## 6. RSS

Production：item link = Production Reading canonical。

Preview：item link = Preview Reading URL，保持 Preview feed 可点击验收。

RSS 不再依赖硬编码 fallback origin。

## 7. Delivery Split

### 50A — SEO Foundation · Merged / Production Gate

PR #21 已于 2026-09-02 合并：

```text
main = 16de75931c984f64cd1458769b6eb87bfa5fe572
```

已落地：

- SiteConfig metadata；
- Production/runtime URL helpers；
- BaseLayout SEO head；
- canonical + robots；
- OG / Twitter；
- static social image；
- Sitemap；
- RSS runtime/canonical alignment；
- Slide canonical boundary；
- Daily/latest alias canonical；
- Production/Preview focused + artifact tests。

Fresh main Site Build：

```text
run      = 33586301122
result   = success
artifact = 9830214428
sha256   = ea1bc7092e23f31536a136a0cf6f48c78e398b5f3a2cbed4d27ff3f653ee31ed
```

同一 main build 明确通过：

```text
SEO URL contract passed
Web SEO artifact contract passed
Assembled SEO canonical contract passed
```

50A 尚未标记 Done：当前最新 `Orbis Pages Production` 仍是 run `33495089941`，对应旧 `main@0c867438fc6cac83b6f97b76cb55e29118b64b87`。必须针对 `16de75931c984f64cd1458769b6eb87bfa5fe572` 新建一次 `deploy=true` workflow dispatch 并完成 public smoke。

### 50B — Structured Data · Next after 50A Production Gate

建议 PR：

```text
feat: add structured data for published content
```

范围：

- WebSite JSON-LD；
- Essay Article + Author Registry；
- Brief Article；
- Knowledge TechArticle；
- JSON parse / canonical consistency tests。

50B 消费 50A URL contract，不重新定义 canonical。

## 8. JSON-LD Contract · 50B

只使用现有真实 Schema 字段：

- Site → `WebSite`；
- Essay → `Article`；
- Brief → `Article`；
- Knowledge → `TechArticle`。

Essay Author 从 Plan 40 Author Registry 解析并保持声明顺序。

不伪造 Brief / Knowledge author、Source publisher、standalone Talk Reading page 或 `reviewAt` 映射。

## 9. Build Invariants

构建必须拒绝：

- 非绝对 HTTP(S) production origin；
- relative canonical；
- canonical 丢失 configured base path；
- Preview canonical 指向 raw.githack / preview-pr-*；
- Production canonical 含 Preview identity；
- Sitemap 泄露 alias、non-public content 或 Brief-derived Slide duplicate；
- default Social Image 缺失；
- 50B JSON-LD 非合法 JSON 或 URL 与 Production canonical 不一致。

## 10. 非目标

- 动态 OG image 服务；
- per-content image generation；
- SEO ranking promises；
- keyword stuffing；
- hreflang；
- Analytics / marketing tracking；
- 数据库 / CMS / 搜索服务；
- Source / Author directory；
- Slidev 全量 noindex。

## 11. Plan 50 验收

- 所有主要 public Astro 页面有绝对 Production canonical；
- Preview canonical → Production + `robots=noindex,nofollow`；
- Preview `og:url` = actual Preview URL；
- OG/Twitter 使用有效绝对 URL 与 1200×630 Brand Image；
- Sitemap 只包含 public canonical resources；
- Production RSS links 与 Reading canonical 一致；
- Daily/Weekly Slides canonical → Reading；
- standalone Talk self-canonical；
- WebSite/Essay/Brief/Knowledge JSON-LD 只使用真实字段；
- Essay JSON-LD 使用 Author Registry；
- `pnpm build`、PR Preview、Production Pages 自动捕获 URL identity 回归。

## 12. 当前 Gate

- [x] Plan 40 Production Pages deploy/smoke complete：run `33495089941`；
- [x] Plan 50 design approved；
- [x] formal design spec committed；
- [x] 50A implementation plan；
- [x] 50A TDD implementation + PR #21；
- [x] PR #21 merged to `main@16de75931c984f64cd1458769b6eb87bfa5fe572`；
- [x] fresh main Site Build `33586301122` passed；
- [ ] 50A Production Pages `deploy=true` for `16de75931c984f64cd1458769b6eb87bfa5fe572` + public smoke；
- [ ] mark 50A Done；
- [ ] 50B implementation plan + PR。
