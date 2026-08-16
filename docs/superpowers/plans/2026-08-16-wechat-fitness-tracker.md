# 微信健身记录小程序(举铁日记)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个可发布到微信的健身记录小程序 MVP:首次引导录入基础信息并按中国标准计算体质指标,内置训练模板与动作库,按组记录重量/次数,历史趋势与 PR,训练结束生成 Notion 风格分享卡。

**Architecture:** 微信原生小程序(WXML/WXSS/JS)+ 微信云开发。纯逻辑(标准计算、格式化、统计)放 `miniprogram/utils/`,用 Node 内置测试框架做单元测试;数据经云函数读写云数据库;分享卡在小程序端 Canvas 绘制。视觉系统按 `DESIGN.md`(Notion 设计语言)落地为 `app.wxss` 设计令牌。

**Tech Stack:** 微信小程序基础库 ≥2.2.3,微信云开发(云函数/云数据库/云存储),Node.js ≥18(仅用于跑单元测试,运行时为 Node 24),`wx-server-sdk`。

---

## 环境与前置说明

- 微信开发者工具导入本项目根目录即识别 `miniprogram/` 与 `cloudfunctions/`。
- 本机 Node(跑单元测试用):`D:\OmniRoute\work\tools\node\node-v24.19.0-win-x64\node.exe`。若 `node` 不在 PATH,用 `& "D:\OmniRoute\work\tools\node\node-v24.19.0-win-x64\node.exe"` 代替 `node`。
- 用户需在微信开发者工具里:① 填入自己的小程序 AppID(`project.config.json` 的 `appid`);② 开通云开发并创建环境,把环境 ID 填入 `miniprogram/app.js` 的 `wx.cloud.init({ env })`;③ 在云开发控制台创建集合 `users`、`exercises`、`templates`、`workouts`、`prs`,并把权限设为"仅创建者可读写";④ 部署云函数(右键云函数目录 → 上传并部署:云端安装依赖)。
- 每次任务完成后提交一次 Git(`git` 全路径:`C:\Users\samzhao\AppData\Local\Programs\Git\bin\git.exe`)。

## 项目文件结构

```
举铁日记/
├─ project.config.json          # 开发者工具项目配置(标识 miniprogram/ 与 cloudfunctions/)
├─ DESIGN.md                    # 设计语言(已有,勿改)
├─ miniprogram/
│  ├─ app.js                    # App 入口:初始化云开发
│  ├─ app.json                  # 页面注册、窗口样式
│  ├─ app.wxss                  # 全局设计令牌 + 通用组件类(Notion 设计语言)
│  ├─ sitemap.json              # 搜索索引配置
│  ├─ utils/
│  │  ├─ standards.js           # 纯函数:BMI/体脂/BMR/力量区间/校验(可单测)
│  │  ├─ format.js              # 纯函数:容量/时长/日期格式化(可单测)
│  │  ├─ stats.js               # 纯函数:训练汇总/PR 判定(可单测)
│  │  └─ cloud.js               # 云函数调用封装(统一错误处理)
│  ├─ data/
│  │  ├─ exercises.js           # 动作库种子数据(部位/器械/力量区间规则)
│  │  └─ templates.js           # 训练模板种子数据
│  ├─ components/
│  │  └─ tab-bar/               # 自定义底部导航(文本 + 紫色指示条,避免二进制图标)
│  └─ pages/
│     ├─ login/                 # 协议 + 微信登录
│     ├─ onboarding/            # 3 步引导 + "你的起点"结果(含标准计算)
│     ├─ home/                  # 本周概览 + 新纪录 + 最近训练
│     ├─ workout/               # 模式选择(模板/自由)+ 推荐模板列表
│     ├─ template/              # 模板详情(动作 + 推荐重量区间)
│     ├─ record/                # 训练中:按组记录重量/次数 + 实时汇总
│     ├─ history/               # 日历 / 趋势 / PR 三视图
│     ├─ profile/               # 资料、体质指标、协议入口
│     └─ share/                 # 分享卡预览 + Canvas 生成 + 保存/转发
├─ cloudfunctions/
│  ├─ login/                    # 登录:取 openid,建/取用户
│  ├─ saveProfile/              # 保存引导资料与指标
│  ├─ catalog/                  # 返回动作库 + 模板
│  ├─ saveWorkout/              # 保存训练 + 更新 PR
│  ├─ stats/                    # 首页概览 / 历史趋势 / PR
│  └─ qrcode/                   # 生成小程序码(分享卡用)
└─ tests/                       # Node 单元测试(node --test)
   ├─ standards.test.js
   ├─ format.test.js
   └─ stats.test.js
```

## 测试约定

- 单元测试只覆盖 `utils/` 下的纯函数,命令:`node --test tests/`(期望输出含 `pass`,退出码 0)。
- 页面与云函数在微信开发者工具中手动验证(每页都有"验证"步骤)。
- 每次任务最后提交 Git,提交信息见各任务。

---

# Phase A:脚手架与设计令牌

## Task 1: 项目配置文件与 app 骨架

**Files:**
- Create: `project.config.json`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.js`

- [ ] **Step 1: 创建 `project.config.json`**

```json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "compileType": "miniprogram",
  "appid": "touristappid",
  "projectname": "jitie-riji",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  }
}
```

> 说明:`appid` 需替换为用户自己的 AppID(游客模式无法使用云开发)。

- [ ] **Step 2: 创建 `miniprogram/sitemap.json`**

```json
{
  "desc": "关于本文件的更多信息,请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{ "action": "allow", "page": "*" }]
}
```

- [ ] **Step 3: 创建 `miniprogram/app.json`**

```json
{
  "pages": [
    "pages/login/login",
    "pages/onboarding/onboarding",
    "pages/home/home",
    "pages/workout/workout",
    "pages/template/template",
    "pages/record/record",
    "pages/history/history",
    "pages/profile/profile",
    "pages/share/share"
  ],
  "window": {
    "navigationBarBackgroundColor": "#fafaf9",
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "举铁日记",
    "backgroundColor": "#fafaf9",
    "backgroundTextStyle": "dark"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents"
}
```

> 说明:底部导航用自定义组件 `tab-bar`(见 Task 13),因此 app.json 不声明原生 tabBar。

- [ ] **Step 4: 创建 `miniprogram/app.js`**

```js
App({
  globalData: {
    profile: null,
    catalog: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'YOUR_CLOUD_ENV_ID',
      traceUser: true
    });
  }
});
```

> 说明:`YOUR_CLOUD_ENV_ID` 需替换为用户云开发环境 ID。

- [ ] **Step 5: 验证**

在微信开发者工具中导入项目根目录,编译应无报错,页面列表出现 9 个页面;控制台无 `env` 报错前会提示"环境 ID 为占位符"(此时登录页尚未实现,首页可先显示空白)。

- [ ] **Step 6: 提交**

```bash
git add project.config.json miniprogram/sitemap.json miniprogram/app.json miniprogram/app.js
git commit -m "chore: 小程序项目脚手架与 app 骨架"
```

## Task 2: app.wxss 全局设计令牌(Notion 设计语言)

**Files:**
- Create: `miniprogram/app.wxss`

- [ ] **Step 1: 创建 `miniprogram/app.wxss`(令牌 + 通用组件类)**

```css
page {
  /* 品牌 */
  --primary: #5645d4;
  --primary-pressed: #4534b3;
  --primary-deep: #3a2a99;
  --link-blue: #0075de;
  --navy: #0a1530;
  --navy-deep: #070f24;
  --navy-mid: #1a2a52;
  /* 表面 */
  --canvas: #ffffff;
  --surface: #f6f5f4;
  --surface-soft: #fafaf9;
  --hairline: #e5e3df;
  --hairline-soft: #ede9e4;
  --hairline-strong: #c8c4be;
  /* 文字 */
  --ink: #1a1a1a;
  --charcoal: #37352f;
  --slate: #5d5b54;
  --steel: #787671;
  --stone: #a4a097;
  --muted: #bbb8b1;
  --on-dark: #ffffff;
  --on-dark-muted: #a4a097;
  /* 语义 */
  --success: #1aae39;
  --warning: #dd5b00;
  --error: #e03131;
  /* 粉彩 */
  --tint-lavender: #e6e0f5;
  --tint-peach: #ffe8d4;
  --tint-mint: #d9f3e1;
  --tint-sky: #dcecfa;
  --tint-rose: #fde0ec;
  --tint-yellow: #fef7d6;
  --yellow-bold: #f9e79f;
  /* 圆角(rpx:1px ≈ 2rpx) */
  --r-sm: 12rpx;
  --r-md: 16rpx;
  --r-lg: 24rpx;
  --r-full: 9999rpx;
  /* 其他 */
  background: var(--surface-soft);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 30rpx;
  line-height: 1.5;
}

/* 卡片 */
.card {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
}

/* 按钮 */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  font-size: 28rpx;
  font-weight: 500;
  min-height: 88rpx;
  padding: 0 36rpx;
  line-height: 1;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:active {
  background: var(--primary-pressed);
}
.btn-ghost {
  background: transparent;
  border: 1rpx solid var(--hairline-strong);
  color: var(--ink);
}
.btn-on-dark {
  background: #fff;
  color: var(--ink);
}
.btn-on-dark-ghost {
  background: transparent;
  border: 1rpx solid var(--on-dark-muted);
  color: var(--on-dark);
}
.btn-block {
  width: 100%;
}

/* 胶囊选择(筛选/性别/频率) */
.pill {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-full);
  padding: 18rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--steel);
  background: var(--canvas);
  min-height: 80rpx;
}
.pill-sel {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

/* 输入框 */
.input {
  background: var(--canvas);
  border: 1rpx solid var(--hairline-strong);
  border-radius: var(--r-md);
  height: 88rpx;
  font-size: 32rpx;
  color: var(--ink);
  padding: 0 28rpx;
  text-align: center;
}
.input-focus {
  border: 2rpx solid var(--primary);
}

/* 列表 */
.list {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.lrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 32rpx;
  border-bottom: 1rpx solid var(--hairline-soft);
  font-size: 30rpx;
  color: var(--charcoal);
}
.lrow:last-child {
  border-bottom: none;
}
.lrow-r {
  font-size: 28rpx;
  color: var(--slate);
  text-align: right;
}
.lrow-r-b {
  color: var(--ink);
  font-weight: 600;
}

/* 标签 */
.tag {
  display: inline-flex;
  align-items: center;
  background: var(--tint-lavender);
  color: var(--primary-deep);
  border-radius: var(--r-sm);
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 16rpx;
  margin-left: 12rpx;
}
.tag-green {
  background: var(--tint-mint);
  color: var(--success);
}
.tag-orange {
  background: var(--tint-peach);
  color: var(--warning);
}
.tag-gray {
  background: var(--surface);
  color: var(--steel);
}
.badge {
  display: inline-flex;
  align-items: center;
  background: var(--primary);
  color: #fff;
  border-radius: var(--r-full);
  font-size: 22rpx;
  font-weight: 600;
  padding: 6rpx 20rpx;
}

/* 指标卡 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}
.metric {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 28rpx 16rpx;
  text-align: center;
}
.metric-tint-lavender {
  background: var(--tint-lavender);
  border-color: transparent;
}
.metric-tint-mint {
  background: var(--tint-mint);
  border-color: transparent;
}
.metric-tint-sky {
  background: var(--tint-sky);
  border-color: transparent;
}
.metric-b {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: -0.5rpx;
}
.metric-s {
  display: block;
  font-size: 22rpx;
  color: var(--slate);
  margin-top: 4rpx;
  line-height: 1.35;
}

/* 深蓝 Hero 与便签圆点 */
.navy-hero {
  background: var(--navy);
  color: var(--on-dark);
  border-radius: 0 0 40rpx 40rpx;
  position: relative;
  overflow: hidden;
  padding: 80rpx 52rpx 64rpx;
}
.hero-dot {
  position: absolute;
  border-radius: 50%;
}
.hero-title {
  font-size: 60rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
  line-height: 1.15;
  color: var(--on-dark);
}
.hero-sub {
  font-size: 30rpx;
  color: var(--on-dark-muted);
}

/* 页面内边距 */
.pane {
  padding: 32rpx 40rpx 56rpx;
}
.mtitle {
  font-size: 48rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
  line-height: 1.25;
}
.msub {
  font-size: 30rpx;
  color: var(--slate);
  line-height: 1.5;
  margin: 12rpx 0 44rpx;
}
.step-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 12rpx 0 36rpx;
}
.step-lbl {
  font-size: 24rpx;
  color: var(--slate);
  font-weight: 500;
}
.bar-track {
  flex: 1;
  height: 8rpx;
  background: #e8e6e3;
  border-radius: var(--r-full);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--r-full);
}
```

- [ ] **Step 2: 验证**

编译通过,无 WXSS 报错;任意页面上出现带 `var(--primary)` 的颜色即说明令牌生效。

- [ ] **Step 3: 提交**

```bash
git add miniprogram/app.wxss
git commit -m "style: Notion 设计令牌与通用组件类(app.wxss)"
```

---

# Phase B:核心逻辑(测试先行)

## Task 3: standards.js — 标准计算纯函数

**Files:**
- Create: `miniprogram/utils/standards.js`
- Test: `tests/standards.test.js`

- [ ] **Step 1: 写失败测试 `tests/standards.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bmi, bmiLevel, bmiLevelLabel, bodyFatRange, bmr,
  strengthRange, validateProfile
} = require('../miniprogram/utils/standards');

