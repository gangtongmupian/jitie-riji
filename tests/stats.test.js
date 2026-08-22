const test = require('node:test');
const assert = require('node:assert/strict');
const st = require('../miniprogram/utils/stats');

const exercises = [
  { exerciseId: 'bench', name: '杠铃卧推', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 60 }] },
  { exerciseId: 'squat', name: '杠铃深蹲', sets: [{ reps: 12, weight: 45 }] }
];

test('totalSets / totalVolume', () => {
  assert.equal(st.totalSets(exercises), 3);
  assert.equal(st.totalVolume(exercises), 1620);
});

test('estimateCalories 按体重/时长/容量预估', () => {
  assert.equal(st.estimateCalories(70, 2700, 6400), 263);
  assert.equal(st.estimateCalories(0, 2700, 6400), 0);
  assert.equal(st.estimateCalories(70, 0, 6400), 0);
  assert.ok(st.estimateCalories(70, 3600, 20000) > st.estimateCalories(70, 3600, 0));
  assert.ok(st.estimateCalories(70, 3600, 0) >= 70 * 3);
});

test('weeklySummary 只统计本周', () => {
  const now = new Date(2026, 7, 16);
  const workouts = [
    { date: '2026-08-16', durationSec: 1800, totalVolume: 2000 },
    { date: '2026-08-09', durationSec: 1800, totalVolume: 9999 }
  ];
  assert.deepEqual(st.weeklySummary(workouts, now), { count: 1, durationSec: 1800, volume: 2000 });
});

test('weeklyTrend 输出 8 周桶且顺序从旧到新', () => {
  const now = new Date(2026, 7, 16);
  const out = st.weeklyTrend([{ date: '2026-08-16', totalVolume: 100 }], now, 8);
  assert.equal(out.length, 8);
  assert.equal(out[7].volume, 100);
});

test('prs 现算最大重量与最重单次容量', () => {
  const map = st.prs([
    { date: '2026-08-10', exercises: [{ exerciseId: 'bench', name: '杠铃卧推', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 3 }] }] },
    { date: '2026-08-16', exercises: [{ exerciseId: 'bench', name: '杠铃卧推', sets: [{ weight: 65, reps: 10 }] }] }
  ]);
  assert.equal(map.bench.bestWeight, 70);
  assert.equal(map.bench.bestWeightDate, '2026-08-10');
  assert.equal(map.bench.bestVolume, 650);
  assert.equal(map.bench.bestVolumeDate, '2026-08-16');
});
