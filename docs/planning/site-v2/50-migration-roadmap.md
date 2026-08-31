# 50 · 迁移路线图

## 总体原则

- 当前 `main/docs` 站点在新架构达到可替代状态前保持运行；
- 先建立内容契约，再实现 UI；
- 先迁移一份真实内容，再扩展 Daily / Weekly；
- 切换 Pages 发布源是独立门控，不与基础重构混在一个步骤中。

## Phase 0 · 规划与冻结

当前分支完成：

- 产品范围；
- Monorepo 结构；
- 内容模型；
- 路由；
- RSS 与发布链路；
- 风险和验收标准。

建议在实现前为当前站点打 Tag：

```text
v1-static-pages
```

## Phase 1 · Foundation

实现分支建议：

```text
feat/site-v2-foundation
```

交付：

- pnpm Workspace；
- `apps/web` Astro 空站；
- `apps/slides` Slidev Theme 空壳；
- `packages/content-schema`；
- `packages/design-tokens`；
- Brand / Design 基础目录；
- validate workflow；
- 不切换 Pages。

门控：

- 根目录一条命令可完成安装、校验和构建；
- Astro 与 Slidev 可分别本地运行；
- Schema 测试通过。

## Phase 2 · First Vertical Slice

迁移一份真实历史内容，例如现有 2026-08-28 Brief：

```text
content/briefs/2026-08-28.yaml
```

同一份内容生成：

- Astro 阅读版；
- Slidev 演示版；
- References；
- Topic 关联；
- Archive 条目。

门控：

- 不复制事实内容；
- 所有来源链接可用；
- 阅读版和演示版互相跳转；
- GitHub Actions 生成可下载的预览 Artifact。

## Phase 3 · Core Content Types

增加：

- Essay；
- Weekly Brief；
- Presentation；
- Topic；
- Knowledge；
- Source Registry；
- 默认 RSS。

门控：

- 每种类型至少有一个真实样例；
- Topic 可跨类型聚合；
- RSS 可被标准阅读器解析。

## Phase 4 · Pages Cutover

执行：

1. 生成完整 `dist/site`；
2. 增加旧 URL 兼容页；
3. 启用 GitHub Actions 作为 Pages Source；
4. 部署并验证；
5. 保留可回滚到 `v1-static-pages` 的说明。

验证：

- `/`；
- `/essays/`；
- `/briefs/`；
- `/slides/<slug>/`；
- `/topics/`；
- `/knowledge/`；
- `/archive/`；
- `/rss.xml`；
- 历史 URL。

## Phase 5 · Content Automation

缩减定时任务职责为：

- RSS 发现；
- 一手来源核验；
- 生成 Markdown / YAML；
- 创建 PR；
- 等待 CI；
- 发布后返回公网链接。

增加 Path Guard，自动任务修改 UI、Brand、Workflow 时构建失败。

## Phase 6 · Scale When Needed

只在出现真实需求后增加：

- 全文搜索；
- 多 Feed 输出；
- 自定义域名；
- 评论系统；
- 内容预览环境；
- 增量 Slidev 构建；
- CMS；
- 多语言。

## 建议的实现 PR 切分

1. `foundation: initialize pnpm workspace and shared packages`
2. `web: add Astro shell and content collections`
3. `slides: add Slidev theme and fixed layouts`
4. `content: migrate first brief vertical slice`
5. `publishing: assemble Astro and Slidev artifacts`
6. `content: add essays topics knowledge and RSS`
7. `pages: switch deployment source with legacy redirects`
8. `automation: restrict agents to content paths`
