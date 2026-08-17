# 「牛来举铁」第一性原理重建 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本会话不使用子代理，采用 inline 执行。

**Goal:** 围绕「记一次训练 → 看见进步 → 分享成果」的最短闭环，从根上重建微信小程序「牛来举铁」，消除真机上「页面横向溢出 / 模板练不了 / 分享不了」三类问题。

**Architecture:** 微信云开发 + 原生小程序（WXML/WXSS/JS）。6 页面、4 集合、5 云函数。纯逻辑（体质指标、统计、格式化）收敛为无 `wx` 依赖的纯函数并用 node:test 覆盖；页面数据「本地兜底 + 云端按需加载」；样式令牌集中、全局 border-box、rpx + 安全区。

**Tech Stack:** 原生小程序（基础库 3.17.1）、微信云开发（云函数 + 云数据库）、Node 24（node:test 单测）。

**Branch:** `codex/rebuild-first-principles`（基于 `master`）。

---

## 文件结构

```
miniprogram/
  app.js / app.json / app.wxss / sitemap.json
  utils/
    standards.js   # 纯函数:体质指标 + 推荐重量区间
    stats.js       # 纯函数:总组数/总容量/PR/周概览/周趋势
    format.js      # 纯函数:日期/重量/容量/时长格式化
    cloud.js       # 云函数调用封装 + 登录/目录/统计便捷方法
    storage.js     # 本地草稿 + 目录缓存
  data/
    exercises.js   # 12 动作种子(前端兜底)
    templates.js   # 4 模板种子(前端兜底)
  pages/
    onboarding/ home/ record/ history/ profile/ share/
  images/          # 8 张 tabBar 图标(4 组 normal/selected)
cloudfunctions/
  login/ saveProfile/ catalog/ saveWorkout/ stats/
tests/
  standards.test.js / stats.test.js / format.test.js
deploy/
  seed-db.js       # 一次性初始化 exercises/templates 种子(云函数内联脚本用)
```

统一数据形状：

- Exercise：`{ id, name, bodyPart, equipment, weighted, pcts:{male:{novice:[lo,hi],intermediate:[..],advanced:[..]},female:{...}} }`
- Template：`{ id, name, goal, genderHint, frequency, exercises:[{exerciseId, sets, repRange:[lo,hi]}] }`
- Set：`{ reps:number, weight:number }`（自重 weight=0）
- Workout doc：`{ openid, date, startedAt, endedAt, durationSec, mode, templateId?, templateName?, exercises:[{exerciseId,name,bodyPart,equipment,sets}], totalSets, totalVolume, createdAt }`
- User doc：`{ openid, gender, age, heightCm, weightKg, goal, frequency?, bmi, bmiLevel, bodyFatRef, bmr, createdAt, updatedAt }`

---

## Task 1：纯逻辑层（standards / stats / format）TDD

**Files:**
- Create: `miniprogram/utils/standards.js`
- Create: `miniprogram/utils/stats.js`
- Create: `miniprogram/utils/format.js`
- Create: `tests/standards.test.js`
- Create: `tests/stats.test.js`
- Create: `tests/format.test.js`

- [ ] **Step 1：写 failing test**

