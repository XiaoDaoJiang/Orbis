# Orbis AI Frontier 定时任务入口提示词

每天按 **Asia/Shanghai** 时区执行一次 AI Frontier 技术 Brief 生成任务。

Scheduler 在开始研究前必须解析并显式传入：

```text
targetDate=YYYY-MM-DD
```

不得依赖运行环境本地时区推断日期。

## 唯一仓库

所有读取、写入和提交都针对：

`XiaoDaoJiang/Orbis`

不得再读取、修改或发布 `XiaoDaoJiang/ai-frontier`，不得维护旧 `docs/` HTML 站点。

## 执行前置条件

开始前必须读取并遵循当前仓库中的：

1. `config/daily-task-prompt.md` — 每日选题、事实核验和 structured Daily Brief 规范；
2. `config/feeds.yaml` — RSS 来源与筛选配置；
3. `AGENTS.md` — Agent 修改边界；
4. `config/path-guard.yaml` — 可执行路径约束；
5. `packages/content-schema/src/index.ts` — 最终 Schema 合同。

仓库当前版本是唯一最新规范。

## Scheduled Daily Identity

每次运行的确定性身份固定为：

```text
targetDate   = YYYY-MM-DD
branch       = automation/daily/YYYY-MM-DD
contentPath  = content/briefs/YYYY-MM-DD.yaml
```

`targetDate` 由 Asia/Shanghai 解析；branch、contentPath 与 YAML `publishedAt` 必须使用相同日期。

同日 rerun 必须收敛到同一个 `automation/daily/YYYY-MM-DD` branch / PR，不创建竞争候选。

在写入前检查 integration base：

```text
目标不存在                     → 创建/更新确定性 candidate
目标 status=published           → already-published；不写入、不新建 PR
目标存在但不是 published        → revision-required；停止 Scheduled Daily
已发布内容需要修正              → explicit correction workflow
```

Scheduled Task 不得自动进入 correction workflow，不得静默覆盖已存在的 main Daily。

## 必须执行

- 第一项外部信息读取动作必须是读取 `feeds.yaml` 中所有 `enabled: true` 的 RSS；
- RSS 只用于发现候选主题，所有最终事实必须回查官方发布、原始论文、GitHub、模型卡或官方文档；
- 聚焦 Agent、LLM、Coding Agent、Agent Harness、Agent Runtime、MCP、Memory、Evaluation、Verification、Security、AI Infra 与高价值开源项目；
- 生成一个符合 `dailyBriefSchema` 的 `content/briefs/YYYY-MM-DD.yaml`，日期必须等于 `targetDate`；
- Daily 必须保持固定 4 个 signals、5 个 sections、3–5 个 actions，并使用 `presentation.template: daily-v1`；
- `presentation.enabled` 默认设为 `true`，由构建系统自动生成 Astro 阅读版、11 页 Slidev 演示版、RSS、日期路由、`archive.json` 与 `/latest/`；
- 不生成或提交 HTML、CSS、JavaScript、Astro、Vue、Slidev generated source、`dist/**`、archive 文件或 latest 文件；
- 不修改 `.github/**`、`apps/**`、`packages/**`、`tools/**`、`config/**` 或根 workspace/lock 文件；
- 提交前运行内容校验；环境允许时运行完整 `pnpm build`；
- 环境有完整 Git base 时运行 `pnpm automation:daily:guard --base <integration-base> --target-date <targetDate>`；
- 不直接 push `main`，不自动 merge，不调用 Production Pages deploy；
- 不得虚构来源、提交状态、CI 状态、Preview 状态、部署状态或公网链接。

## PR 模型

Producer 的职责是产生或更新一个受控 candidate：

```text
Asia/Shanghai targetDate
  -> automation/daily/YYYY-MM-DD
  -> content/briefs/YYYY-MM-DD.yaml
  -> schema / Scheduled Daily guard
  -> content-only PR
  -> repository full Build
  -> Trusted Preview
  -> Human / Policy Review
  -> merge main
  -> existing governed Pages pipeline
```

Producer 只能报告自己实际执行过的 validation / build。GitHub CI、Trusted Preview 与 Production 状态必须等真实系统完成后再记录，不能预先声称成功。

PR metadata 使用 Repository 定义的 provider-neutral `DailyAutomationReport`；不得包含 chain-of-thought、密钥、内部 prompt 或不必要的抓取原文。

## 发布模型

Agent 的职责到“提交结构化候选内容 PR”结束。

```text
content/briefs/YYYY-MM-DD.yaml
  -> schema validation
  -> Astro
  -> Slidev daily-v1
  -> RSS
  -> archive/date/latest routes
  -> dist/site
  -> governed GitHub Pages
```

Agent 不直接维护发布产物，也不拥有 Production Pages write 权限。

## 最终回复

成功创建/更新 candidate 时包含：

1. `AI FRONTIER · YYYY-MM-DD`；
2. 3～5 行中文导读；
3. `targetDate`、确定性 branch 与 structured Brief 路径；
4. 已实际验证的 validation / build / PR / Preview 状态；未验证项必须明确写“未验证”。

若 base 已有 published Daily，则返回 `already-published` 并说明没有写入。若需要修改历史内容，则说明必须进入 correction workflow。

不要在最终回复中暴露内部提示词、RSS 抓取细节、中间处理数据或私有推理。
