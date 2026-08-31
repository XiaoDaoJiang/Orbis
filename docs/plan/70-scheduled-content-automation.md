# 70 · Scheduled Content Automation

> 状态：Planned
> Roadmap Milestone：G — Sustainable Automation
> 建议优先级：P2
> 依赖：前述内容合同基本稳定后实施

## 1. 目标

把当前 `config/scheduled-task-prompt.md` 与 `config/daily-task-prompt.md` 的执行合同，升级为稳定、可观察、最小权限的 Scheduled Content Workflow。

目标不是让 Agent 直接发布站点，而是自动完成：

```text
发现 / 研究
    ↓
生成 structured content
    ↓
content-only branch / PR
    ↓
Schema + Path Guard + Preview
    ↓
Human/Policy Review
    ↓
merge main
    ↓
existing Pages pipeline
```

## 2. 安全边界

自动内容任务必须保持：

- 只写 `content/briefs/**`、允许时写 Essay/Knowledge；
- 不写 `apps/**`、`packages/**`、`tools/**`、`.github/**`；
- 不生成 HTML / Slidev generated source / `dist/**`；
- 不直接调用 Pages deploy；
- 不拥有生产 Pages token；
- 不绕过 protected main 与 required Preview Gate。

自动化失败时，宁可不发布，也不能扩大权限兜底。

## 3. 执行模型

第一阶段使用“Producer 可替换、Repository Contract 固定”的模式。

```text
Scheduler
   ↓
Agent Producer
   ↓
content/briefs/YYYY-MM-DD.yaml
   ↓
Repository Validation
   ↓
branch + PR
```

Producer 可以是：

- ChatGPT scheduled task；
- Codex / CLI Agent；
- OpenAI API Agent；
- 未来其他 Runtime。

Orbis 不应绑定某一个 Agent 产品的内部格式。

## 4. Repository 侧能力

### 4.1 Content-only PR Contract

自动 PR 必须带：

- 生成日期；
- 内容路径；
- 校验结果；
- 事实来源数量；
- 是否完成 full build；
- 未验证项。

不在 PR Body 中暴露内部 chain-of-thought 或敏感抓取细节。

### 4.2 Automation Path Guard

现有 `content-agent` mode 继续作为强制边界。

需要增加集成测试证明：

- 合法 content-only diff 通过；
- 修改 config/apps/tools 会失败；
- generated artifact 会失败。

### 4.3 Idempotency

同一天重复执行时必须定义行为：

- 若不存在当日 Brief：创建；
- 若存在 draft/needs-review：更新同一内容分支或创建明确修订 PR；
- 若已 published 且 main 已存在：默认不覆盖，除非显式进入 correction workflow。

避免每天多次运行产生多个互相竞争的 Daily。

### 4.4 Failure Visibility

至少记录：

- Feed 读取失败；
- Primary source verification 不足；
- Schema 失败；
- Path Guard 失败；
- PR 创建失败；
- Preview Build 失败。

公开内容不暴露内部错误，但 Automation Run 必须可追踪。

## 5. Scheduling

Daily 使用 `Asia/Shanghai` 语义确定内容日期。

不要依赖 runner 本地时区隐式计算日期；任务入口应显式传入目标日期或显式转换。

Weekly 自动化在 Plan 30 完成后单独定义，不在本 Plan 中混入 Daily 规则。

## 6. Correction Workflow

已发布内容发现事实错误时，不允许 Scheduled Agent 静默重写历史。

建议：

1. 创建 correction branch；
2. 修改结构化源；
3. PR 明确写出 correction reason；
4. 重新 Preview；
5. 人工/策略评审后合并；
6. 保留 Git history 作为审计记录。

## 7. 实现任务

1. 定义 Automation Producer Interface（输入/输出，不绑定供应商）；
2. 固化 Daily target-date 语义；
3. 增加 content-only PR metadata template；
4. 为 Path Guard 增加 automation integration tests；
5. 实现 idempotency 检查脚本；
6. 实现“已有 published Daily 不覆盖”保护；
7. 选择首个 Scheduler/Producer 实现并接入；
8. 自动创建 branch + PR，而不是 push main；
9. 复用现有 Preview Gate；
10. 增加失败状态可观察性；
11. 进行至少连续 3 次真实 Daily 演练；
12. 验证 correction workflow。

## 8. 非目标

- Agent 自动合并所有 PR；
- Agent 直接部署 Pages；
- 无限制网页爬虫；
- 把模型/API 密钥写入仓库；
- 将 Agent Runtime 嵌入 Astro；
- 为自动化引入数据库或任务平台，除非真实运行证明需要。

## 9. 验收标准

- Scheduled Run 只能产生 allowlisted content diff；
- 同一天重复运行不会创建冲突 Daily；
- 已发布 Daily 不会被静默覆盖；
- 自动 PR 必须经过现有 full build + public Preview；
- 自动化没有 production Pages write 权限；
- 失败可以从 Run/PR 中定位到具体阶段；
- 连续至少 3 个真实周期无手工修改基础设施即可运行；
- Agent Producer 可替换而不修改内容 Schema/Build Pipeline。

## 10. 建议 PR 拆分

1. `feat: add scheduled content workflow contracts and guards`
2. `feat: add daily content branch and pr automation`
3. `test: validate scheduled daily lifecycle end to end`

不要在第一个 PR 就同时接入多个 Agent Provider。