`tests/standards.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const s = require('../miniprogram/utils/standards');

test('bmi 计算与取 1 位小数', () => {
  assert.equal(s.bmi(70, 175), 22.9);
  assert.equal(s.bmi(55, 165), 20.2);
});

test('bmiLevel 中国标准边界', () => {
  assert.equal(s.bmiLevel(18.4), 'underweight');
  assert.equal(s.bmiLevel(18.5), 'normal');
  assert.equal(s.bmiLevel(23.9), 'normal');
  assert.equal(s.bmiLevel(24), 'overweight');
  assert.equal(s.bmiLevel(28), 'obese');
});

test('bodyFatRange 按性别 + 分级返回参考区间', () => {
  assert.equal(s.bodyFatRange('male', 'normal'), '10–20%');
  assert.equal(s.bodyFatRange('female', 'obese'), '>30%');
});

test('bmr Mifflin-St Jeor 男女', () => {
  assert.equal(s.bmr('male', 28, 175, 70), 1659);
  assert.equal(s.bmr('female', 28, 165, 55), 1280);
});

test('recommendedWeight 按体重倍数并取 2.5kg 档', () => {
  const bench = { weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] } } };
  assert.deepEqual(s.recommendedWeight('male', 70, bench).novice, [27.5, 42.5]);
  assert.equal(s.recommendedWeight('male', 70, { weighted: false }), null);
});

test('validateProfile 边界与可选 frequency', () => {
  assert.equal(s.validateProfile({ gender: 'x', age: 5, heightCm: 70, weightKg: 10, goal: '' }).ok, false);
  assert.equal(s.validateProfile({ gender: 'male', age: 28, heightCm: 175, weightKg: 70, goal: '增肌' }).ok, true);
  assert.equal(s.validateProfile({ gender: 'male', age: 28, heightCm: 175, weightKg: 70, goal: '增肌', frequency: 8 }).ok, false);
});
```

`tests/stats.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const st = require('../miniprogram/utils/stats');

const exercises = [
  { exerciseId: 'bench', name: '杠铃卧推', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 60 }] },
  { exerciseId: 'squat', name: '杠铃深蹲', sets: [{ reps: 12, weight: 45 }] }
];

test('totalSets / totalVolume', () => {
  assert.equal(st.totalSets(exercises), 3);
  assert.equal(st.totalVolume(exercises), 1620);
});

test('weeklySummary 只统计本周', () => {
  const now = new Date(2026, 7, 16);
  const workouts = [
    { date: '2026-08-16', durationSec: 1800, totalVolume: 2000 },
    { date: '2026-08-09', durationSec: 1800, totalVolume: 9999 }
  ];
  assert.deepEqual(st.weeklySummary(workouts, now), { count: 1, durationSec: 1800, volume: 2000 });
});

test('weeklyTrend 输出 8 周桶且顺序从旧到新', () => {
  const now = new Date(2026, 7, 16);
  const out = st.weeklyTrend([{ date: '2026-08-16', totalVolume: 100 }], now, 8);
  assert.equal(out.length, 8);
  assert.equal(out[7].volume, 100);
});

test('prs 现算最大重量与最重单次容量', () => {
  const map = st.prs([
    { date: '2026-08-10', exercises: [{ exerciseId: 'bench', name: '杠铃卧推', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 3 }] }] },
    { date: '2026-08-16', exercises: [{ exerciseId: 'bench', name: '杠铃卧推', sets: [{ weight: 65, reps: 10 }] }] }
  ]);
  assert.equal(map.bench.bestWeight, 70);
  assert.equal(map.bench.bestWeightDate, '2026-08-10');
  assert.equal(map.bench.bestVolume, 650);
  assert.equal(map.bench.bestVolumeDate, '2026-08-16');
});
```

`tests/format.test.js`：

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const f = require('../miniprogram/utils/format');

test('formatVolume 千位/吨', () => {
  assert.equal(f.formatVolume(12340), '12.3t');
  assert.equal(f.formatVolume(3450), '3,450kg');
  assert.equal(f.formatVolume(850), '850kg');
});

test('formatDuration 秒转分钟/小时', () => {
  assert.equal(f.formatDuration(2700), '45 分钟');
  assert.equal(f.formatDuration(5400), '1.5h');
});