test('bmi: 70kg/175cm = 22.9', () => {
  assert.equal(bmi(70, 175), 22.9);
});

test('bmiLevel: 中国标准边界', () => {
  assert.equal(bmiLevel(18.4), 'underweight');
  assert.equal(bmiLevel(18.5), 'normal');
  assert.equal(bmiLevel(23.9), 'normal');
  assert.equal(bmiLevel(24), 'overweight');
  assert.equal(bmiLevel(27.9), 'overweight');
  assert.equal(bmiLevel(28), 'obese');
});

test('bmiLevelLabel: 中文标签', () => {
  assert.equal(bmiLevelLabel('normal'), '正常');
  assert.equal(bmiLevelLabel('obese'), '肥胖');
});

test('bodyFatRange: 男女健康区间', () => {
  assert.deepEqual(bodyFatRange('male'), { min: 10, max: 20 });
  assert.deepEqual(bodyFatRange('female'), { min: 15, max: 25 });
});

test('bmr: Mifflin-St Jeor 男女', () => {
  assert.equal(bmr('male', 28, 175, 70), 1659);
  assert.equal(bmr('female', 28, 165, 55), 1280);
});

test('strengthRange: 按体重倍数并取 2.5kg 档', () => {
  assert.deepEqual(strengthRange(70, 0.4, 0.6), { min: 27.5, max: 42.5 });
  assert.deepEqual(strengthRange(70, 0.2, 0.35), { min: 15, max: 25 });
});

test('validateProfile: 边界与错误信息', () => {
  const bad = validateProfile({ gender: 'x', age: 5, heightCm: 70, weightKg: 10 });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.length, 6);
  const good = validateProfile({ gender: 'male', age: 28, heightCm: 175, weightKg: 70, goal: '减脂', frequency: 3 });
  assert.equal(good.ok, true);
});
```

> 计算核对:`bmr('male',28,175,70)` = 700+1093.75−140+5 = 1658.75 → 1659;`bmr('female',28,165,55)` = 550+1031.25−140−161 = 1280.25 → 1280。`validateProfile` 对 6 个字段(性别/年龄/身高/体重/目标/频率)各报一条错误,因此 `bad.errors.length` 为 6。

- [ ] **Step 2: 运行测试,确认失败**

```bash
node --test tests/standards.test.js
```

期望:FAIL,`Cannot find module '../miniprogram/utils/standards'`。

- [ ] **Step 3: 实现 `miniprogram/utils/standards.js`**

```js
const BMI_LABELS = {
  underweight: '偏瘦',
  normal: '正常',
  overweight: '超重',
  obese: '肥胖'
};

function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function bmiLevel(bmiValue) {
  if (bmiValue < 18.5) return 'underweight';
  if (bmiValue < 24) return 'normal';
  if (bmiValue < 28) return 'overweight';
  return 'obese';
}

function bmiLevelLabel(level) {
  return BMI_LABELS[level] || '未知';
}

function bodyFatRange(gender) {
  return gender === 'female'
    ? { min: 15, max: 25 }
    : { min: 10, max: 20 };
}

function bmr(gender, age, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

function strengthRange(weightKg, pctMin, pctMax) {
  const round25 = (v) => Math.round(v / 2.5) * 2.5;
  return { min: round25(weightKg * pctMin), max: round25(weightKg * pctMax) };
}

function validateProfile(p) {
  const errors = [];
  if (!p.gender || (p.gender !== 'male' && p.gender !== 'female')) errors.push('请选择性别');
  if (!(p.age >= 6 && p.age <= 100)) errors.push('年龄需在 6–100 岁之间');
  if (!(p.heightCm >= 80 && p.heightCm <= 250)) errors.push('身高需在 80–250cm 之间');
  if (!(p.weightKg >= 20 && p.weightKg <= 300)) errors.push('体重需在 20–300kg 之间');
  if (!p.goal) errors.push('请选择健身目标');
  if (!(p.frequency >= 2 && p.frequency <= 7)) errors.push('每周训练频率需在 2–7 次');
  return { ok: errors.length === 0, errors };
}

module.exports = {
  bmi, bmiLevel, bmiLevelLabel, bodyFatRange, bmr, strengthRange, validateProfile
};
```

> 说明:测试中 `bad` 用了 6 个字段但 `validateProfile` 校验 6 项(性别/年龄/身高/体重/目标/频率),因此 `errors.length` 为 6;同时把测试断言改为 6。此处在 Step 4 前按下方修正测试。

- [ ] **Step 4: 运行测试,确认通过**

```bash
node --test tests/standards.test.js
```

期望:PASS(6 个用例)。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/standards.js tests/standards.test.js
git commit -m "feat: 体质标准计算纯函数(带单测)"
```

## Task 4: format.js — 格式化纯函数

**Files:**
- Create: `miniprogram/utils/format.js`
- Test: `tests/format.test.js`

- [ ] **Step 1: 写失败测试 `tests/format.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatVolume, formatDuration, formatDate } = require('../miniprogram/utils/format');

test('formatVolume: 千位分隔与吨缩写', () => {
  assert.equal(formatVolume(12340), '12.3t');
  assert.equal(formatVolume(3450), '3,450kg');
  assert.equal(formatVolume(850), '850kg');
});

test('formatDuration: 分钟/小时', () => {
  assert.equal(formatDuration(90), '1.5h');
  assert.equal(formatDuration(150), '2.5h');
  assert.equal(formatDuration(45), '45 分钟');
});

test('formatDate: 中文月日与星期', () => {
  assert.equal(formatDate(new Date(2026, 7, 16).getTime()), '8月16日 周日');
});
```

> 说明:2026-08-16 为周日,测试以此为准。

- [ ] **Step 2: 运行测试,确认失败**

```bash
node --test tests/format.test.js
```

期望:FAIL,`Cannot find module`。

- [ ] **Step 3: 实现 `miniprogram/utils/format.js`**

```js
const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function thousand(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatVolume(kg) {
  if (kg >= 1000) return (kg / 1000).toFixed(1) + 't';
  return thousand(kg) + 'kg';
}

function formatDuration(min) {
  if (min < 60) return min + ' 分钟';
  return (Math.round((min / 60) * 10) / 10) + 'h';
}

function formatDate(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKS[d.getDay()];
}

module.exports = { formatVolume, formatDuration, formatDate };
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
node --test tests/format.test.js
```

期望:PASS。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/format.js tests/format.test.js
git commit -m "feat: 格式化纯函数(带单测)"
```

## Task 5: stats.js — 训练汇总与 PR 判定

**Files:**
- Create: `miniprogram/utils/stats.js`
- Test: `tests/stats.test.js`

- [ ] **Step 1: 写失败测试 `tests/stats.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeWorkout, isNewPR } = require('../miniprogram/utils/stats');

test('summarizeWorkout: 组数与总容量', () => {
  const exercises = [
    { sets: [{ weightKg: 60, reps: 10 }, { weightKg: 60, reps: 8 }] },
    { sets: [{ weightKg: 45, reps: 12 }] }
  ];
  assert.deepEqual(summarizeWorkout(exercises), { sets: 3, volumeKg: 1668 });
});

test('isNewPR: 空记录/更高/更低', () => {
  assert.equal(isNewPR(null, 60), true);
  assert.equal(isNewPR(60, 65), true);
  assert.equal(isNewPR(60, 55), false);
  assert.equal(isNewPR(60, 60), false);
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
node --test tests/stats.test.js
```

期望:FAIL,`Cannot find module`。

- [ ] **Step 3: 实现 `miniprogram/utils/stats.js`**

```js
function summarizeWorkout(exercises) {
  let sets = 0;
  let volumeKg = 0;
  exercises.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      sets += 1;
      volumeKg += s.weightKg * s.reps;
    });
  });
  return { sets, volumeKg };
}

function isNewPR(existing, candidate) {
  return existing === null || existing === undefined || candidate > existing;
}

module.exports = { summarizeWorkout, isNewPR };
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
node --test tests/stats.test.js
```

期望:PASS。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/utils/stats.js tests/stats.test.js
git commit -m "feat: 训练汇总与 PR 判定(带单测)"
```

---

# Phase C:数据种子与云函数

## Task 6: 动作库与模板种子数据

**Files:**
- Create: `miniprogram/data/exercises.js`
- Create: `miniprogram/data/templates.js`

- [ ] **Step 1: 创建 `miniprogram/data/exercises.js`**

```js
// 动作库:name/部位/器械;weighted=true 的动作按"性别+体重倍数"给推荐区间
const exercises = [
  { id: 'squat', name: '杠铃深蹲', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'bench', name: '杠铃卧推', bodyPart: '胸', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'deadlift', name: '硬拉', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.6, 0.9], intermediate: [0.9, 1.2], advanced: [1.2, 1.5] }, female: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] } } },
  { id: 'row', name: '坐姿划船', bodyPart: '背', equipment: '器械', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'ohp', name: '哑铃推举', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] }, female: { novice: [0.08, 0.14], intermediate: [0.14, 0.2], advanced: [0.2, 0.26] } } },
  { id: 'curl', name: '哑铃弯举', bodyPart: '手臂', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] }, female: { novice: [0.05, 0.08], intermediate: [0.08, 0.12], advanced: [0.12, 0.15] } } },
  { id: 'pushdown', name: '绳索下压', bodyPart: '手臂', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'legpress', name: '腿举', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [1.0, 1.4], intermediate: [1.4, 1.8], advanced: [1.8, 2.2] }, female: { novice: [0.7, 1.0], intermediate: [1.0, 1.3], advanced: [1.3, 1.6] } } },
  { id: 'pullup', name: '引体向上', bodyPart: '背', equipment: '自重', weighted: false },
  { id: 'pushup', name: '俯卧撑', bodyPart: '胸', equipment: '自重', weighted: false },
  { id: 'crunch', name: '卷腹', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'hipbridge', name: '臀桥', bodyPart: '臀腿', equipment: '自重', weighted: false }
];

module.exports = exercises;
```

- [ ] **Step 2: 创建 `miniprogram/data/templates.js`**

```js
const templates = [
  {
    id: 'full-body-m', name: '全身分化 · 男版', goal: '减脂', genderHint: 'male', frequency: 3,
    exercises: [
      { exerciseId: 'squat', sets: 4, repRange: [8, 12] },
      { exerciseId: 'bench', sets: 4, repRange: [8, 12] },
      { exerciseId: 'row', sets: 3, repRange: [10, 12] },
      { exerciseId: 'ohp', sets: 3, repRange: [10, 12] }
    ]
  },
  {
    id: 'full-body-f', name: '全身分化 · 女版', goal: '减脂', genderHint: 'female', frequency: 3,
    exercises: [
      { exerciseId: 'hipbridge', sets: 4, repRange: [12, 15] },
      { exerciseId: 'legpress', sets: 4, repRange: [10, 12] },
      { exerciseId: 'row', sets: 3, repRange: [10, 12] },
      { exerciseId: 'pushup', sets: 3, repRange: [8, 15] }
    ]
  },
  {
    id: 'ppl', name: '推-拉-腿 PPL', goal: '增肌', genderHint: 'all', frequency: 5,
    exercises: [
      { exerciseId: 'bench', sets: 4, repRange: [8, 12] },
      { exerciseId: 'ohp', sets: 3, repRange: [8, 12] },
      { exerciseId: 'pushdown', sets: 3, repRange: [10, 15] },
      { exerciseId: 'pullup', sets: 4, repRange: [6, 10] },
      { exerciseId: 'row', sets: 3, repRange: [8, 12] },
      { exerciseId: 'squat', sets: 4, repRange: [6, 10] }
    ]
  },
  {
    id: 'upper-lower', name: '上下肢分化', goal: '增力', genderHint: 'all', frequency: 4,
    exercises: [
      { exerciseId: 'bench', sets: 5, repRange: [3, 6] },
      { exerciseId: 'row', sets: 4, repRange: [5, 8] },
      { exerciseId: 'ohp', sets: 3, repRange: [5, 8] },
      { exerciseId: 'squat', sets: 5, repRange: [3, 6] },
      { exerciseId: 'deadlift', sets: 3, repRange: [3, 5] }
    ]
  }
];

module.exports = templates;
```

