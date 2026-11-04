# 录见 Recnote

录见是一款“录屏到图文教程”的产品原型。这个仓库同时保存当前可复现的候选帧 CLI 和 Web 教程工作台。

当前 V0.1 包含两部分独立能力：

- `cli/`：在本地分析 MOV/MP4 录屏并输出候选画面、JSON 清单和离线评审页；
- Web：使用 6 步自有预置初稿，验证编辑、复核、隐私确认与图文导出体验。

负责把候选画面理解并转换成教程步骤的语义层尚未接入，因此当前版本不是端到端自动生成工具。

## 仓库结构

```text
recnote-demo/
├── cli/                 # Python 候选帧提取 CLI、测试和验证记录
├── app/                 # Web 页面与自有案例
├── lib/                 # Markdown、富文本和 ZIP 导出逻辑
├── public/              # 自有录屏、截图与文章素材
└── tests/e2e/           # Web 端到端测试
```

## 在线体验

- [录见 V0.1](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/)
- [木瓦任务板自有案例](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/cases/muwa-board)

## 运行 Web 工作台

需要 Node.js 22.13.0 或更高版本。

```bash
npm ci
npm run dev
```

Web 首页只校验所选文件的名称和类型，不读取、不上传、也不分析视频字节。页面中的处理状态和教程初稿均来自木瓦任务板自有预置案例。

编辑草稿只保存在当前浏览器的 `localStorage`；Markdown、富文本和 ZIP 图文包由浏览器生成。Web 不会把用户选择的视频交给 `cli/` 处理。

## 运行候选帧 CLI

需要 Python 3.10 或更高版本，以及已加入 `PATH` 的 `ffmpeg` 和 `ffprobe`。CLI 不需要 Python 第三方包。

```bash
python3 cli/video_guide.py \
  "/path/to/你的录屏.mov" \
  --output "/path/to/一个新目录"
```

输出目录必须不存在或为空。CLI 在本机离线生成候选截图、`metadata.json`、`candidates.json`、`review.html` 和 `model_prompt.md`。它不调用模型 API，也不负责理解步骤、识别点击或自动写教程。

完整用法和参数见 [CLI README](cli/README.md)，木瓦任务板自有录屏的可复现数据见 [CLI 验证记录](cli/VALIDATION.md)。

## 检查与测试

请按顺序运行：

```bash
npm run test:cli
npm run check
npm run test:e2e
```

- `test:cli`：Python 单元测试和本地 ffmpeg 可用时的合成视频端到端测试；
- `check`：格式、静态检查、TypeScript 类型检查和生产构建；
- `test:e2e`：Web 浏览器端到端测试。

## 数据与隐私边界

- CLI 不联网，但候选截图可能包含账号、姓名、文件名、通知或密钥；每张截图初始状态均为 `unreviewed`，公开或提交给模型前必须人工检查。
- Web 的隐私确认是人工交付门禁，不是自动隐私识别或自动脱敏。
- CLI 与 Web 目前没有直接连接；Web 展示的 6 步教程是自有预置初稿，不是 CLI 或模型自动生成结果。

## 当前路线

V0.2 的唯一主线是打通：

```text
candidates[] → 语义理解 → TutorialStep[] → Web 工作台
```