test('today / formatDate', () => {
  assert.match(f.today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(f.formatDate('2026-08-17'), '8月17日 周一');
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `work\node\node-v24.19.0-win-x64\node.exe --test tests/`
Expected: FAIL（模块不存在）。

- [ ] **Step 3：实现三个纯函数模块**

`miniprogram/utils/standards.js`：

```js
const BMI_LABELS = { underweight: '偏瘦', normal: '正常', overweight: '超重', obese: '肥胖' };
const BODY_FAT = {
  male: { underweight: '<10%', normal: '10–20%', overweight: '20–25%', obese: '>25%' },
  female: { underweight: '<15%', normal: '15–25%', overweight: '25–30%', obese: '>30%' }
};

function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}
function bmiLevel(v) {
  if (v < 18.5) return 'underweight';
  if (v < 24) return 'normal';
  if (v < 28) return 'overweight';
  return 'obese';
}
function bmiLevelLabel(level) { return BMI_LABELS[level] || '未知'; }
function bodyFatRange(gender, level) { return (BODY_FAT[gender] && BODY_FAT[gender][level]) || ''; }
function bmr(gender, age, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}
function roundWeight(v) { return Math.round(v / 2.5) * 2.5; }
function recommendedWeight(gender, weightKg, exercise) {
  if (!exercise || !exercise.weighted) return null;
  const pcts = exercise.pcts && exercise.pcts[gender];
  if (!pcts) return null;
  const out = {};
  ['novice', 'intermediate', 'advanced'].forEach((k) => {
    const [lo, hi] = pcts[k];
    out[k] = [roundWeight(weightKg * lo), roundWeight(weightKg * hi)];
  });
  return out;
}
function validateProfile(p) {
  const errors = [];
  if (p.gender !== 'male' && p.gender !== 'female') errors.push('请选择性别');
  if (!(p.age >= 6 && p.age <= 100)) errors.push('年龄需在 6–100 岁之间');
  if (!(p.heightCm >= 80 && p.heightCm <= 250)) errors.push('身高需在 80–250cm 之间');
  if (!(p.weightKg >= 20 && p.weightKg <= 300)) errors.push('体重需在 20–300kg 之间');
  if (!p.goal) errors.push('请选择健身目标');
  if (p.frequency != null && !(p.frequency >= 1 && p.frequency <= 7)) errors.push('每周训练频率需在 1–7 次');
  return { ok: errors.length === 0, errors };
}

module.exports = { bmi, bmiLevel, bmiLevelLabel, bodyFatRange, bmr, recommendedWeight, roundWeight, validateProfile };
```

`miniprogram/utils/stats.js`：

```js
function totalSets(exercises) { return exercises.reduce((n, ex) => n + (ex.sets ? ex.sets.length : 0), 0); }
function totalVolume(exercises) {
  return exercises.reduce((sum, ex) => sum + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
}
function weekStart(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function weeklySummary(workouts, now = new Date()) {
  const start = weekStart(now);
  const end = new Date(start.getTime() + 7 * 86400000);
  const inWeek = workouts.filter((w) => { const t = new Date(w.date + 'T00:00:00'); return t >= start && t < end; });
  return {
    count: inWeek.length,
    durationSec: inWeek.reduce((s, w) => s + (w.durationSec || 0), 0),
    volume: inWeek.reduce((s, w) => s + (w.totalVolume || 0), 0)
  };
}
function weeklyTrend(workouts, now = new Date(), weeks = 8) {
  const start = weekStart(now);
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) buckets.push({ weekStart: isoDate(new Date(start.getTime() - i * 7 * 86400000)), count: 0, volume: 0 });
  workouts.forEach((w) => {
    const k = isoDate(weekStart(new Date(w.date + 'T00:00:00')));
    const b = buckets.find((x) => x.weekStart === k);
    if (b) { b.count += 1; b.volume += (w.totalVolume || 0); }
  });
  return buckets;
}
function prs(workouts) {
  const map = {};
  workouts.forEach((w) => (w.exercises || []).forEach((ex) => {
    if (!map[ex.exerciseId]) map[ex.exerciseId] = { name: ex.name, bestWeight: 0, bestWeightDate: '', bestVolume: 0, bestVolumeDate: '' };
    const rec = map[ex.exerciseId];
    (ex.sets || []).forEach((set) => {
      const weight = set.weight || 0;
      const vol = weight * (set.reps || 0);
      if (weight > rec.bestWeight) { rec.bestWeight = weight; rec.bestWeightDate = w.date; }
      if (vol > rec.bestVolume) { rec.bestVolume = vol; rec.bestVolumeDate = w.date; }
    });
  }));
  return map;
}
module.exports = { totalSets, totalVolume, weeklySummary, weeklyTrend, prs };
```

`miniprogram/utils/format.js`：

```js
const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function thousand(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function formatWeight(kg) { return Number.isInteger(kg) ? String(kg) : String(kg); }
function formatVolume(kg) { if (kg >= 10000) return (kg / 1000).toFixed(1) + 't'; return thousand(kg) + 'kg'; }
function formatDuration(sec) {
  const min = Math.round(sec / 60);
  if (min < 60) return min + ' 分钟';
  return (Math.round((min / 60) * 10) / 10) + 'h';
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKS[d.getDay()]}`;
}
module.exports = { thousand, formatWeight, formatVolume, formatDuration, today, formatDate };
```

- [ ] **Step 4：运行测试确认通过**

Run: `work\node\node-v24.19.0-win-x64\node.exe --test tests/`
Expected: PASS（3 个文件全绿）。

- [ ] **Step 5：提交**

```bash
git add miniprogram/utils/standards.js miniprogram/utils/stats.js miniprogram/utils/format.js tests/
git commit -m "feat: 重写纯逻辑层(体质指标/统计/格式化)并补单测"
```

---

## Task 2：种子数据（exercises / templates）

**Files:**
- Create: `miniprogram/data/exercises.js`
- Create: `miniprogram/data/templates.js`

- [ ] **Step 1：写动作库种子**

`miniprogram/data/exercises.js`：12 个动作，字段与第 4 节数据形状一致；自重动作 `weighted:false` 且无 `pcts`。动作清单沿用现有 `exercises.js`（squat/bench/deadlift/row/ohp/curl/pushdown/legpress/pullup/pushup/crunch/hipbridge），把字段 `weightKg` 统一为 `weight`、`pcts` 结构保留。

- [ ] **Step 2：写模板种子**

`miniprogram/data/templates.js`：4 个模板（full-body-m / full-body-f / ppl / upper-lower），结构沿用现有 `templates.js`。

- [ ] **Step 3：语法校验并提交**

Run: `work\node\node-v24.19.0-win-x64\node.exe -e "require('./miniprogram/data/exercises.js');require('./miniprogram/data/templates.js');console.log('ok')"`
Expected: `ok`。

```bash
git add miniprogram/data/
git commit -m "feat: 动作库与模板种子数据"
```

---

## Task 3：5 个云函数

**Files:**
- Create: `cloudfunctions/login/index.js`, `cloudfunctions/login/package.json`
- Create: `cloudfunctions/saveProfile/index.js`, `cloudfunctions/saveProfile/package.json`
- Create: `cloudfunctions/catalog/index.js`, `cloudfunctions/catalog/package.json`
- Create: `cloudfunctions/saveWorkout/index.js`, `cloudfunctions/saveWorkout/package.json`
- Create: `cloudfunctions/stats/index.js`, `cloudfunctions/stats/package.json`

每个 `package.json` 为 `{ "name":"<name>", "version":"1.0.0", "main":"index.js", "dependencies": { "wx-server-sdk": "~2.6.3" } }`。

- [ ] **Step 1：写 login**

`index.js`：`cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})`；`getWXContext()` 取 `OPENID`；查 `users`，无则 `add` 空档案；返回 `{ok:true,data:{openid,user}}`。

- [ ] **Step 2：写 saveProfile**

`index.js`：校验 gender/age/heightCm/weightKg/goal/frequency；计算 `bmi`、`bmiLevel`、`bodyFatRef`（复用 Task 1 的规则）、`bmr`；按 `openid` upsert `users`；返回 `{ok:true,data:metrics}`。

- [ ] **Step 3：写 catalog**

`index.js`：并行读 `exercises`、`templates`，返回 `{ok:true,data:{exercises,templates}}`。

- [ ] **Step 4：写 saveWorkout**

`index.js`：校验 date（`YYYY-MM-DD`）、exercises 非空、mode 合法；服务端算 `totalSets`/`totalVolume`；`openid` 注入；`add` 到 `workouts`；返回保存后的记录。

- [ ] **Step 5：写 stats**

`index.js`：按 `openid` 拉最近 1000 条 workouts；现算 `week`（本周 count/durationSec/volume）、`trend`（8 周）、`prs`（每动作 bestWeight/bestVolume + 日期）、`recent`（最近 5 条）；返回 `{ok:true,data:{week,trend,prs,recent}}`。

- [ ] **Step 6：本地语法校验并提交**

Run（每个云函数目录）: `work\node\node-v24.19.0-win-x64\node.exe --check index.js`
Expected: 无输出（语法通过）。

```bash
git add cloudfunctions/
git commit -m "feat: 重建 5 个云函数(login/saveProfile/catalog/saveWorkout/stats)"
```

---

## Task 4：应用骨架（app.json / app.wxss / app.js + tab 图标）

**Files:**
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/app.js`
- Modify: `miniprogram/app.wxss`
- Create: `miniprogram/images/*.png`（8 张 tab 图标）
- Delete: `miniprogram/components/tab-bar/*`

