# 牛来举铁（Jitie Riji）

一款基于微信云开发的健身记录小程序，围绕「记一次训练 → 看见进步 → 分享成果」的最短闭环设计。

> 参赛作品 · 微信小程序 · v1.2.0

## 功能特性

- **首次建档引导**：隐私协议勾选 → 性别 / 年龄 / 身高 / 体重 / 健身目标 → 自动计算 BMI、体脂参考区间、基础代谢 BMR
- **专业动作库**：195 个动作（96 个标准动作 + 26 台 ROSEN + 73 台 FORWARD 固定器械），覆盖胸 / 背 / 腿 / 臀腿 / 肩 / 手臂 / 核心 7 大部位，含中英文术语、器械图示、男女差异化推荐重量区间
- **训练记录**：自由训练 / 模板训练双模式；4 套男女差异化模板（全身分化男/女版、PPL、上下肢分化），训练中可随时换模板
- **自定义动作**：内置动作之外可添加自定义动作，满足个性化需求
- **动作间歇计时器**：每组动作可设 1–30 分钟休息倒计时，底部常驻显示，到点震动提醒
- **历史统计**：月历打卡、近 8 周训练趋势、PR 个人最好成绩（最大重量 / 最重单次容量）
- **分享卡**：Canvas 本地绘制，白卡 / 照片背景可选，一键保存相册或转发好友
- **本地草稿兜底**：断网不丢数据，启动自动补传云端
- **Notion 风格 UI**：设计令牌集中管理，全 rpx + 安全区适配，真机无横向滚动

## 技术栈

- 微信原生小程序（基础库 3.17.1）
- 微信云开发：云函数 + 云数据库
- Node.js 24 + `node:test`（纯函数单元测试）

## 项目结构

```
miniprogram/          小程序前端（6 页面 + 工具层 + 数据种子）
  pages/              onboarding / home / record / history / profile / share
  utils/              纯函数逻辑（体质指标/统计/格式化）+ 云调用封装 + 本地存储
  data/               动作库（195 个）与模板（10 套）前端兜底种子
cloudfunctions/       云函数（login / saveProfile / catalog / saveWorkout / stats / initDb）
tests/                node:test 单元测试（15 个用例）
docs/                 设计文档、实现计划、部署指南、验收清单
outputs/pdf/          赛事说明文档（PDF / DOCX）
```

## 快速开始

1. 使用微信开发者工具导入项目根目录（`miniprogramRoot: miniprogram/`、`cloudfunctionRoot: cloudfunctions/`）
2. 在 `project.config.json` 中替换为自己的 AppID
3. 在 `miniprogram/app.js` 与 `cloudbaserc.json` 中替换为你的云环境 ID
4. 部署 6 个云函数：`login`、`saveProfile`、`catalog`、`saveWorkout`、`stats`、`initDb`
5. 运行 `initDb` 初始化数据库：自动创建 `users / workouts / exercises / templates` 并同步种子数据（幂等，可重复执行）
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
- [docs/](docs/)：部署指南、验收清单、设计规格与实现计划
- [outputs/pdf/](outputs/pdf/)：赛事说明文档（含创作背景、创作思路、实践过程）
