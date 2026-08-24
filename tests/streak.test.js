const { currentStreak, maxStreak, achievements } = require('../cloudfunctions/stats/streak');
const test = require('node:test');
const assert = require('node:assert');

test('currentStreak 今天练过：连续到今天', () => {
  const now = new Date(2026, 7, 24, 15, 0);
  const dates = ['2026-08-24', '2026-08-23', '2026-08-22'];
  assert.equal(currentStreak(dates, now), 3);
});

test('currentStreak 今天没练但昨天练过：连续仍有效', () => {
  const now = new Date(2026, 7, 24, 15, 0);
  const dates = ['2026-08-23', '2026-08-22'];
  assert.equal(currentStreak(dates, now), 2);
});

test('currentStreak 昨天也没练：为 0', () => {
  const now = new Date(2026, 7, 24, 15, 0);
  const dates = ['2026-08-21', '2026-08-20'];
  assert.equal(currentStreak(dates, now), 0);
});

test('maxStreak 跨多段取最长', () => {
  const dates = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-10', '2026-08-11'];
  assert.equal(maxStreak(dates), 3);
});

test('achievements 阈值判定', () => {
  const a = achievements(['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'], 40, 5000);
  const map = {};
  a.forEach((x) => { map[x.id] = x.done; });
  assert.equal(map.first, true);
  assert.equal(map.streak3, true);
  assert.equal(map.streak7, false);
  assert.equal(map.sets100, false);
  assert.equal(map.ton10, false);
});
