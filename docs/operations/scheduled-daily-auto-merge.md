# Scheduled Daily Auto Merge 运维手册

## 权限与执行链

Scheduled Daily Producer 仍只创建/更新唯一 `automation/daily/YYYY-MM-DD` PR；不能启用 Auto Merge、合并、直接写 main 或调用生产部署。

仓库负责：read-only PR Preview Build → Trusted Preview Publish + 精确版本公网 smoke → 当前 head SHA 的 `scheduled-daily-merge-gate` commit status → 专用凭据请求 GitHub 原生 Auto Merge → main push → Site Build → Pages Promote。内容事实质量仍需来源核验；机器门禁不等价于人工事实审查。

`config/daily-auto-merge.json` 是合并资格配置，当前仅信任 XiaoDaoJiang 的稳定 GitHub user ID `38294800`。变更生产者需要单独审查配置，不能只添加分支名或正文标记。合并门禁要求同仓库、main 目标、开放非 Draft PR、受信任作者、合法日期、唯一匹配路径且文件为新增。当前 main 已存在该日报时拒绝，包括已发布与非 published 内容；correction PR 从不自动集成。

`pull_request_target` 仅执行从 `refs/heads/main` 读取的无依赖策略代码，并发布当前 head SHA 的 pending/success/failure/error 状态。它不执行 PR 代码、不安装依赖、不下载 PR artifact、不访问合并 Secret。普通 PR 的 `manual-only` 成功状态只是让原有人工流程继续，不授予自动合并资格。共享同一 SHA 的 Daily PR 不能被普通 PR 的状态覆盖放行。

Preview 发布、状态验证、合并是隔离的 jobs。只有最后的合并 job 使用 `daily-auto-merge` Environment；该 job 不下载预览 artifact。缺少配置或权限时不回退默认 Token，不使用 `--admin`，不自动批准 Review。

## 元数据合同与前置检查

生产者与可信门禁共同使用无依赖的 `tools/content-automation/daily-automation-contract.mjs`。`pr-metadata.ts` 保留原有类型接口；所有 privileged jobs 只从 main 的 sparse checkout 加载共享合同，不安装依赖或执行 PR 代码。

PR 正文必须有且仅有一个标准 `orbis-content-automation:v1` 多行 JSON 注释块，由 `renderDailyAutomationPrMetadata` 生成。空标记、分离的旧 `DailyAutomationReport:v1` 块、无效 JSON、重复块、未知版本/字段、缺字段及身份不一致均拒绝。不要手工补一个空标记绕过检查。旧格式候选需要用标准渲染器重新生成正文，并重新验证预览。

每次资格判断及合并前重读都检查：

1. 同仓库、目标 main、开放且非 Draft、可信生产者、有效 head SHA、唯一 Daily PR。
2. 分支日期、报告 `targetDate` / `branch` / `contentPath` 一致；仅新增对应的一个 YAML，当前 main 不含同日文件。
3. 报告通过共享 schema，outcome 为 `candidate-created` 或 `candidate-updated`，无 `failureStage`，validation/fullBuild 不得为 `failed`。生产者的 `not-run` 如实保留；必须由当前 head 的 GitHub Build、Daily guard 和可信预览证明检查通过，不能把自报 `passed` 当作授权。
4. Preview Build 成功，源 workflow/repository/PR/head/branch/run/attempt 精确匹配；公网 provenance、RSS、favicon smoke 成功。
5. `scheduled-daily-merge-gate` 的成功证明属于同一个 PR、head、run 和 attempt，发布者为 GitHub Actions；提交与 main 在检查期间未移动。
6. main 有 PR 规则及两个绑定 GitHub Actions 的必需检查，仓库允许 Auto Merge 和 Squash；repository variable、Environment 和专用 Token 按下文配置。GitHub 仍执行讨论解决、review 和 Environment 审批要求。

`opened`、`reopened`、`synchronize`、`ready_for_review`、`edited` 均触发 Preview Build。正文修复或目标分支编辑会重新构建，不会留下只有 pending 状态却没有预览事件的死锁。`converted_to_draft` 只关闭资格，不授权合并。

