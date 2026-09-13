const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../miniprogram/data/exercises');
const templates = require('../miniprogram/data/templates');

const PARTS = ['胸', '背', '腿', '臀腿', '肩', '手臂', '核心', '有氧', '拉伸'];

test('exercises: id 唯一且字段合法', () => {
  const ids = exercises.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, '存在重复 id');
  assert.ok(exercises.length >= 300, '动作数量应为 workout-guide 全量(302)');
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

test('exercises: 每个动作都有中文名与英文术语', () => {
  for (const e of exercises) {
    assert.ok(e.enName, `${e.id} 缺少英文术语`);
    assert.ok(!/[A-Za-z]/.test(e.name.replace(/[TVY]/g, '')), `${e.id} 中文名含未翻译英文: ${e.name}`);
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
