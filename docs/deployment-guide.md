# 举铁日记 · 部署上线指南（就绪版）

## 当前进度：一切可自动化的部分已完成

- 代码开发完成：9 个页面、7 个云函数、12 个动作 + 4 套模板种子数据
- 单元测试 12/12 通过
- AppID `wx2a14c212978a5374` 已填入 project.config.json
- 云环境：miniprogram/app.js 使用**默认环境**（省略 env）；若你的账号下有多个云环境，需把 `env` 设为你的环境 ID
- 微信开发者工具安装包已下载到本机：`work/installer/wechat_devtools_setup.exe`，不需要再下载
- 7 个云函数已部署到环境 `cloudbase-d9gyqv3ea400083a0`
- 数据库已初始化并验证：`users/exercises/templates/workouts/prs` 5 个集合已建，`exercises` 12 条、`templates` 4 条
- 小程序代码已上传（版本 1.0.0）

剩下的步骤都需要你的微信身份（扫码 / 后台操作），无法代劳，按顺序做完约 20 分钟。

## 第 1 步 安装开发者工具并扫码登录

1. 双击 `work/installer/wechat_devtools_setup.exe`，管理员权限弹窗点「是」
2. 安装完成后打开微信开发者工具，用**微信扫码登录**（微信号需是该小程序的管理员或被授权的开发者）

## 第 2 步 导入项目

1. 微信开发者工具 → 「导入项目」→ 选择**项目根目录**（会自动识别 `miniprogram/` 与 `cloudfunctions/`）
2. 确认 AppID 显示 `wxb19de0cfbfef1a9d`，编译通过

## 第 3 步 部署云函数（7 个）+ 初始化数据库

1. 在左侧文件树的 `cloudfunctions/` 下，对以下每个目录**右键 →「上传并部署：云端安装依赖」**：
   `login`、`saveProfile`、`catalog`、`saveWorkout`、`stats`、`qrcode`、`initDb`
2. 打开「云开发控制台 → 云函数」，找到 `initDb`，点「测试运行」（不需要传参数）
3. 返回结果类似：
   `{ createdCollections: ["users","exercises","templates","workouts","prs"], exercisesAdded: 12, templatesAdded: 4 }`
4. 在「数据库」里确认 5 个集合已创建，并把每个集合的权限改为**「仅创建者可读写」**

> 备用方案：不想运行 initDb 的话，可手动建 5 个集合，再导入 `deploy/seed/exercises.json` 和 `deploy/seed/templates.json`。

## 第 4 步 上传代码 → 提交审核 → 发布

### 上传代码（二选一）

**方式 A（推荐，开发者工具）**：工具右上角「上传」→ 版本号 `1.0.0`，备注「首版」→ 上传。

**方式 B（命令行）**：
1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 开发管理 → 开发设置 →「小程序代码上传密钥」→ 生成并下载 `private.wx....key`（妥善保管）
2. 在 `deploy/` 目录执行（Node 用项目自带的 `work/node/node-v24.19.0-win-x64/node.exe` 即可，依赖已装好）：

   ```powershell
   $env:WX_APPID = "wx2a14c212978a5374"
   $env:WX_PRIVATE_KEY_PATH = "密钥文件完整路径"
   $env:WX_VERSION = "1.0.0"
   node upload.js
   ```

### 提交审核

1. [mp.weixin.qq.com](https://mp.weixin.qq.com) → 管理 → 版本管理 → 找到刚上传的版本 →「提交审核」
2. 服务类目建议选 **体育 > 健身**（或 工具 > 健康管理）
3. 隐私保护指引：声明会收集性别 / 年龄 / 身高 / 体重（用于计算 BMI、基础代谢等身体指标）；小程序登录页已有协议勾选
4. 若涉及医疗健康类目可能需要额外资质，按平台提示操作

### 发布

审核通过（通常 1–7 天）后，在版本管理里点「发布」。

## 发布后

- `qrcode` 云函数恢复正常（发布前调用会报错，属预期）
- 分享卡右下角出现小程序码

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 编译报 `env` 错误 | app.js 中环境 ID 未配置；若账号只有一个云环境则无需 env |
| 登录失败 | 云函数未部署，或 AppID 未替换；检查 5 个集合是否已建 |
| 动作列表为空 | `catalog` 云函数未部署，或 `exercises` 集合为空（运行 initDb） |
| 保存训练失败提示「已存草稿」 | 云函数报错，查看云函数日志；数据不会丢失，下次进入会提示恢复 |
| 保存相册失败 | 手机相册权限未授权，或平台「相册」接口权限未配置 |
| `qrcode` 函数报错 | 小程序尚未发布，发布后即正常 |

## 关键路径

- 项目根目录：`C:\Users\samzhao\Documents\Codex\2026-08-16\superpowers-plugin-superpowers-openai-api-curated`
- 安装包：`work/installer/wechat_devtools_setup.exe`
- 上传脚本：`deploy/upload.js`
- 种子数据：`deploy/seed/exercises.json`、`deploy/seed/templates.json`
- 验收清单：`docs/acceptance-checklist.md`
