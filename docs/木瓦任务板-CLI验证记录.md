# 木瓦任务板候选帧 CLI 验证记录

## 验证范围

- 日期：2026-10-26
- 输入：`public/cases/muwa-board/recording.mp4`
- 输入 SHA-256：`16ebd5e9650f2776c81268a453f995c7663d0c8deff334807d946dcbc5186327`
- CLI 脚本 SHA-256：`6df2dcfaecc79f56ba5cc9f7e657b649422bab1e786b8b2e572edea1c1550f8b`
- 环境：macOS 26.6.2、Python 3.13.2、FFmpeg/ffprobe 7.1

## 运行命令

输出目录需为空；下列 `<empty-output-dir>` 代表本次创建的临时空目录。

```bash
/usr/bin/time -p python3 ../ai-video-guide-cli/video_guide.py \
  public/cases/muwa-board/recording.mp4 \
  --output <empty-output-dir> \
  --coverage-interval 2.5 \
  --max-candidates 20
```

## 单次结果

- 墙钟时间：2.06 秒（本机单次样本，不是性能基准）
- 视频：17.833333 秒、1440 × 900、30 fps、H.264、无音频
- 场景信号：4
- 周期信号：6
- 丢弃相邻重复候选：3
- 最终候选截图：7
- 候选时间：0.5、3.0、4.5、6.75、9.25、11.0、13.5 秒
- 网络或模型 API 调用：否
- 截图隐私状态：全部为 `unreviewed`

本次 7 个候选依赖显式参数 `--coverage-interval 2.5 --max-candidates 20`。使用默认的 5 秒覆盖间隔时，候选数量可能不同；因此文章中的 7 个候选不应被表述为默认配置的固定结果。
