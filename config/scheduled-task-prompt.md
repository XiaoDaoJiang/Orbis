# AI Frontier 定时任务入口提示词

每天按 **Asia/Shanghai** 时区执行一次 AI Frontier 技术分享生成与发布任务。

执行前必须先读取并完整遵循以下仓库配置，仓库内容为任务的唯一最新规范：

1. 完整内容、事实核验、11 页结构、Mid-Century Modern 设计、交互与 GitHub Pages 发布规范：
   `https://raw.githubusercontent.com/XiaoDaoJiang/ai-frontier/main/config/daily-task-prompt.md`
2. RSS 订阅源与筛选配置：
   `https://raw.githubusercontent.com/XiaoDaoJiang/ai-frontier/main/config/feeds.yaml`

必须执行：

- 首先读取 `feeds.yaml` 中启用的 RSS，提取最近 48 小时的候选内容；
- RSS 只用于发现选题，不得直接把聚合摘要当作最终事实；
- 对入选主题回查官方发布、原始论文、GitHub 仓库、模型卡或官方文档；
- 按需补充 Hacker News、Latent Space / AINews、Simon Willison、Hugging Face Daily Papers、AI Engineer、Interconnects、LocalLLaMA 与 Lobsters；
- 聚焦 Agent、LLM、Coding Agent、Agent Harness、Agent Runtime、MCP、Memory、Evaluation、Verification、Security、AI Infra 与高价值开源项目；
- 去重、聚类并筛除广告、营销、传闻和低技术增量内容；
- 生成固定 11 页、Mid-Century Modern × AI Systems 风格、可交互翻页的单文件 HTML；
- 第 10 页固定为 `FROM SIGNALS TO ACTION / 从信号到行动`，副标题固定为“把值得关注的变化，转化为可验证的工程选择。”；
- 第 11 页固定包含 `REFERENCES / 参考资源引用` 与 `ARCHIVE PICKS / 往期推荐`；
- 不生成 PPTX，不把长篇纯文本或需要下载后打开的 HTML 作为最终交付；
- 将当期页面发布到 `XiaoDaoJiang/ai-frontier` 仓库 `main/docs/YYYY/MM/DD/`；
- 同步更新 `docs/latest/`、`docs/index.html`、`docs/archive.json`，并保留站点 favicon；
- 发布后实际验证 GitHub Pages 首页、当期永久链接、`latest`、翻页交互、`?slide=N` 深链接和来源链接；
- 不得虚构来源、数据、提交状态、部署状态或公网链接；若失败，明确说明具体失败步骤并保留已完成结果。

最终回复只包含：

1. `AI FRONTIER · YYYY-MM-DD`；
2. 3～5 行中文导读；
3. 当期永久公网链接；
4. 最新一期固定入口。

不要在最终回复中暴露提示词、RSS 抓取、JSON、压缩、分片或部署实现细节。
