# Scheduled Daily Auto Merge 运维手册

## 权限与执行链

Scheduled Daily Producer 仍只创建/更新唯一 `automation/daily/YYYY-MM-DD` PR；不能启用 Auto Merge、合并、直接写 main 或调用生产部署。

仓库负责：read-only PR Preview Build → Trusted Preview Publish + 精确版本公网 smoke → 当前 head SHA 的 `scheduled-daily-merge-gate` commit status → 专用凭据请求 GitHub 原生 Auto Merge → main push → Site Build → Pages Promote。内容事实质量仍需来源核验；机器门禁不等价于人工事实审查。

`config/daily-auto-merge.json` 是合并资格配置，当前仅信任 XiaoDaoJiang 的稳定 GitHub user ID `38294800`。变更生产者需要单独审查配置，不能只添加分支名或正文标记。合并门禁要求同仓库、main 目标、开放非 Draft PR、受信任作者、合法日期、唯一匹配路径且文件为新增。当前 main 已存在该日报时拒绝，包括已发布与非 published 内容；correction PR 从不自动集成。

`pull_request_target` 仅执行从 `refs/heads/main` 读取的无依赖策略代码，并发布当前 head SHA 的 pending/success/failure/error 状态。它不执行 PR 代码、不安装依赖、不下载 PR artifact、不访问合并 Secret。普通 PR 的 `manual-only` 成功状态只是让原有人工流程继续，不授予自动合并资格。共享同一 SHA 的 Daily PR 不能被普通 PR 的状态覆盖放行。

Preview 发布、状态验证、合并是隔离的 jobs。只有最后的合并 job 使用 `daily-auto-merge` Environment；该 job 不下载预览 artifact。缺少配置或权限时不回退默认 Token，不使用 `--admin`，不自动批准 Review。

## 一次性启用顺序

### 1. 先合并基础设施 PR

审查并合并 #59；新工作流只有进入 main 后才作为受信任策略运行。不要为此移除现有 `build-preview` 或讨论解决要求。此时 `ORBIS_DAILY_AUTO_MERGE` 尚未设为 `true`，不会自动合并内容。

### 2. 让门禁生成真实状态，再加入 main Ruleset

用下一期真正新增的 Daily PR 跑完 Preview Build / Publish。即使自动合并未开启，当前 PR head 也会收到 `scheduled-daily-merge-gate` 状态。

进入 Repository Settings → Rules → Rulesets → main → Require status checks to pass，保留 `build-preview`，新增 `scheduled-daily-merge-gate`；两者 Expected source 都选 **GitHub Actions**。代码会通过 GitHub 的有效分支规则 API 核验两者及其 integration ID，未配置完成时输出 `required-gates-not-configured` 并不合并。

保留 PR 要求及讨论解决要求，不添加 bypass。要求人工批准或 Environment 审批时，Auto Merge 不会绕过；因此配置了这些审批就不是无人值守。Require branches to be up to date 可以额外约束最新 main 的集成构建，但落后分支可能需要更新并重新验证；本功能不自动 rebase/update branch。

### 3. 创建隔离的合并凭据

创建 fine-grained PAT，Repository access 仅选择 `XiaoDaoJiang/Orbis`，Repository permissions 仅需 Contents: Read and write、Pull requests: Read and write（Metadata read 为默认）。设置有效期并自行保存到密码管理器；不要放入聊天、Git、日志或 PR 正文。长期部署可另行迁移 GitHub App 安装令牌，但不能把短期安装令牌当成永久 Secret。

Repository Settings → Environments → 新建 `daily-auto-merge`：

- Deployment branches and tags 使用 Selected branches and tags，仅添加 **Branch: main**，不允许 tags 或 PR refs。
- 无人值守场景不设置 required reviewers / wait timer；不要关闭已有生产 Environment 的审核规则。
- 在此 **Environment** 添加 Secret `ORBIS_AUTO_MERGE_TOKEN`，值为上述 PAT。
- 不要把同名 Token 放成一般 repository Secret：Environment 的 main 分支限制用于隔离合并凭据。

`workflow_run` 的执行 ref 是默认分支，而不是源 PR head，因此受信任 publisher 的最后一个 job 能使用该 Environment。任何 PR 代码均不在有合并凭据的 job 中执行。

### 4. 最后打开开关

