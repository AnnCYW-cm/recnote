# Web 状态机

## 页面生命周期

`Home` 只保存三个顶层阶段：`upload`、`processing`、`editor`。示例流程和真实视频流程在 `processing` 与 `editor` 中通过输入数据区分。

```mermaid
stateDiagram-v2
  state "上传与入口页" as Upload
  state "自有示例处理演示" as ProcessingDemo
  state "真实视频本地处理" as ProcessingLocal
  state "示例教程工作台" as EditorDemo
  state "真实视频教程工作台" as EditorLocal
  state "处理错误" as ProcessingError

  [*] --> Upload
  Upload --> ProcessingDemo : 体验示例流程
  Upload --> ProcessingLocal : 选择有效视频并开始
  Upload --> EditorDemo : 恢复示例草稿

  ProcessingDemo --> Upload : 退出演示
  ProcessingDemo --> EditorDemo : 预置流程完成

  ProcessingLocal --> Upload : 取消处理
  ProcessingLocal --> ProcessingError : 分析失败
  ProcessingError --> Upload : 返回重选
  ProcessingLocal --> EditorLocal : 分析成功并确认进入

  EditorDemo --> Upload : 重新体验或清空草稿
  EditorLocal --> Upload : 处理另一段视频
```

状态事实：

- `ProcessingDemo` 是展示 CLI 候选结果与 Web 预置初稿之间尚未连接的示例，不会分析视频。
- `ProcessingLocal` 创建 `AbortController`；组件卸载或用户取消时终止分析。
- `EditorLocal` 的状态只在当前 React 会话中存在，刷新页面后不会恢复。

## 产品教程生命周期

下面是产品经理用于需求评审的概念状态机。源码没有 `TutorialStatus` 枚举，也不会持久化这个状态；图中的状态由页面阶段、内容完整度、复核集合和交付结果共同推导。

```mermaid
stateDiagram-v2
  state "待输入" as New
  state "分析中" as Analyzing
  state "候选结果就绪" as CandidateReady
  state "可编辑初稿" as Editing
  state "复核阻塞" as ReviewBlocked
  state "可交付" as Ready
  state "已生成交付物" as Exported
  state "分析失败" as Failed
  state "已取消" as Cancelled
  state "会话结束且未保存" as Expired

  [*] --> New
  New --> Analyzing : 有效真实视频
  New --> CandidateReady : 自有示例完成
  Analyzing --> CandidateReady : 候选分析成功
  Analyzing --> Failed : 解码、超时或 Canvas 失败
  Analyzing --> Cancelled : 用户取消或离开
  Failed --> New : 返回重选
  Cancelled --> New : 返回重选
  CandidateReady --> Editing : 进入教程工作台
  Editing --> ReviewBlocked : 内容完整但复核未完成
  ReviewBlocked --> Editing : 内容再次不完整
  ReviewBlocked --> Ready : 五项门禁全部通过
  Ready --> ReviewBlocked : 文案或隐私复核失效
  Ready --> Editing : 内容、时间戳或截图失效
  Ready --> Exported : 复制或下载成功
  Exported --> Ready : 继续导出其他格式
  Exported --> ReviewBlocked : 再次修改且内容仍完整
  Exported --> Editing : 再次修改并产生内容缺口
  CandidateReady --> Expired : 真实视频页面刷新或关闭
  Editing --> Expired : 真实视频页面刷新或关闭
  ReviewBlocked --> Expired : 真实视频页面刷新或关闭
  Ready --> Expired : 真实视频页面刷新或关闭
  Expired --> [*]
```

产品语义：

