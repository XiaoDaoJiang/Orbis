# Orbis AI Frontier 每日 Structured Brief 规范

> 时区：Asia/Shanghai  
> 发布仓库：`XiaoDaoJiang/Orbis`  
> 内容源：`content/briefs/YYYY-MM-DD.yaml`  
> 展示与发布：由 Astro + Slidev + GitHub Actions 自动完成

## 1. 目标

每天从高信号 AI / Agent 技术变化中筛选真正值得工程师关注的主题，回查一手来源，形成可验证的工程判断，并产出一份符合 Orbis `dailyBriefSchema` 的结构化 Daily Brief。

Agent 只负责内容，不负责 HTML、页面模板、Slidev 源码、archive、latest 或 GitHub Pages 产物。

## 2. 执行前必须读取

开始前读取当前仓库中的：

- `config/feeds.yaml`
- `packages/content-schema/src/index.ts`
- `apps/slides/templates/daily-v1.ts`
- `AGENTS.md`
- `config/path-guard.yaml`
- 最近若干 `content/briefs/*.yaml`

Schema 与模板代码优先于本说明；如果字段约束发生变化，以仓库当前代码为准。

## 3. 信息发现顺序

第一项外部信息读取动作必须是读取 `config/feeds.yaml` 中所有 `enabled: true` 的 RSS。

- 读取最近 48 小时条目；
- RSS 仅用于发现候选，不得把聚合摘要当最终事实；
- 对转载、标题改写和同一事件做聚类去重；
- 过滤广告、纯融资宣传、无技术增量更新、重复榜单和未经验证传闻；
- RSS 主地址失败时尝试配置中的备用地址；
- 所有启用源均失败时可以继续使用高信噪网页来源，但必须如实记录执行状态。

重点覆盖：Agent、Multi-Agent、LLM、Coding Agent、Agent Harness / Runtime、MCP / Tool Use、Memory / Context Engineering、Evaluation / Verification、Security / Sandbox、AI Infra / Inference / Routing，以及值得学习或验证的开源项目。

## 4. 一手来源核验

每个进入最终 Brief 的核心判断至少有一项一手依据：

- 官方发布或官方技术博客；
- 原始论文；
- GitHub 原始仓库、Release、README 或提交记录；
- Hugging Face 模型卡；
- 官方文档、规范或安全报告。

社区讨论只能补充体验、限制和争议，不能替代官方事实。厂商自报 benchmark 必须注明属于官方报告；个人实验不能写成普遍结论。

## 5. 选题与写作原则

最终内容应围绕 4–8 个高价值信号形成统一判断，不做新闻流水账。

表达要求：

- 使用中文，模型、协议、项目和产品名保留英文；
- 先给结论，再给依据；
- 每个专题回答“发生了什么、为什么重要、限制是什么、下一步做什么”；
- 标题表达判断而不是复述新闻标题；
- 避免“震撼、颠覆、杀疯了、遥遥领先”等营销措辞；
- 不暴露 RSS 抓取、内部 Prompt、自动化或部署实现细节。

## 6. Daily Brief Schema 合同

输出文件固定为：

`content/briefs/YYYY-MM-DD.yaml`

核心字段必须符合 `dailyBriefSchema`：

```yaml
kind: brief
cadence: daily
publishedAt: YYYY-MM-DD
status: published
title: ...
summary: ...
topics: [...]
signals: [...]       # 恰好 4 项
sections: [...]      # 恰好 5 项
projects: [...]      # 最多 6 项
radar: [...]         # 最多 8 项
actions: [...]       # 3–5 项
references: [...]    # 至少 1 项
archivePicks: [...]  # 最多 6 项
presentation:
  enabled: true
  template: daily-v1
```

### signals

每项包含：

- `title`：简短判断；
- `summary`：说明变化及工程影响；
- `impact`：`high | medium | watch`。

必须恰好 4 项，并覆盖本期最重要的四个判断。

### sections

必须恰好 5 项。每项包含：

- `id`：稳定、简洁的英文 slug；
- `layout`：`architecture | comparison | timeline | metrics | system-map`；
- `title`；
- `conclusion`：先给结论；
- `facts`：1–4 条；
- `limitations`：0–3 条；
- `references`：至少 1 个一手来源。

这 5 个 section 会直接对应 `daily-v1` 的 03–07 页。

### projects

用于 Open Source Radar。每项使用：

- `action`: `CLONE | READ | TEST | WATCH`；
- `name`；
- `summary`；
- `maturity`: `experimental | early | growing | stable`；
- `url`。

优先真实可运行、可阅读或值得持续关注的项目，不为凑数量加入低价值条目。

### radar

用于 Impact × Adoption Horizon。`impact` 与 `horizon` 均为 0–100，必须能够解释为何应立即验证、近期采用或长期观察。

### actions

必须 3–5 项。每项都要是工程师可执行动作，例如 clone、最小实验、更新 threat model、对比 Harness、加入技术路线观察等。

### references

只放本期实际使用的高价值来源。每项包含：

- `title`
- `url`
- `source`（可选）
- `supports`：明确说明该来源支持了什么判断
- `accessedAt`（可选）

### archivePicks

从 Orbis 已有结构化内容中选择仍有长期价值、且与本期有关的历史内容。优先读取 `content/briefs/**`、`content/essays/**`、`content/knowledge/**`；不得依赖旧 `docs/archive.json` 或旧 HTML 历史站。

## 7. 固定 11 页语义

`daily-v1` 模板自动把结构化字段映射为 11 页：

1. 封面；
2. FOUR SIGNALS；
3–7. 五个 sections；
8. OPEN SOURCE RADAR；
9. IMPACT × ADOPTION HORIZON；
10. FROM SIGNALS TO ACTION；
11. EXTENDED READING。

Agent 不手写页面，也不改变模板布局、视觉系统、导航或交互。

## 8. 写入与校验

完成 YAML 后：

1. 确认日期使用 Asia/Shanghai 的绝对日期；
2. 确认没有同日期已发布 Daily；若存在则更新该 structured Brief，而不是创建第二份；
3. 运行 `pnpm validate`；
4. 环境允许时运行 `pnpm build`；
5. 仅提交允许的 structured content 路径；
6. 不提交 `apps/slides/generated/**`、`dist/**` 或任何生成 HTML。

构建系统负责自动产生：

- `/briefs/<id>/`
- `/slides/<id>/`
- `/YYYY/MM/DD/`
- `/latest/`
- `/archive.json`
- `/rss.xml`

## 9. 禁止事项

不得：

- 写入或维护 `docs/index.html`、`docs/latest/**`、`docs/YYYY/**`、`docs/archive.json`；
- 生成单文件 HTML 作为仓库源文件；
- 直接修改 Astro / Vue / Slidev 模板来适配当天内容；
- 修改 GitHub Actions 或 Pages 配置；
- 伪造来源、验证结果、CI、PR Preview 或生产部署状态。

Orbis 的长期原则是：**内容是源，展示是构建产物。**
