# 参与贡献

感谢你帮助改进录见。

## 开始之前

1. 先搜索现有 Issue，避免重复工作。
2. 较大的功能或架构改动，请先开 Issue 说明用户问题、范围和验收标准。
3. Bug 修复可以直接提交 Pull Request，但请附最小复现步骤。

## 本地开发

需要 Node.js 22.13+、Python 3.10+。CLI 的完整端到端测试还需要本机安装 `ffmpeg` 和 `ffprobe`；没有安装时，对应合成视频用例会跳过。

```bash
npm ci
npx playwright install chromium
npm run dev
```

Linux 环境可以使用 `npx playwright install --with-deps chromium` 一并安装浏览器系统依赖。

提交前请运行：

```bash
npm run test:cli
npm run check
npm run test:e2e
```

## Pull Request 要求

- 一次只解决一个清晰问题；
- 说明改动前后的行为和验证方式；
- 新增产品行为时同步补测试和 README；
- 修改公共数据结构、状态流、处理链或持久化边界时，同步更新 [`docs/uml/`](docs/uml/README.md) 中对应文档；
- 不夸大候选帧算法、AI、隐私检测或导出能力；
- 界面改动需要兼顾键盘操作、小屏和减少动态效果设置；
- 不提交真实客户录屏、个人隐私、账号、路径、密钥或未经授权素材。

## 技术原则

- 默认保持视频本地处理；
- 第三方模型必须是可选能力，并在发送数据前取得明确同意；
- 候选画面、教程步骤和用户修改应保持可追溯；
- 失败时应允许用户继续手工编辑，而不是丢失已有结果。
