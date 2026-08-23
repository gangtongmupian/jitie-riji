# iOS 版「牛来举铁」设计文档

日期：2026-08-23
状态：已由用户确认（2026-08-23）

## 1. 背景与目标

「牛来举铁」微信小程序已上线并稳定迭代（v1.2.4：85 动作库、26 台 ROSEN 固定器械、动作动画演示、器械图示、男女分离模板、训练统计）。用户希望基于最新版本开发 App Store 原生 iOS 应用。

目标：在保持产品逻辑与视觉语言一致的前提下，交付一个可编译、可测试、可上架的 SwiftUI 应用；通过 GitHub Actions macOS 云构建解决本机（Windows）无法编译的问题。

## 2. 范围

### 包含

- SwiftUI 原生 iOS 应用，最低 iOS 17，SwiftData 本地存储。
- 1:1 移植小程序功能：引导、首页、训练记录、历史统计、我的、分享图。
- 内置数据移植：85 动作（含 26 台 ROSEN）、6 套模板、29 张器械图、41 种动作动画。
- 设计系统移植：DESIGN.md 全部 token 与组件规范。
- 工程化：XcodeGen（project.yml）、单元测试、GitHub Actions 构建与模拟器截图。
- 上架准备：App 名称/简介/隐私政策文案、隐私标签指引、截图清单。

### 不包含（本阶段）

- 云端同步/账号系统（小程序 CloudBase 为微信生态专用，不可直接复用；后续可接 Supabase 做互通）。
- Apple Watch、健康 App 数据接入。
- Android 版本。

## 3. 技术方案

- 语言/框架：Swift 5.9+ / SwiftUI / SwiftData。
- 最低系统：iOS 17。
- 工程生成：XcodeGen（`ios/project.yml`），不提交 `.xcodeproj`。
- 构建验证：GitHub Actions（macos-15 runner）执行 `xcodegen generate` + `xcodebuild` + `xcrun simctl` 截图。
- 无第三方网络依赖，纯本地运行。

## 4. 架构与模块

`ios/` 目录结构：

```
ios/
  project.yml
  Jitie/
    App/JitieApp.swift
    Models/          # SwiftData 实体
    Stores/          # 数据访问 + 内置数据加载
    Services/        # 计时、分享图、动作动画引擎、推荐重量
    Views/           # 页面与可复用组件
    Resources/       # Assets、器械图、字体
  JitieTests/        # 单元测试
  JitieUITests/      # UI 冒烟测试
```

分层规则：Views 只依赖 Stores/Services；Models 为纯数据；Services 不依赖 SwiftUI。

## 5. 数据模型（SwiftData）

- `Profile`：gender, age, heightCm, weightKg, goal, frequency, nickname, bmi, bmr。
- `Workout`：date, startedAt, endedAt, durationSec, calories, mode, templateName, exercises(WorkoutExercise[]), totalSets, totalVolume。
- `WorkoutExercise`：exerciseId, name, bodyPart, equipment, weighted, sets(Set[])。
- `Set`：reps, weight。
- `Template`：id, name, goal, genderHint, frequency, exercises(TemplateExercise[])。内置数据，只读。
- `TemplateExercise`：exerciseId, sets, repRange。
- `CustomExercise`：id, name, bodyPart, equipment, weighted。

内置动作库与模板以 Swift 常量文件提供（由小程序数据生成），不入库。

## 6. 屏幕与交互

### 引导（Onboarding）

多步表单：性别 → 年龄/身高/体重 → 目标/频率 → 结果（BMI/BMR/推荐重量）。完成后写入 Profile 并进入首页。未完成 Profile 时启动强制进入引导。

### 首页（Home）

- 深蓝 Hero：昵称（可编辑）、「本周训练（次）」（按完成训练次数，不按组数）、「本周消耗（kcal）」。
- 「开始训练」主按钮；最近一次训练卡片；空态引导。

### 训练（Record）

- 自由/模板分段切换；模板卡片带「男士/女士/通用」标签并按性别排序。
- 动作选择弹层：部位筛选、搜索、动作名 + 器械图示、演示入口。
- 动作详情弹层：器械图、火柴人动画循环、目标肌群、推荐重量、动作要领、注意事项。
- 训练卡：组列表（重量/次数/删除）、加组、间歇计时（1–30 分钟）、开始休息/停止。
- 重量口径提示：杠铃记总重、哑铃记单只、器械记配重显示值。
- 完成训练：汇总弹层 + 热量录入（默认预估）→ 保存（防重复提交）→ 分享页。
- 自定义动作：名称/部位/器械/类型，存本地。

### 历史（History）