- [ ] **Step 1：app.json 声明 6 页 + 原生 tabBar**

`pages` 顺序：`onboarding/home/record/history/profile/share`。`window` 保持浅色背景。`tabBar`：4 项（首页/训练/历史/我的），`color:#787671`、`selectedColor:#5645d4`、`backgroundColor:#ffffff`、`borderStyle:white`，每项配 normal/selected 图标。保留 `style:v2`、`lazyCodeLoading:requiredComponents`、`sitemapLocation`。

- [ ] **Step 2：app.wxss 令牌 + 共享类**

保留现有 DESIGN.md 令牌（primary/surface/hairline/ink/tint-* 等），重写为：`page { box-sizing:border-box; overflow-x:hidden; }`，`view,text,input,button,canvas,image,scroll-view { box-sizing:border-box; }`；共享类 `.card/.btn/.btn-primary/.btn-ghost/.pill/.pill-sel/.input/.list/.lrow/.tag/.metric-grid/.metric/.navy-hero/.pane/.mtitle/.msub/.step-row/.bar-track/.bar-fill`。页面容器统一用 `.pane { padding: 32rpx 40rpx calc(56rpx + env(safe-area-inset-bottom)); }`。底部固定操作条用 `padding-bottom: env(safe-area-inset-bottom)`。

