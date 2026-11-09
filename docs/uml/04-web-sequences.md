# Web 时序图

## 真实视频本地分析

```mermaid
sequenceDiagram
  actor User as 教程创作者
  participant Upload as UploadView
  participant Home
  participant Process as LocalProcessingView
  participant Analysis as video-analysis
  participant Video as HTMLVideoElement
  participant Canvas
  participant Editor as EditorView

  User->>Upload: 选择或拖入 File
  Upload->>Analysis: validateVideoFile
  alt 文件无效
    Analysis-->>Upload: 返回格式、空文件或体积错误
    Upload-->>User: 显示错误并停止
  else 文件有效
    Analysis-->>Upload: 校验通过
    User->>Upload: 点击本地分析
    Upload->>Home: onStart File
    Home->>Process: phase = processing
    Process->>Analysis: analyzeVideo File, signal, onProgress
    Analysis->>Analysis: createObjectURL
    Analysis->>Video: 加载 Blob URL
    Video-->>Analysis: duration、width、height

    loop 12 到 120 个采样点
      Analysis->>Video: seek 到采样时间
      Video-->>Analysis: seeked
      Analysis->>Canvas: drawImage 与 getImageData
      Canvas-->>Analysis: 灰度像素
      Analysis->>Analysis: 全局与 4x4 局部差异
      Analysis-->>Process: onProgress sampling
    end

    Analysis->>Analysis: 筛选时间与视觉上不同的候选

    loop 每个候选时间点
      Analysis->>Video: seek 到候选时间
      Analysis->>Canvas: 绘制高清 JPEG
      Canvas-->>Analysis: data URL
      Analysis-->>Process: onProgress capturing
    end

    Analysis->>Analysis: 构造 VideoAnalysisResult
    Analysis->>Video: 清空 src
    Analysis->>Analysis: revokeObjectURL
    Analysis-->>Process: 返回 VideoAnalysisResult
    User->>Process: 进入教程工作台
    Process->>Home: onComplete result
    Home->>Home: localEditorSource 映射候选为步骤
    Home->>Editor: source.kind = local
  end
```

整个序列中没有上传请求、服务器媒体处理器或模型 API。唯一被处理的是用户主动选择的本地 `File`。

## 编辑与复核

```mermaid
sequenceDiagram
  actor User as 教程创作者
  participant Editor as EditorView
  participant State as React State
  participant Gate as 发布门禁

  User->>Editor: 修改步骤标题或正文
  Editor->>State: 更新 TutorialStep
  Editor->>State: editedStepIds 加入 stepId
  Editor->>State: reviewedStepIds 移除 stepId
  State-->>Gate: copyReviewReady = false

  User->>Editor: 确认文字与画面一致
  Editor->>State: reviewedStepIds 加入 stepId

  User->>Editor: 修改文章标题或摘要
  Editor->>State: articleCopyEdited = true
  Editor->>State: articleCopyReviewed = false
  User->>Editor: 确认标题与摘要
  Editor->>State: articleCopyReviewed = true

  loop 每张纳入成稿的截图
    User->>Editor: 确认当前截图无敏感信息
    Editor->>State: privacyReviewedIds 加入 stepId
  end

  State-->>Gate: 重算五项并行条件
  Gate-->>User: 显示完成数量或待办项
```

截图隐私确认是人工声明，不代表系统已经自动识别或处理敏感信息。

## 教程交付

```mermaid
sequenceDiagram
  actor User as 教程创作者
  participant Editor as EditorView
  participant Export as tutorial-export
  participant Clipboard as Clipboard API
  participant Zip as fflate
  participant Browser as 浏览器下载

  User->>Editor: 请求 Markdown、富文本或 ZIP
  Editor->>Editor: validateDelivery

  alt 任一发布门禁未通过
    Editor-->>User: 显示具体阻塞原因
  else 五项门禁全部通过
    Editor->>Editor: 构造 TutorialExportInput
    Editor->>Export: buildMarkdown
    Export-->>Editor: Markdown 文本

    alt 复制 Markdown
      Editor->>Clipboard: writeText
      Clipboard-->>Editor: 写入成功
      Editor-->>User: Markdown 已复制
    else 复制公众号排版
      Editor->>Export: buildWechatHtml
      Export-->>Editor: HTML 文本
      Editor->>Export: writeRichClipboard HTML, Markdown
      Export->>Clipboard: 写入 text/html 与 text/plain
      alt 富文本写入成功
        Clipboard-->>Export: 写入成功
        Export-->>Editor: rich
        Editor-->>User: 公众号格式已复制
      else 浏览器拒绝富文本
        Clipboard-->>Export: 写入失败
        Export->>Clipboard: 回退 writeText Markdown
        Clipboard-->>Export: 写入成功
        Export-->>Editor: fallback
        Editor-->>User: 已复制降级内容
      end
    else 下载独立图文包
      Editor->>Export: createTutorialZip
      Export->>Export: 读取 data URL 或同源示例图片
      Export->>Zip: 压缩文稿、预览与 images
      Zip-->>Export: application/zip Blob
      Export->>Browser: downloadBlob
      Browser-->>User: 保存 ZIP
    end
  end
```

ZIP 内部契约：

```text
教程标题/
├── 教程.md
├── 公众号预览.html
├── 使用说明.txt
└── images/
    ├── step-01.jpg
    └── ...
```

## 自有示例草稿恢复

```mermaid
sequenceDiagram
  actor User as 示例体验者
  participant Upload as UploadView
  participant Home
  participant Editor as EditorView
  participant Store as localStorage

  Upload->>Store: 读取示例草稿键
  alt 存在兼容版本
    Store-->>Upload: StoredDraft version 2
    Upload-->>User: 显示继续编辑入口
    User->>Upload: 继续编辑
    Upload->>Home: onResume
    Home->>Editor: source.kind = demo
    Editor->>Store: 再次读取并校验字段
    Store-->>Editor: 文字、步骤顺序与纳入状态、当前选择、编辑模式与复核状态
    Editor->>Editor: 与受控示例素材合并
  else 无草稿或版本不兼容
    Upload-->>User: 显示体验示例流程
  end

  User->>Editor: 编辑示例内容
  Editor->>Editor: 防抖 250 ms
  Editor->>Store: setItem StoredDraft
```

`source.kind = local` 时，`EditorView` 不执行这条持久化序列；真实视频草稿刷新后即丢失。

## 取消与资源释放

```mermaid
sequenceDiagram
  actor User
  participant Process as LocalProcessingView
  participant Abort as AbortController
  participant Analysis as analyzeVideo
  participant Video as HTMLVideoElement

  Process->>Abort: 创建 signal
  Process->>Analysis: 开始分析
  User->>Process: 取消或离开页面
  Process->>Abort: abort
  Abort-->>Analysis: AbortError
  Analysis->>Video: 移除 src 并 load
  Analysis->>Analysis: revokeObjectURL
  Analysis-->>Process: 结束，不显示普通错误
```
