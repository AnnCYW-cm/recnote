# V1 To-Be 产品蓝图

本文描述录见下一阶段的**待验证目标产品**，不是当前实现、开发承诺、上线日期或已经批准的排期。当前 MVP 和用户研究先按[产品验证指标与决策规则](10-product-validation-metrics.md)收集证据；目标能力只有在能够解释主要失败原因时才进入开发，验证所必需的能力也只能先做成有边界的实验切片。

当前 `0.2.x` 事实仍以 `01`–`09` 为准。本文中的 `To-Be` 对象和状态不得被引用为“已经支持”。

## 目标结论

V1 候选方向收敛为：

> 面向高频个体软件教程创作者的匿名、单人、浏览器本地项目制工具。它首先解决草稿可恢复、候选漏帧可补救、截图可处理和完整交付；AI 建议是默认关闭的可选支路，不是主链硬依赖。

这意味着 V1 不是团队 SaaS，也不以账号、云同步、计费或服务端视频处理作为前置条件。

## 目标范围与决策状态

| 能力 | V1 候选优先级 | 进入目标蓝图的原因 | 决策状态 |
| --- | --- | --- | --- |
| 本地项目列表与最新自动保存 | P0 | 当前真实视频刷新即丢失，是高风险中断点 | 待验证目标 |
| 恢复项目与重新挂载源视频 | P0 | 保存文字和截图不等于持续持有原始视频权限 | 待验证目标 |
| 候选池、按时间补帧、删除与替换截图 | P0 | 当前漏掉关键步骤后没有产品内恢复 | 待验证目标 |
| 裁剪、简单标注和人工遮挡 / 模糊 | P0 | 让候选画面真正可用于教程与隐私处理 | 待验证目标 |
| 当前编辑、复核、五项门禁与三种导出 | P0 | 保留已实现并经工程验收的交付闭环 | 延续当前能力 |
| 可选语义建议 | P1 独立实验 | 人工补全文案仍是核心成本，但模型不能成为主链依赖 | 默认关闭、需单独验证，不属于最小 V1 P0 |
| 账号、组织、团队权限、审批与计费 | 不进入 V1 | 尚无验证证据，会改变产品与部署复杂度 | 未定义 |
| 云同步、云数据库、对象存储与分享链接 | 不进入 V1 | 与本地优先承诺和首轮 ICP 不匹配 | 未定义 |
| 服务端 ffmpeg、任务队列与默认视频上传 | 不进入 V1 | 当前没有必要，也会扩大隐私边界 | 未定义 |

## 目标参与者

| 参与者 | V1 责任 | 边界 |
| --- | --- | --- |
| 教程创作者 | 创建和恢复本地项目、整理候选、编辑截图和文案、完成复核并导出 | 唯一系统内主角色；匿名、单人 |
| 文案审核者、隐私审核者、发布者 | 创作者承担的三种责任侧面 | V1 不创建独立账号或权限角色 |
| 模型提供方 | 在用户明确启用时接收被选中的候选截图并返回建议 | 外部、可选、默认关闭 |
| 外部发布平台 | 接收用户主动粘贴、上传或导入的交付物 | RecNote 不直接发布，也不观测发布结果 |
| 教程读者 | 使用外部平台上的最终教程 | 系统外部角色 |
| CLI 使用者 | 继续使用独立离线候选工具 | 不进入 Web V1 主链，也不与 Web 项目自动互通 |

## 目标核心用例

