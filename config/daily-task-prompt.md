# Orbis AI Frontier 每日 Structured Brief 规范

> 时区：Asia/Shanghai  
> 发布仓库：`XiaoDaoJiang/Orbis`  
> 内容源：`content/briefs/YYYY-MM-DD.yaml`  
> 展示与发布：由 Astro + Slidev + GitHub Actions 自动完成

## 1. 目标

每天从高信号 AI / Agent 技术变化中筛选真正值得工程师关注的主题，回查一手来源，形成可验证的工程判断，并产出一份符合 Orbis 当前 Daily Schema 的结构化 Daily Brief。

Agent 只负责内容，不负责 HTML、页面模板、Slidev 源码、archive、latest 或 GitHub Pages 产物。

Scheduled Daily 运行前必须由 Scheduler 按 **Asia/Shanghai** 解析并显式传入 `targetDate=YYYY-MM-DD`。Repository 侧不得根据 runner 本地时区推断“今天”。

## 2. 执行前必须读取

开始前读取当前仓库中的：

- `config/feeds.yaml`
- `packages/content-schema/src/index.ts`
- `apps/slides/templates/daily-v1.ts`
- `AGENTS.md`
- `config/path-guard.yaml`
- 最近若干 `content/briefs/*.yaml`

Schema 与模板代码优先于本说明；如果字段约束发生变化，以仓库当前代码为准。

## 3. Scheduled Daily Identity

对 Scheduled Daily，运行身份必须固定为：

```text
targetDate   = YYYY-MM-DD
branch       = automation/daily/YYYY-MM-DD
contentPath  = content/briefs/YYYY-MM-DD.yaml
```

三处日期必须一致，YAML 中 `publishedAt` 也必须等于 `targetDate`。

同一天重复运行使用同一个 `automation/daily/YYYY-MM-DD` 分支和同一个 PR candidate，不创建竞争分支或第二份 Daily。

Repository base 状态决定动作：

```text
main 不存在 target            → 创建或更新同一 automation candidate
main 已存在且 status=published → already-published；停止且不写入
main 已存在其他状态            → revision-required；停止 Scheduled Daily
已发布内容需要事实修正         → 进入显式 correction workflow
```

Scheduled Daily 不得自动进入 correction workflow，也不得静默覆盖 `main` 上任何已存在的目标文件。

## 4. 信息发现顺序

第一项外部信息读取动作必须是读取 `config/feeds.yaml` 中所有 `enabled: true` 的 RSS。

- 读取最近 48 小时条目；
- RSS 仅用于发现候选，不得把聚合摘要当最终事实；
- 对转载、标题改写和同一事件做聚类去重；
- 过滤广告、纯融资宣传、无技术增量更新、重复榜单和未经验证传闻；
- RSS 主地址失败时尝试配置中的备用地址；
- 所有启用源均失败时可以继续使用高信噪网页来源，但必须如实记录执行状态。

重点覆盖：Agent、Multi-Agent、LLM、Coding Agent、Agent Harness / Runtime、MCP / Tool Use、Memory / Context Engineering、Evaluation / Verification、Security / Sandbox、AI Infra / Inference / Routing，以及值得学习或验证的开源项目。

## 5. 一手来源核验

每个进入最终 Brief 的核心判断至少有一项一手依据：

- 官方发布或官方技术博客；
- 原始论文；
- GitHub 原始仓库、Release、README 或提交记录；
- Hugging Face 模型卡；
- 官方文档、规范或安全报告。

社区讨论只能补充体验、限制和争议，不能替代官方事实。厂商自报 benchmark 必须注明属于官方报告；个人实验不能写成普遍结论。

Evidence V1 把这项编辑要求进一步结构化：每个 section factual fact 都必须有 stable fact ID，并通过 `evidence[]` 明确绑定 canonical top-level reference ID。`supports` 仍是给 Reviewer 阅读的说明，不能替代机器可检查的 evidence edge。

## 6. 选题与写作原则

最终内容应围绕 4–8 个高价值信号形成统一判断，不做新闻流水账。

表达要求：

- 使用中文，模型、协议、项目和产品名保留英文；
- 先给结论，再给依据；
- 每个专题回答“发生了什么、为什么重要、限制是什么、下一步做什么”；
- 标题表达判断而不是复述新闻标题；
- 避免“震撼、颠覆、杀疯了、遥遥领先”等营销措辞；
- 不暴露 RSS 抓取、内部 Prompt、自动化或部署实现细节。

Synthesis 字段（如 `signals[].summary`、`section.conclusion`、`actions[]`）不得引入没有出现在 evidence-bound facts 中的新的关键外部事实。Evidence coverage 只证明结构化证据绑定完整，不代表机器自动证明事实真实性。

## 7. Daily Brief Schema 合同 · Evidence V1

输出文件固定为：

`content/briefs/YYYY-MM-DD.yaml`

对 Scheduled Daily，文件名日期必须等于显式 `targetDate`。

所有**新 Scheduled Daily candidate** 必须使用 `evidenceVersion: 1`：

```yaml
kind: brief
cadence: daily
evidenceVersion: 1
publishedAt: YYYY-MM-DD
status: published
title: ...
summary: ...
topics: [...]
signals: [...]       # 恰好 4 项
sections:            # 恰好 5 项
  - id: stable-section-id
    layout: architecture
    title: ...
    conclusion: ...
    facts:
      - id: stable-fact-id
        text: 具体 factual claim
        evidence:
          - canonical-reference-id
    limitations: []
projects: [...]      # 最多 6 项
radar: [...]         # 最多 8 项
actions: [...]       # 3–5 项
references:
  - id: canonical-reference-id
    title: ...
    url: https://...
    source: existing-source-registry-id
    supports: 该来源支撑的事实说明
    accessedAt: YYYY-MM-DD
archivePicks: [...]  # 最多 6 项
corrections: []      # 正常新 Daily 为空；Scheduled Daily 不自动写历史 correction
presentation:
  enabled: true
  template: daily-v1
```

