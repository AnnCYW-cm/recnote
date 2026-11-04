# 录见 Recnote

录见是一款“录屏到图文教程”的产品原型。

当前 V0.1 包含两部分独立能力：

- 候选帧 CLI POC：在本地分析自有录屏并输出候选画面；
- Web 教程工作台：使用 6 步自有预置初稿，验证编辑、复核、隐私确认与导出体验。

负责把候选画面理解并转换成教程步骤的语义层尚未接入，因此当前版本不是端到端自动生成工具。

## 在线体验

- [录见 V0.1](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/)
- [木瓦任务板自有案例](https://lujian-video-guide-demo.caiyiwenann.chatgpt.site/cases/muwa-board)

## 本地运行

需要 Node.js 22.13.0 或更高版本。

```bash
npm ci
npm run dev
```

完整检查：

```bash
npm run check
```

## 数据与隐私边界

Web 首页只校验所选文件的名称和类型，不读取、不上传、也不分析视频字节。页面中的处理状态和教程初稿均来自木瓦任务板自有预置案例。

编辑草稿只保存在当前浏览器的 `localStorage`；下载的图文包由浏览器本地生成。

## 当前路线

V0.2 的唯一主线是打通：

```text
candidates[] → 语义理解 → TutorialStep[] → Web 工作台
```

详细产品说明见 [公众号首次亮相发布稿](docs/公众号文章-v11-首次亮相发布版.md)。