| 编号 | 用例 | V1 目标结果 | 主要失败与恢复 |
| --- | --- | --- | --- |
| `TU-01` | 创建本地项目 | 从有效录屏得到候选池和可编辑初稿，并保存最新快照 | 解码或分析失败时保留项目壳，允许重试或换视频 |
| `TU-02` | 恢复本地项目 | 恢复文字、候选截图、复核状态和最近编辑位置 | 原视频不可继续访问时进入“需要重新挂载”，不丢失已有成果 |
| `TU-03` | 管理本地项目 | 列出、重命名、继续和删除本机项目 | 删除必须二次确认；V1 不承诺版本树和跨设备恢复 |
| `TU-04` | 修复候选池 | 按时间补帧、删除候选、恢复候选或替换步骤截图 | 需要重新读取视频时要求重新挂载并核对指纹 |
| `TU-05` | 编辑截图 | 裁剪、简单标注和人工遮挡 / 模糊，保留原图与派生图关系 | 编辑失败回到上一张可用图片，不破坏原图 |
| `TU-06` | 编辑与复核教程 | 延续标题、摘要、步骤、顺序、纳入状态与五项门禁 | 修改文案或图片时按规则撤销历史复核 |
| `TU-07` | 获取可选语义建议 | 披露提供方与数据范围，明确同意后只发送选中截图，用户决定接受、拒绝或修改 | 拒绝、失败、取消或超时都回到完整人工路径 |
| `TU-08` | 导出教程 | 按格式级口径生成 Markdown、富文本或完整 ZIP | 失败不改变最近已保存项目，允许重试 |

## 目标系统上下文辅助图

这张图用于表达目标边界，不是标准 UML 系统上下文图。虚线表示只有用户明确启用后才存在的数据路径。

```mermaid
flowchart LR
  Creator[教程创作者]
  Publish[外部发布平台]
  Reader[教程读者]
  Model[外部模型提供方：默认关闭]

  subgraph Device[用户设备]
    Video[本地录屏]
    Web[RecNote V1 Web]
    Media[浏览器媒体与 Canvas]
    Store[浏览器本地项目存储]
    Clipboard[系统剪贴板与本地文件]
  end

  Hosting[Sites / Worker：只分发应用]

  Creator --> Web
  Hosting --> Web
  Video -->|临时读取；恢复时可能需重新选择| Web
  Web --> Media
  Web --> Store
  Web --> Clipboard
  Clipboard -->|用户主动带出| Publish
  Publish --> Reader
  Web -.->|明确同意后，仅选中截图与披露的上下文| Model
  Model -.->|建议，不是已复核成稿| Web
```

目标部署仍然没有 D1、R2、RecNote 自有的原视频上传 API 或服务端 ffmpeg。只有用户明确启用可选语义建议时，浏览器才按本次同意范围把选中截图直接发送给已披露的外部模型提供方。浏览器本地项目存储可以由 IndexedDB、OPFS 或其他浏览器能力实现，具体技术必须通过 ADR 决定；领域模型只依赖抽象的 `BrowserLocalStore`。

## 目标领域类图

这是 V1 候选范围的标准 UML 类图。它与[当前产品领域模型](08-product-domain-model.md)分开，不能用于声称现有代码已经实现这些对象。

