# 50 · SEO & Sharing

> 状态：Design Review
> Roadmap Milestone：E — Search & Share Ready
> 当前基线：`main@0c867438fc6cac83b6f97b76cb55e29118b64b87`
> 设计：[`docs/superpowers/specs/2026-09-01-seo-sharing-design.md`](../superpowers/specs/2026-09-01-seo-sharing-design.md)
> 建议优先级：P1
> 生产依赖：Plan 40 Production Pages deploy/smoke 通过后再进入可合并实现阶段

## 1. 目标

让 Astro Reading 成为 Orbis 在公开网络中的稳定内容身份，并让搜索、社交分享、RSS 与结构化数据共享同一套可验证 URL contract。

Slidev 继续负责演示体验；Brief-derived Slides 不与对应 Reading 页面争夺 canonical identity。

## 2. 已确认的核心设计

### 2.1 Production 与 Preview 身份分离

Production：

```text
canonical = production URL
og:url    = production URL
robots    = index,follow
```

PR Preview：

```text
canonical = corresponding production URL
og:url    = current raw.githack Preview URL
robots    = noindex,nofollow
```

Preview 可以分享和验收，但不成为搜索引擎中的长期内容身份。

### 2.2 URL 继续复用现有 SiteConfig / Runtime Contract

现有 `config/site.yaml` 已定义：

- production `site.origin`；
- production `site.basePath`；
- locale；
- Preview origin/repository/branch prefix。

现有 PR Build 已通过 `SITE_ORIGIN` / `SITE_BASE` 注入 Preview runtime 地址。

Plan 50 不建立第二套 URL 配置，也不允许页面硬编码 `/Orbis/`、raw.githack host 或 PR number。

### 2.3 第一版 Social Image

使用一个静态 1200×630 Brand Social Image。

第一版不为每篇内容动态生成 OG Image。

## 3. Canonical Taxonomy

### Canonical public resources

- `/`；
- Essay indexes/details；
- Brief indexes/details；
- Knowledge indexes/details；
- Topic indexes/details；
- `/archive/`；
- `/slides/`；
- standalone `talk-v1` deck，因为它没有伪造的 Reading page。

### Alias / non-primary resources

- `/latest/` canonical → 当前 Daily Reading；
- `/YYYY/MM/DD/` canonical → 对应 Daily `/briefs/:id/`；
- 两类 alias 均不进入 Sitemap。

### Brief-derived Slides

Daily / Weekly Slidev：

- 保留 Reading backlink；
- canonical → 对应 Astro Reading；
- 不以独立 canonical entry 进入 Sitemap；
- 第一版不默认全量 `noindex`，先用 canonical/backlink 解决重复身份。

### Standalone Talk

`talk-v1` 没有 Reading page：

- deck self-canonical；
- 可以进入 Sitemap；
- 不伪造不存在的 Reading URL。

## 4. Metadata Contract

`BaseLayout.astro` 扩展为统一 Astro `<head>` renderer，负责：

- title；
- description；
- canonical；
- robots；
- Open Graph；
- Twitter Card；
- RSS discovery；
- 50B 的 JSON-LD。

至少输出：

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

内容页只传 route/content intent，不自行拼绝对 URL。

## 5. Sitemap

第一版输出单个：

```text
/sitemap.xml
```

由 structured content + 明确路由 taxonomy 构建，不通过扫描 `dist/site` 猜测 canonical 页面。

只包含公开 canonical resources；排除：

- draft / needs-review / 非公开 archived content；
- `/latest/`；
- 日期 alias；
- Brief-derived Slide deck duplicate；
- Preview URL；
- RSS 和 asset。

即使在 PR Preview build 中，Sitemap `<loc>` 也始终使用 Production URL。

## 6. RSS

Production：item link 等于 Production Reading canonical。

Preview：item link 继续使用 Preview Reading URL，保证 Preview feed 可实际点击验证。

RSS 不再依赖硬编码 fallback origin。

## 7. JSON-LD · 50B

只使用现有真实 Schema 字段：

- Site → `WebSite`；
- Essay → `Article`；
- Brief → `Article`；
- Knowledge → `TechArticle`。

Essay Author 从 Plan 40 Author Registry 解析，保持 frontmatter 声明顺序。

不伪造：

- Brief / Knowledge 作者；
- Source Registry 作为 Orbis Article publisher；
- standalone Talk Reading page；
- `reviewAt` 的错误 Schema.org 映射。

## 8. Delivery Split

### 50A — SEO Foundation

建议 PR：

```text
feat: add canonical seo metadata and sitemap
```

范围：

- SiteConfig metadata；
- Production/runtime URL helpers；
- BaseLayout SEO head；
- canonical + robots；
- OG / Twitter；
- static social image；
- Sitemap；
- RSS canonical alignment；
- Slide canonical boundary；
- Production/Preview focused + artifact tests。

50A 不包含 JSON-LD。

### 50B — Structured Data

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

50B 消费 50A URL contract，不重新定义 canonical 语义。

## 9. Build Invariants

构建必须拒绝：

- 非绝对 HTTP(S) production origin；
- relative canonical；
- canonical 丢失 configured base path；
- Preview canonical 指向 raw.githack / preview-pr-*；
- Production canonical 含 Preview identity；
- Sitemap 泄露 alias、non-public content 或 Brief-derived Slide duplicate；
- 默认 Social Image 缺失；
- JSON-LD 非合法 JSON；
- JSON-LD URL 与 Production canonical 不一致。

## 10. 非目标

- 动态 OG image 服务；
- 每篇内容自动生成图片；
- SEO 排名承诺；
- keyword stuffing；
- hreflang / 多语言路由；
- Analytics / marketing tracking；
- 数据库 / CMS / 搜索服务；
- Source / Author directory；
- Slidev 全量 noindex 策略。

## 11. Plan 50 验收

- 所有主要公共 Astro 页面有绝对 Production canonical；
- Preview canonical → Production，同时 `robots=noindex,nofollow`；
- Preview `og:url` 仍为实际 Preview URL；
- OG/Twitter 使用有效绝对 URL 与 1200×630 Brand Image；
- Sitemap 只包含 public canonical resources；
- Production RSS links 与 Reading canonical 一致；
- Daily/Weekly Slides canonical/backlink → Reading；
- standalone Talk self-canonical；
- WebSite/Essay/Brief/Knowledge JSON-LD 只使用真实字段并可解析；
- Essay JSON-LD 使用 Author Registry；
- `pnpm build`、PR Preview 和最终 Production Pages 验证均能捕获 origin/base/canonical 回归。

## 12. 当前 Gate

设计已收敛并写入正式 Spec。

进入 implementation plan 前需要：

1. 人工 review `docs/superpowers/specs/2026-09-01-seo-sharing-design.md`；
2. Plan 40 Production Pages 新 run 必须出现 `Deploy to GitHub Pages = success`，而不是 Build success + Deploy skipped。