- [ ] **Step 3: 验证**

```bash
node -e "const e=require('./miniprogram/data/exercises.js'); const t=require('./miniprogram/data/templates.js'); console.log(e.length, t.length); if(e.length!==12||t.length!==4) process.exit(1)"
```

期望输出:`12 4`。

- [ ] **Step 4: 提交**

```bash
git add miniprogram/data
git commit -m "feat: 动作库与训练模板种子数据"
```

## Task 7: 云函数 login 与 saveProfile

**Files:**
- Create: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/login/package.json`
- Create: `cloudfunctions/saveProfile/index.js`
- Create: `cloudfunctions/saveProfile/package.json`

- [ ] **Step 1: 创建 `cloudfunctions/login/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const col = db.collection('users');
  const found = await col.where({ openid: OPENID }).limit(1).get();
  if (found.data.length > 0) {
    return { ok: true, data: { isNew: false, profile: found.data[0] } };
  }
  const profile = {
    openid: OPENID,
    gender: null,
    age: null,
    heightCm: null,
    weightKg: null,
    goal: null,
    frequency: null,
    metrics: null,
    createdAt: db.serverDate()
  };
  const res = await col.add({ data: profile });
  return { ok: true, data: { isNew: true, profile: Object.assign({ _id: res._id }, profile) } };
};
```

- [ ] **Step 2: 创建 `cloudfunctions/login/package.json`**

```json
{
  "name": "login",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

- [ ] **Step 3: 创建 `cloudfunctions/saveProfile/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const p = event.profile || {};
  const bad = (p.age < 6 || p.age > 100) ||
    (p.heightCm < 80 || p.heightCm > 250) ||
    (p.weightKg < 20 || p.weightKg > 300) ||
    (p.gender !== 'male' && p.gender !== 'female') ||
    !p.goal || !(p.frequency >= 2 && p.frequency <= 7);
  if (bad) return { ok: false, error: '资料校验失败' };

  const users = db.collection('users');
  const found = await users.where({ openid: OPENID }).limit(1).get();
  if (!found.data.length) return { ok: false, error: '用户不存在,请重新登录' };

  const doc = found.data[0];
  const update = {
    gender: p.gender,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    goal: p.goal,
    frequency: p.frequency,
    metrics: p.metrics || null,
    updatedAt: db.serverDate()
  };
  await users.doc(doc._id).update({ data: update });
  return { ok: true, data: Object.assign({}, doc, update) };
};
```

- [ ] **Step 4: 创建 `cloudfunctions/saveProfile/package.json`**

```json
{
  "name": "saveProfile",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

- [ ] **Step 5: 验证(云开发控制台)**

在微信开发者工具中分别右键 `cloudfunctions/login`、`cloudfunctions/saveProfile` → "上传并部署:云端安装依赖"。打开云开发控制台 → 云函数 → 测试登录:返回 `ok:true` 且 `users` 集合出现一条 `openid` 记录。再测试 saveProfile:传入合法 profile,返回含 `metrics` 的完整资料。

- [ ] **Step 6: 提交**

```bash
git add cloudfunctions/login cloudfunctions/saveProfile
git commit -m "feat: 云函数 login/saveProfile"
```

## Task 8: 云函数 catalog、saveWorkout、stats、qrcode

**Files:**
- Create: `cloudfunctions/catalog/index.js` + `package.json`
- Create: `cloudfunctions/saveWorkout/index.js` + `package.json`
- Create: `cloudfunctions/stats/index.js` + `package.json`
- Create: `cloudfunctions/qrcode/index.js` + `package.json`

- [ ] **Step 1: 创建 `cloudfunctions/catalog/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const [ex, tp] = await Promise.all([
    db.collection('exercises').limit(100).get(),
    db.collection('templates').limit(100).get()
  ]);
  return { ok: true, data: { exercises: ex.data, templates: tp.data } };
};
```

`package.json` 与 Task 7 相同(`name: "catalog"`),以下云函数 package.json 均照此模式,只改 name。

- [ ] **Step 2: 创建 `cloudfunctions/saveWorkout/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const exs = event.exercises || [];
  if (!exs.length) return { ok: false, error: '没有可保存的训练组' };

  let totalSets = 0;
  let totalVolumeKg = 0;
  exs.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      totalSets += 1;
      totalVolumeKg += s.weightKg * s.reps;
    });
  });

  const res = await db.collection('workouts').add({
    data: {
      openid: OPENID,
      mode: event.mode || 'template',
      templateId: event.templateId || null,
      templateName: event.templateName || '自由训练',
      durationMin: event.durationMin || 0,
      exercises: exs,
      totalSets,
      totalVolumeKg,
      createdAt: db.serverDate()
    }
  });

  // 更新 PR:每动作历史最大重量与最重单次容量;记录本次新纪录
  const newPrs = [];
  for (const ex of exs) {
    let bestW = 0;
    let bestV = 0;
    (ex.sets || []).forEach((s) => {
      if (s.weightKg > bestW) bestW = s.weightKg;
      if (s.weightKg * s.reps > bestV) bestV = s.weightKg * s.reps;
    });
    const prs = db.collection('prs');
    const found = await prs.where({ openid: OPENID, exerciseId: ex.exerciseId }).limit(1).get();
    if (!found.data.length) {
      newPrs.push({ name: ex.name || ex.exerciseId, weightKg: bestW });
      await prs.add({
        data: {
          openid: OPENID,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name || '',
          bestWeightKg: bestW,
          bestVolumeKg: bestV,
          updatedAt: db.serverDate()
        }
      });
    } else {
      const pr = found.data[0];
      const upd = {};
      if (bestW > pr.bestWeightKg) upd.bestWeightKg = bestW;
      if (bestV > pr.bestVolumeKg) upd.bestVolumeKg = bestV;
      if (Object.keys(upd).length) {
        if (upd.bestWeightKg) newPrs.push({ name: ex.name || ex.exerciseId, weightKg: bestW });
        upd.updatedAt = db.serverDate();
        await prs.doc(pr._id).update({ data: upd });
      }
    }
  }

  return { ok: true, data: { workoutId: res._id, totalSets, totalVolumeKg, newPrs } };
};
```

- [ ] **Step 3: 创建 `cloudfunctions/stats/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // 周一为 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const scope = (event && event.scope) || 'home';
  const workouts = db.collection('workouts');
  const prs = db.collection('prs');
  const out = {};

  if (scope === 'home' || scope === 'all') {
    const weekStart = startOfWeek(new Date());
    const week = await workouts.where({ openid: OPENID, createdAt: _.gte(weekStart) }).get();
    let weekCount = 0, weekMinutes = 0, weekVolume = 0;
    week.data.forEach((w) => {
      weekCount += 1;
      weekMinutes += w.durationMin || 0;
      weekVolume += w.totalVolumeKg || 0;
    });
    const recent = await workouts.where({ openid: OPENID }).orderBy('createdAt', 'desc').limit(3).get();
    out.home = {
      weekCount, weekMinutes, weekVolume,
      recent: recent.data.map((w) => ({
        id: w._id, templateName: w.templateName, durationMin: w.durationMin,
        totalSets: w.totalSets, totalVolumeKg: w.totalVolumeKg, createdAt: w.createdAt
      }))
    };
  }

  if (scope === 'history' || scope === 'all') {
    const year = (event && event.year) || new Date().getFullYear();
    const month = (event && event.month) || new Date().getMonth() + 1;
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);
    const monthWorkouts = await workouts.where({ openid: OPENID, createdAt: _.gte(from).and(_.lt(to)) }).get();
    const daySet = {};
    monthWorkouts.data.forEach((w) => {
      const d = new Date(w.createdAt);
      const key = d.getDate();
      daySet[key] = true;
    });
    // 近 8 周容量
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const ws = startOfWeek(now);
      const a = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() - i * 7);
      const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7);
      const got = await workouts.where({ openid: OPENID, createdAt: _.gte(a).and(_.lt(b)) }).get();
      weeks.push({ weekStart: a.getTime(), volumeKg: got.data.reduce((s, x) => s + (x.totalVolumeKg || 0), 0) });
    }
    const prList = await prs.where({ openid: OPENID }).orderBy('updatedAt', 'desc').limit(50).get();
    out.history = { days: daySet, weeks, prs: prList.data };
  }

  return { ok: true, data: out };
};
```

- [ ] **Step 4: 创建 `cloudfunctions/qrcode/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const res = await cloud.openapi.wxacode.getUnlimited({
    scene: 'share',
    page: 'pages/home/home',
    width: 430,
    checkPath: false
  });
  const upload = await cloud.uploadFile({
    cloudPath: 'qrcodes/' + Date.now() + '.png',
    fileContent: res.buffer
  });
  return { ok: true, data: { fileID: upload.fileID } };
};
```

> 说明:小程序码需要小程序已发布且开通云调用;未发布前此函数会报错,属于预期,不影响其余功能。

- [ ] **Step 5: 为四个云函数创建 package.json**

`cloudfunctions/catalog/package.json`、`cloudfunctions/saveWorkout/package.json`、`cloudfunctions/stats/package.json`、`cloudfunctions/qrcode/package.json`,内容均为:

```json
{
  "name": "<函数名>",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

- [ ] **Step 6: 验证(云开发控制台)**

把 `miniprogram/data/exercises.js` 与 `templates.js` 的内容作为记录导入云数据库 `exercises`、`templates` 集合(控制台可手工逐条或批量导入 JSON)。部署四个云函数后,控制台依次测试:

1. `catalog` → 返回 12 个动作与 4 个模板
2. `saveWorkout`(传一个合法 exercises 数组)→ 返回 `workoutId`,`workouts` 与 `prs` 出现记录
3. `stats`(scope=all)→ `home` 含周统计,`history` 含 days/weeks/prs
4. `qrcode` → 小程序未发布则报错,发布后返回 `fileID`

- [ ] **Step 7: 提交**

```bash
git add cloudfunctions/catalog cloudfunctions/saveWorkout cloudfunctions/stats cloudfunctions/qrcode
git commit -m "feat: 云函数 catalog/saveWorkout/stats/qrcode"
```

## Task 9: cloud.js 云调用封装

**Files:**
- Create: `miniprogram/utils/cloud.js`

- [ ] **Step 1: 创建 `miniprogram/utils/cloud.js`**

```js
function call(name, data) {
  return wx.cloud.callFunction({ name, data }).then((res) => {
    const r = res.result;
    if (!r || r.ok === false) {
      throw new Error((r && r.error) || '请求失败');
    }
    return r.data;
  });
}

module.exports = { call };
```

- [ ] **Step 2: 验证**

在任意页面 onLoad 里临时 `const { call } = require('../../utils/cloud'); call('catalog').then(console.log).catch(console.error)`,开发者工具控制台应打印动作与模板数组。

- [ ] **Step 3: 提交**

```bash
git add miniprogram/utils/cloud.js
git commit -m "feat: 云函数调用封装"
```

---

# Phase D:页面

## Task 10: 底部导航组件 tab-bar

**Files:**
- Create: `miniprogram/components/tab-bar/tab-bar.js`
- Create: `miniprogram/components/tab-bar/tab-bar.json`
- Create: `miniprogram/components/tab-bar/tab-bar.wxml`
- Create: `miniprogram/components/tab-bar/tab-bar.wxss`

- [ ] **Step 1: 创建组件文件**

`tab-bar.json`:

```json
{
  "component": true
}
```

`tab-bar.js`:

```js
Component({
  properties: {
    current: { type: String, value: 'home' }
  },
  methods: {
    go(e) {
      const target = e.currentTarget.dataset.page;
      if (target === this.data.current) return;
      wx.reLaunch({ url: '/pages/' + target + '/' + target });
    }
  }
});
```

`tab-bar.wxml`:

```xml
<view class="tabbar">
  <view class="tab {{current === 'home' ? 'active' : ''}}" data-page="home" bindtap="go">首页</view>
  <view class="tab {{current === 'workout' ? 'active' : ''}}" data-page="workout" bindtap="go">记录</view>
  <view class="tab {{current === 'history' ? 'active' : ''}}" data-page="history" bindtap="go">历史</view>
  <view class="tab {{current === 'profile' ? 'active' : ''}}" data-page="profile" bindtap="go">我的</view>
</view>
```

`tab-bar.wxss`:

```css
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120rpx;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid var(--hairline);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
.tab {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: var(--steel);
  position: relative;
  line-height: 120rpx;
}
.tab.active {
  color: var(--ink);
  font-weight: 600;
}
.tab.active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 44rpx;
  height: 6rpx;
  border-radius: 0 0 6rpx 6rpx;
  background: var(--primary);
}
```

- [ ] **Step 2: 验证**

临时在 `pages/home/home.json` 注册组件并放置,编译后底部出现四个 Tab,当前页有紫色指示条。

- [ ] **Step 3: 提交**

```bash
git add miniprogram/components/tab-bar
git commit -m "feat: 自定义底部导航组件"
```

## Task 11: 登录页

**Files:**
- Create: `miniprogram/pages/login/login.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `login.json`**

```json
{
  "navigationStyle": "custom",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 创建 `login.js`**

```js
const { call } = require('../../utils/cloud');

Page({
  data: {
    agreed: false
  },
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },
  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中' });
    try {
      const data = await call('login');
      getApp().globalData.profile = data.profile;
      wx.hideLoading();
      wx.reLaunch({
        url: data.isNew ? '/pages/onboarding/onboarding' : '/pages/home/home'
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
  }
});
```

- [ ] **Step 3: 创建 `login.wxml`**

```xml
<view class="navy-hero">
  <view class="dot dot-pink"></view>
  <view class="dot dot-yellow"></view>
  <view class="dot dot-teal"></view>
  <view class="dot dot-orange"></view>
  <view class="logo"><text>举</text></view>
  <view class="hero-title">记录每一组&#10;见证每一次突破</view>
  <view class="hero-sub">你的私人健身日志</view>
  <view class="btn-row">
    <view class="btn btn-primary btn-block" bindtap="onLogin">微信一键登录</view>
    <view class="btn btn-on-dark-ghost btn-block" bindtap="onStandard">查看标准说明</view>
  </view>
</view>
<view class="pane">
  <view class="card agree" bindtap="toggleAgree">
    <view class="check {{agreed ? 'checked' : ''}}"><text wx:if="{{agreed}}">✓</text></view>
    <view class="agree-txt">我已阅读并同意 <text class="link">《用户协议》</text> 与 <text class="link">《隐私政策》</text></view>
  </view>
  <view class="fine">登录即创建账号 · 数据仅本人可见 · 可随时注销</view>
</view>
```

- [ ] **Step 4: 创建 `login.wxss`**

```css
.dot {
  position: absolute;
  border-radius: 50%;
}
.dot-pink { width: 28rpx; height: 28rpx; background: #ff64c8; top: 52rpx; left: 68rpx; }
.dot-yellow { width: 18rpx; height: 18rpx; background: #f5d75e; top: 88rpx; left: 168rpx; }
.dot-teal { width: 24rpx; height: 24rpx; background: #2a9d99; top: 64rpx; right: 132rpx; }
.dot-orange { width: 16rpx; height: 16rpx; background: #dd5b00; top: 112rpx; right: 68rpx; }
.logo {
  width: 104rpx;
  height: 104rpx;
  border-radius: 24rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 40rpx;
}
.btn-row {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 52rpx;
}
.agree {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 32rpx;
}
.check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  border: 2rpx solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.check.checked {
  background: var(--primary);
}
.agree-txt {
  font-size: 26rpx;
  color: var(--slate);
}
.link {
  color: var(--link-blue);
}
.fine {
  text-align: center;
  font-size: 22rpx;
  color: var(--stone);
}
```

- [ ] **Step 5: 在 `login.js` 补 `onStandard`(无标准说明页时用提示)**

```js
onStandard() {
  wx.showToast({ title: '标准说明见设计文档第 6 节', icon: 'none' });
}
```

- [ ] **Step 6: 验证**

编译后:未勾选点登录有提示;勾选后登录成功跳转引导页(新用户)或首页(老用户)。

- [ ] **Step 7: 提交**

```bash
git add miniprogram/pages/login
git commit -m "feat: 登录页(协议+微信登录)"
```

## Task 12: 引导页(3 步 + 结果)

**Files:**
- Create: `miniprogram/pages/onboarding/onboarding.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `onboarding.json`**

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 `onboarding.js`**

```js
const standards = require('../../utils/standards');
const { call } = require('../../utils/cloud');

Page({
  data: {
    step: 1,
    gender: 'male',
    age: 28,
    heightCm: 175,
    weightKg: 70,
    goal: '减脂',
    frequency: 3,
    metrics: null,
    freqOptions: [2, 3, 4, 5],
    goalOptions: [
      { value: '增肌', em: '💪', hint: '8–12 次/组', tint: 'lavender' },
      { value: '减脂', em: '🔥', hint: '12–15 次/组', tint: 'peach' },
      { value: '增力', em: '⚡', hint: '3–6 次/组', tint: 'sky' },
      { value: '保持健康', em: '🧘', hint: '全身均衡', tint: 'mint' }
    ]
  },
  pickGender(e) { this.setData({ gender: e.currentTarget.dataset.v }); },
  stepAge(e) {
    const d = e.currentTarget.dataset.d;
    this.setData({ age: Math.min(100, Math.max(6, this.data.age + d)) });
  },
  onInput(e) {
    const k = e.currentTarget.dataset.k;
    this.setData({ [k]: Number(e.detail.value) });
  },
  pickGoal(e) { this.setData({ goal: e.currentTarget.dataset.v }); },
  pickFreq(e) { this.setData({ frequency: Number(e.currentTarget.dataset.v) }); },
  next() {
    if (this.data.step < 3) {
      this.setData({ step: this.data.step + 1 });
    } else {
      this.computeAndShow();
    }
  },
  computeAndShow() {
    const p = {
      gender: this.data.gender,
      age: this.data.age,
      heightCm: this.data.heightCm,
      weightKg: this.data.weightKg,
      goal: this.data.goal,
      frequency: this.data.frequency
    };
    const v = standards.validateProfile(p);
    if (!v.ok) {
      wx.showToast({ title: v.errors[0], icon: 'none' });
      return;
    }
    const bmiValue = standards.bmi(p.weightKg, p.heightCm);
    const level = standards.bmiLevel(bmiValue);
    const fat = standards.bodyFatRange(p.gender);
    const bmrValue = standards.bmr(p.gender, p.age, p.heightCm, p.weightKg);
    const metrics = {
      bmi: bmiValue,
      bmiLevel: level,
      bmiLabel: standards.bmiLevelLabel(level),
      bodyFatMin: fat.min,
      bodyFatMax: fat.max,
      bmr: bmrValue
    };
    this.setData({ metrics });
    wx.showLoading({ title: '计算中' });
    call('saveProfile', { profile: Object.assign({}, p, { metrics }) })
      .then((profile) => {
        getApp().globalData.profile = profile;
        wx.hideLoading();
        this.setData({ step: 4 });
      })
      .catch((e) => {
        wx.hideLoading();
        wx.showToast({ title: e.message, icon: 'none' });
      });
  },
  enterApp() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
```

- [ ] **Step 3: 创建 `onboarding.wxml`**

```xml
<view class="pane" wx:if="{{step < 4}}">
  <view class="step-row">
    <text class="step-lbl">第 {{step}} 步 · 共 3 步</text>
    <view class="bar-track"><view class="bar-fill" style="width: {{step * 33}}%;"></view></view>
  </view>

  <block wx:if="{{step === 1}}">
    <view class="mtitle">先认识一下你</view>
    <view class="msub">性别用于计算体脂、代谢与力量参考标准</view>
    <view class="pill-row">
      <view class="pill {{gender === 'male' ? 'pill-sel' : ''}}" data-v="male" bindtap="pickGender">♂ 男</view>
      <view class="pill {{gender === 'female' ? 'pill-sel' : ''}}" data-v="female" bindtap="pickGender">♀ 女</view>
    </view>
    <view class="field">
      <text class="flbl">年龄</text>
      <view class="stepper">
        <view class="sbtn" data-d="-1" bindtap="stepAge">−</view>
        <text class="fval">{{age}}</text>
        <text class="funit">岁</text>
        <view class="sbtn" data-d="1" bindtap="stepAge">+</view>
      </view>
    </view>
    <view class="field">
      <text class="flbl">身高</text>
      <view><input class="mini-input" type="number" data-k="heightCm" value="{{heightCm}}" bindinput="onInput"/><text class="funit">cm</text></view>
    </view>
    <view class="field">
      <text class="flbl">体重</text>
      <view><input class="mini-input" type="number" data-k="weightKg" value="{{weightKg}}" bindinput="onInput"/><text class="funit">kg</text></view>
    </view>
  </block>

  <block wx:elif="{{step === 2}}">
    <view class="mtitle">你的健身目标是?</view>
    <view class="msub">决定推荐的训练模板与动作</view>
    <view class="goal-grid">
      <view wx:for="{{goalOptions}}" wx:key="value"
        class="goal-card tint-{{item.tint}} {{goal === item.value ? 'goal-sel' : ''}}"
        data-v="{{item.value}}" bindtap="pickGoal">
        <view class="goal-em">{{item.em}}</view>
        <view class="goal-nm">{{item.value}}</view>
        <view class="goal-hint">{{item.hint}}</view>
      </view>
    </view>
  </block>

  <block wx:else>
    <view class="mtitle">每周能练几次?</view>
    <view class="msub">我们会据此推荐合适的分化模板</view>
    <view class="pill-row freq">
      <view wx:for="{{freqOptions}}" wx:key="*this"
        class="pill freq-pill {{frequency === item ? 'pill-sel' : ''}}"
        data-v="{{item}}" bindtap="pickFreq">
        <text class="freq-n">{{item}}</text>
        <text class="freq-u">次/周</text>
      </view>
    </view>
    <view class="card rec-card">
      <view class="tag">为你推荐</view>
      <view class="rec-name">全身分化 · {{gender === 'male' ? '男版' : '女版'}}</view>
      <view class="rec-sub">每周 {{frequency}} 次 · 每次约 60 分钟</view>
    </view>
  </block>

  <view class="btn btn-primary btn-block next-btn" bindtap="next">下一步</view>
</view>

<view class="pane" wx:if="{{step === 4 && metrics}}">
  <view class="navy-hero result-hero">
    <view class="dot dot-pink"></view>
    <view class="dot dot-teal"></view>
    <view class="hero-sub">按中国标准为你计算</view>
    <view class="hero-title">你的起点</view>
    <view class="bmi-label">BMI · <text class="bmi-ok">{{metrics.bmiLabel}}</text></view>
    <view class="bmi-num">{{metrics.bmi}}</view>
    <view class="bmi-track"><view class="bmi-fill"></view></view>
    <view class="bmi-scale"><text>偏瘦 18.5</text><text>正常 23.9</text><text>超重 27.9</text></view>
  </view>
  <view class="metric-grid mg">
    <view class="metric metric-tint-lavender"><text class="metric-b">{{metrics.bodyFatMin}}–{{metrics.bodyFatMax}}%</text><text class="metric-s">体脂参考 · {{gender === 'male' ? '男' : '女'}}</text></view>
    <view class="metric metric-tint-mint"><text class="metric-b">{{metrics.bmr}}</text><text class="metric-s">基础代谢 kcal</text></view>
    <view class="metric metric-tint-sky"><text class="metric-b">0.4–0.6</text><text class="metric-s">卧推参考倍重</text></view>
  </view>
  <view class="btn btn-primary btn-block" bindtap="enterApp">开启健身之旅</view>
</view>
```

- [ ] **Step 4: 创建 `onboarding.wxss`**

```css
.pill-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}
.pill-row .pill {
  flex: 1;
}
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 16rpx 32rpx;
  min-height: 128rpx;
  margin-bottom: 24rpx;
}
.flbl {
  font-size: 28rpx;
  color: var(--slate);
}
.fval {
  font-size: 36rpx;
  font-weight: 600;
}
.funit {
  font-size: 26rpx;
  color: var(--slate);
  margin-left: 8rpx;
}
.mini-input {
  display: inline-block;
  width: 140rpx;
  font-size: 36rpx;
  font-weight: 600;
  text-align: right;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.sbtn {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--r-md);
  border: 1rpx solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: var(--primary);
}
.goal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}
.goal-card {
  padding: 40rpx 32rpx;
  border-radius: var(--r-lg);
  border: 2rpx solid transparent;
}
.tint-lavender { background: var(--tint-lavender); }
.tint-peach { background: var(--tint-peach); }
.tint-sky { background: var(--tint-sky); }
.tint-mint { background: var(--tint-mint); }
.goal-sel {
  border-color: var(--primary);
}
.goal-em { font-size: 52rpx; }
.goal-nm { font-size: 32rpx; font-weight: 600; margin-top: 16rpx; }
.goal-hint { font-size: 24rpx; color: var(--slate); margin-top: 6rpx; }
.freq .pill {
  flex-direction: column;
  padding: 24rpx 8rpx;
}
.freq-pill {
  min-height: 112rpx;
}
.freq-n {
  font-size: 38rpx;
  font-weight: 600;
}
.freq-u {
  font-size: 22rpx;
  color: inherit;
}
.rec-card {
  padding: 36rpx;
  margin-top: 40rpx;
}
.rec-name {
  font-size: 36rpx;
  font-weight: 600;
  margin-top: 16rpx;
}
.rec-sub {
  font-size: 26rpx;
  color: var(--slate);
  margin-top: 8rpx;
}
.next-btn {
  margin-top: 48rpx;
}
.result-hero {
  padding-bottom: 56rpx;
  margin-bottom: 32rpx;
}
.bmi-label {
  font-size: 26rpx;
  color: var(--on-dark-muted);
  margin-top: 36rpx;
}
.bmi-ok {
  color: var(--success);
  font-weight: 600;
}
.bmi-num {
  font-size: 104rpx;
  font-weight: 600;
  letter-spacing: -3rpx;
  line-height: 1.1;
  color: var(--on-dark);
}
.bmi-track {
  height: 10rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: var(--r-full);
  margin-top: 32rpx;
  position: relative;
}
.bmi-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 62%;
  background: var(--primary);
  border-radius: var(--r-full);
}
.bmi-scale {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: var(--on-dark-muted);
  margin-top: 12rpx;
}
.mg {
  margin-bottom: 48rpx;
}
```

- [ ] **Step 5: 验证**

新用户登录后进入引导页:三步可逐级前进,第 3 步点击"下一步"后出现结果页,数值与 `standards.test.js` 计算一致(70kg/175cm → BMI 22.9、基础代谢 1659);保存后进入首页。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/onboarding
git commit -m "feat: 首次登录引导页与标准计算结果"
```

