# 20 · Presentation Platform

> 状态：Done
> Roadmap Milestone：B — Presentation Platform
> 完成 PR：#11 / #12
> 建议优先级：Completed

## 1. 目标

把以 `daily-v1` 为唯一真实实现的 Slide Generator，升级为支持多种 Presentation 来源与模板的稳定平台。

核心原则：**Slides 是输出通道，不是第二套内容源。**

## 2. 完成后的架构

```text
Brief / Presentation
        ↓
Presentation Descriptor
        ↓
Template Registry
   ├── daily-v1
   ├── weekly-v1   # Plan 30 完成
   └── talk-v1
        ↓
Generated Slidev Source
        ↓
Slidev Build × N
        ↓
/slides/<slug>/
```

Presentation source discovery、renderer dispatch 与 Slidev build 已分离：

- source adapter 负责把结构化内容转换为 `PresentationDescriptor`；
- Template Registry 负责模板到 payload contract 的显式校验与 renderer dispatch；
- `tools/generate-slides/index.ts` 只遍历 descriptor 并调用 Registry；
- `tools/build-slides/**` 完全不知道 Daily / Weekly / Talk。

## 3. 20A — Descriptor + Template Registry · Done

PR #11 `refactor: introduce presentation registry and descriptor` 已合并。

已提供：

- source-neutral `PresentationDescriptor`；
- Brief → Descriptor adapter；
- Template Registry；
- `daily-v1` 经 Registry dispatch；
- unsupported template 明确失败；
- `daily-v1` 缺少 Reading URL 明确失败；
- Daily renderer 输出与重构前保持等价；
- `build-slides` 保持不变。

## 4. 20B — Standalone Presentation + talk-v1 · Done

PR #12 `feat: add standalone presentations and talk-v1` 已合并。

已提供：

- `content/presentations/**`；
- `presentationContentSchema`；
- Astro `presentations` collection；
- standalone Presentation → Descriptor adapter；
- Brief + standalone source 统一 discovery；
- cross-source duplicate slug fail-before-write；
- `talk-v1`；
- 一份真实 standalone Talk：`orbis-presentation-platform`；
- `/slides/` 与 Homepage Latest Presentation 同时发现 Brief-derived 与 standalone Presentation；
- non-public standalone Presentation 不生成、不发现；
- standalone Talk 不伪造 Reading URL；
- standalone Presentation 保持在 generic Archive/RSS 之外。

## 5. Plan 30 扩展验证

Plan 30 没有重新设计 Presentation Platform，而是作为第三种 template/source behavior 直接接入现有边界：

```text
Weekly Brief
   ↓
PresentationDescriptor
   ↓
weekly-v1 Registry entry
   ↓
unchanged generator / build-slides
```

PR #14 已证明正常真实仓库可以同时生成：

```text
Daily  -> daily-v1
Weekly -> weekly-v1
Talk   -> talk-v1
```

因此 Plan 20 的平台边界已经被第二个 Brief cadence 和 standalone source 双重验证。

## 6. 稳定合同

- `content/**` 是所有可发布 Presentation 的 Source of Truth；
- generated Slidev Markdown 是输出，不提交 Git；
- 每个 descriptor 有稳定 slug、template、sourceKind、publishedAt、topics；
- Brief-derived deck 可以携带 Reading URL；standalone Talk 不需要伪造 Reading URL；
- Registry 是唯一 template dispatch 边界；
- 未知 template 明确失败；
- duplicate slug 在清空/写入 generated source 前失败；
- 每个 deck 使用独立 `/slides/<slug>/` base path；
- `build-slides` 保持 template-neutral；
- Daily 保持精确 11 页；Talk 保持 `sections.length + 2`；Weekly 页数合同由 Plan 30 定义。

## 7. 非目标

Plan 20 不实现：

- 可视化 Slide Editor；
- 任意 HTML/Vue 注入；
- 用户自定义主题上传；
- 动态 Runtime Template；
- PPTX 导出；
- standalone Presentation detail/reading page；
- generic Citation graph。

## 8. 验收状态

- [x] 现有 Daily Deck 输出无回归；
- [x] Template Registry 是唯一 renderer dispatch 边界；
- [x] 一个仓库 Build 可以同时生成 Daily + standalone Talk；
- [x] Plan 30 进一步证明 Daily + Weekly + Talk 可以同时生成；
- [x] 新增 template 不需要修改 `build-slides`；
- [x] `content/presentations/**` 通过 Schema 校验；
- [x] 未知 template 明确失败；
- [x] invalid standalone source 明确失败；
- [x] cross-source duplicate slug fail-before-write；
- [x] 所有 Deck 拥有独立 `/slides/<slug>/`；
- [x] PR Preview 可公开访问 mixed Presentation；
- [x] generated Slidev source 不提交。

## 9. PR 记录

1. **20A · Done** — PR #11 `refactor: introduce presentation registry and descriptor`；
2. **20B · Done** — PR #12 `feat: add standalone presentations and talk-v1`。

Plan 20 / Milestone B 已关闭。