```mermaid
classDiagram
  class LocalProject {
    <<aggregate root>>
    +id
    +schemaVersion
    +title
    +phase
    +createdAt
    +updatedAt
  }

  class SourceMediaRef {
    <<local reference>>
    +fileName
    +size
    +lastModified
    +duration
    +dimensions
    +fingerprint
    +attachmentState
  }

  class AnalysisRun {
    <<transient process>>
    +stage
    +progress
    +status
  }

  class CandidateFrame {
    <<project item>>
    +id
    +timestamp
    +visualScore
  }

  class FrameSelection {
    <<mapping>>
    +order
    +kind selected_supplement_replacement
    +replacementOf
  }

  class ScreenshotAsset {
    <<local asset>>
    +id
    +kind original_or_derived
    +localReference
    +width
    +height
  }

  class ImageEdit {
    <<value object>>
    +kind crop_annotation_redaction
    +parameters
    +createdAt
  }

  class TutorialDraft {
    <<aggregate member>>
    +title
    +summary
    +mode
  }

  class TutorialStep {
    <<domain item>>
    +id
    +timestamp
    +title
    +body
    +included
  }

  class ReviewGate {
    <<derived decision>>
    +contentReady
    +timestampsReady
    +screenshotsReady
    +copyReviewReady
    +privacyReady
  }

  class ProjectSnapshot {
    <<latest local snapshot>>
    +schemaVersion
    +savedAt
    +saveStatus
  }

  class ModelConsent {
    <<explicit consent>>
    +provider
    +dataScope
    +selectedFrameIds
    +purpose
    +consentedAt
  }

  class SemanticRun {
    <<optional process>>
    +status
    +startedAt
  }

  class SemanticSuggestion {
    <<unreviewed suggestion>>
    +targetStepId
    +suggestedTitle
    +suggestedBody
    +decision
  }

  class DeliveryArtifact {
    <<ephemeral output>>
    +format
    +createdOnDemand
  }

  LocalProject "1" *-- "0..1" SourceMediaRef : records metadata
  LocalProject "1" --> "0..*" AnalysisRun : launches
  LocalProject "1" *-- "0..*" CandidateFrame : owns
  LocalProject "1" *-- "0..*" FrameSelection : owns
  LocalProject "1" *-- "0..*" ScreenshotAsset : owns
  LocalProject "1" *-- "0..1" TutorialDraft : owns
  LocalProject "1" *-- "0..1" ProjectSnapshot : latest recoverable state
  LocalProject "1" *-- "0..*" SemanticRun : records optional runs
  CandidateFrame "1" --> "1" ScreenshotAsset : original capture
  CandidateFrame "1" --> "0..1" FrameSelection : may select
  FrameSelection "1" --> "0..1" TutorialStep : maps to
  TutorialDraft "1" *-- "0..*" TutorialStep : contains
  TutorialStep "1" --> "1" ScreenshotAsset : uses current image
  ScreenshotAsset "0..1" --> "0..*" ScreenshotAsset : source to derivatives
  ScreenshotAsset "1" *-- "0..*" ImageEdit : derives through
  TutorialDraft "1" --> "1" ReviewGate : evaluates
  ReviewGate ..> DeliveryArtifact : permits
  LocalProject "1" --> "0..*" DeliveryArtifact : generates on demand
  SemanticRun "1" *-- "1" ModelConsent : captures immutable consent
  SemanticRun "0..*" --> "1..*" CandidateFrame : sends selected inputs
  SemanticRun "1" *-- "0..*" SemanticSuggestion : returns
  SemanticSuggestion ..> TutorialStep : may update after acceptance
```

### 领域不变量

1. `LocalProject` 是候选映射、所有本地截图资产和可选语义运行记录的生命周期所有者；删除项目时，其快照、候选、原始截图副本、派生截图、`SemanticRun`、同意快照和建议一并删除，源视频文件本身不复制进项目存储。
2. `SourceMediaRef` 只保存元数据、指纹和可选本地引用；浏览器不再拥有文件权限时必须进入 `NeedsReattach`。
3. 空项目壳可以暂时没有 `TutorialDraft`；分析生成候选或用户主动进入人工建稿后才创建草稿。草稿在选中第一张候选前可以没有步骤，但有效交付至少需要一个被纳入的完整步骤。
4. V1 只承诺“最新可恢复快照”，不承诺版本树、分支或回滚。
5. 每个 `TutorialStep` 使用一张当前截图；替换、裁剪、标注或遮挡必须至少撤销该步隐私复核。
6. 接受 AI 建议等同于修改草稿，必须撤销对应文案复核；建议不能直接成为已复核成稿。
7. 每次 `SemanticRun` 必须保存一份不可变 `ModelConsent` 快照，绑定提供方、被选中的候选 ID、数据范围、用途和同意时间；再次请求建议需要新的本次范围，不能沿用一次同意无限扩大到其他视频或截图。
8. `ReviewGate` 仍是派生决策，不能被用户或模型直接写成通过。
9. `DeliveryArtifact` 按需生成；V1 不保存外部发布结果，也不把导出成功称为已经发布。

## 目标项目生命周期

这是标准 UML 状态机。`phase` 可以保存在最新快照中，但恢复时必须根据草稿内容与门禁重新校验，不能盲信历史 `Ready`。

