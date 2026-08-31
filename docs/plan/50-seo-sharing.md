# 50 · SEO & Sharing

> 状态：Planned
> Roadmap Milestone：E — Search & Share Ready
> 建议优先级：P1
> 依赖：Plan 10；建议在核心路由稳定后实施

## 1. 目标

让 Astro 阅读页成为公开网络中的 canonical 内容入口，并保证搜索引擎、社交平台和 Feed Reader 能正确理解 Orbis 内容。

Slidev 负责演示体验，主要 SEO 权重应落到对应 Astro 页面。

## 2. 当前基础

当前 `BaseLayout` 已有：

- title；
- description；
- favicon；
- RSS discovery link。

还缺：

- canonical；
- Open Graph；
- Twitter Card；
- Sitemap；
- JSON-LD；
- 分享图策略；
- Slide → Reading canonical/backlink 合同。

## 3. 范围

### 3.1 Site Metadata Contract

扩展 `config/site.yaml`，集中定义：

- site origin；
- base path；
- default title；
- default description；
- default social image；
- locale；
- author/brand metadata（只保存站点级配置）。

所有 URL 必须通过 site config/runtime base 推导，禁止内容硬编码 `/Orbis/`。

### 3.2 Canonical

为以下页面生成 canonical：

- 首页；
- Essay；
- Brief；
- Topic；
- Knowledge；
- Archive/Slides indexes；
- Presentation 对应阅读页。

日期 alias `/YYYY/MM/DD/` 和 `/latest/` 不应被当作主要 canonical 内容页。

### 3.3 Open Graph / Twitter

至少生成：

- `og:title`；
- `og:description`；
- `og:url`；
- `og:type`；
- `og:image`；
- `twitter:card`；
- `twitter:title`；
- `twitter:description`；
- `twitter:image`。

第一版允许使用统一 Brand Social Image，不要求每篇动态生成图片。

### 3.4 Sitemap

构建输出：

```text
/sitemap-index.xml 或 /sitemap.xml
```

只包含可公开且 canonical 的页面，不包含 draft、needs-review 私有态或 Preview-only 路由。

### 3.5 JSON-LD

第一版只做简单、正确、可验证的结构化数据：

- Essay → `Article`；
- Brief → `Article` 或适合的 CreativeWork；
- Knowledge → `Article`/`TechArticle`（根据字段可表达程度选择）；
- Site → `WebSite`。

不要为了 Schema.org 覆盖率加入没有真实数据的字段。

### 3.6 Slide SEO Boundary

Slidev 页面至少应：

- 明确对应 reading URL；
- 可通过 UI 回到 reading page；
- 不与 Astro 页面争夺主 canonical。

是否给 Slidev 注入 `noindex` 需要先验证实际分享需求；第一版优先 canonical/backlink，不武断屏蔽。

## 4. 实现任务

1. 扩展 SiteConfig；
2. 抽象 Astro SEO metadata helper；
3. 扩展 BaseLayout head；
4. 为各内容页传入 canonical/OG metadata；
5. 增加 sitemap；
6. 增加基础 JSON-LD；
7. 给 Slidev 生成 reading URL metadata/backlink；
8. 更新 `site-check` 验证 canonical、OG、sitemap；
9. 验证 GitHub Pages base path 与 PR Preview base path 都正确；
10. 公网检查最终生成 URL 不含本地或错误 origin。

## 5. 非目标

- 动态服务端 OG Image；
- SEO 排名承诺；
- 自动关键词堆砌；
- 多语言 hreflang；
- Analytics 平台；
- 广告/营销 tracking。

## 6. 验收标准

- 所有主要 Astro 公共页有绝对 canonical；
- canonical 在 Production 与 PR Preview 都使用正确 origin/base contract；
- Essay/Brief/Knowledge 至少有基本 OG/Twitter metadata；
- Sitemap 只包含公开 canonical pages；
- JSON-LD 可以解析为合法 JSON；
- `/rss.xml` 中的 item link 与 canonical 阅读 URL 一致；
- Slidev 可以返回对应阅读页；
- `pnpm build` 对错误 canonical/base 有自动检查。

## 7. 建议 PR

`feat: add canonical seo metadata and sitemap`

如果 JSON-LD 让 PR 过大，可作为第二个小 PR：

`feat: add structured data for published content`