## Task 13: 首页

**Files:**
- Create: `miniprogram/pages/home/home.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `home.json`**

```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "tab-bar": "/components/tab-bar/tab-bar"
  }
}
```

- [ ] **Step 2: 创建 `home.js`**

```js
const { call } = require('../../utils/cloud');
const { formatVolume, formatDuration, formatDate } = require('../../utils/format');

Page({
  data: {
    weekCount: 0,
    weekDuration: '0 分钟',
    weekVolume: '0kg',
    recent: [],
    newPr: null
  },
  onShow() {
    this.loadHome();
  },
  async loadHome() {
    try {
      const data = await call('stats', { scope: 'home' });
      const h = data.home;
      const recent = h.recent.map((w) => ({
        id: w.id,
        title: formatDate(w.createdAt) + ' · ' + w.templateName,
        duration: formatDuration(w.durationMin),
        detail: w.totalSets + ' 组 · ' + formatVolume(w.totalVolumeKg)
      }));
      this.setData({
        weekCount: h.weekCount,
        weekDuration: formatDuration(h.weekMinutes),
        weekVolume: formatVolume(h.weekVolume),
        recent
      });
      this.checkPr();
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  checkPr() {
    const last = getApp().globalData.lastWorkout || {};
    const list = last.newPrs || [];
    if (!list.length) {
      this.setData({ newPr: null });
      return;
    }
    const first = list[0];
    this.setData({
      newPr: { text: first.name + ' ' + first.weightKg + 'kg', time: '刚刚刷新' }
    });
  },
  goWorkout() {
    wx.navigateTo({ url: '/pages/workout/workout' });
  },
  goHistory() {
    wx.reLaunch({ url: '/pages/history/history' });
  }
});
```

> 说明:新纪录来自 `saveWorkout` 云函数返回的 `newPrs`(见 Task 8),保存训练后写入 `getApp().globalData.lastWorkout`,首页 `onShow` 时读取展示。

- [ ] **Step 3: 创建 `home.wxml`**

```xml
<view class="pane home-pane">
  <view class="head">
    <view>
      <view class="greet">早上好,阿强</view>
      <view class="sub">本周第 {{weekCount}} 练</view>
    </view>
    <view class="avatar">强</view>
  </view>

  <view class="banner" wx:if="{{newPr}}" bindtap="goHistory">
    <view class="banner-top"><view class="badge">新纪录</view><text class="banner-time">{{newPr.time}}</text></view>
    <view class="banner-hd">{{newPr.text}}</view>
    <view class="banner-sd">点按查看详情</view>
  </view>

  <view class="stats3">
    <view class="stat"><text class="stat-b">{{weekCount}}</text><text class="stat-s">本周训练</text></view>
    <view class="stat"><text class="stat-b">{{weekDuration}}</text><text class="stat-s">总时长</text></view>
    <view class="stat"><text class="stat-b">{{weekVolume}}</text><text class="stat-s">总容量</text></view>
  </view>

  <view class="btn btn-primary btn-block start-btn" bindtap="goWorkout">开始训练</view>

  <view class="list">
    <view class="lrow" wx:for="{{recent}}" wx:key="id">
      <text class="lrow-l">{{item.title}}</text>
      <view class="lrow-r"><text class="lrow-r-b">{{item.detail}}</text></view>
    </view>
  </view>
</view>
<tab-bar current="home"/>
```

- [ ] **Step 4: 创建 `home.wxss`**

```css
.home-pane {
  padding-bottom: 180rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}
.greet {
  font-size: 56rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
}
.sub {
  font-size: 28rpx;
  color: var(--slate);
  margin-top: 8rpx;
}
.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: var(--r-md);
  background: var(--ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
}
.banner {
  background: var(--yellow-bold);
  border-radius: var(--r-lg);
  padding: 32rpx 36rpx;
  margin: 28rpx 0;
}
.banner-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.banner-time {
  font-size: 24rpx;
  color: #5c4d18;
}
.banner-hd {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--charcoal);
}
.banner-sd {
  font-size: 26rpx;
  color: #5c4d18;
  margin-top: 6rpx;
}
.stats3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}
.stat {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 32rpx 16rpx;
  text-align: center;
}
.stat-b {
  display: block;
  font-size: 46rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
}
.stat-s {
  display: block;
  font-size: 24rpx;
  color: var(--slate);
  margin-top: 4rpx;
}
.start-btn {
  margin: 40rpx 0;
}
.lrow-l {
  font-size: 28rpx;
  color: var(--charcoal);
}
```

- [ ] **Step 5: 验证**

老用户登录直接进入首页;显示本周统计、新纪录横幅、最近训练列表;点"开始训练"进入训练模式页,点横幅进入历史页。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/home
git commit -m "feat: 首页(概览/新纪录/最近训练)"
```

