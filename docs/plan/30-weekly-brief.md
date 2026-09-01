# 30 · Weekly Brief

> 状态：Done
> Roadmap Milestone：C — Weekly Intelligence
> 完成 PR：#13 / #14
> 依赖：Plan 20 Presentation Platform · Done

## 1. 目标

实现真正表达跨时间变化的 Weekly Brief，而不是把多份 Daily 内容简单拼接。

Weekly 第一版回答：

- 这一周期什么变化最重要？
- 哪些方向持续升温、稳定或降温？
- 出现了什么新变量？
- 哪些判断需要继续观察？
- 下一个周期应该看什么？

## 2. 30A — Weekly Model + Reading · Done

PR #13 `feat: add weekly brief model and reading experience` 已合并。

已提供独立严格 `weeklyBriefSchema`：

```yaml
kind: brief
cadence: weekly
publishedAt: 2026-09-01
status: published
period:
  from: 2026-08-26
  to: 2026-09-01
weeklyThesis: ...
trendMovements:
  - topic: agent-harness
    direction: rising
    summary: ...
nextPeriodWatch:
  - title: ...
    reason: ...
presentation:
  enabled: true
  template: weekly-v1
```

稳定约束：

- `period` 恰好覆盖七个日历日期（含首尾）；
- `publishedAt === period.to`；
- `trendMovements` 2..8；
- direction 只允许 `rising | stable | cooling | new-variable`；
- `sections` 2..6；
- `nextPeriodWatch` 1..5；
- Weekly 拒绝 Daily-only `signals / actions / projects / radar / archivePicks`；
- Daily 原有 exact 4 signals / 5 sections / action contract 保持不变。

Reading 使用共享 `/briefs/:id/` shell，但 cadence-specific body 独立渲染：

```text
Period
→ Weekly Thesis
→ Trend Movements
→ Key Sections
→ Next Period Watch
→ References
```

真实 Weekly：`content/briefs/2026-09-01-weekly.yaml`。

30A 已证明 Weekly 会自然进入 Briefs、Weekly index、Archive、RSS、Topic、Related 和 Homepage Latest Brief，同时不会抢占 Daily `/latest/`、日期 alias 或生成型 `archive.json`。

## 3. 30B — weekly-v1 + Mixed Presentation · Done

PR #14 `feat: add weekly-v1 presentation integration` 已合并。

`weekly-v1` 通过 Plan 20 Template Registry 注册，Registry 负责：

- `weeklyBriefSchema.parse(payload)`；
- `readingUrl` 必须存在；
- wrong Daily / Talk payload 明确失败；
- renderer 只接收已验证 Weekly。

### Slide 结构

```text
1            Cover
2            Period + Weekly Thesis
3            Trend Movements
4..N         one slide per Weekly section
N + 1        Next Period Watch
N + 2        References
```

若 `sections.length = S`：

```text
slides = S + 5
```

因此第一版合同是：

- 2 sections → 7 slides；
- 当前真实 Weekly 3 sections → 8 slides；
- 6 sections → 11 slides。

Weekly 不复用 Daily 的 `FOUR SIGNALS / OPEN SOURCE RADAR / FROM SIGNALS TO ACTION` 等模板语义。

## 4. Discovery 与路由语义

Weekly 自动进入：

- `/briefs/`；
- `/briefs/weekly/`；
- `/archive/`；
- `/rss.xml`；
- `/slides/`；
- Homepage Latest Brief / Latest Presentation；
- Topic 聚合；
- Related Content。

Daily 专属 contract 保持分离：

```text
/latest/             -> newest Daily
/YYYY/MM/DD/         -> Daily only
dist/site/archive.json.latest / issues -> Daily only
```

Weekly `publishedAt` 不会创建 Daily 日期 alias。

## 5. Mixed Presentation 验证

正常真实仓库同时存在：

```text
2026-08-28                  daily-v1  · Brief
2026-09-01-weekly           weekly-v1 · Brief
orbis-presentation-platform talk-v1   · standalone Presentation
```

集成 Fixture 阶段还会加入 future Daily，证明同一次构建可同时生成 4 个 public decks，并继续验证：

- duplicate slug fail-before-write；
- non-public Brief / standalone Presentation exclusion；
- future Daily 推进 `/latest/`、Daily date route 和 `archive.json`；
- 每个 deck 使用独立 public base path；
- fixture cleanup 后恢复真实三 deck 状态。

## 6. 安全边界

`weekly-v1` 对结构化内容执行与 `talk-v1` 同级别的 escaping：

- title / summary / thesis；
- trend topic / direction / summary；
- section title / conclusion / facts / limitations / references；
- next-period watch；
- top-level references；
- Slidev frontmatter title。

测试证明 schema-valid `<script>` / `<iframe>` 字符串不会以 raw executable markup 进入生成 Markdown。

## 7. 非目标

Plan 30 第一版不实现：

- 自动从 Daily 机械合并生成 Weekly；
- 自动总结全部过去七天内容；
- 趋势预测模型或量化趋势分数；
- 月报；
- Weekly previous / next；
- Weekly 独立日期 alias；
- 第二套 Presentation pipeline。

未来 Agent 可以读取本周期 Daily 作为研究输入，但最终 Weekly 必须是独立结构化判断。

## 8. 验收状态

- [x] Weekly 有独立严格 Schema，不能被 Daily 语义误接受；
- [x] Weekly 不依赖固定 4 signals / 5 sections；
- [x] Weekly Reading 有独立跨周期语义；
- [x] `weekly-v1` 独立构建；
- [x] `weekly-v1` 7..11 动态页数合同有 min / real / max 测试；
- [x] Daily + Weekly + Talk 在正常 Build 中共存；
- [x] Weekly 出现在正确的 Web / RSS / Topic / Archive / Slides 入口；
- [x] Homepage Latest Brief / Presentation 可以由 Weekly 驱动；
- [x] Weekly 不改变 Daily `/latest/`、日期路由和 `archive.json` 语义；
- [x] Reading ↔ Weekly Slides 双向可达；
- [x] hostile markup escaping 有负向验证；
- [x] PR Preview 公开访问 Reading 和 Slides；
- [x] generator / `build-slides` 保持 template-neutral。

## 9. PR 记录

1. **30A · Done** — PR #13 `feat: add weekly brief model and reading experience`；
2. **30B · Done** — PR #14 `feat: add weekly-v1 presentation integration`。

Plan 30 / Milestone C 已关闭。