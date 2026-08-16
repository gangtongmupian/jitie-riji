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