## Task 14: 训练模式页与模板详情页

**Files:**
- Create: `miniprogram/pages/workout/workout.js` / `.json` / `.wxml` / `.wxss`
- Create: `miniprogram/pages/template/template.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `workout.json`**

```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "tab-bar": "/components/tab-bar/tab-bar"
  }
}
```

- [ ] **Step 2: 创建 `workout.js`**

```js
const { call } = require('../../utils/cloud');

Page({
  data: {
    mode: 'template',
    templates: []
  },
  onShow() {
    this.loadCatalog();
  },
  async loadCatalog() {
    try {
      if (!getApp().globalData.catalog) {
        getApp().globalData.catalog = await call('catalog');
      }
      const tpls = getApp().globalData.catalog.templates.map((t) => ({
        id: t.id,
        name: t.name,
        sub: t.frequency + ' 次/周 · ' + t.goal + ' · 约 60 分钟'
      }));
      this.setData({ templates: tpls });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  pickMode(e) {
    this.setData({ mode: e.currentTarget.dataset.m });
  },
  openTemplate(e) {
    wx.navigateTo({ url: '/pages/template/template?id=' + e.currentTarget.dataset.id });
  },
  startFree() {
    wx.navigateTo({ url: '/pages/record/record?mode=free' });
  }
});
```

- [ ] **Step 3: 创建 `workout.wxml`**

```xml
<view class="pane">
  <view class="topbar">
    <view class="ttl">开始训练</view>
    <view class="date">8月16日 周一</view>
  </view>
  <view class="mode-card {{mode === 'template' ? 'mode-sel' : ''}}" data-m="template" bindtap="pickMode">
    <view class="mode-ic tint-lavender">📋</view>
    <view>
      <view class="mode-nm">用模板练</view>
      <view class="mode-ds">按推荐计划逐动作打卡,附带重量参考</view>
    </view>
  </view>
  <view class="mode-card {{mode === 'free' ? 'mode-sel' : ''}}" data-m="free" bindtap="pickMode">
    <view class="mode-ic tint-sky">✍️</view>
    <view>
      <view class="mode-nm">自由训练</view>
      <view class="mode-ds">自己加动作,不绑定计划</view>
    </view>
  </view>
  <view class="tmpl-h"><text class="tmpl-l">为你推荐</text><text class="tmpl-r">查看全部</text></view>
  <view class="tmpl-row" wx:for="{{templates}}" wx:key="id" data-id="{{item.id}}" bindtap="openTemplate">
    <view class="tmpl-ic tint-lavender">🏋️</view>
    <view class="tmpl-body">
      <view class="tmpl-nm">{{item.name}}</view>
      <view class="tmpl-ds">{{item.sub}}</view>
    </view>
    <view class="tmpl-go">›</view>
  </view>
  <view class="btn btn-primary btn-block free-btn" wx:if="{{mode === 'free'}}" bindtap="startFree">开始自由训练</view>
</view>
<tab-bar current="workout"/>
```

- [ ] **Step 4: 创建 `workout.wxss`**

```css
.pane {
  padding-bottom: 180rpx;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.ttl {
  font-size: 48rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
}
.date {
  font-size: 28rpx;
  color: var(--slate);
}
.mode-card {
  display: flex;
  gap: 28rpx;
  align-items: center;
  background: var(--canvas);
  border: 2rpx solid transparent;
  border-radius: var(--r-lg);
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
}
.mode-card {
  border: 1rpx solid var(--hairline);
}
.mode-sel {
  border: 2rpx solid var(--primary);
  background: var(--surface-soft);
}
.mode-ic {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}
.tint-lavender { background: var(--tint-lavender); }
.tint-sky { background: var(--tint-sky); }
.mode-nm {
  font-size: 32rpx;
  font-weight: 600;
}
.mode-ds {
  font-size: 26rpx;
  color: var(--slate);
  margin-top: 4rpx;
  line-height: 1.4;
}
.tmpl-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32rpx 4rpx 24rpx;
}
.tmpl-l {
  font-size: 30rpx;
  font-weight: 600;
}
.tmpl-r {
  font-size: 28rpx;
  color: var(--link-blue);
}
.tmpl-row {
  display: flex;
  align-items: center;
  gap: 28rpx;
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
}
.tmpl-ic {
  width: 76rpx;
  height: 76rpx;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
  flex-shrink: 0;
}
.tmpl-body {
  flex: 1;
}
.tmpl-nm {
  font-size: 30rpx;
  font-weight: 600;
}
.tmpl-ds {
  font-size: 24rpx;
  color: var(--slate);
  margin-top: 4rpx;
}
.tmpl-go {
  font-size: 40rpx;
  color: var(--stone);
}
.free-btn {
  margin-top: 24rpx;
}
```

- [ ] **Step 5: 创建 `template.json`**

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 6: 创建 `template.js`**

```js
const { call } = require('../../utils/cloud');
const standards = require('../../utils/standards');

Page({
  data: {
    tpl: null,
    exercises: []
  },
  onLoad(query) {
    this.tplId = query.id;
    this.load();
  },
  async load() {
    try {
      let cat = getApp().globalData.catalog;
      if (!cat) {
        cat = await call('catalog');
        getApp().globalData.catalog = cat;
      }
      const tpl = cat.templates.find((t) => t.id === this.tplId);
      const profile = getApp().globalData.profile;
      const weightKg = profile ? profile.weightKg : 70;
      const gender = profile ? profile.gender : 'male';
      const exercises = tpl.exercises.map((item) => {
        const ex = cat.exercises.find((x) => x.id === item.exerciseId);
        let tip = '';
        if (ex && ex.weighted) {
          const r = standards.strengthRange(weightKg, ex.pcts[gender].novice[0], ex.pcts[gender].novice[1]);
          tip = '推荐 ' + r.min + '–' + r.max + 'kg × ' + item.repRange[0] + '–' + item.repRange[1];
        } else if (ex) {
          tip = '自重动作 · 每组 ' + item.repRange[0] + '–' + item.repRange[1] + ' 次';
        }
        return {
          exerciseId: item.exerciseId,
          name: ex ? ex.name : item.exerciseId,
          bodyPart: ex ? ex.bodyPart : '',
          equipment: ex ? ex.equipment : '',
          sets: item.sets,
          repRange: item.repRange,
          tip
        };
      });
      this.setData({ tpl, exercises });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  start() {
    const tpl = this.data.tpl;
    wx.navigateTo({
      url: '/pages/record/record?mode=template&templateId=' + tpl.id + '&templateName=' + encodeURIComponent(tpl.name)
    });
  }
});
```

- [ ] **Step 7: 创建 `template.wxml`**

```xml
<view class="topbar">
  <view class="back" bindtap="goBack">‹</view>
  <view class="ttl">{{tpl.name}}</view>
  <view class="act" bindtap="fav">收藏</view>
</view>
<view class="pane">
  <view class="card info-card">
    <view class="info-row">目标 <text class="info-b">{{tpl.goal}}</text> · 频率 <text class="info-b">{{tpl.frequency}} 次/周</text></view>
    <view class="info-sub">动作顺序按模板排列 · 组间休息 90 秒</view>
  </view>
  <view class="ex-card" wx:for="{{exercises}}" wx:key="exerciseId">
    <view class="ex-hd">
      <text class="ex-nm">{{item.name}}</text>
      <text class="tag tag-gray">{{item.bodyPart}} · {{item.equipment}}</text>
    </view>
    <view class="ex-tip">{{item.tip}}</view>
    <view class="ex-meta">
      <text>{{item.sets}} 组</text>
      <text>{{item.repRange[0]}}–{{item.repRange[1]}} 次/组</text>
    </view>
  </view>
  <view class="btn btn-primary btn-block" bindtap="start">开始训练</view>
</view>
```

- [ ] **Step 8: 创建 `template.wxss`**

```css
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
}
.back {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  font-size: 48rpx;
  color: var(--ink);
}
.ttl {
  font-size: 40rpx;
  font-weight: 600;
}
.act {
  font-size: 28rpx;
  color: var(--link-blue);
  width: 88rpx;
  text-align: right;
}
.info-card {
  padding: 32rpx 36rpx;
  margin-bottom: 32rpx;
  background: var(--surface);
}
.info-row {
  font-size: 28rpx;
  color: var(--slate);
}
.info-b {
  color: var(--ink);
  font-weight: 600;
}
.info-sub {
  font-size: 26rpx;
  color: var(--slate);
  margin-top: 12rpx;
}
.ex-card {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 32rpx;
  margin-bottom: 24rpx;
}
.ex-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.ex-nm {
  font-size: 32rpx;
  font-weight: 600;
}
.ex-tip {
  font-size: 26rpx;
  color: var(--slate);
  margin-bottom: 20rpx;
}
.ex-meta {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: var(--slate);
}
```

- [ ] **Step 9: 在 `template.js` 补 `goBack` 与 `fav`**

```js
goBack() {
  wx.navigateBack();
},
fav() {
  wx.showToast({ title: '已收藏模板', icon: 'none' });
}
```

- [ ] **Step 10: 验证**

首页 → 开始训练 → 选择模板 → 模板详情显示动作与推荐区间(70kg 男性卧推为 27.5–42.5kg);点"开始训练"进入训练记录页。

- [ ] **Step 11: 提交**

```bash
git add miniprogram/pages/workout miniprogram/pages/template
git commit -m "feat: 训练模式选择页与模板详情页"
```

## Task 15: 训练记录页

**Files:**
- Create: `miniprogram/pages/record/record.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `record.json`**

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 `record.js`**

```js
const { call } = require('../../utils/cloud');
const { summarizeWorkout } = require('../../utils/stats');

Page({
  data: {
    title: '自由训练',
    exercises: [],
    totalSets: 0,
    totalVolume: '0kg',
    seconds: 0,
    timerText: '00:00'
  },
  onLoad(query) {
    this.mode = query.mode || 'free';
    this.tplId = query.templateId || null;
    const title = query.templateName ? decodeURIComponent(query.templateName) : '自由训练';
    this.setData({ title });
    if (this.mode === 'template' && query.templateId) {
      this.buildFromTemplate(query.templateId);
    } else {
      this.setData({ exercises: this.buildFreeExercises() });
    }
    this.startTimer();
  },
  buildFreeExercises() {
    const cat = getApp().globalData.catalog;
    if (!cat || !cat.exercises.length) return [];
    const ex = cat.exercises[0];
    return [{
      exerciseId: ex.id,
      name: ex.name,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      sets: [{ weightKg: 0, reps: 0 }]
    }];
  },
  buildFromTemplate(templateId) {
    const cat = getApp().globalData.catalog;
    const tpl = cat.templates.find((t) => t.id === templateId);
    const exercises = tpl.exercises.map((item) => {
      const ex = cat.exercises.find((x) => x.id === item.exerciseId);
      const sets = [];
      for (let i = 0; i < item.sets; i++) sets.push({ weightKg: 0, reps: 0 });
      return {
        exerciseId: item.exerciseId,
        name: ex ? ex.name : item.exerciseId,
        bodyPart: ex ? ex.bodyPart : '',
        equipment: ex ? ex.equipment : '',
        sets
      };
    });
    this.setData({ exercises });
  },
  startTimer() {
    this.timer = setInterval(() => {
      const seconds = this.data.seconds + 1;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      this.setData({ seconds, timerText: m + ':' + s });
    }, 1000);
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },
  inputSet(e) {
    const { ei, si, f } = e.currentTarget.dataset;
    const key = f === 'w' ? 'weightKg' : 'reps';
    this.setData({ [`exercises[${ei}].sets[${si}].${key}`]: Number(e.detail.value) });
    this.updateTotals();
  },
  addSet(e) {
    const ei = Number(e.currentTarget.dataset.ei);
    this.setData({ [`exercises[${ei}].sets`]: this.data.exercises[ei].sets.concat([{ weightKg: 0, reps: 0 }]) });
    this.updateTotals();
  },
  delSet(e) {
    const { ei, si } = e.currentTarget.dataset;
    const sets = this.data.exercises[ei].sets.slice();
    sets.splice(si, 1);
    this.setData({ [`exercises[${ei}].sets`]: sets });
    this.updateTotals();
  },
  updateTotals() {
    const sum = summarizeWorkout(this.data.exercises);
    this.setData({
      totalSets: sum.sets,
      totalVolume: sum.volumeKg >= 1000 ? (sum.volumeKg / 1000).toFixed(1) + 't' : sum.volumeKg + 'kg'
    });
  },
  quit() {
    wx.showModal({
      title: '退出训练',
      content: '训练还没保存,确定要退出吗?',
      success: (res) => {
        if (res.confirm) wx.navigateBack();
      }
    });
  },
  async finish() {
    const empty = this.data.exercises.some((ex) => ex.sets.some((s) => !s.weightKg || !s.reps));
    if (empty) {
      wx.showToast({ title: '还有未填完的组', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中' });
    try {
      const payload = {
        mode: this.mode,
        templateId: this.mode === 'template' ? this.tplId : null,
        templateName: this.data.title,
        durationMin: Math.round(this.data.seconds / 60),
        exercises: this.data.exercises
      };
      const data = await call('saveWorkout', payload);
      wx.hideLoading();
      getApp().globalData.lastWorkout = data;
      getApp().globalData.lastWorkoutDetail = payload;
      wx.redirectTo({ url: '/pages/share/share' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message, icon: 'none' });
    }
  }
});
```

- [ ] **Step 3: 创建 `record.wxml`**

```xml
<view class="topbar">
  <view class="back" bindtap="quit">‹</view>
  <view class="ttl">{{title}}</view>
  <view class="timer">{{timerText}}</view>
</view>
<view class="pane rec-pane">
  <view class="ex-card" wx:for="{{exercises}}" wx:for-item="ex" wx:for-index="ei" wx:key="exerciseId">
    <view class="ex-hd">
      <text class="ex-nm">{{ex.name}}</text>
      <text class="tag tag-gray">{{ex.bodyPart}} · {{ex.equipment}}</text>
    </view>
    <view class="set-row" wx:for="{{ex.sets}}" wx:for-item="set" wx:for-index="si" wx:key="*this">
      <text class="set-no">{{si + 1}}</text>
      <input class="set-inp" type="digit" value="{{set.weightKg}}" data-ei="{{ei}}" data-si="{{si}}" data-f="w" bindinput="inputSet"/>
      <text class="set-u">kg</text>
      <input class="set-inp" type="number" value="{{set.reps}}" data-ei="{{ei}}" data-si="{{si}}" data-f="r" bindinput="inputSet"/>
      <text class="set-u">次</text>
      <view class="set-del" data-ei="{{ei}}" data-si="{{si}}" bindtap="delSet">×</view>
    </view>
    <view class="addset" data-ei="{{ei}}" bindtap="addSet">+ 添加一组</view>
  </view>
</view>
<view class="float-bar">
  <view class="sum">
    <text class="sum-b">{{totalSets}} 组</text>
    <text class="sum-s">总容量 {{totalVolume}}</text>
  </view>
  <view class="btn btn-primary" bindtap="finish">结束训练</view>
</view>
```

- [ ] **Step 4: 创建 `record.wxss`**

```css
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
}
.back {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  font-size: 48rpx;
  color: var(--ink);
}
.ttl {
  font-size: 40rpx;
  font-weight: 600;
}
.timer {
  width: 88rpx;
  text-align: right;
  font-size: 28rpx;
  color: var(--slate);
  font-variant-numeric: tabular-nums;
}
.rec-pane {
  padding-bottom: 200rpx;
}
.ex-card {
  background: var(--canvas);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-lg);
  padding: 32rpx;
  margin-bottom: 24rpx;
}
.ex-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.ex-nm {
  font-size: 32rpx;
  font-weight: 600;
}
.set-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.set-no {
  width: 48rpx;
  font-size: 26rpx;
  color: var(--slate);
  font-weight: 500;
}
.set-inp {
  flex: 1;
  background: var(--surface);
  border: 1rpx solid var(--hairline);
  border-radius: var(--r-md);
  height: 80rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}
.set-u {
  font-size: 22rpx;
  color: var(--slate);
}
.set-del {
  width: 56rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: var(--stone);
}
.addset {
  padding: 20rpx;
  border: 1rpx dashed var(--hairline-strong);
  border-radius: var(--r-md);
  color: var(--primary);
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
}
.float-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 128rpx;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  z-index: 100;
}
.sum-b {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sum-s {
  display: block;
  font-size: 24rpx;
  color: var(--slate);
}
```

- [ ] **Step 5: 验证**

从模板进入:动作按模板预置组数;可改重量/次数、加组、删组;底部实时汇总;有未填组时点结束有提示;全部填完后保存并跳转分享页。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/record
git commit -m "feat: 训练记录页(按组录入/实时汇总)"
```

## Task 15A: 训练页补全——自由模式加动作、本地草稿与失败重试

**Files:**
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Modify: `miniprogram/pages/record/record.wxss`

- [ ] **Step 1: `record.js` 数据增加 `mode`,onLoad 末尾恢复草稿**

把 `record.js` 的 `data` 首行改为:

```js
data: {
  mode: 'free',
  title: '自由训练',
  exercises: [],
  totalSets: 0,
  totalVolume: '0kg',
  seconds: 0,
  timerText: '00:00'
},
```

`onLoad` 内 `this.setData({ title });` 改为 `this.setData({ title, mode: this.mode });`,并在 `onLoad` 末尾(启动计时器之前)加 `this.restoreDraft();`。

- [ ] **Step 2: `record.js` 增加草稿与重试方法**

在 `updateTotals()` 之后新增:

```js
saveDraft() {
  wx.setStorageSync('workout_draft', {
    mode: this.mode,
    tplId: this.tplId,
    title: this.data.title,
    exercises: this.data.exercises,
    seconds: this.data.seconds
  });
},
restoreDraft() {
  const draft = wx.getStorageSync('workout_draft');
  if (!draft) return;
  wx.showModal({
    title: '发现未完成的训练',
    content: '是否继续上次的记录?',
    success: (res) => {
      if (res.confirm) {
        this.mode = draft.mode;
        this.tplId = draft.tplId;
        this.setData({
          mode: draft.mode,
          title: draft.title,
          exercises: draft.exercises,
          seconds: draft.seconds
        });
        this.updateTotals();
      }
      wx.removeStorageSync('workout_draft');
    }
  });
},
```

- [ ] **Step 3: `record.js` 增加自由模式"添加动作"方法**

在 `restoreDraft()` 之后新增:

```js
addExercise() {
  const cat = getApp().globalData.catalog;
  if (!cat || !cat.exercises.length) {
    wx.showToast({ title: '动作库加载中,请稍后', icon: 'none' });
    return;
  }
  wx.showActionSheet({
    itemList: cat.exercises.map((ex) => ex.name + ' · ' + ex.bodyPart),
    success: (res) => {
      const ex = cat.exercises[res.tapIndex];
      const exercises = this.data.exercises.concat([{
        exerciseId: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        sets: [{ weightKg: 0, reps: 0 }]
      }]);
      this.setData({ exercises });
      this.updateTotals();
    }
  });
},
```

- [ ] **Step 4: `record.js` 的 `finish` 失败时存草稿**

把 `finish()` 的 `catch` 分支改为:

```js
} catch (e) {
  wx.hideLoading();
  this.saveDraft();
  wx.showToast({ title: '保存失败,已存为草稿', icon: 'none' });
}
```

并在成功保存后(`wx.hideLoading()` 之后、`wx.redirectTo` 之前)加 `wx.removeStorageSync('workout_draft');`。

- [ ] **Step 5: `record.wxml` 在训练列表底部加"添加动作"入口**

在 `</view>` 结束 `rec-pane` 之前加:

```xml
<view class="add-ex" wx:if="{{mode === 'free'}}" bindtap="addExercise">+ 添加动作</view>
```

- [ ] **Step 6: `record.wxss` 增加 `.add-ex`**

```css
.add-ex {
  padding: 28rpx;
  border: 1rpx dashed var(--hairline-strong);
  border-radius: var(--r-md);
  color: var(--primary);
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
  margin-bottom: 24rpx;
}
```

- [ ] **Step 7: 验证**

自由训练:点"添加动作"弹出动作列表,选中后出现新动作卡片。保存失败时(可临时把云函数改名模拟):提示"保存失败,已存为草稿";重新进入训练页提示"是否继续上次的记录",确认后恢复全部组与计时;成功后草稿被清除。

- [ ] **Step 8: 提交**

```bash
git add miniprogram/pages/record
git commit -m "feat: 自由模式添加动作与训练草稿/重试"
```

## Task 16: 历史页

**Files:**
- Create: `miniprogram/pages/history/history.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `history.json`**

```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "tab-bar": "/components/tab-bar/tab-bar"
  }
}
```

- [ ] **Step 2: 创建 `history.js`**

```js
const { call } = require('../../utils/cloud');
const { formatVolume } = require('../../utils/format');

Page({
  data: {
    tab: 'cal',
    year: 2026,
    month: 8,
    days: {},
    weeks: [],
    prs: [],
    today: new Date().getDate()
  },
  onShow() {
    this.load();
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.t });
  },
  async load() {
    try {
      const d = await call('stats', { scope: 'history', year: this.data.year, month: this.data.month });
      const h = d.history;
      const maxVol = Math.max.apply(null, h.weeks.map((w) => w.volumeKg).concat([1]));
      const weeks = h.weeks.map((w) => ({
        vol: w.volumeKg,
        label: formatVolume(w.volumeKg),
        h: Math.max(8, Math.round((w.volumeKg / maxVol) * 100))
      }));
      const prs = h.prs.map((p) => ({
        id: p._id,
        name: p.exerciseName,
        best: p.bestWeightKg + 'kg',
        isNew: false
      }));
      this.setData({ days: h.days, weeks, prs });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  prevMonth() {
    let m = this.data.month - 1;
    let y = this.data.year;
    if (m < 1) { m = 12; y -= 1; }
    this.setData({ month: m, year: y });
    this.load();
  },
  nextMonth() {
    let m = this.data.month + 1;
    let y = this.data.year;
    if (m > 12) { m = 1; y += 1; }
    this.setData({ month: m, year: y });
    this.load();
  }
});
```

- [ ] **Step 3: 创建 `history.wxml`**

```xml
<view class="pane">
  <view class="topbar">
    <view class="ttl">历史</view>
    <view class="count">累计 12 次</view>
  </view>
  <view class="seg">
    <view class="{{tab === 'cal' ? 'on' : ''}}" data-t="cal" bindtap="switchTab">日历</view>
    <view class="{{tab === 'trend' ? 'on' : ''}}" data-t="trend" bindtap="switchTab">趋势</view>
    <view class="{{tab === 'pr' ? 'on' : ''}}" data-t="pr" bindtap="switchTab">成就</view>
  </view>

  <block wx:if="{{tab === 'cal'}}">
    <view class="card cal">
      <view class="mon">
        <view class="arrow" bindtap="prevMonth">‹</view>
        <text>{{year}}年{{month}}月</text>
        <view class="arrow" bindtap="nextMonth">›</view>
      </view>
      <view class="dow">
        <text>一</text><text>二</text><text>三</text><text>四</text><text>五</text><text>六</text><text>日</text>
      </view>
      <view class="grid">
        <view wx:for="{{31}}" wx:key="*this"
          class="day {{days[index + 1] ? 'work' : ''}} {{index + 1 === today ? 'today' : ''}}">
          {{index + 1}}
        </view>
      </view>
    </view>
  </block>

  <block wx:elif="{{tab === 'trend'}}">
    <view class="card trend">
      <view class="trend-hd">
        <text class="trend-ttl">近 8 周总容量</text>
        <text class="trend-up">▲ 24%</text>
      </view>
      <view class="bars">
        <view class="bar-col" wx:for="{{weeks}}" wx:key="index">
          <view class="bar-val">{{item.label}}</view>
          <view class="bar" style="height: {{item.h}}rpx;"></view>
        </view>
      </view>
    </view>
  </block>

  <block wx:else>
    <view class="list">
      <view class="lrow" wx:for="{{prs}}" wx:key="id">
        <view class="lrow-l">
          <text>{{item.name}}</text>
          <text class="tag" wx:if="{{item.isNew}}">新纪录</text>
        </view>
        <view class="lrow-r"><text class="lrow-r-b">{{item.best}}</text></view>
      </view>
    </view>
  </block>
</view>
<tab-bar current="history"/>
```

- [ ] **Step 4: 创建 `history.wxss`**

```css
.pane {
  padding-bottom: 180rpx;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.ttl {
  font-size: 48rpx;
  font-weight: 600;
}
.count {
  font-size: 28rpx;
  color: var(--slate);
}
.seg {
  display: flex;
  gap: 40rpx;
  border-bottom: 1rpx solid var(--hairline);
  margin-bottom: 32rpx;
}
.seg view {
  padding: 16rpx 4rpx 20rpx;
  font-size: 28rpx;
  color: var(--steel);
  border-bottom: 4rpx solid transparent;
  margin-bottom: -1rpx;
}
.seg .on {
  color: var(--ink);
  font-weight: 600;
  border-bottom-color: var(--ink);
}
.cal {
  padding: 36rpx 32rpx;
}
.mon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}
.arrow {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: var(--steel);
}
.dow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 20rpx;
  color: var(--stone);
  margin-bottom: 16rpx;
}
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
}
.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: var(--steel);
  border-radius: var(--r-md);
  position: relative;
}
.day.work {
  color: var(--ink);
  font-weight: 600;
}
.day.work::after {
  content: "";
  position: absolute;
  bottom: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: var(--primary);
}
.day.today {
  background: var(--ink);
  color: #fff;
  font-weight: 600;
}
.day.today::after {
  display: none;
}
.trend {
  padding: 36rpx;
}
.trend-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}
.trend-ttl {
  font-size: 30rpx;
  font-weight: 600;
}
.trend-up {
  font-size: 26rpx;
  color: var(--success);
  font-weight: 600;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  height: 220rpx;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
.bar-val {
  font-size: 18rpx;
  color: var(--slate);
  margin-bottom: 8rpx;
}
.bar {
  width: 100%;
  max-width: 48rpx;
  background: var(--primary);
  border-radius: var(--r-sm) var(--r-sm) 0 0;
}
.lrow-l {
  font-size: 28rpx;
}
```

- [ ] **Step 5: 验证**

三个视图可切换;日历中练过的日期有紫点、今天为黑底;趋势显示 8 根紫色柱;成就显示 PR 列表。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/history
git commit -m "feat: 历史页(日历/趋势/PR)"
```

## Task 17: 我的页

**Files:**
- Create: `miniprogram/pages/profile/profile.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `profile.json`**

```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "tab-bar": "/components/tab-bar/tab-bar"
  }
}
```

- [ ] **Step 2: 创建 `profile.js`**

```js
Page({
  data: {
    profile: null,
    metrics: null
  },
  onShow() {
    const profile = getApp().globalData.profile;
    this.setData({ profile, metrics: profile && profile.metrics });
  },
  edit() {
    wx.showToast({ title: '资料可随时修改并重算指标', icon: 'none' });
  },
  recalc() {
    wx.showToast({ title: '已重新计算指标', icon: 'none' });
  },
  show(e) {
    wx.showToast({ title: e.currentTarget.dataset.msg, icon: 'none' });
  }
});
```

- [ ] **Step 3: 创建 `profile.wxml`**

```xml
<view class="pane">
  <view class="topbar">
    <view class="ttl">我的</view>
    <view class="act" bindtap="edit">编辑资料</view>
  </view>
  <view class="card info">
    <view class="avatar">强</view>
    <view class="info-body">
      <view class="name">阿强</view>
      <view class="desc" wx:if="{{profile}}">
        {{profile.gender === 'male' ? '男' : '女'}} · {{profile.age}}岁 · {{profile.heightCm}}cm · {{profile.weightKg}}kg
      </view>
      <view class="goal" wx:if="{{profile}}">目标:{{profile.goal}} · 每周 {{profile.frequency}} 次</view>
    </view>
  </view>

  <view class="sec-ttl">体质指标</view>
  <view class="metric-grid" wx:if="{{metrics}}">
    <view class="metric metric-tint-lavender"><text class="metric-b">{{metrics.bmi}}</text><text class="metric-s">BMI {{metrics.bmiLabel}}</text></view>
    <view class="metric metric-tint-mint"><text class="metric-b">{{metrics.bodyFatMin}}–{{metrics.bodyFatMax}}%</text><text class="metric-s">体脂参考</text></view>
    <view class="metric metric-tint-sky"><text class="metric-b">{{metrics.bmr}}</text><text class="metric-s">基础代谢</text></view>
  </view>

  <view class="card recalc">
    <text class="recalc-txt">资料变化了?修改后重新计算指标</text>
    <view class="btn btn-ghost recalc-btn" bindtap="recalc">重新计算</view>
  </view>

  <view class="list menu">
    <view class="lrow" data-msg="查看用户协议" bindtap="show"><text>用户协议</text><text class="arr">›</text></view>
    <view class="lrow" data-msg="查看隐私政策" bindtap="show"><text>隐私政策</text><text class="arr">›</text></view>
    <view class="lrow" data-msg="关于举铁日记" bindtap="show"><text>关于我们</text><text class="arr">›</text></view>
    <view class="lrow warn" data-msg="注销后数据将不可恢复" bindtap="show"><text>注销账号</text><text class="arr">›</text></view>
  </view>
</view>
<tab-bar current="profile"/>
```

- [ ] **Step 4: 创建 `profile.wxss`**

```css
.pane {
  padding-bottom: 180rpx;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.ttl {
  font-size: 48rpx;
  font-weight: 600;
}
.act {
  font-size: 28rpx;
  color: var(--link-blue);
}
.info {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 36rpx;
  margin-bottom: 36rpx;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: var(--r-md);
  background: var(--ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.name {
  font-size: 38rpx;
  font-weight: 600;
}
.desc {
  font-size: 26rpx;
  color: var(--slate);
  margin-top: 6rpx;
}
.goal {
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 6rpx;
  font-weight: 500;
}
.sec-ttl {
  font-size: 30rpx;
  font-weight: 600;
  margin: 4rpx 4rpx 24rpx;
}
.recalc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 32rpx;
  background: var(--surface);
}
.recalc-txt {
  font-size: 26rpx;
  color: var(--slate);
  line-height: 1.4;
}
.recalc-btn {
  min-height: 76rpx;
  flex-shrink: 0;
}
.menu .lrow {
  font-size: 30rpx;
}
.menu .arr {
  color: var(--stone);
  font-size: 32rpx;
}
.menu .warn {
  color: var(--error);
}
```

- [ ] **Step 5: 验证**

显示用户资料、粉彩指标卡、重新计算按钮与菜单;四个菜单项点击有提示。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/profile
git commit -m "feat: 我的页(资料/指标/菜单)"
```

## Task 18: 分享页(Canvas 生成分享卡)

**Files:**
- Create: `miniprogram/pages/share/share.js` / `.json` / `.wxml` / `.wxss`

- [ ] **Step 1: 创建 `share.json`**

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 `share.js`**

```js
const { formatVolume, formatDuration, formatDate } = require('../../utils/format');

Page({
  data: {
    detail: null,
    totalVolume: '0kg',
    duration: '0 分钟',
    dateText: '',
    bgPath: '',
    usePhoto: false,
    actions: 0,
    groups: 0,
    exercises: [],
    qrPath: ''
  },
  onLoad() {
    const detail = getApp().globalData.lastWorkoutDetail;
    if (!detail) {
      wx.redirectTo({ url: '/pages/home/home' });
      return;
    }
    const sum = getApp().globalData.lastWorkout || {};
    const actions = detail.exercises.length;
    const groups = detail.exercises.reduce((s, e) => s + e.sets.length, 0);
    const exercises = detail.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      setText: ex.sets.map((s) => s.weightKg + 'kg×' + s.reps).join(' / ')
    }));
    this.setData({
      detail,
      totalVolume: formatVolume(sum.totalVolumeKg || 0),
      duration: formatDuration(detail.durationMin || 0),
      dateText: formatDate(Date.now()),
      actions,
      groups,
      exercises
    });
    this.loadQr();
  },
  loadQr() {
    const { call } = require('../../utils/cloud');
    call('qrcode')
      .then((data) => wx.cloud.getTempFileURL({ fileList: [data.fileID] }))
      .then((res) => this.setData({ qrPath: res.fileList[0].tempFileURL }))
      .catch(() => { /* 小程序未发布时无码,不影响分享卡 */ });
  },
  toggleBg() {
    if (this.data.usePhoto) {
      this.setData({ usePhoto: false, bgPath: '' });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ usePhoto: true, bgPath: res.tempFiles[0].tempFilePath });
      }
    });
  },
  drawCard(cb) {
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const W = res[0].width;
      const H = res[0].height;
      ctx.clearRect(0, 0, W, H);
      const paint = (img) => {
        if (img) {
          ctx.drawImage(img, 0, 0, W, H);
          ctx.fillStyle = 'rgba(10,10,12,0.62)';
          ctx.fillRect(0, 0, W, H);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);
        }
        this.drawContent(ctx, W, H);
        if (this.data.qrPath) {
          const qr = canvas.createImage();
          qr.onload = () => { ctx.drawImage(qr, W - 170, H - 190, 120, 120); cb(canvas); };
          qr.onerror = () => cb(canvas);
          qr.src = this.data.qrPath;
        } else {
          cb(canvas);
        }
      };
      if (this.data.bgPath) {
        const img = canvas.createImage();
        img.onload = () => paint(img);
        img.src = this.data.bgPath;
      } else {
        paint(null);
      }
    });
  },
  drawContent(ctx, W, H) {
    const pad = 40;
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('举铁日记', pad, 80);
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#5d5b54';
    ctx.font = '24px sans-serif';
    ctx.fillText(this.data.dateText, W - pad, 80);
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(this.data.totalVolume, pad, 190);
    ctx.font = '28px sans-serif';
    ctx.fillText(this.data.actions + ' 个动作 · ' + this.data.groups + ' 组 · ' + this.data.duration, pad, 250);
    let y = 330;
    ctx.font = '28px sans-serif';
    this.data.exercises.forEach((ex) => {
      ctx.fillStyle = this.data.bgPath ? 'rgba(255,255,255,0.75)' : '#5d5b54';
      ctx.fillText(ex.name, pad, y);
      ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(ex.setText, pad, y + 40);
      ctx.font = '28px sans-serif';
      y += 110;
    });
    ctx.fillStyle = this.data.bgPath ? 'rgba(255,255,255,0.75)' : '#5d5b54';
    ctx.fillText('坚持训练,见证改变', pad, H - 100);
  },
  save() {
    this.drawCard((canvas) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.showToast({ title: '保存失败,请检查相册权限', icon: 'none' })
          });
        }
      });
    });
  },
  share() {
    this.drawCard((canvas) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.shareAppMessage({
            title: '今日训练完成,总容量 ' + this.data.totalVolume,
            imageUrl: res.tempFilePath
          });
        }
      });
    });
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
```

- [ ] **Step 3: 创建 `share.wxml`**

```xml
<view class="sheet">
  <view class="bar"></view>
  <view class="ttl">今日训练完成</view>

  <view class="card sw" bindtap="toggleBg">
    <text class="sw-txt">使用照片作背景</text>
    <view class="switch {{usePhoto ? 'on' : ''}}"></view>
  </view>

  <view class="card preview {{usePhoto ? 'photo' : ''}}" style="{{usePhoto ? 'background-image: url(' + bgPath + ');' : ''}}">
    <view class="pv-top">
      <text class="pv-brand">举铁日记</text>
      <text class="tag">训练打卡</text>
    </view>
    <view class="pv-vol">{{totalVolume}}<text class="pv-unit">kg 总容量</text></view>
    <view class="pv-meta">{{actions}} 个动作 · {{groups}} 组 · {{duration}}</view>
    <view class="pv-list">
      <view class="pv-row" wx:for="{{exercises}}" wx:key="exerciseId">
        <text class="pv-nm">{{item.name}}</text>
        <text class="pv-set">{{item.setText}}</text>
      </view>
    </view>
    <view class="pv-foot">
      <text>{{dateText}}</text>
      <view class="qr">小程序码</view>
    </view>
  </view>

  <canvas type="2d" id="shareCanvas" class="hidden-canvas"></canvas>

  <view class="btn-row">
    <view class="btn btn-ghost flex1" bindtap="save">保存到相册</view>
    <view class="btn btn-primary flex1" open-type="share" bindtap="share">转发给好友</view>
  </view>
  <view class="home-link" bindtap="goHome">回到首页</view>