- [ ] **Step 3：app.js 云初始化 + 启动草稿补传**

`onLaunch` 里 `wx.cloud.init({env:'cloudbase-d9gyqv3ea400083a0', traceUser:true})`；`globalData = { profile:null, catalog:null }`；调用 `utils/storage` 检查本地草稿，存在则后台补传（失败静默保留）。

- [ ] **Step 4：生成 8 张 tab 图标并提交**

图标为简单线性轮廓（首页=房子、训练=哑铃、历史=日历、我的=人形），normal 灰色 `#787671`、selected 紫色 `#5645d4`，尺寸 81×81px PNG。用脚本生成或引入占位图，确保开发者工具与真机可加载。

```bash
git add miniprogram/
git commit -m "feat: 应用骨架(原生 tabBar/设计令牌/启动兜底)"
```

---

## Task 5：云调用与本地存储工具

**Files:**
- Create: `miniprogram/utils/cloud.js`
- Create: `miniprogram/utils/storage.js`

- [ ] **Step 1：cloud.js 封装**

`call(name, data)`：`wx.cloud.callFunction`，非 `ok` 时抛错；`ensureLogin()`：调用 login 缓存 profile；`getCatalog()`：先读 storage 缓存再云端刷新，云端失败用 `data/exercises.js` + `data/templates.js` 兜底；`saveProfile(p)`、`saveWorkout(w)`、`getStats()` 便捷封装。

