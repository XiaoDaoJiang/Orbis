# 构建与跨平台约定

## 本地入口

保持仓库 `package.json` 的 Node `engines` 和精确 `packageManager` 版本；不要求 Windows 用户降级到旧 Node，不自动升级依赖或关闭安装安全策略。

```powershell
pnpm install --frozen-lockfile
pnpm build:preflight
pnpm test:build-tools
pnpm build
```

`build:preflight` 检查实际 Node/pnpm 版本、站点配置、环境 URL 覆盖和必要目录，并输出工作目录及构建目标。版本不匹配时，先激活 `packageManager` 指定的 pnpm，而不是删除锁文件。`pnpm build` 仍执行全部原有校验、真实 CLI 集成测试和产物检查；不把局部成功当成完整构建成功。

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

## 验证与发布边界

新增 `Orbis Build Portability` 只读 workflow，在含空格和中文的真实 checkout 路径下执行完整 `pnpm build`：Linux 覆盖最低声明 Node 版本；Windows 覆盖 Node 22/24、Node CLI 与 standalone pnpm；macOS 覆盖 Node 24。矩阵配置不等于已验证成功，以每个提交对应的 CI 结果为准。

现有 PR Preview、Trusted Publish 和 Production Pages workflow 不变。新增 workflow 不上传发布产物、不持有写权限、不触发 Pages。它不会自动修改 GitHub ruleset；维护者可以把该矩阵的检查加入合并必需项。

参考：Node `child_process` 官方文档、pnpm `run` 文档和 `pnpm/action-setup` 的 `package_json_file` / `standalone` 输入约定。
