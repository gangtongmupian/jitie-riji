const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../miniprogram/data/exercises');
const details = require('../miniprogram/data/exercise-details');

test('every exercise has details with targets/steps/tips', () => {
  for (const ex of exercises) {
    const d = details[ex.id];
    assert.ok(d, '缺少演示说明: ' + ex.id);
    assert.ok(Array.isArray(d.targets) && d.targets.length > 0, ex.id + ' 缺少目标肌群');
    assert.ok(Array.isArray(d.steps) && d.steps.length > 0, ex.id + ' 缺少动作要领');
    assert.ok(Array.isArray(d.tips) && d.tips.length > 0, ex.id + ' 缺少注意事项');
  }
});

test('details ids are consistent with exercises', () => {
  const ids = new Set(exercises.map((e) => e.id));
  Object.keys(details).forEach((id) => assert.ok(ids.has(id), '未知动作 id: ' + id));
});