- [ ] **Step 2：storage.js 封装**

`saveDraft(workout)/loadDraft()/clearDraft()`（key：`jitie.draft`）；`cacheCatalog(c)/loadCatalogCache()`（key：`jitie.catalog`）。

- [ ] **Step 3：语法校验并提交**

Run: `work\node\node-v24.19.0-win-x64\node.exe --check miniprogram/utils/cloud.js miniprogram/utils/storage.js`
Expected: 无输出。

```bash
git add miniprogram/utils/cloud.js miniprogram/utils/storage.js
git commit -m "feat: 云调用与本地草稿/目录缓存工具"
```

---

## Task 6：onboarding（首次建档）

**Files:** `miniprogram/pages/onboarding/onboarding.{js,wxml,wxss,json}`

- [ ] 数据：`step(0..2)`、`agree`、`form{gender,age,heightCm,weightKg,goal,frequency}`、`result`。
- [ ] 第 0 步：协议勾选 + 「同意并开始」；未勾选禁点。
- [ ] 第 1 步：性别胶囊、年龄/身高/体重数字输入（带单位与范围校验）。
- [ ] 第 2 步：目标胶囊（增肌/减脂/增力/保持）+ 频率胶囊（1–7）。
- [ ] 提交：本地 `validateProfile` → `cloud.saveProfile` → 展示 BMI/分级/体脂参考/BMR → 「进入」写 globalData.profile 并 `wx.switchTab` 到 home。
- [ ] 顶部进度条 + 步骤文案；错误 toast 汇总第一条。

提交：`git commit -m "feat: 首次建档页"`。

---

## Task 7：home（首页）

**Files:** `miniprogram/pages/home/home.{js,wxml,wxss,json}`

- [ ] `onShow`：`ensureLogin` + `getStats` 刷新；数据 `greeting`、`week{count,durationSec,volume}`、`recent`。
- [ ] 顶部 navy-hero 问候 + 本周三指标（次数/时长/总容量）。
- [ ] 「开始训练」主按钮 → `wx.switchTab` 到 record。
- [ ] 最近一次训练摘要卡（动作数/总容量/日期），无记录显示空态。
- [ ] 未建档（无 profile）时 `wx.reLaunch` 到 onboarding。

提交：`git commit -m "feat: 首页(本周概览/最近训练)"`。

---

## Task 8：record（训练记录，核心）

**Files:** `miniprogram/pages/record/record.{js,wxml,wxss,json}`

- [ ] 数据：`mode('free'|'template')`、`templates`、`selectedTemplate`、`exercises`、`startedAt`、`totals{sets,volume}`、`saving`。
- [ ] 顶部模式切换：自由训练 / 模板训练；模板模式下弹层选择模板（按 genderHint 排序，同性别优先），选中后按模板 exercises 生成动作列表（每组 repRange 中点作默认次数，weight 空）。
- [ ] 自由模式：按部位分组动作选择器，展示器械与推荐重量区间（`recommendedWeight(gender, weightKg, ex)`）。
- [ ] 动作卡片：每组一行 `[重量 input] [次数 input] [删除]`；加组 / 删组 / 删动作。
- [ ] 底部 sticky 条：总组数、总容量实时 `stats.totalSets/totalVolume`；「完成训练」→ 校验（每动作至少 1 组且次数>0）→ 组装 workout → `storage.saveDraft` → `cloud.saveWorkout` → `storage.clearDraft` → `wx.redirectTo` 到 share。
- [ ] 训练中返回用 `wx.enableAlertBeforeUnload` + `onUnload` 保留草稿；云失败 toast 且草稿保留。

