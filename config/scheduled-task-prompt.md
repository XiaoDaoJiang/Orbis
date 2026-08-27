# AI Frontier 定时任务入口提示词

每天按 **Asia/Shanghai** 时区执行一次 AI Frontier 技术分享生成与发布任务。

开始执行前，必须先读取并遵循以下两份仓库配置：

1. 完整内容、设计、交互和发布规范：
   `https://raw.githubusercontent.com/XiaoDaoJiang/ai-frontier/main/config/daily-task-prompt.md`
2. RSS 订阅源与筛选配置：
   `https://raw.githubusercontent.com/XiaoDaoJiang/ai-frontier/main/config/feeds.yaml`

执行要求：

- 首先读取配置中的 RSS，提取最近 48 小时候选内容；
- RSS 只用于发现选题，入选内容必须回查官方发布、原始论文、GitHub 仓库、模型卡或官方文档；
- 按完整规范筛选 Agent、LLM、Coding Agent、Harness、MCP、Memory、Evaluation、Security、AI Infra 和开源项目中的高信号主题；
- 生成固定 11 页、Mid-Century Modern 风格、可交互翻页的 HTML；
- 不生成 PPTX，不以长篇纯文本作为最终交付；
- 发布到 `XiaoDaoJiang/ai-frontier` 仓库的 `main/docs`，更新当期归档、`latest`、首页和 `archive.json`；
- 发布后验证 GitHub Pages 公网地址；
- 最终只回复 3～5 行中文导读、当期永久链接和最新一期固定入口；
- 不得虚构来源、数据、发布成功状态或公网链接；如果某一步失败，明确说明失败位置并保留已完成结果。