### signals

每项包含 `title`、`summary`、`impact: high | medium | watch`。必须恰好 4 项，并覆盖本期最重要的四个判断。

### sections / facts

必须恰好 5 个 sections。每个 section 包含 `id`、`layout`、`title`、`conclusion`、`facts`、`limitations`。`layout` 只能是 `architecture | comparison | timeline | metrics | system-map`。

Evidence V1 的每个 `facts[]` 项是对象而不是字符串：

```yaml
- id: stable-fact-id
  text: factual claim
  evidence: [canonical-reference-id]
```

要求：

- section ID 与 fact ID 使用稳定 lowercase kebab-case；
- fact ID 在所属 section 内唯一；
- 每个 fact 至少一个 evidence ID；
- 同一个 fact 不重复同一 evidence ID；
- evidence ID 必须解析到本 Daily top-level `references[]`；
- Evidence V1 section 不再重复持久化完整 `references[]` object。

### references

`references[]` 是本 Daily 唯一 canonical evidence registry。每项必须有 stable reference ID，并包含 `title`、`url`、可选 `source`、`supports`、可选 `accessedAt`。

- reference ID 在 Daily 内唯一；
- 声明 `source` 时必须使用已存在 Source Registry ID；
- canonical evidence reference 必须被至少一个 fact 或 correction 使用；
- 仅用于延伸阅读、但不支撑本期 factual fact 的历史链接应放 `archivePicks`，不要伪装成 evidence reference。

### corrections

正常 Scheduled Daily candidate 的 `corrections` 应为空。已发布内容的事实修正必须进入显式 correction workflow；Scheduled Daily 不自动进入 correction mode。

### projects

用于 Open Source Radar。每项使用 `action: CLONE | READ | TEST | WATCH`、`name`、`summary`、`maturity: experimental | early | growing | stable`、`url`。

### radar

用于 Impact × Adoption Horizon。`impact` 与 `horizon` 均为 0–100，必须能解释为何应立即验证、近期采用或长期观察。

### actions

必须 3–5 项，每项都应是工程师可执行动作。

### archivePicks

从 Orbis 已有结构化内容中选择仍有长期价值、且与本期有关的历史内容。优先读取 `content/briefs/**`、`content/essays/**`、`content/knowledge/**`；不得依赖旧 `docs/archive.json` 或旧 HTML 历史站。

已发布的 pre-H legacy Daily 仅作为冻结迁移债务继续读取；新 Scheduled Daily 不得继续产出 legacy string-facts / section-references shape。

## 8. 固定 11 页语义

`daily-v1` 模板自动把结构化字段映射为 11 页：封面、FOUR SIGNALS、五个 sections、OPEN SOURCE RADAR、IMPACT × ADOPTION HORIZON、FROM SIGNALS TO ACTION、EXTENDED READING。

Agent 不手写页面，也不改变模板布局、视觉系统、导航或交互。Evidence V1 不增加第 12 页。

## 9. 写入与校验

完成 YAML 后：

1. 再次确认显式 `targetDate` 来自 Asia/Shanghai，并与 branch、contentPath、`publishedAt` 完全一致；
2. 确认 base 不存在目标 Daily；若 base 已 published，返回 `already-published` 且不写入；若 base 存在其他状态，返回 `revision-required`；
3. 对 Scheduled Daily 使用确定性分支 `automation/daily/YYYY-MM-DD`，同日 rerun 只更新同一 candidate；
4. 确认 candidate 使用 `evidenceVersion: 1`、stable fact ID、explicit evidence ID 与 canonical reference ID；
5. 运行 `pnpm validate`；
6. 可单独运行 `pnpm evidence:daily:report` 检查 evidence coverage / migration debt；
7. 环境允许且依赖完整时运行 `pnpm build`；
8. 环境具备完整 Git base 时运行 `pnpm automation:daily:guard --base <integration-base> --target-date <targetDate>`；
9. 仅提交允许的 structured content 路径；
10. 不提交 `apps/slides/generated/**`、`dist/**` 或任何生成 HTML。

构建系统负责自动产生阅读版、演示版、日期路由、`/latest/`、`/archive.json` 与 `/rss.xml`。

## 10. Correction boundary

已发布 Daily 的事实修正必须使用单独的 correction workflow，并在 PR 中说明错误、修正原因和新证据。Scheduled Daily Job 不自动修改历史，也不因为 rerun 自动进入 correction mode。

Evidence V1 correction provenance 与 append-only correction guard 属于显式 correction workflow；正常 Scheduled Daily 不能删除、重写或制造历史 correction event。

## 11. 禁止事项

不得：

- 写入或维护旧 `docs/` HTML 发布产物；
- 生成单文件 HTML 作为仓库源文件；
- 直接修改 Astro / Vue / Slidev 模板来适配当天内容；
- 修改 GitHub Actions 或 Pages 配置；
- 修改 `config/evidence-integrity.yaml` legacy allowlist；
- 创建或修改 Source / Author / Topic Registry；
- 直接 push `main`、自动 merge 或触发 Production Pages deploy；
- 伪造来源、evidence coverage、验证结果、CI、PR Preview 或生产部署状态。

Orbis 的长期原则是：**内容是源，展示是构建产物；候选由 Agent 生产，发布由 Repository Gate 决定；证据关系必须显式，事实真实性仍由证据与 Human Review 负责。**