- 周/月/年三档统计卡（kcal + 次数）。
- 训练日历：有训练日期加深标记，点击查看当日明细（动作/组/重量×次数/热量）。
- 个人最好成绩列表（按动作的最大单组重量）。

### 我的（Profile）

- 资料编辑（昵称/体重/目标/频率）、隐私政策、关于。

### 分享（Share）

- 训练完成后生成本地分享图（SwiftUI 视图 + ImageRenderer → UIImage），系统分享面板（ShareLink / UIActivityViewController），支持存相册与微信。

## 7. 设计系统移植

### 颜色（Color tokens，Swift `Color` 扩展）

- primary `#5645D4` / primaryPressed `#4534B3` / primaryDeep `#3A2A99`
- linkBlue `#0075DE`
- navy `#0A1530` / navyDeep `#070F24` / navyMid `#1A2A52`
- canvas `#FFFFFF` / surface `#F6F5F4` / surfaceSoft `#FAFAF9`
- hairline `#E5E3DF` / hairlineSoft `#EDE9E4` / hairlineStrong `#C8C4BE`
- ink `#1A1A1A` / charcoal `#37352F` / slate `#5D5B54` / steel `#6B6861` / stone `#75726A`
- success `#1AAE39` / successDeep `#0E7528` / warning `#DD5B00` / warningDeep `#AD4200` / error `#E03131` / roseDeep `#B02A58` / track `#E8E6E3`
- tint 粉彩组：lavender/peach/mint/sky/rose/yellow + yellowBold

### 字体层级

- display 34px/600；heading 22px/600；title 17px/600；body 16px/400（行高 1.5）；caption 13px/400；micro 12px/500；button 14px/500。
- 数据数字 `monospacedDigit()`。

### 组件

- 主按钮：紫底白字、8pt 圆角、高 44pt。
- 卡片：白底 + 1px 发丝线 + 12pt 圆角。
- 胶囊筛选：未选中白底描边，选中黑底白字。
- 标签：粉彩底 + 深色文字（对比度 ≥4.5:1）。
- 触控目标 ≥44pt。

## 8. 内置数据与资源

- 动作库：由 `miniprogram/data/exercises.js` 生成 Swift 常量（85 条：id/name/enName/bodyPart/equipment/weighted/pcts）。
- 模板：6 套由 `templates.js` 生成。
- 器械图示：29 张 PNG 复制为 Assets。
- 动作动画：`motion.js` 的 41 种姿态关键帧与插值逻辑移植为 Swift `MotionEngine`（纯计算，可单测）。
- 演示说明：`exercise-details.js` 的目标肌群/要领/注意事项生成 Swift 常量。

## 9. 计时与后台行为

- 间歇计时基于绝对时间戳（endAt），`scenePhase` 进入后台不停止，回前台按剩余时间恢复；结束震动（`UINotificationFeedbackGenerator`）+ 长提醒。
- 动画仅在详情弹层存在时运行，离开即停止。

## 10. 测试策略

- 单元测试（JitieTests）：
  - 统计：周/月/年次数与热量、去重（同 startedAt+组数+容量只计 1 次）、PR 计算。
  - 推荐重量、BMI/BMR 计算。
  - MotionEngine：姿态坐标有限且在画布范围内。
  - 内置数据完整性：动作 id 唯一、模板引用有效、器械图存在。
- UI 冒烟（JitieUITests）：引导 → 首页 → 添加动作 → 完成训练 → 历史，无崩溃。
- CI 截图：模拟器按机型生成 6.9"/6.1" 两档关键页截图，供上架素材。

## 11. 构建与交付

- 本地：任意 Mac 安装 Xcode 16 + xcodegen，`cd ios && xcodegen generate && open Jitie.xcodeproj`。
- CI：`.github/workflows/ios-build.yml`（macos-15）：generate → build → test → 截图上传 artifact。
- 上架：Apple Developer 账号（$99/年）注册 App ID；证书与描述文件由用户提供或在其 Mac 生成；App Store Connect 资料、隐私标签、年龄分级由我提供文案与填写指引。

## 12. 风险与对策

- 无法在本机编译 Swift：对策为 CI 云构建 + 代码尽量使用稳定 API、保守写法。
- 小程序与 iOS 数据不互通：本阶段明示为本地独立，后续接 Supabase。
- 火柴人动画保真度有限：与小程序一致，详情页同时保留文字要领。

## 13. 里程碑

1. M1 工程骨架：project.yml + App 入口 + 设计 tokens + 数据模型。
2. M2 内置数据与核心逻辑：动作/模板/统计/推荐/MotionEngine + 单测。
3. M3 页面：引导 → 首页 → 训练 → 历史 → 我的 → 分享。
4. M4 CI 构建与截图 + UI 冒烟。
5. M5 上架资料包（文案/截图清单/隐私标签指引）。