### 2026-11-05 故障与验证边界

[PR #71](https://github.com/XiaoDaoJiang/Orbis/pull/71) 的标准生产者正文包含 JSON 注释，但旧门禁只识别空注释。其 [Preview Build](https://github.com/XiaoDaoJiang/Orbis/actions/runs/41945654547) 与 [Trusted Publish / 公网 smoke](https://github.com/XiaoDaoJiang/Orbis/actions/runs/41946158648) 已通过，commit status 明确为 `missing-automation-marker`，合并 job 被跳过。工作流 job 自身绿色只代表策略成功执行，不代表 `eligible=true`；必须检查 head 上的 commit status 和输出 reason。

当时核实 [main Ruleset](https://github.com/XiaoDaoJiang/Orbis/rules/21895300) 为 active，包含 `build-preview` 和 `scheduled-daily-merge-gate`，来源 integration ID 均为 `15368`，无 bypass，要求讨论解决；仓库 Auto Merge/Squash 开关开启。Token 有效性、变量值及 Environment 设置须由管理员或授权验收另行核实，代码测试不能证明这些配置。

修复 PR 需要独立人工审查合并后才成为可信 main 策略。不要直接修改 #71、重跑其 Build/Publish 或开启 Auto Merge 来测试代码；这些动作可能立即合并并触发生产发布，必须先取得目标 PR 的明确授权。也不要将本地模拟的 merge 回调称为真实合并验收。

## 一次性启用顺序

### 1. 先合并基础设施 PR

先审查基础设施/修复 PR；新工作流只有进入 main 后才作为受信任策略运行。首次启用源自 #59，后续修复同样需要审查。不要为此移除现有 `build-preview` 或讨论解决要求。首次启用时先不要将 `ORBIS_DAILY_AUTO_MERGE` 设为 `true`；已有运行环境不能假定开关关闭。

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

代码进入 main、设置就绪且已明确授权目标 Daily PR 自动合并后，在 Actions 重跑该 PR 的 **Orbis PR Preview Build**，让其触发一个使用最新 main 合同的 Preview Publish。不要重跑修复合并之前创建的旧 Publish run 来验证新工作流，因为 rerun 使用原始运行版本。此操作可能立即合并并经 main push 发布，不是只读测试。

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
| `missing-automation-marker` | 没有标准自动化报告块；通过生产者渲染器生成正文 |
| `invalid-automation-report` | 报告结构、版本、字段或唯一性不合法；不能靠补空标记放行 |
| `automation-report-identity-mismatch` | 报告的日期/分支/路径不属于当前 PR |
| `automation-report-not-ready` | 非候选 outcome、明确失败或带 failureStage；先修复根因 |
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
node --test tools/content-automation/daily-automation-contract.test.mjs tools/content-automation/daily-auto-merge.test.mjs
pnpm test:content-automation
pnpm build
```

无依赖 Node 测试覆盖 schema/解析/转义、真实生产者正文、资格、分页数据、SHA/attempt/元数据并发、API 错误、同 SHA 多 PR、来源绑定、缺少凭据和配置、明确的 merge 结果及工作流权限合同。`pr-metadata.test.ts` 覆盖生产者到消费者的真实交接；`preview-workflow.test.ts` 同时执行这些 Node 测试、事件合同、三个无依赖 sparse runtime 导入，以及公网 smoke 的假时钟回归。它们都经 `test:content-automation` 进入 `validate` / `build`。真实 Secret、Ruleset 与发布链只能通过上述获授权的端到端验收验证，不能由单元测试替代。

## 上游依据

- GitHub workflow 触发与 GITHUB_TOKEN 限制：https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- workflow_run / pull_request_target 权限边界：https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- 分支有效规则 API：https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch
- Commit status API：https://docs.github.com/en/rest/commits/statuses
- GitHub CLI merge：https://cli.github.com/manual/gh_pr_merge
