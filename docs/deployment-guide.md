# 举铁日记 · 部署上线指南

> 目标是:把代码上传到微信,通过审核,正式发布。整个流程约 1–2 小时(不含审核等待时间)。
> 必须由你本人操作的部分都已标明 ⚠️(需要你的微信小程序账号或扫码)。

## 需要你准备的(一次性)

- ⚠️ 微信小程序账号(AppID):到 [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册/登录(个人主体即可,免费)
- ⚠️ 一个能扫码登录微信的账号(微信开发者工具登录用)

## 第 1 步:获取 AppID ⚠️

登录 mp.weixin.qq.com → 左侧"设置 → 基本设置",复制 **AppID(小程序ID)**。
把项目根目录 [project.config.json](../project.config.json) 中的 `"appid": "touristappid"` 替换成你的 AppID。

## 第 2 步:开通云开发并创建环境

1. 打开 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 左侧"开发 → 开发管理"→ 找到"云开发"入口开通
2. 创建环境(如 `jitie-prod`),记下**环境 ID**
3. 把 [miniprogram/app.js](../miniprogram/app.js) 中 `wx.cloud.init({ env: 'YOUR_CLOUD_ENV_ID' })` 替换成你的环境 ID

## 第 3 步:安装微信开发者工具 ⚠️

下载地址:https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
安装后用**微信扫码登录**(登录的微信号需是小程序管理员或已授权成员)。

## 第 4 步:导入项目并预览

1. 微信开发者工具 → "导入项目",选择本项目根目录(会自动识别 `miniprogram/` 与 `cloudfunctions/`)
2. 确认 AppID 已替换、编译通过
3. 点"预览",用手机微信扫码,走一遍完整流程(登录→引导→训练→历史→分享),对照 [acceptance-checklist.md](acceptance-checklist.md)

## 第 5 步:部署云函数(7 个)

在开发者工具左侧文件树里,对以下每个函数目录**右键 → "上传并部署:云端安装依赖"**:

- `login`
- `saveProfile`
- `catalog`
- `saveWorkout`
- `stats`
- `qrcode`
- `initDb`(数据库初始化专用)

## 第 6 步:初始化数据库(自动建表+灌种子数据)

1. 开发者工具 → 云开发控制台 → 云函数 → 找到 `initDb` → 测试运行(不需要传参)
2. 返回结果类似 `{ createdCollections: ["users","exercises","templates","workouts","prs"], exercisesAdded: 12, templatesAdded: 4 }`
3. 到"数据库"确认 5 个集合已存在,`exercises` 有 12 条、`templates` 有 4 条
4. ⚠️ 手动把每个集合的权限改为**"仅创建者可读写"**(集合 → 权限设置)

> 备用方案:如果不想用 initDb,也可以手工创建集合,再导入 [deploy/seed/exercises.json](../deploy/seed/exercises.json) 和 [deploy/seed/templates.json](../deploy/seed/templates.json)。

## 第 7 步:上传代码 ⚠️

两种方式任选:

**方式 A(推荐,开发者工具)**:工具栏"上传"按钮 → 填版本号 `1.0.0` 与备注 → 上传。

**方式 B(命令行)**:
1. 在 mp.weixin.qq.com → 开发管理 → 开发设置 → 生成"小程序代码上传密钥",下载到本地(注意保管)
2. 安装 Node.js(或使用本项目 `work/node/` 里的便携版)
3. `cd deploy && npm install`
4. 设置环境变量后运行:
   ```powershell
   $env:WX_APPID = "你的AppID"
   $env:WX_PRIVATE_KEY_PATH = "私钥文件路径"
   $env:WX_VERSION = "1.0.0"
   node upload.js
   ```

## 第 8 步:提交审核 ⚠️

1. mp.weixin.qq.com → 管理 → 版本管理 → 找到刚上传的版本 → "提交审核"
2. 按提示填写:
   - 服务类目:建议选"体育 > 健身"(或"工具 > 健康管理")
   - 隐私保护指引:声明会收集性别/年龄/身高/体重(用于计算体质指标),小程序登录页已有协议勾选
   - 若涉及医疗健康类目可能需要额外资质,按平台提示操作
3. 提交后等待审核(通常 1–7 天)

## 第 9 步:发布 ⚠️

审核通过后,在版本管理里点"发布"。发布后:

- `qrcode` 云函数就能正常生成小程序码(发布前调用会报错,属预期)
- 分享卡的"小程序码"会出现在卡片右下角

## 常见问题

| 现象 | 原因/处理 |
| --- | --- |
| 编译报 `env` 错误 | app.js 里的环境 ID 未替换 |
| 登录失败 | 云函数未部署或 AppID 未替换;检查 5 个集合是否已建 |
| 动作列表为空 | `catalog` 云函数未部署,或 `exercises` 集合为空(运行 initDb) |
| 保存训练失败提示"已存草稿" | 云函数报错,查看云函数日志;数据不会丢,下次进入会提示恢复 |
| 保存相册失败 | 手机相册权限未授权,或未在平台配置"相册"接口权限 |
| `qrcode` 函数报错 | 小程序尚未发布,发布后即正常 |
