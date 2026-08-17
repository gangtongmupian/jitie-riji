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
