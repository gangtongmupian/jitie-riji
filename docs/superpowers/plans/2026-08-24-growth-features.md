# 增长功能实施计划（v1.2.6）

> **执行方式：** 本会话内联执行（executing-plans），完成即自测并上传。

**Goal:** 实现邀请裂变、连续打卡/成就、训练提醒、私域入口四大增长能力，交付增长运营手册。

**Architecture:** 云函数负责邀请关系、解锁状态、打卡统计、定时提醒；小程序端负责分享携带邀请码、邀请页、首页成就展示、我的页入口与模板锁定态。

**Tech Stack:** 微信小程序原生 + 微信云开发（Node16）。

---

## 文件地图

### 云函数
- 新增 `cloudfunctions/invite/index.js`：邀请状态（人数/是否被邀请/解锁）
- 新增 `cloudfunctions/remind/index.js` + `config.json`：每日 20:00 提醒未训练用户
- 新增 `cloudfunctions/stats/streak.js`：纯函数（streak/maxStreak/achievements），可单测
- 修改 `cloudfunctions/login/index.js`：绑定邀请关系并发放解锁
- 修改 `cloudfunctions/saveProfile/index.js`：支持 `remindEnabled`
- 修改 `cloudfunctions/stats/index.js`：返回 streak/maxStreak/totalWorkouts/achievements
- 修改 `cloudfunctions/qrcode/index.js`：支持自定义 scene（邀请码）
- 修改 `cloudfunctions/initDb/data/templates.js`：新增 2 套进阶模板（premium）

### 小程序端
- 新增 `miniprogram/config.js`：订阅模板 ID / 群二维码 / 客服微信号（可配置，留空即隐藏）
- 新增 `miniprogram/pages/invite/*`：邀请页（二维码、人数、解锁状态、转发）
- 修改 `miniprogram/app.json`：注册 invite 页
- 修改 `miniprogram/utils/storage.js`：inviter 存储
- 修改 `miniprogram/utils/cloud.js`：ensureLogin 带 inviter、getInviteStatus
- 修改 `miniprogram/utils/share.js`：分享路径统一携带 inviter
- 修改 `miniprogram/utils/stats.js` 或引用 streak 模块：仅测试用
- 修改 `miniprogram/pages/home/*`：连续天数 + 成就勋章 + 解析邀请参数
- 修改 `miniprogram/pages/profile/*`：邀请入口 / 提醒开关 / 群 / 客服
- 修改 `miniprogram/pages/onboarding/*`：建档时绑定邀请
- 修改 `miniprogram/pages/record/*`：进阶模板锁定态
- 修改 `miniprogram/pages/share/*`：卡片加入连续天数
- 修改 `miniprogram/data/templates.js`：新增进阶模板（与 initDb 数据一致）

### 文档
- 新增 `docs/growth-playbook.md`：增长运营手册

## 数据模型

- `invites` 集合：`{ inviter: string, invitee: string, createdAt }`
- `users` 新增字段：`inviteReward: bool`、`remindEnabled: bool`
- `templates` 新增字段：`premium: bool`（进阶模板）

## 关键接口

- `login` 云函数入参 `{ inviter }`：首次绑定 + 双方 `inviteReward=true`
- `invite` 云函数返回 `{ inviteCount, invitedBy, rewardUnlocked }`
- `qrcode` 云函数入参 `{ scene }`：返回 `{ fileID }`
- `stats` 返回新增 `{ streak, maxStreak, totalWorkouts, achievements: [{id,name,done}] }`
- `saveProfile` 新增入参 `remindEnabled`
- `share.appMessage(title, path)` 自动追加 `inviter=<openid>`；`share.timeline(title)` 携带 query

## 任务

1. TDD：写 streak 模块单测（连续天数、跨天、成就阈值）
2. 云函数：invite / remind / login / saveProfile / stats / qrcode / initDb 数据
3. 客户端：config / storage / cloud / share
4. 客户端页面：home 成就、profile 入口、onboarding 绑定、record 锁定、share 卡片、invite 新页
5. 测试：单元 + UI 自动化
6. 部署云函数（--install-dependency true）+ initDb 同步数据 + CLI 验证
7. 上传 v1.2.6；写增长运营手册；提交并推送 GitHub

## 验证

- `node --test tests/*.test.js` 全绿
- CLI 调用 invite/stats/login/saveProfile 无 wx-server-sdk 缺失错误
- UI 自动化：邀请链路、模板锁定、成就展示、错误提示
- 响应式检查无横向溢出
