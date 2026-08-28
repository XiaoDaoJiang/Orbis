# 40 · 构建、RSS 与 GitHub Pages 发布

## 1. 构建目标

源代码仓库只保存内容、应用、共享包和配置。生产站点由 GitHub Actions 构建为一个 Pages Artifact。

不再把 `docs/` 作为长期手工维护的生产产物目录。

## 2. 推荐构建链路

```text
checkout
  ↓
pnpm install --frozen-lockfile
  ↓
validate content + schema + links
  ↓
generate Slidev entries
  ↓
Astro build
  ↓
Slidev build × N
  ↓
assemble site artifact
  ↓
post-build link check
  ↓
upload-pages-artifact
  ↓
deploy-pages
```

GitHub Pages 自定义工作流应使用独立 build / deploy job，并为部署授予 `pages: write` 与 `id-token: write`。

## 3. 产物目录

```text
dist/site/
├── index.html                         # Astro
├── essays/
├── briefs/
├── topics/
├── knowledge/
├── archive/
├── rss.xml
├── assets/
└── slides/
    ├── 2026-08-28/                    # Slidev SPA
    └── understanding-agent-harness/
```

## 4. Slidev 多演示构建

每个需要演示版的 Brief / Presentation 生成一个中间入口：

```text
generated/slides/<slug>/slides.md
```

然后执行：

```bash
slidev build generated/slides/<slug>/slides.md \
  --base /Orbis/slides/<slug>/ \
  --out dist/slides/<slug>
```

第一阶段可以全量构建。内容规模扩大后，通过 manifest、GitHub Actions cache 和内容 hash 只重建变化的 Deck。

## 5. Astro 构建

Astro 负责生成：

- 所有阅读页面；
- 索引、归档和 Topic 页面；
- RSS、Sitemap、Open Graph 元数据；
- 演示入口链接；
- 旧路径兼容页。

站点 Base 统一从配置或环境变量读取，例如：

```text
SITE_URL=https://xiaodaojiang.github.io
SITE_BASE=/Orbis/
```

若未来使用自定义域名，只修改站点配置，不修改内容文件。

## 6. RSS 输入

保留 `config/feeds.yaml` 作为受控发现源：

```text
RSS feeds
   ↓
候选条目
   ↓
去重与聚类
   ↓
一手来源核验
   ↓
生成内容文件
```

RSS 摘要不能直接作为最终事实。Feed 配置与公开 Source Registry 分离：

- `config/feeds.yaml`：抓取策略、启停、优先级、私有配置引用；
- `content/sources/`：公开来源说明和引用元数据。

私有 Feed Token 只放 GitHub Secrets，不进入仓库和公开页面。

## 7. RSS 输出

第一阶段生成一个默认 Feed：

```text
/rss.xml
```

内容包含所有已发布且允许进入 Feed 的 Essay、Brief 和 Knowledge 更新。

每个 Item 至少包含：

- title；
- link；
- guid；
- published date；
- description；
- content type；
- topics。

后续根据真实订阅需求再增加：

```text
/feeds/essays.xml
/feeds/briefs.xml
/feeds/knowledge.xml
/feed.json
```

不在第一阶段预建大量低使用率 Feed。

## 8. 自动内容任务边界

自动任务流程：

```text
读取 RSS / 搜索 / 核验
        ↓
创建 content 文件
        ↓
Schema 校验
        ↓
提交 PR 或内容分支
        ↓
CI 构建预览
        ↓
合并 main
        ↓
自动发布
```

自动任务不得直接生成或提交：

- `dist/`；
- Astro Component；
- Slidev Layout；
- CSS；
- GitHub Actions；
- Brand / Design Token。

## 9. Workflow 划分

建议：

```text
validate.yml
  - schema
  - lint
  - typecheck
  - content guard
  - link syntax

deploy-pages.yml
  - build Astro
  - build Slidev
  - assemble
  - link check
  - deploy

scheduled-content.yml（后续）
  - 仅生成内容分支或 PR
```

## 10. 官方参考

- GitHub Pages Custom Workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Slidev Hosting: https://sli.dev/guide/hosting
- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
