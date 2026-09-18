const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../miniprogram/data/exercises');
const templates = require('../miniprogram/data/templates');

const PARTS = ['有氧', '胸', '背', '腿', '肩', '手臂', '核心', '臀腿'];

test('exercises: id 唯一且字段合法', () => {
  const ids = exercises.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, '存在重复 id');
  assert.ok(exercises.length >= 80, '动作数量应不少于 80(含 ROSEN 固定器械)');
  assert.ok(exercises.filter((e) => e.id.indexOf('rosen-') === 0).length >= 20, 'ROSEN 固定器械应不少于 20 台');
  assert.ok(exercises.filter((e) => e.id.indexOf('fwd-') === 0).length >= 70, 'FORWARD 固定器械应不少于 70 台');
  for (const e of exercises) {
    assert.ok(e.name, `${e.id} 缺少 name`);
    assert.ok(PARTS.includes(e.bodyPart), `${e.id} 部位非法: ${e.bodyPart}`);
    assert.ok(e.equipment, `${e.id} 缺少 equipment`);
    if (e.weighted) {
      assert.ok(e.pcts && e.pcts.male && e.pcts.female, `${e.id} 负重动作缺少 pcts`);
      assert.ok(e.pcts.male.novice && e.pcts.male.novice.length === 2, `${e.id} pcts.male.novice 格式错误`);
    }
  }
});

test('FORWARD 器械型号对照完整（每个动作都有型号图）', () => {
  const machines = require('../miniprogram/data/forward-machines');
  const fwd = exercises.filter((e) => e.id.indexOf('fwd-') === 0);
  for (const e of fwd) {
    const m = machines[e.id];
    assert.ok(m && m.model, `${e.id} 缺少 FORWARD 型号对照`);
    assert.ok(m.image && m.image.indexOf('/images/forward/') === 0, `${e.id} 缺少器械图路径`);
  }
});

test('ROSEN 扩充机型完整（型号 + 官图 + 动画映射 + 说明）', () => {
  const machines = require('../miniprogram/data/rosen-machines');
  const motion = require('../miniprogram/utils/motion');
  const details = require('../miniprogram/data/exercise-details');
  const fs = require('fs');
  const path = require('path');
  const ADDED = ['HM-1007', 'HM-1008', 'HM-1010', 'HM-1013', 'HM-1018', 'HM-1029', 'HM-1035',
    'HM-1047', 'HM-1048', 'HM-3001', 'HM-3002', 'HM-3004', 'HM-3006', 'HM-3007', 'HM-3008',
    'HM-3009', 'HM-3010', 'HM-3011', 'HM-3015', 'HM-3016', 'HM-3017', 'HM-3018', 'HM-3022'];
  const byModel = {};
  exercises.filter((e) => e.rosen).forEach((e) => { byModel[e.rosen] = e; });
  ADDED.forEach((m) => {
    const e = byModel[m];
    assert.ok(e, '缺少 ROSEN 机型 ' + m);
    assert.ok(motion.ANIM_BY_ID[e.id], m + ' 缺动画映射');
    const mm = machines[e.id];
    assert.ok(mm && mm.model === m, m + ' 缺型号对照');
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'miniprogram', mm.image.replace(/^\//, ''))), m + ' 缺器械图');
    const d = details.detailsOf(e.id);
    assert.ok(d && d.targets && d.steps, m + ' 缺演示说明');
  });
});

test('有氧分类完整（计时类动作，含专业名词）', () => {
  const cardio = exercises.filter((e) => e.bodyPart === '有氧');
  assert.ok(cardio.length >= 10, '有氧动作应不少于 10 个');
  cardio.forEach((e) => {
    assert.equal(e.cardio, true, e.id + ' 缺少 cardio 标记');
    assert.equal(e.weighted, false, e.id + ' 有氧动作不应带重量推荐');
    assert.ok(e.enName, e.id + ' 缺少英文术语');
    assert.ok(e.py, e.id + ' 缺少拼音检索字段');
  });
  const names = cardio.map((e) => e.name);
  ['跑步', '慢走', '爬坡走', '爬楼梯机', '椭圆机', '农夫行走'].forEach((n) => {
    assert.ok(names.indexOf(n) >= 0, '缺少有氧动作: ' + n);
  });
});

test('templates: 引用的动作 id 全部存在', () => {
  const ids = new Set(exercises.map((e) => e.id));
  for (const t of templates) {
    assert.ok(t.id && t.name, '模板缺少 id/name');
    for (const x of t.exercises) {
      assert.ok(ids.has(x.exerciseId), `模板 ${t.id} 引用了不存在的动作 ${x.exerciseId}`);
    }
  }
});