提交：`git commit -m "feat: 训练记录页(自由/模板/按组录入/草稿兜底)"`。

---

## Task 9：history（历史）

**Files:** `miniprogram/pages/history/history.{js,wxml,wxss,json}`

- [ ] 数据：`trend`、`prs`、`month`、`calendarDays`。
- [ ] 顶部近 8 周趋势（用 view 高度柱或列表）；月历打卡（可切换月份，有训练的天打点）。
- [ ] PR 榜：每动作最大重量 + 最重单次容量 + 达成日期；空态提示。
- [ ] `onShow` 调 `cloud.getStats()` 刷新。

提交：`git commit -m "feat: 历史页(趋势/月历/PR)"`。

---

## Task 10：profile（我的）

**Files:** `miniprogram/pages/profile/profile.{js,wxml,wxss,json}`

- [ ] 数据：`profile`、`metrics`（BMI/分级/体脂/BMR）。
- [ ] 顶部资料卡 + 体质指标卡；「编辑资料」进入 onboarding（预填）或复用 onboarding 编辑态。
- [ ] 列表：用户协议、隐私政策、注销账号、关于（品牌「牛来举铁」）。
- [ ] 注销：二次确认 → 清本地 → 提示（云数据按 openid 保留，后续可接删除云函数）。

提交：`git commit -m "feat: 我的页(资料/指标/设置)"`。

---

## Task 11：share（分享卡）

**Files:** `miniprogram/pages/share/share.{js,wxml,wxss,json}`

- [ ] 数据：`workout`、`bg(white|photo)`、`photoPath`、`generating`、`saved`。
- [ ] 隐藏 canvas 用 `position:fixed; top:-9999px; left:0`（不参与布局宽度）。
- [ ] 绘制白卡：品牌名「牛来举铁」+「训练打卡」标签 + 总容量大字 + 动作摘要（名称 + 每组重量×次数）+ 日期。
- [ ] 「换背景」：`wx.chooseMedia` 选照片 → 深色遮罩 + 白字重绘。
- [ ] 「保存到相册」：`wx.canvasToTempFilePath` → `wx.saveImageToPhotosAlbum`；权限拒绝提示；成功后标记 saved。
- [ ] 「完成」返回首页；转发用 `onShareAppMessage`。
- [ ] canvas 初始化失败 / 保存失败均 toast 并可重试。

提交：`git commit -m "feat: 分享卡(Canvas 绘制/照片背景/保存相册)"`。

---

## Task 12：数据库初始化 + 云函数部署 + 真机验收

- [ ] 一次性 seed：用云开发 CLI 或 initDb 脚本把 `exercises` 12 条、`templates` 4 条写入云数据库（存在则更新）。
- [ ] 部署 5 个云函数到 `cloudbase-d9gyqv3ea400083a0`。
- [ ] 开发者工具 + 真机按验收清单逐项验证：建档、自由训练、模板训练、保存后历史可见、分享卡保存相册、断网草稿补传、iOS/Android 无横向滚动、底部 Tab 不遮挡。
- [ ] 全部通过后，切回 `master` 合入并评估是否上传新版本（默认不上线，等待用户确认）。

```bash
git commit -am "chore: 数据库初始化与部署记录"
```

---

## Self-Review

- Spec 覆盖：6 页、4 集合、5 云函数、标准数据、分享卡、真机适配、容错、测试均映射到 Task 1–12。
- 占位符：无 TBD/TODO；Task 2 的动作清单沿用现有 `exercises.js` 明确列出的 12 个动作。
- 类型一致性：Set 统一 `{reps, weight}`；Exercise `pcts` 结构统一；`stats` 输出 `week/trend/prs/recent` 与 Task 9 消费一致。
