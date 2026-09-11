# 构建与跨平台约定

## 本地入口

保持仓库 `package.json` 的 Node `engines` 和精确 `packageManager` 版本；不要求 Windows 用户降级到旧 Node，不自动升级依赖或关闭安装安全策略。

```powershell
pnpm install --frozen-lockfile
pnpm build:preflight
pnpm test:build-tools
pnpm build
```

`build:preflight` 检查实际 Node/pnpm 版本、站点配置、环境 URL 覆盖和必要目录，并输出工作目录及构建目标。版本不匹配时，先激活 `packageManager` 指定的 pnpm，而不是删除锁文件。

`pnpm build` 始终是 canonical clean/full rebuild 入口。它仍执行全部校验、真实 CLI 集成测试、Astro/Slidev 全量构建和最终产物检查；增量 CI 不改变这个合同，也不把局部成功当成完整构建成功。

## 进程边界

`tools/shared/process.ts` 是 Node 工具的异步外部进程入口：

- `runPnpm(args, options)` 保留真实 package-script 合同。它使用当前 pnpm 脚本注入的 `npm_execpath`，不重新从 PATH 找另一份 pnpm。`.js`/`.cjs`/`.mjs` 通过当前 `process.execPath` 运行；standalone 原生可执行文件直接运行。
- `runProcess(command, args, options)` 用于原生可执行文件。参数始终是数组，`shell: false`；不拼接 shell 命令，也不直接执行 `.cmd`、`.bat` 或 `.ps1`。
- 环境变量覆盖保留继承环境，并处理 Windows 的 `Path`/`PATH` 大小写重复。捕获输出按 UTF-8 流解码，等待 `close` 而不是 `exit`；启动错误、信号退出和取消不能被当作预期非零退出。捕获输出上限为 16 MiB；普通构建日志直接流式输出。

需要子进程的工具必须通过上述 pnpm scripts 运行，而不是直接用 `node`/`tsx` 启动并依赖未知的包管理器环境。已有 Git `execFile` 调用原生可执行文件，不需要为了统一名称进行无收益重写。AbortSignal 作用于直接子进程；这不是通用进程树监督器，CI 另有 job 超时约束。

本次不新增运行依赖，不引入 Nx/Turbo，也不把真实 CLI 测试改成只测内部函数。多个 fixture 测试会修改同一份内容树和生成目录，因此同一工作区仍保持串行；不要同时启动两次 `pnpm build`。需要并行构建时，使用独立工作区。

## 配置边界

`tools/shared/site-config-contract.ts` 接受 `unknown`，在 YAML 解析后验证版本、字段类型、必填字段和未知字段。URL 路径与文件系统路径分别校验。

`site.basePath` 和 `SITE_BASE` 支持空字符串、`/` 和合法子路径。来源 URL 必须为不带凭据、路径、查询或 fragment 的 HTTP(S) origin。拒绝穿越段、混合分隔符和畸形 URL 覆盖。

内容目录必须位于 `content/` 下且不重叠。V1 生成目录固定为 `apps/slides/generated`，与生成文件相对导入和 Path Guard 一致。演示产物必须位于 `dist/` 内，不得覆盖 `dist/web` 或 `dist/site`。这些是构建配置校验，不是面向恶意工作区的文件系统沙箱。

`.gitattributes` 统一文本 LF，二进制文件保持原样。现有 pnpm 锁文件、`allowBuilds` 与依赖发布时间策略不变。

## 增量发布边界

PR Preview 和 `main` Site Build 会先判断变更范围。只有以下纯内容源可以进入 content-only fast path：

- `content/briefs/**/*.yaml|yml`
- `content/presentations/**/*.yaml|yml`
- `content/essays/**/*.md`
- `content/knowledge/**/*.md`

任何 `apps/**`、`packages/**`、`tools/**`、`config/**`、`.github/**`、锁文件、根 package 配置、Topic/Source/Author Registry 或无法明确分类的变更都进入 full lane。分类默认 fail closed：不确定就完整构建。

content-only lane 仍执行完整内容/引用/证据/生命周期验证，然后使用两个可丢失的加速层：

1. Astro 官方 incremental-build cache：只复用 cache identity 和框架依赖图都未变化的静态页面；cache miss 自动正常 render。
2. Slidev deck cache：保存 `apps/slides/generated` 与 `dist/slides`。`tools/incremental-build/presentation-impact.ts` 根据变更源计算受影响 deck，并检查所有未重建历史 deck 的缓存完整性；cache miss、共享模板/工具变化、缺少历史 deck 或影响范围不明确时自动回退为全量 Slidev build。

Slidev 的默认本地命令仍是 full：

```powershell
pnpm generate:slides
pnpm build:slides
```

只有显式设置 `SLIDES_IDS=id-a,id-b` 或传入 `--ids` 时才进入 deck-scoped 模式。scoped 模式只替换选中的 generated/output deck 目录，保留其他已验证历史 deck；真实集成测试会用 sentinel 验证无关 deck 不会被误删。

PR Preview 的缓存按 PR 隔离，因为 Preview 的 `SITE_BASE` 与生产地址不同。因此新 PR 第一次没有可用 Slidev cache 时会安全地全量构建；同一 PR 的后续 content-only 更新才能复用该 PR 的历史 deck。`main` 使用独立 cache namespace，并由 full Site Build 播种后续 content-only 发布可复用的历史 deck。

缓存始终只是加速层，不是发布历史或 editorial source of truth。删除所有缓存后，`content/** + repository code` 必须仍能通过 `pnpm build` 重建完整 `dist/site`。

## 验证与发布边界

`Orbis Build Portability` 是只读跨平台回归 workflow。它先运行与 Preview/Site Build 相同的 build-scope 判定：

- build/tooling/配置或无法安全分类的 PR/main 变更：运行完整五矩阵 `pnpm build`；
- content-only PR/main 变更：不重复运行昂贵的跨平台 full matrix，由 canonical Linux Preview/Site Build 负责内容发布验证；
- `workflow_dispatch` 和每周定时任务：强制 full，用于持续证明 clean rebuild 没被增量路径隐藏。

完整矩阵仍在含空格和中文的真实 checkout 路径下运行：Linux 覆盖最低声明 Node 版本；Windows 覆盖 Node 22/24、Node CLI、CRLF worktree 与 standalone pnpm；macOS 覆盖 Node 24。矩阵配置不等于已验证成功，以每个提交对应的 CI 结果为准。

PR Preview、Trusted Publish 与 Production Pages 的治理边界不变：缓存不能直接发布，Preview/Site Build 仍上传经过 artifact checks 的完整 `dist/site`；Production 继续消费受治理的 workflow artifact。Portability workflow 不上传发布产物、不持有写权限、不触发 Pages。

`tools/incremental-build/workflow-contract.test.ts` 会锁定 full/content 分流、Slidev impact/cache wiring 和 scheduled full portability 的关键 workflow 合同，避免后续 YAML 调整静默移除安全回退。

参考：Node `child_process` 官方文档、pnpm `run` 文档、`pnpm/action-setup` 的 `package_json_file` / `standalone` 输入约定，以及 Astro 7.2 incremental static build 合同。
