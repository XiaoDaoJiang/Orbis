# 70 · Site V2 原型验证结果

> 验证日期：2026-08-28  
> 实现分支：`feat/site-v2-foundation`  
> 验证提交：`0af87dfa7215a8a0850b5790735f57c55def5a42`  
> 结论：第一条 Astro + Slidev Vertical Slice 已跑通；当前生产 Pages 未切换。

## 1. 已验证的完整链路

```text
结构化 Brief YAML
        ↓
Zod Schema 与内容校验
        ↓
固定脚本生成 11 页 Slidev Markdown
        ↓
Astro 构建阅读站点与 RSS
        ↓
Slidev 构建交互式演示 SPA
        ↓
组装为单一 dist/site
        ↓
原型 Artifact 自动检查
        ↓
GitHub Actions 上传构建产物
```

## 2. CI 结果

GitHub Actions：

- Workflow：`Site V2 prototype`
- Run：`33162100786`
- 状态：Success
- 地址：https://github.com/XiaoDaoJiang/Orbis/actions/runs/33162100786
- Artifact：`orbis-site-v2-prototype`
- Artifact ID：`9682060038`
- Artifact SHA-256：`7ab9c252f62114be4d6a4305bea936eeee7abf5ade129aae780fd8961948dfdc`
- 保留时间：14 天

该运行使用：

- `actions/checkout@v6`
- `actions/setup-node@v6`
- `actions/upload-artifact@v7`
- Node.js `22.16.0`
- pnpm `11.24.0`

## 3. 构建与自动测试

自动流水线已经验证：

- `content-schema` 正向和失败样例测试通过；
- 6 个真实内容条目通过 Schema 校验；
- Astro 成功生成首页、Essay、Brief、Topic、Knowledge 与 RSS；
- Slidev 成功生成和构建 `2026-08-28` 演示；
- 演示严格为 11 页，不存在额外空白页；
- 第 2 页、10 页、11 页固定语义标签存在；
- Astro 和 Slidev 构建产物成功组装到 `dist/site`；
- 演示使用仓库内 `/Orbis/favicon.svg`，不再依赖 Slidev 默认外部 favicon；
- 所有必需产物存在后才允许上传 Artifact。

自动检查覆盖的关键文件：

```text
dist/site/index.html
dist/site/briefs/2026-08-28/index.html
dist/site/essays/agent-harness-system-layer/index.html
dist/site/topics/agent-harness/index.html
dist/site/knowledge/verification-loop/index.html
dist/site/rss.xml
dist/site/favicon.svg
dist/site/slides/2026-08-28/index.html
apps/slides/generated/2026-08-28/slides.md
```

## 4. 人工原型检查

对 CI 生成的静态 Artifact 做了以下检查：

### Astro 阅读站点

- 桌面首页布局正常；
- 390px 移动视口无横向溢出；
- Brief 阅读版可打开演示入口；
- Essay、Topic、Knowledge 页面均可渲染；
- 内部路径统一使用 `/Orbis/` Base；
- RSS 文件是可解析的 XML 输出。

### Slidev 演示

- 固定 11 页结构存在；
- 键盘翻页可以从第 1 页到达第 11 页；
- Mid-Century Modern 色板和固定布局生效；
- 中文字体使用本地 CJK fallback，不请求 Google Fonts；
- 文本对比度已增强；
- favicon 改为站点本地品牌资产。

## 5. 本次 Vertical Slice 证明了什么

### 已证明

1. 一份 `Brief YAML` 可以同时生成 Astro 阅读版、Slidev 演示版和 RSS 条目；
2. AI 可以只提交结构化内容，不必生成 HTML、CSS、Astro 或 Vue；
3. Astro 与 Slidev 可以独立构建后组装进同一个 GitHub Pages Artifact；
4. 共享 Schema 与设计 Token 可以跨两个应用使用；
5. GitHub Actions 可以作为未来 Pages 发布前的确定性质量门。

### 尚未证明

1. Weekly 和独立 Presentation 的通用生成能力；
2. 多个 Deck 的自动发现和全量/增量构建；
3. 自定义域名下的 Base Path 行为；
4. 搜索、Sitemap、Open Graph 图片与完整 Archive；
5. Scheduled Agent 创建内容 PR 的权限隔离；
6. Pages 从旧 `docs/` 发布源切换到 Actions 的迁移与回滚；
7. 大量历史内容下的构建时间和缓存策略。

## 6. 当前已知技术债

- `2026-08-28` 仍是原型构建脚本中的固定入口，应改为 manifest 自动发现；
- Slidev `--base /Orbis/...` 尚未统一从 `config/site.yaml` 推导；
- 当前使用 `pnpm install --no-frozen-lockfile`，应在进入合并前提交并使用锁文件；
- Slidev 输出目录在项目根之外，构建日志仍有 Vite `outDir` 清理提示；
- 当前 Workflow 只上传普通 Artifact，不发布 Pages；
- Path Guard、CODEOWNERS 与内容 PR 流程尚未落地；
- 视觉系统是可用原型，不是最终 Brand / Design System。

## 7. 下一门控建议

进入 Phase 2 前建议完成：

1. 提交 `pnpm-lock.yaml` 并启用 `--frozen-lockfile`；
2. 增加 Brief/Presentation manifest 和多 Deck 构建脚本；
3. 把 Base URL、站点名和资产路径集中到 `config/site.yaml`；
4. 增加 Path Guard，Scheduled Agent 只能修改 `content/**` 白名单；
5. 为 Draft PR 提供可下载 Artifact，并保留当前生产站不变；
6. 评审通过后，再规划 GitHub Pages Preview 或正式 Cutover。

## 8. 原型结论

当前结果足以确认规划中的核心架构可行：

> Astro 负责内容网站，Slidev 负责演示；二者共享结构化内容、Schema 和品牌 Token，通过 GitHub Actions 组装为单一静态站点。

下一步不应继续扩大页面功能，而应优先把原型中的硬编码转化为通用构建能力，并建立内容自动化的权限边界。