- `CandidateReady` 只表示分析或示例处理结果已准备好；用户还没有进入编辑器。
- `Editing` 是激活节点；用户点击进入教程工作台后，才真正获得可编辑初稿。
- `Ready` 是实时门禁结果，不是人工设置的状态。
- `Exported` 只说明交付物生成成功，不等于内容已在外部平台 `Published`。
- `Expired` 只描述真实视频草稿；自有示例可以通过版本化 `localStorage` 草稿恢复。
- 未来若增加项目历史，必须把“会话状态”升级为有 ID、有版本和可恢复的持久化生命周期，不能直接复用这张派生状态图冒充数据库状态。

## 视频分析阶段

```mermaid
stateDiagram-v2
  state "读取元数据" as Loading
  state "低分辨率采样与比较" as Sampling
  state "候选筛选" as Selecting
  state "高清截图" as Capturing
  state "完成" as Complete

  [*] --> Loading
  Loading --> Sampling : 元数据与尺寸有效
  Sampling --> Selecting : 所有采样点完成
  Selecting --> Capturing : 得到候选时间点
  Capturing --> Complete : 候选截图全部生成
  Complete --> [*]
```

`VideoAnalysisStage` 只包含图中的五个正常阶段。错误与取消通过 Promise rejection / `AbortError` 处理，不伪装成该联合类型中的额外状态。

## 编辑模式

```mermaid
stateDiagram-v2
  state "编辑步骤" as Edit
  state "成稿预览" as Preview

  [*] --> Edit
  Edit --> Preview : 查看成稿
  Preview --> Edit : 返回编辑
```

切换模式不会改变教程内容或复核状态。

## 单步文案复核状态

```mermaid
stateDiagram-v2
  state "未修改的示例预置文案" as Initial
  state "已修改，待核对" as PendingReview
  state "文字与画面已核对" as Reviewed
  state SourceKind <<choice>>

  [*] --> SourceKind
  SourceKind --> Initial : 新示例，或恢复为未修改
  SourceKind --> PendingReview : 真实视频，或恢复为待核对
  SourceKind --> Reviewed : 恢复为已核对
  Initial --> PendingReview : 修改标题或正文
  PendingReview --> PendingReview : 再次修改
  PendingReview --> Reviewed : 人工确认一致
  Reviewed --> PendingReview : 再次修改
```

真实视频步骤在进入工作台时就被视为“已修改、待核对”，因为默认正文只是人工占位说明。
示例草稿恢复时，保存的 `editedStepIds` 与 `reviewedStepIds` 会覆盖新示例的默认入口状态。

## 发布门禁

发布就绪不是一个单线状态机，而是五个并行条件的合取：

| 条件 | 通过规则 | 失败后行为 | 规则 |
| --- | --- | --- | --- |
| `contentReady` | 标题、摘要、至少一个纳入步骤及其标题正文均非空；真实视频占位说明已替换 | 阻止交付并要求补全真实说明 | `BR-ED-01`、`BR-ED-02` |
| `timestampsReady` | 每个纳入步骤都有时间戳 | 阻止交付 | `BR-GT-01` |
| `screenshotsReady` | 每个纳入步骤都有截图 | 阻止交付 | `BR-GT-01` |
| `copyReviewReady` | 所有被修改的步骤、标题和摘要都已重新复核 | 显示剩余待核对数量 | `BR-RV-01`、`BR-RV-02` |
| `privacyReady` | 每个纳入步骤的截图都已被逐张人工确认 | 显示隐私检查进度 | `BR-RV-03` |

只有五项全部为 `true` 时，`publishReady` 才为 `true`，复制和下载请求才会继续。完整规则见[业务规则与需求追踪](09-business-rules-and-traceability.md)。

## 状态失效规则

- 修改步骤标题或正文：保留 `edited`，清除该步骤的 `reviewed`。
- 修改文章标题或摘要：设置 `articleCopyEdited = true`，同时设置 `articleCopyReviewed = false`。
- 隐藏步骤：该步骤不再参与门禁和导出；恢复后重新纳入计数。
- 调整顺序：不改变文字复核与隐私复核结果。
- 清空示例草稿：删除 `localStorage` 条目，无法撤销。