```mermaid
stateDiagram-v2
  state "新项目" as New
  state "已选择源视频" as SourceSelected
  state "分析中" as Analyzing
  state "候选池就绪" as CandidateReady
  state "编辑中" as Editing
  state "复核阻塞" as ReviewBlocked
  state "可交付" as Ready
  state "已生成交付物" as Delivered
  state "分析失败" as AnalysisFailed
  state "已取消分析" as Cancelled
  state "已归档" as Archived
  state "已删除" as Deleted
  state RestoreGate <<choice>>

  [*] --> New
  New --> SourceSelected : 选择并校验本地视频
  SourceSelected --> Analyzing : 开始本地分析
  Analyzing --> CandidateReady : 候选生成成功并保存
  Analyzing --> AnalysisFailed : 解码、超时或 Canvas 失败
  Analyzing --> Cancelled : 用户取消
  AnalysisFailed --> SourceSelected : 重试或重新挂载视频
  Cancelled --> SourceSelected : 保留项目并返回
  CandidateReady --> Editing : 创建或修复教程初稿
  Editing --> ReviewBlocked : 内容完整但复核未完成
  ReviewBlocked --> Editing : 内容再次不完整
  ReviewBlocked --> Ready : 五项门禁全部通过
  Ready --> ReviewBlocked : 修改后内容仍完整但复核失效
  Ready --> Editing : 修改导致内容、时间戳或截图缺失
  Ready --> Delivered : 格式级有效交付成功
  Delivered --> Ready : 继续导出其他格式
  Delivered --> ReviewBlocked : 修改后内容仍完整但复核失效
  Delivered --> Editing : 修改导致内容、时间戳或截图缺失
  Editing --> Archived : 用户归档
  ReviewBlocked --> Archived : 用户归档
  Ready --> Archived : 用户归档
  Delivered --> Archived : 用户归档
  Archived --> RestoreGate : 恢复并重新计算门禁
  RestoreGate --> Editing : 内容不完整
  RestoreGate --> ReviewBlocked : 内容完整但复核未完成
  RestoreGate --> Ready : 五项门禁全部通过
  New --> Deleted : 确认删除
  SourceSelected --> Deleted : 确认删除
  Analyzing --> Deleted : 取消分析并确认删除
  AnalysisFailed --> Deleted : 确认删除
  Cancelled --> Deleted : 确认删除
  CandidateReady --> Deleted : 确认删除
  Editing --> Deleted : 确认删除
  ReviewBlocked --> Deleted : 确认删除
  Ready --> Deleted : 确认删除
  Delivered --> Deleted : 确认删除
  Archived --> Deleted : 确认删除
  Deleted --> [*]
```

## 本地保存状态机

保存失败不得让内存中的编辑结果消失，也不得显示虚假的“已保存”。

```mermaid
stateDiagram-v2
  state "已保存" as Saved
  state "有未保存修改" as Dirty
  state "保存中" as Saving
  state "保存失败" as SaveFailed
  state "空间不足" as QuotaExceeded

  [*] --> Saved
  Saved --> Dirty : 文案、顺序、候选、图片或复核变化
  Dirty --> Saving : 自动保存或手动保存
  Saving --> Saved : 快照和本地资产写入成功
  Saving --> SaveFailed : 写入异常
  Saving --> QuotaExceeded : 浏览器配额不足
  SaveFailed --> Dirty : 保留内存工作并允许重试
  QuotaExceeded --> Dirty : 提示清理空间或先导出
```

## 源视频连接状态机

```mermaid
stateDiagram-v2
  state "已连接" as Attached
  state "需要重新挂载" as NeedsReattach
  state AttachmentCheck <<choice>>

  [*] --> AttachmentCheck
  AttachmentCheck --> Attached : 当前会话仍持有源文件
  AttachmentCheck --> NeedsReattach : 恢复项目且文件权限已失效
  Attached --> NeedsReattach : 页面重开且浏览器不再持有源文件权限
  NeedsReattach --> Attached : 用户重新选择且指纹匹配
```

