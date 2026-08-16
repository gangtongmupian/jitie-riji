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
