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