项目处于 `NeedsReattach` 时仍可编辑已有文字和截图、完成复核或导出；只有重新分析、按时间补帧或从源视频替换截图时才必须重新挂载。

## 新建、保存与恢复时序

```mermaid
sequenceDiagram
  actor Creator as 教程创作者
  participant Web as RecNote V1
  participant Media as 浏览器媒体 API
  participant Store as BrowserLocalStore

  Creator->>Web: 选择本地视频并创建项目
  Web->>Store: 先保存项目壳、源视频元数据和最新状态
  alt 项目壳保存成功
    Store-->>Web: saved
    Web->>Media: 本地解码、采样与生成候选
    alt 分析成功
      Media-->>Web: 候选截图与视频元数据
      Web->>Store: 保存候选、草稿和最新快照
      alt 结果保存成功
        Store-->>Web: saved
        Web-->>Creator: 打开候选池和可编辑初稿
      else 写入失败或空间不足
        Store-->>Web: write error / quota exceeded
        Web-->>Creator: 保留内存结果并标记未保存；允许重试或先导出
      end
    else 分析失败或用户取消
      Media-->>Web: error / cancelled
      Web->>Store: 保存 AnalysisFailed / Cancelled 状态
      alt 失败状态保存成功
        Store-->>Web: saved
        Web-->>Creator: 保留项目壳，允许重试、换视频或删除
      else 写入失败或空间不足
        Store-->>Web: write error / quota exceeded
        Web-->>Creator: 项目壳仍在内存中且未保存；允许重试保存或删除
      end
    end
  else 项目壳保存失败或空间不足
    Store-->>Web: write error / quota exceeded
    Web-->>Creator: 不开始分析；保留内存输入并允许重试或取消
  end

  Creator->>Web: 刷新或稍后重新打开
  Web->>Store: 读取项目索引、最新快照与本地资产
  alt 快照可读且版本兼容
    Store-->>Web: 恢复内容与复核状态
    Web->>Web: 重新计算五项门禁
    Web-->>Creator: 恢复项目；源视频可能标记 NeedsReattach
  else 读取失败、快照损坏或版本不兼容
    Store-->>Web: read error / invalid snapshot
    Web-->>Creator: 不覆盖现有本地数据；显示恢复失败、重试与确认删除入口
  end

  opt 需要补帧或重新分析
    Web-->>Creator: 请求重新选择源视频
    Creator->>Web: 重新挂载文件
    Web->>Web: 校验元数据与指纹
    alt 匹配
      Web-->>Creator: 允许继续读取源视频
    else 不匹配
      Web-->>Creator: 阻止覆盖并要求确认其他文件
    end
  end
```

## 候选修复与截图编辑时序

```mermaid
sequenceDiagram
  actor Creator as 教程创作者
  participant Web as RecNote V1
  participant Media as 浏览器媒体 API
  participant Store as BrowserLocalStore
  participant Review as 文案与隐私复核状态

  Creator->>Web: 在时间轴补帧或替换步骤截图
  alt 源视频已连接
    Web->>Media: seek 并截取指定时间画面
    Media-->>Web: 原始 ScreenshotAsset
  else 需要重新挂载
    Web-->>Creator: 请求重新选择并校验源视频
    Creator->>Web: 重新选择文件
    Web->>Web: 校验元数据与指纹
    alt 指纹匹配
      Web->>Media: seek 并截取指定时间画面
      Media-->>Web: 原始 ScreenshotAsset
    else 指纹不匹配
      Web-->>Creator: 阻止替换，保留现有项目和截图
    end
  end
  opt 已获得新的原始截图
    Web->>Web: 把原图加入候选池
    alt 直接使用原图
      Creator->>Web: 确认补帧或替换
      Web->>Web: 更新 FrameSelection 与步骤当前截图
    else 选择裁剪、标注或人工遮挡
      Creator->>Web: 提交图片编辑
      alt 图片编辑成功
        Web->>Web: 生成派生 ScreenshotAsset 与 ImageEdit
        Web->>Web: 更新 FrameSelection 与步骤当前截图
      else 图片编辑失败
        Web-->>Creator: 保留上一张可用步骤截图；新原图留在候选池，可重试或直接使用
      end
    end
    opt 步骤当前截图已经变化
      Web->>Review: 撤销该步隐私复核；画面证据变化时同时撤销文案复核
      Web->>Web: 重新计算 ReviewGate
    end
    Web->>Store: 保存候选、可能的派生资产、步骤与复核状态
    alt 保存成功
      Store-->>Web: saved
      Web-->>Creator: 显示候选池和新的待复核项
    else 写入失败或空间不足
      Store-->>Web: write error / quota exceeded
      Web-->>Creator: 保留内存结果并标记未保存；允许重试
    end
  end
```