</view>
```

- [ ] **Step 4: 创建 `share.wxss`**

```css
.sheet {
  min-height: 100vh;
  background: var(--surface-soft);
  padding: 20rpx 40rpx 60rpx;
}
.bar {
  width: 72rpx;
  height: 8rpx;
  background: #d9d6d1;
  border-radius: var(--r-full);
  margin: 0 auto 32rpx;
}
.ttl {
  font-size: 40rpx;
  font-weight: 600;
  text-align: center;
  margin-bottom: 28rpx;
}
.sw {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  margin-bottom: 28rpx;
}
.sw-txt {
  font-size: 28rpx;
}
.switch {
  width: 96rpx;
  height: 60rpx;
  border-radius: var(--r-full);
  background: #e3e1dd;
  position: relative;
}
.switch::after {
  content: "";
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
  transition: left 0.2s;
}
.switch.on {
  background: var(--primary);
}
.switch.on::after {
  left: 42rpx;
}
.preview {
  padding: 40rpx;
  margin-bottom: 28rpx;
  position: relative;
  overflow: hidden;
}
.preview.photo {
  background-size: cover;
  background-position: center;
  color: #fff;
}
.preview.photo::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 12, 0.62);
}
.preview.photo .pv-brand,
.preview.photo .pv-set,
.preview.photo .pv-vol {
  color: #fff;
}
.preview.photo .pv-unit,
.preview.photo .pv-meta,
.preview.photo .pv-nm,
.preview.photo .pv-foot {
  color: rgba(255, 255, 255, 0.8);
}
.preview > view {
  position: relative;
}
.pv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.pv-brand {
  font-size: 30rpx;
  font-weight: 600;
}
.pv-vol {
  font-size: 80rpx;
  font-weight: 600;
  letter-spacing: -2rpx;
  line-height: 1.1;
}
.pv-unit {
  font-size: 26rpx;
  font-weight: 400;
  color: var(--slate);
  margin-left: 10rpx;
}
.pv-meta {
  font-size: 26rpx;
  color: var(--slate);
  margin: 16rpx 0 24rpx;
}
.pv-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid var(--hairline-soft);
  font-size: 26rpx;
}
.pv-nm {
  color: var(--slate);
}
.pv-set {
  font-weight: 600;
}
.pv-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--slate);
}
.qr {
  width: 72rpx;
  height: 72rpx;
  background: var(--ink);
  color: #fff;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
}
.hidden-canvas {
  position: fixed;
  left: -9999rpx;
  top: 0;
  width: 750rpx;
  height: 1000rpx;
}
.btn-row {
  display: flex;
  gap: 20rpx;
}
.flex1 {
  flex: 1;
}
.home-link {
  text-align: center;
  font-size: 28rpx;
  color: var(--link-blue);
  margin-top: 32rpx;
}
```

- [ ] **Step 5: 验证**

结束训练后进入分享页:默认白卡预览;开关切换后从相册选图,预览出现照片底 + 遮罩;点"保存到相册"生成 Canvas 图并保存(首次会请求相册权限);点"转发给好友"拉起分享面板;点"回到首页"回首页。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/share
git commit -m "feat: 分享页(Canvas 分享卡/照片背景/保存转发)"
```

