# 牛来举铁（Jitie Riji）

一款基于微信云开发的健身记录小程序，围绕「记一次训练 → 看见进步 → 分享成果」的最短闭环设计。

> 微信小程序 · 健身训练日志 · 当前版本 v1.5.2（已在微信平台提交审核）

## 功能特性

- **首次建档引导**：隐私协议勾选 → 性别 / 年龄 / 身高 / 体重 / 健身目标 → 自动计算 BMI、体脂参考区间、基础代谢 BMR
- **专业动作库**：195 个动作（96 个标准动作 + 26 台 ROSEN + 73 台 FORWARD 固定器械），覆盖胸 / 背 / 腿 / 臀腿 / 肩 / 手臂 / 核心 7 大部位，含中英文术语、器械图示、男女差异化推荐重量区间
- **免登录动作库浏览页**：`pages/library` 按部位展示全部动作，`pages/exercise-detail?ex=id` 展示动作图解与三帧演示，供微信搜一搜收录
- **训练记录**：自由训练 / 模板训练双模式；10 套男女差异化模板（全身分化男/女版、PPL、上下肢分化、ROSEN/FORWARD 器械男/女版、进阶计划），训练中可随时换模板
- **自定义动作**：内置动作之外可添加自定义动作，满足个性化需求
- **动作间歇计时器**：每组动作可设 0–30 分 + 0–55 秒休息倒计时，离开页面按剩余时间恢复，到点震动提醒
- **历史统计**：本周 / 本月 / 本年三档统计、月历打卡（点日期看当天训练）、PR 个人最好成绩、连续训练天数与成就
- **分享卡**：Canvas 本地绘制，白卡 / 照片背景可选，一键保存相册或转发好友；训练结束后未及时分享的可从历史页随时补分享
- **邀请好友**：邀请二维码 + 解锁进阶模板；支持一键转发 / 朋友圈
- **数据与合规**：本地草稿兜底、云端注销删除（deleteAccount）、隐私保护指引
- **SEO**：页面标题关键词化、sitemap 精修、免登录动作库供爬虫收录
- **本地草稿兜底**：断网不丢数据，启动自动补传云端
- **Notion 风格 UI**：设计令牌集中管理，全 rpx + 安全区适配，动作列表图片懒加载，真机无横向滚动

## 技术栈

- 微信原生小程序（基础库 3.17.1，页面 9 个）
- 微信云开发：云函数 + 云数据库
- 云函数 10 个：login / saveProfile / catalog / saveWorkout / stats / initDb / qrcode / invite / remind / deleteAccount
- Node.js 24 + `node:test`（纯函数单元测试，32 项）

## 项目结构

```
miniprogram/          小程序前端（9 页面 + 工具层 + 数据种子）
  pages/              onboarding / home / record / history / profile / share / invite / library / exercise-detail
  utils/              纯函数逻辑（体质指标/统计/格式化）+ 云调用封装 + 本地存储
  data/               动作库（195 个）与模板（10 套）前端兜底种子
cloudfunctions/       云函数（10 个）
tests/                node:test 单元测试（32 个用例）
docs/                 设计文档、实现计划、部署指南、验收清单
outputs/pdf/          赛事说明文档（PDF / DOCX）
```

## 快速开始

1. 使用微信开发者工具导入项目根目录（`miniprogramRoot: miniprogram/`、`cloudfunctionRoot: cloudfunctions/`）
2. 在 `project.config.json` 中替换为自己的 AppID
3. 在 `miniprogram/app.js` 与 `cloudbaserc.json` 中替换为你的云环境 ID
4. 部署云函数（见 `cloudbaserc.json`，共 10 个）
5. 运行 `initDb` 初始化数据库：自动创建 `users / workouts / exercises / templates / invites` 并同步种子数据（幂等，可重复执行）
6. 将集合权限设置为「仅创建者可读写」
7. 运行单元测试：

```bash
node --test 'tests/*.test.js'
```

## 数据标准

- BMI：中国标准分级（偏瘦 <18.5 / 正常 18.5–23.9 / 超重 24–27.9 / 肥胖 ≥28）
- 体脂参考：中国常用健康参考值（男女分表）
- BMR：Mifflin-St Jeor 公式
- 推荐重量区间：按「性别 × 训练水平」的体重倍数规则，取 2.5kg 档；自重动作不给出重量

## 素材致谢

- 动作演示三帧插画：源自 [Workout Guide](https://github.com/bryllim/workout-guide)（作者 Bryl Lim，基础姿态来自 [Everkinetic](https://github.com/everkinetic/data)），采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可，仅作等比缩放使用，未做其他修改。
- ROSEN 固定器械照片：来源 ROSEN 官网产品页，仅用于器械识别展示。
- FORWARD 韩国器械照片：来源 FORWARD 韩国官网产品页，仅用于器械识别展示。

## 文档

- [DESIGN.md](DESIGN.md)：Notion 风格设计语言
- [docs/牛来举铁-项目说明.md](docs/牛来举铁-项目说明.md)：最新项目说明（创作背景 / 思路 / 实践过程 / 功能 / 数据 / 部署）
- [docs/](docs/)：部署指南、验收清单、设计规格与实现计划
- [outputs/pdf/](outputs/pdf/)：赛事说明文档（含创作背景、创作思路、实践过程）