## 可选 AI 建议时序

这条序列是条件性目标，不属于默认人工主链。

```mermaid
sequenceDiagram
  actor Creator as 教程创作者
  participant Web as RecNote V1
  participant Model as 外部模型提供方
  participant Review as 文案复核状态
  participant Store as BrowserLocalStore

  Creator->>Web: 请求语义建议
  Web-->>Creator: 显示提供方、选中截图、用途与发送范围
  alt 用户拒绝或取消
    Creator->>Web: 取消
    Web-->>Creator: 返回完整人工编辑路径
  else 用户明确同意
    Creator->>Web: 确认本次数据范围
    Web->>Web: 创建 ModelConsent
    Web->>Store: 保存 SemanticRun 与不可变同意快照
    alt 同意快照保存失败
      Store-->>Web: write error / quota exceeded
      Web-->>Creator: 不发送截图；返回人工编辑并允许稍后重试
    else 同意快照保存成功
      Store-->>Web: saved
      Web->>Model: 仅发送明确选中的截图与披露的上下文
      alt 成功
        Model-->>Web: 未复核建议
        Web-->>Creator: 展示接受、拒绝或编辑
        alt 接受或修改
          Creator->>Web: 接受或修改建议
          Web->>Review: 标记文案已修改、撤销历史文案复核
          Web->>Web: 重新计算 ReviewGate
          Web->>Store: 保存建议决策、草稿与复核状态
        else 拒绝建议
          Creator->>Web: 拒绝
          Web->>Store: 保存拒绝决策；不改草稿
          Web-->>Creator: 保留原草稿与原复核状态
        end
      else 提供方失败或超时
        Model-->>Web: error
        Web->>Store: 保存失败状态
        Web-->>Creator: 保留原草稿并返回人工编辑
      else 用户取消运行
        Creator->>Web: 取消
        Web->>Model: 中止本次请求
        Web->>Store: 保存取消状态
        Web-->>Creator: 保留原草稿并返回人工编辑
      end
    end
  end
```

## V1 明确排除

- `User`、`Organization`、`Workspace`、登录、RBAC、多人协作和审批流；
- `Plan`、`Subscription`、`Entitlement`、支付、套餐和用量计费；
- 云端数据库、对象存储、云同步、跨设备项目和分享链接；
- 直连公众号或知识库发布、发布记录、阅读分析与读者埋点；
- 服务端 ffmpeg、后台队列、默认上传原视频；
- 自动隐私识别、自动合规认证或无需人工确认的自动发布；
- 完整版本树、分支和回滚；V1 只承诺本地项目列表与最新快照；
- Docker 自托管、原生桌面或移动端、长视频、会议转写和通用视频摘要。

## 进入开发前的门槛

1. [产品验证指标与决策规则](10-product-validation-metrics.md)达到对应 Go 或明确的 Iterate 条件；`Go` 才授权完整 P0 产品化，`Iterate` 只授权针对失败原因的有边界实验。
2. 为本地项目存储、浏览器配额、源视频重新挂载和删除语义完成 ADR。
3. 明确 P0 只包含本地项目、候选修复、基础截图处理和现有交付闭环；可选模型链单独估算、单独启用、单独验收。
4. 为每项新增能力补充业务规则 ID、异常路径、隐私说明和自动化验收，再把它从本文迁入当前实现文档。
