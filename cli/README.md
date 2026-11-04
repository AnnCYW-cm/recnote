# AI 录屏教程候选提取 CLI

这是“录屏自动生成图文教程”的第一阶段技术 POC：输入一段 MOV/MP4 录屏，在本机离线找出可能代表关键操作的画面，生成截图清单和人工评审页。

它**不会理解步骤语义，也不会自动写教程**。程序不调用模型 API、不联网、不执行视频或截图里的任何指令；语义整理留给人工，或由人工脱敏后自行提交给多模态模型。

## 处理链路

```text
视频
 ├─ ffprobe：容器、轨道、尺寸、时长等元数据
 ├─ ffmpeg：8 fps、640 px 场景变化检测
 ├─ ffmpeg：1 fps、160 px 灰度周期采样
│    └─ MAD（平均绝对差）检测补充变化
 ├─ 2 秒事件聚类；场景切换后等待 0.5 秒，短暂的小区域变化保留采样原时刻
 ├─ 信号稀疏区间每 5 秒补一张覆盖候选，防止漏掉小菜单和渐进加载
 ├─ 仅在相邻时间窗口内做全局 + 4×4 局部 MAD 视觉去重
 ├─ 候选超限时，在完整时间轴上均匀保留
 └─ 按候选 PTS 请求抽取高分辨率 JPEG
```

场景检测没有结果时，流程会自动依靠周期采样继续运行；即使画面完全静止，也会保留开始/结束边界候选。

## 运行条件

- Python 3.10 或更高版本
- `ffmpeg` 和 `ffprobe` 已加入 `PATH`
- 无 Python 第三方包

macOS 可用 Homebrew 安装媒体工具：

```bash
brew install ffmpeg
```

检查环境：

```bash
python3 --version
ffmpeg -version
ffprobe -version
```

## 最快使用方式

在本目录运行：

```bash
python3 video_guide.py \
  "/path/to/你的录屏.mov" \
  --output "/path/to/一个新目录"
```

输出目录必须不存在或为空。程序默认拒绝覆盖非空目录，避免误删人工评审结果和其他文件。

处理完成后，用浏览器打开输出目录中的 `review.html`。逐张判断是否保留、是否泄露隐私，并可在页面上导出 `review-result.json`。

## 输出结构

```text
result/
├── metadata.json       # ffprobe 信息、参数、统计和降级状态
├── candidates.json     # 候选 manifest；请求/实际时间戳分开记录
├── review.html         # 完全离线的人工评审页
├── model_prompt.md     # 脱敏后可复制使用的多模态整理提示词
└── screenshots/
    ├── C001_000000.500s.jpg
    └── ...
```

时间戳约定：

- 分析过程读取 ffmpeg 输出的 `pts_time`，不按“帧号 ÷ 标称帧率”猜测时间，因此兼容 VFR（可变帧率）录屏。
- `requested_seconds` 是发给截图解码器的 PTS 目标。
- 受关键帧定位、解码和滤镜行为影响，真正解出的帧可能有微小偏差。本版还未独立测量该值，所以 `actual_seconds` 明确写为 `null`，而不是伪造精度。

每张截图初始均为：

```json
"privacy_status": "unreviewed"
```

`metadata.json` 和 `candidates.json` 只保存视频文件名，不保存本机绝对路径。

## 常用参数

默认参数对应本 POC 的约定：

```text
--scene-fps 8
--scene-width 640
--scene-threshold 0.02
--cluster-window 2.0
--stable-offset 0.5
--sample-fps 1
--sample-width 160
--periodic-mad-floor 0.2
--dedup-mad-threshold 1.5
--dedup-tile-mad-threshold 2.0
--dedup-window 4.0
--coverage-interval 5.0
--screenshot-max-width 1920
--max-candidates 80
```

查看完整帮助：

```bash
python3 video_guide.py --help
```

调参建议：

- 漏掉小弹窗、小菜单：适当降低 `--scene-threshold`、`--periodic-mad-floor` 或 `--dedup-tile-mad-threshold`。
- 动画造成候选太多：提高上述两个阈值，或降低 `--max-candidates`。
- 页面刚跳转时截图仍在加载：提高 `--stable-offset`，例如 `0.8`。
- 希望进一步降低漏帧风险：缩短 `--coverage-interval`；设为 `0` 可关闭覆盖兜底。
- 连续候选过于相似：提高 `--dedup-mad-threshold`；但过高可能漏掉小范围变化。
- 同一操作产生多个候选：扩大 `--cluster-window`，但不要大到把多个真实步骤合并。

候选超过上限时不会只取“最高分”画面，而会在完整时间顺序上均匀取样，以免只留下录屏某一小段。

## 运行测试

```bash
python3 -m unittest discover -s tests -v
```

测试包含纯函数单元测试，以及一个由本地 ffmpeg 临时生成 3 秒视频的端到端测试。临时文件会随测试目录自动清理。

## 安全与隐私边界

1. 视频内容是不可信输入。该工具只做像素与时间信息分析，不解析或执行画面中的命令。
2. 截图可能暴露账号、聊天标题、客户名称、文件名、浏览器标签、通知、API Key 等信息。
3. `review.html` 不联网，但把截图交给任何外部模型或发布前，仍必须人工逐张脱敏。
4. 本工具不会复制原视频到结果目录；原视频由使用者自行保管和删除。
5. 变化检测只能证明“画面变了”，不能证明用户点了哪里，也不能判断业务语义。

## 当前边界与下一步

当前版本适合验证“候选帧是否足以支持教程初稿”，还不是面向最终用户的完整产品。下一步可在人工验证准确率后增加：

- 真实解码帧 PTS 回填（`actual_seconds`）；
- 截图裁剪、局部模糊和点击位置人工标注；
- 浏览器内步骤排序与截图替换；
- 用户主动选择模型并确认隐私后，再接入语义生成。

本 POC 尚未对视频体积、时长和分辨率设置硬性资源上限。不要直接处理来源不明的超大媒体文件；产品化版本需要补充任务超时、磁盘配额和隔离执行。