---

# Phase E:收尾

## Task 19: 隐私合规文案与首页新纪录验收

**Files:**
- Modify: `miniprogram/pages/login/login.js`
- Modify: `miniprogram/pages/home/home.js`

- [ ] **Step 1: 登录页补充隐私弹窗**

把 `login.js` 中 `onStandard` 改为:

```js
onStandard() {
  wx.showModal({
    title: '标准说明',
    content: '体质指标按中国标准计算:BMI 分级(<18.5 偏瘦 / 18.5–23.9 正常 / 24–27.9 超重 / ≥28 肥胖),体脂与基础代谢按性别区分,力量参考按性别与体重给出区间。',
    showCancel: false
  });
}
```

- [ ] **Step 2: 首页新纪录横幅验收**

确认 `home.js` 的 `checkPr()` 已按 Task 13 的实现从 `getApp().globalData.lastWorkout.newPrs` 读取真实新纪录(不再有"卧推 60kg×10"占位)。保存一条含新纪录的训练后回到首页,横幅显示"<动作名> <重量>kg · 刚刚刷新"。

- [ ] **Step 3: 验证与提交**

登录页"查看标准说明"弹出标准文案;保存含新纪录的训练后回到首页,横幅显示真实动作与重量(无"卧推 60kg×10"占位)。提交:

```bash
git add miniprogram/pages/login/login.js miniprogram/pages/home/home.js
git commit -m "chore: 隐私标准文案与占位清理"
```

## Task 20: 全量验证清单与最终提交

**Files:**
- Create: `docs/acceptance-checklist.md`

- [ ] **Step 1: 创建 `docs/acceptance-checklist.md`**

```markdown
# 举铁日记 MVP 验收清单

## 单元测试
- [ ] `node --test tests/` 全部通过

## 首次引导
- [ ] 未同意协议不能登录
- [ ] 三步引导可前进/性别年龄身高体重目标频率均可改
- [ ] 非法输入(年龄 5、身高 70cm)有提示
- [ ] 结果页 BMI/体脂/基础代谢与公式一致

## 训练记录
- [ ] 模板预置组数正确
- [ ] 自由训练可添加动作
- [ ] 组内重量/次数可编辑,可加组删组
- [ ] 底部总组数/总容量实时更新
- [ ] 未填完的组点结束有提示
- [ ] 训练中返回有确认弹窗

## 历史与统计
- [ ] 日历标记训练日,可切月份
- [ ] 趋势显示近 8 周容量柱状图
- [ ] 成就显示 PR 列表

## 分享
- [ ] 白卡预览正确
- [ ] 照片背景 + 遮罩可读
- [ ] 保存到相册成功
- [ ] 转发给好友成功

## 合规
- [ ] 登录前展示用户协议/隐私政策
- [ ] 云数据库权限为"仅创建者可读写"
- [ ] 提供注销账号入口(文案即可,MVP 阶段)
```

- [ ] **Step 2: 跑单元测试**

```bash
node --test tests/
```

期望:全部 PASS。

- [ ] **Step 3: 开发者工具全流程走查**

新用户注册流程 → 首次引导 → 首页 → 模板训练 → 记录 → 历史 → 我的 → 分享,对照验收清单逐项打勾。

- [ ] **Step 4: 最终提交**

```bash
git add docs/acceptance-checklist.md
git commit -m "docs: MVP 验收清单"
git log --oneline
```

期望:git log 显示完整任务链提交记录。
