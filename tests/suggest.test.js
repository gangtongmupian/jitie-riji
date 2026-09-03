const test = require('node:test');
const assert = require('node:assert/strict');
const suggest = require('../miniprogram/utils/suggest');

test('suggest: 无训练 → 开始建议', () => {
  const s = suggest.suggest(null);
  assert.equal(s.focus, '今天开始');
  assert.equal(s.hasLast, false);
  assert.equal(s.items.length, 0);
});

test('suggest: 3组达标 → 建议加重', () => {
  const w = { exercises: [{ name: '卧推', bodyPart: '胸', sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] }] };
  const s = suggest.suggest(w);
  assert.equal(s.hasLast, true);
  assert.equal(s.items[0].increased, true);
  assert.equal(s.items[0].weight, 22.5);
});

test('suggest: 未达标 → 保持重量且目标次数不低于8', () => {
  const w = { exercises: [{ name: '卧推', bodyPart: '胸', sets: [{ weight: 20, reps: 8 }, { weight: 20, reps: 7 }] }] };
  const s = suggest.suggest(w);
  assert.equal(s.items[0].increased, false);
  assert.equal(s.items[0].weight, 20);
  assert.ok(s.items[0].targetReps >= 8);
});

test('suggest: 聚焦部位避开上次练过的', () => {
  const w = { exercises: [{ name: '卧推', bodyPart: '胸', sets: [{ weight: 0, reps: 8 }] }] };
  const s = suggest.suggest(w);
  assert.ok(s.focus.indexOf('胸') < 0);
  assert.equal(s.focus, '背 为主');
});
