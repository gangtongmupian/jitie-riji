const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeWorkout, isNewPR } = require('../miniprogram/utils/stats');

test('summarizeWorkout: 组数与总容量', () => {
  const exercises = [
    { sets: [{ weightKg: 60, reps: 10 }, { weightKg: 60, reps: 8 }] },
    { sets: [{ weightKg: 45, reps: 12 }] }
  ];
  assert.deepEqual(summarizeWorkout(exercises), { sets: 3, volumeKg: 1668 });
});

test('isNewPR: 空记录/更高/更低', () => {
  assert.equal(isNewPR(null, 60), true);
  assert.equal(isNewPR(60, 65), true);
  assert.equal(isNewPR(60, 55), false);
  assert.equal(isNewPR(60, 60), false);
});
