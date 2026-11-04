# 录见 v16 公众号核心视觉与真实截图链

本目录的 SVG 是可维护源文件，PNG 是微信公众号发布版。全部画布为 1440 × 1800（4:5）。

## 文件清单

- `01-product-architecture.svg/.png`：产品全景架构，明确本地 CLI、规划中的语义层和 Web Demo 的真实状态。
- `02-end-to-end-flow.svg/.png`：目标端到端流程，绿色/紫色表示已完成端点，橙色虚线表示规划中的语义桥。
- `03-technical-layers.svg/.png`：组件依赖与技术分层，展示本地 CLI、可检查产物、待实现语义桥和 Web 教程状态机。
- `04-product-demo-input.svg/.png`：选择入口 → 能力边界 → 模拟处理完成。
- `05-product-demo-review.svg/.png`：编辑初稿 → 修改后复核失效 → 人工重新核对。
- `06-product-demo-delivery.svg/.png`：隐私门禁 → 5/5 发布检查完成 → ZIP 图文包真实下载成功。
- `07-editor-detail.svg/.png`：放大教程工作台的步骤定位、内容编辑与交付检查三块区域。
- `screens/`：原始 1280 × 720 截图。合成图只引用和裁切展示，不改写原截图。

## 文章展示顺序

文章按画面右上角编号 `01 / 07` 至 `07 / 07` 连续展示。由于文件名沿用早期素材命名，实际引用顺序是：

1. `01-product-architecture`
2. `02-end-to-end-flow`
3. `03-technical-layers`
4. `04-product-demo-input`
5. `07-editor-detail`（画面编号 05 / 07）
6. `05-product-demo-review`（画面编号 06 / 07）
7. `06-product-demo-delivery`（画面编号 07 / 07）

## 状态语义

- 绿色：真实完成的本地 CLI / 已通过的检查。
- 紫色：已完成的交互 Demo / Web 交付工作台。
- 橙色虚线：规划中或尚未接通，不能画成已实现。
- 灰色：数据契约或中性说明。

## 建议放入 v16 的真实 UI 截图序列

文章中的产品演示应按同一案例、同一方向连续推进：

1. `04-web-home.png`：选择 MOV/MP4 或进入示例流程。
2. `05-capability-boundary.png`：明确“候选帧回放”和“Web 预置初稿”是两段尚未连接的真实能力。
3. `06-processing-complete.png`：模拟处理结束，准备进入 Web 预置初稿。
4. `07-editor.png`：打开 6 步预置教程，展示标题、说明、排序和显示控制。
5. `08-review-invalidated.png`：文案被修改，原复核状态自动失效。
6. `09-copy-review-gate.png`：用户重新确认文字与画面一致。
7. `10-privacy-gate.png`：截图隐私为 0/6，导出被阻止。
8. `11-publish-ready.png`：发布检查 5/5，截图隐私 6/6，可以交付。
9. `12-final-preview.png`：打开成稿预览。
10. `13-export-result.png`：真实点击下载后的成功提示，证明实际文件已生成，而不是只有目录结构说明。

CLI 侧若还要继续增强证据链，建议再补两张原始画面：

- 一张终端或 `metadata.json` 运行结果，直接显示 17.83 秒、4 个场景信号、6 个周期信号、丢弃 3 个重复候选和最终 7 张候选；
- 一张 `review.html` 完成至少一项人工保留/标题/备注并导出 `review-result.json` 的状态。

## 标注规范

1. 每张截图只表达一个结论，使用两位编号 `01` 至 `07` 连续推进。
2. 编号写在 Mac 标题栏，标题使用动作句，例如“文案一修改，原复核自动失效”。
3. 箭头只表示时间顺序，不暗示尚不存在的数据连接；规划中连接必须使用橙色虚线并标注“未接通”。
4. 单张截图最多保留一个结论标签。紫色表示产品操作，绿色表示完成，橙色表示门禁或未完成状态。
5. 原图按比例缩放或在 SVG 中使用 `clipPath` 裁切，不拉伸、不涂改、不覆盖原始业务状态。
6. 1440px 画布上的关键标题不低于 34px；上传公众号后必须在约 375px 宽手机预览中确认标题和状态标签无需放大即可读。
7. 原截图中已经存在的边界提示、自有案例标签和计数不得裁掉；不能把 Web 预置案例描述成 CLI 自动生成结果。
8. 不使用参考文章、ChatGPT/GPTs 或其他第三方产品界面补图；只使用录见、木瓦任务板和自有代码素材。

## 导出命令

```bash
for file in outputs/ai-video-guide-demo/public/article/reference-standard/*.svg; do
  rsvg-convert -w 1440 -h 1800 -o "${file%.svg}.png" "$file"
done
```

公众号后台应上传 PNG/GIF 原文件，不依赖站点热链；发布前做一次真机预览。
