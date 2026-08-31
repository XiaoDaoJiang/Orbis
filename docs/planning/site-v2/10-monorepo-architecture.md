# 10 · Astro + Slidev Monorepo 架构

## 1. 架构决策

采用 **pnpm Workspace + Astro + Slidev**：

- Astro 是主站和内容查询层；
- Slidev 是独立演示构建器；
- 两者共享内容、Schema、设计 Token 和品牌资产；
- 两者不共享页面组件，也不在 Astro 页面中直接启动 Slidev Runtime。

Astro Content Collections 适合组织 Markdown、YAML 和 JSON 内容，并提供 Schema 校验与 TypeScript 类型；Slidev 可以构建为静态 SPA，并通过 `--base` 和 `--out` 发布到子路径。

## 2. 推荐目录

```text
Orbis/
├── apps/
│   ├── web/                         # Astro 主站
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── layouts/
│   │   │   ├── components/
│   │   │   ├── styles/
│   │   │   └── content.config.ts
│   │   ├── public/
│   │   ├── astro.config.mjs
│   │   └── package.json
│   │
│   └── slides/                      # Slidev 演示应用
│       ├── layouts/
│       ├── components/
│       ├── theme/
│       ├── styles/
│       ├── slidev.config.ts
│       └── package.json
│
├── content/                          # 内容唯一来源
│   ├── essays/
│   ├── briefs/
│   ├── presentations/
│   ├── topics/
│   ├── knowledge/
│   ├── authors/
│   └── sources/
│
├── packages/
│   ├── content-schema/              # Zod / 类型与判别联合
│   ├── content-utils/               # 查询、排序、引用、slug
│   ├── design-tokens/               # 色彩、字体、间距、动效
│   ├── brand-assets/                # Logo、favicon、社交图资产
│   └── slide-generator/             # Brief / Presentation → Slidev Markdown
│
├── brand/                            # 人类可读的品牌与 IP 规范
│   ├── strategy/
│   ├── identity/
│   ├── voice/
│   ├── assets/
│   └── legal/
│
├── design/                           # 人类可读的设计规范
│   ├── foundations/
│   ├── web/
│   ├── slides/
│   └── decisions/
│
├── config/
│   ├── feeds.yaml                    # RSS 输入源
│   ├── editorial.yaml                # 编辑与引用规则
│   └── site.yaml                     # 站点元数据与路径
│
├── tools/
│   ├── validate-content/
│   ├── generate-slides/
│   ├── generate-rss/
│   ├── assemble-site/
│   ├── check-links/
│   └── migrate-legacy/
│
├── generated/                        # 构建期文件，不作为内容源
├── .github/workflows/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── AGENTS.md
└── README.md
```

## 3. 应用职责

### `apps/web`

负责：

- 首页；
- Blog / Essays；
- Brief 阅读版；
- Topics；
- Knowledge；
- Archive；
- SEO、Open Graph、Sitemap；
- RSS / Atom / JSON Feed；
- 从阅读版跳转到演示版。

不负责：

- Slidev 页面运行时；
- 逐页演示布局；
- Daily / Weekly 演示构建。

### `apps/slides`

负责：

- 固定 Slidev Theme；
- Daily / Weekly / Presentation 的布局白名单；
- 演示组件；
- 键盘、触控、全屏、概览等 Slidev 能力；
- 静态 SPA 构建。

不负责：

- 站点首页；
- 内容归档；
- Blog；
- 主题查询；
- RSS 输出。

## 4. 共享边界

### 共享

- 内容文件；
- 内容 Schema；
- Topic / Source Registry；
- 设计 Token；
- Logo、favicon 与字体策略；
- URL 和 slug 规则；
- 引用与日期格式化工具。

### 不共享

- Astro Component 与 Vue Component；
- 页面布局实现；
- 路由实现；
- 应用级 CSS；
- 构建配置；
- 客户端状态。

原则：**共享语义和品牌，不共享框架耦合的 UI 代码。**

## 5. 依赖方向

```text
content
   ↓
content-schema / content-utils
   ↓
┌──────────────┬────────────────┐
│              │                │
Astro Web   Slide Generator   RSS Generator
                  ↓
              Slidev App

brand / design-tokens
   ├────────────→ Astro Web
   └────────────→ Slidev App
```

禁止出现：

```text
apps/web → apps/slides 源码依赖
apps/slides → apps/web 源码依赖
content → UI Component
```

## 6. 工具选择

第一阶段只使用 pnpm Workspace，不引入 Turborepo 或 Nx。当前规模下，根脚本、pnpm filter 和 GitHub Actions 缓存已足够；当构建时间和包数量真实增长后再评估任务编排器。

## 7. 官方参考

- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Slidev Building and Hosting: https://sli.dev/guide/hosting
- pnpm Workspaces: https://pnpm.io/workspaces
- GitHub Pages Custom Workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