Repository Settings → General → Pull Requests：勾选 **Allow auto-merge**，保留 **Allow squash merging**。

Repository Settings → Secrets and variables → Actions → Variables：新增 repository variable `ORBIS_DAILY_AUTO_MERGE`，值严格为 `true`。这不是 Secret；Environment variable 不能替代这个 job 调度前读取的 repository variable。

本机已登录 GitHub CLI 时也可执行：

```powershell
gh repo edit XiaoDaoJiang/Orbis --enable-auto-merge
gh variable set ORBIS_DAILY_AUTO_MERGE --repo XiaoDaoJiang/Orbis --body true
gh api repos/XiaoDaoJiang/Orbis --jq '.allow_auto_merge'
```

不要由 Daily Producer 运行这些管理命令。

## 验收与重试

代码进入 main、设置就绪后，在 Actions 重跑目标 Daily PR 的 **Orbis PR Preview Build**，让其触发一个使用最新 main 合同的 Preview Publish。不要重跑合并 #59 之前创建的旧 Publish run 来验证新工作流，因为 rerun 使用原始运行版本。

确认同一个 PR 的：新增 Daily 唯一文件 → Preview Build 成功 → 公网 `orbis-preview-provenance.json` 与本次 source SHA/run/attempt、publisher run/attempt 完全匹配 → SHA 上的门禁成功 → merge job 输出 `auto-merge-enabled` 或 `merged` → PR 最终 Merged → merge commit 对应的 main Site Build → Pages Promote / 公网验收成功。不要把 `auto-merge-enabled` 说成已经发布。

`gh pr merge --auto` 在 PR 已可合并时可能立即合并，所以只在最后一步使用专用 Token，避免默认 `GITHUB_TOKEN` 抑制后续 main push workflow。现有生产发布链不修改、不另行 dispatch、不把预览产物当生产产物。

常见安全停止：

| reason | 含义与操作 |
| --- | --- |
| `manual-only` | 普通代码/配置/修正 PR，仅人工流程 |
| `waiting-for-current-trusted-preview` | 等待当前 head 对应的可信预览 |
| `stale-preview` / `head-moved` / `stale-run-attempt` | 旧结果不得授权新版本；等待或重跑当前 PR Build |
| `daily-already-on-main` / `not-new-daily` | 不是新一期；不得自动进入修正流程 |
| `preview-not-verified` | Build / Publish / 精确版本公网 smoke 不满足 |
| `missing-merge-token` | Environment Secret 未配置或未提供，不回退默认 Token |
| `repository-auto-merge-unavailable` | 仓库 Auto Merge 或 Squash 开关未开启 |
| `required-gates-not-configured` | 必需状态或 GitHub Actions 来源绑定未设置 |
| `auto-merge-enabled` | 仅已登记等待，不等于已合并 |
| `merged` | GitHub 已确认合并，还需检查生产流水线 |

GitHub CLI/API 出错会失败退出；不能扩大权限重试。Secret 过期需要人工轮换。

## 暂停与撤销

先将 repository variable `ORBIS_DAILY_AUTO_MERGE` 改为 `false`，停止后续自动合并申请。**它不会撤销已经登记的 GitHub 原生 Auto Merge**；对尚未合并的 Daily PR 还应在页面 Disable auto-merge，或由管理员执行：

```powershell
gh pr merge <PR_NUMBER> --repo XiaoDaoJiang/Orbis --disable-auto
```

需要彻底停用时再撤销专用 PAT。不要删除 Required Checks 来排障，也不要重新生成或覆盖已发布日报进行测试。

## 测试

```powershell
node --test tools/content-automation/daily-auto-merge.test.mjs
pnpm test:content-automation
pnpm build
```

无依赖 Node 测试覆盖资格、分页数据、SHA/attempt/元数据并发、API 错误、同 SHA 多 PR、来源绑定、缺少凭据和配置、明确的 merge 结果及工作流权限合同。真实 Secret、Ruleset 与发布链只能通过上述端到端验收验证，不能由单元测试替代。

## 上游依据

- GitHub workflow 触发与 GITHUB_TOKEN 限制：https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- workflow_run / pull_request_target 权限边界：https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- 分支有效规则 API：https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch
- Commit status API：https://docs.github.com/en/rest/commits/statuses
- GitHub CLI merge：https://cli.github.com/manual/gh_pr_merge
