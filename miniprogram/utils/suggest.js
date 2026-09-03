// 「下一次训练建议」规则引擎（非 AI）：
// 基于上次训练每个动作的 组数/重量/次数，给出「保持重量拉满次数」或「加重」的建议，
// 并给出下次训练的聚焦部位轮换。

const FOCUS = ['胸', '背', '腿', '臀腿', '肩', '手臂', '核心'];

function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function setWeight(s) {
  return num(s && (s.weightKg != null ? s.weightKg : s.weight));
}

function setReps(s) {
  return num(s && s.reps);
}

function roundWeight(w) {
  return Math.round(w * 2) / 2; // 0.5kg 档
}

// 每个动作：上次重量/次数 → 本次建议
function adviceFor(ex) {
  const sets = (ex && ex.sets) || [];
  const reps = sets.map(setReps).filter(Boolean);
  const weights = sets.map(setWeight).filter(Boolean);
  const lastWeight = weights.length ? Math.max(...weights) : 0;
  const lastReps = reps.length ? reps[reps.length - 1] : 0;
  // 简单判据：至少 3 组且每组都达标（组数≥8 且最后组≥8）→ 尝试加重
  const complete = sets.length >= 3 && reps.length >= 3 && reps.every((r) => r >= 8);
  const nextWeight = complete ? roundWeight(lastWeight + 2.5) : roundWeight(lastWeight);
  const targetReps = complete ? Math.min(12, (lastReps && lastReps + 1) || 10) : Math.max(8, lastReps);
  return {
    name: ex.name,
    last: lastWeight ? (lastWeight + 'kg × ' + (reps.join('/') || lastReps)) : (reps.join('/') || '—'),
    weight: nextWeight,
    targetReps,
    increased: complete && nextWeight > lastWeight
  };
}

// 下一次聚焦部位：轮换到上次没练的部位
function nextFocus(workout) {
  const parts = new Set((workout && workout.exercises || []).map((e) => e.bodyPart));
  const missed = FOCUS.filter((f) => !parts.has(f));
  return (missed.length ? missed[0] : '全身') + ' 为主';
}

function suggest(workout) {
  if (!workout || !(workout.exercises || []).length) {
    return { focus: '今天开始', items: [], hasLast: false };
  }
  return {
    focus: nextFocus(workout),
    items: (workout.exercises || []).slice(0, 4).map(adviceFor),
    hasLast: true
  };
}

module.exports = { suggest, adviceFor, nextFocus };
