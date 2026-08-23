const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../miniprogram/data/exercises');
const templates = require('../miniprogram/data/templates');

const PARTS = ['胸', '背', '腿', '肩', '手臂', '核心', '臀腿'];

test('exercises: id 唯一且字段合法', () => {
  const ids = exercises.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, '存在重复 id');
  assert.ok(exercises.length >= 80, '动作数量应不少于 80(含 ROSEN 固定器械)');
  assert.ok(exercises.filter((e) => e.id.indexOf('rosen-') === 0).length >= 20, 'ROSEN 固定器械应不少于 20 台');
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

test('templates: 引用的动作 id 全部存在', () => {
  const ids = new Set(exercises.map((e) => e.id));
  for (const t of templates) {
    assert.ok(t.id && t.name, '模板缺少 id/name');
    for (const x of t.exercises) {
      assert.ok(ids.has(x.exerciseId), `模板 ${t.id} 引用了不存在的动作 ${x.exerciseId}`);
    }
  }
});
