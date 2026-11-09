# 录见 RecNote

[![CI](https://github.com/AnnCYW-cm/recnote/actions/workflows/ci.yml/badge.svg)](https://github.com/AnnCYW-cm/recnote/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-5b5bd6.svg)](LICENSE)

录见是一个开源的“录屏转图文教程”Web 工具。选择一段软件录屏后，它会直接在浏览器本地采样画面、筛选候选截图，并生成一份可编辑、可复核、可导出的教程初稿。

**视频不会上传服务器，也不会在未获同意时发送给第三方模型。**

## 在线体验

- [录见 Web 工具](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/)
- [木瓦任务板自有示例](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/cases/muwa-board)

## 当前可以做什么

- 读取 MP4、MOV、WebM 录屏，并在浏览器本地解码；
- 对视频进行低分辨率采样，结合全局与局部画面变化筛选候选帧；
- 生成高清候选截图和带时间戳的教程步骤；
- 编辑标题、摘要、步骤文案，调整顺序或隐藏步骤；
- 对修改后的文字进行人工复核，并逐张确认截图隐私；
- 导出 Markdown、公众号富文本和包含全部图片的 ZIP 图文包；
- 无视频时体验一套完全自有的示例流程；
- 使用 Python CLI 进行更完整、可复现的离线候选帧提取。

## 能力边界

当前版本是一条真实可用的本地处理链路，但还不是“全自动 AI 写教程”：

- 候选画面由视觉变化启发式算法筛选，不代表已经识别出点击或操作语义；
- 步骤标题和说明是待人工完善的初稿，当前不会调用大模型自动写作；
- 真实视频草稿只保存在当前浏览器会话，刷新或关闭页面后不会恢复；
- 首版限制为 5 分钟、500 MB，推荐使用 H.264 编码的 MP4；
- MOV、WebM 是否可用取决于当前浏览器能否解码其中的视频编码；
- 隐私检查是人工交付门禁，不是自动识别或自动脱敏。

## 工作原理

```text
本地录屏
  → 浏览器读取元数据
  → 最多采样 120 个低分辨率画面
  → 计算全局与 4×4 局部灰度差异
  → 按变化强度、视觉差异和时间分布选择 1–10 张候选帧
  → 生成高清 JPEG 截图
  → 编辑、复核、隐私确认
  → Markdown / 富文本 / ZIP 图文包
```

整个 Web 链路都在浏览器执行。当前部署不需要视频上传接口、对象存储或媒体处理服务器。

## 本地运行

需要 Node.js 22.13.0 或更高版本。

```bash
git clone https://github.com/AnnCYW-cm/recnote.git
cd recnote
npm ci
npx playwright install chromium
npm run dev
```

打开终端显示的本地地址，选择一段短录屏即可开始。

## 项目结构

```text
recnote/
├── app/                   # Web 上传、处理、编辑、复核与示例页面
├── components/ui/         # 可复用界面组件
├── lib/video-analysis.ts  # 浏览器本地视频采样与候选帧筛选
├── lib/tutorial-export.ts # Markdown、富文本和 ZIP 导出
├── cli/                   # Python + ffmpeg 离线候选帧 CLI
├── docs/uml/              # 当前实现的用例、数据、状态与时序文档
├── tests/e2e/             # Playwright 端到端测试
└── public/cases/          # 自有示例录屏和截图
```

## 设计文档

完整工程文档见 [UML 与架构文档](docs/uml/README.md)，包括：

- Web 与 CLI 的真实系统边界；
- 正式用例说明；
- Web 数据模型和草稿持久化模型；
- 页面、视频分析和复核状态机；
- 本地视频分析、编辑复核、导出和草稿恢复时序；
- Python + ffmpeg CLI 的数据结构、处理时序和输出契约；
- Sites、浏览器、本地文件系统之间的部署与隐私边界。

所有图都对应当前代码。尚未实现的模型语义层、服务端视频处理、数据库和自动隐私识别不会被画成现有能力。

## 离线 CLI

CLI 适合需要可复现输出、离线评审页或更细粒度参数的场景。它需要 Python 3.10+，以及已加入 `PATH` 的 `ffmpeg` 和 `ffprobe`，不依赖 Python 第三方包，也不调用网络或模型 API。

```bash
python3 cli/video_guide.py \
  "/path/to/你的录屏.mp4" \
  --output "/path/to/一个新目录"
```

它会生成高分辨率截图、`metadata.json`、`candidates.json`、`review.html` 和 `model_prompt.md`。完整参数见 [CLI 文档](cli/README.md)。

## 质量检查

```bash
npm run test:cli
npm run check
npm run test:e2e
```

- `test:cli`：Python 单元测试与可用时的 ffmpeg 合成视频端到端测试；
- `check`：格式、静态检查、TypeScript 类型检查和生产构建；
- `test:e2e`：示例流程、真实本地视频处理、发布门禁和导出测试。

## 路线图

- [x] 浏览器本地读取真实视频并提取候选截图
- [x] 教程编辑、人工复核、隐私门禁和图文包导出
- [ ] 候选截图池、手工增删帧和截图替换
- [ ] 本地草稿持久化与项目历史
- [ ] 可插拔的多模态语义适配器，由用户明确选择是否启用
- [ ] 裁剪、标注和敏感信息打码
- [ ] Docker 自托管方案与可选服务端处理器

## 隐私与安全

请先阅读 [隐私说明](PRIVACY.md) 和 [安全策略](SECURITY.md)。不要把包含客户信息、密钥、账号或个人隐私的录屏提交到公开 Issue、Pull Request 或测试夹具中。

## 参与贡献

欢迎提交问题、改进文档或代码。开始前请阅读 [贡献指南](CONTRIBUTING.md) 与 [行为准则](CODE_OF_CONDUCT.md)。

## 许可证

源代码采用 [MIT License](LICENSE)。木瓦任务板示例、录屏、截图、文章配图和录见品牌素材不随代码授予再利用权，具体见 [素材许可说明](ASSETS_LICENSE.md)。
