function totalSets(exercises) {
  return exercises.reduce((n, ex) => n + (ex.sets ? ex.sets.length : 0), 0);
}

function totalVolume(exercises) {
  return exercises.reduce((sum, ex) =>
    sum + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
}

// 力量训练热量预估：MET × 体重(kg) × 时长(h)，按训练容量微调强度
function estimateCalories(weightKg, durationSec, totalVolume) {
  if (!weightKg || !durationSec) return 0;
  const hours = durationSec / 3600;
  const volumeT = (totalVolume || 0) / 1000;
  let met = 4.5;
  if (volumeT >= 8) met += 1.0;
  else if (volumeT >= 5) met += 0.5;
  else if (volumeT < 2) met -= 0.5;
  met = Math.max(3, Math.min(7, met));
  return Math.round(weightKg * hours * met);
}

function weekStart(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weeklySummary(workouts, now = new Date()) {
  const start = weekStart(now);
  const end = new Date(start.getTime() + 7 * 86400000);
  const inWeek = workouts.filter((w) => {
    const t = new Date(w.date + 'T00:00:00');
    return t >= start && t < end;
  });
  return {
    count: inWeek.length,
    durationSec: inWeek.reduce((s, w) => s + (w.durationSec || 0), 0),
    volume: inWeek.reduce((s, w) => s + (w.totalVolume || 0), 0)
  };
}

function weeklyTrend(workouts, now = new Date(), weeks = 8) {
  const start = weekStart(now);
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ weekStart: isoDate(new Date(start.getTime() - i * 7 * 86400000)), count: 0, volume: 0 });
  }
  workouts.forEach((w) => {
    const k = isoDate(weekStart(new Date(w.date + 'T00:00:00')));
    const b = buckets.find((x) => x.weekStart === k);
    if (b) { b.count += 1; b.volume += (w.totalVolume || 0); }
  });
  return buckets;
}

function prs(workouts) {
  const map = {};
  workouts.forEach((w) => (w.exercises || []).forEach((ex) => {
    if (!map[ex.exerciseId]) {
      map[ex.exerciseId] = { name: ex.name, bestWeight: 0, bestWeightDate: '', bestVolume: 0, bestVolumeDate: '' };
    }
    const rec = map[ex.exerciseId];
    (ex.sets || []).forEach((set) => {
      const weight = set.weight || 0;
      const vol = weight * (set.reps || 0);
      if (weight > rec.bestWeight) { rec.bestWeight = weight; rec.bestWeightDate = w.date; }
      if (vol > rec.bestVolume) { rec.bestVolume = vol; rec.bestVolumeDate = w.date; }
    });
  }));
  return map;
}

module.exports = { totalSets, totalVolume, estimateCalories, weeklySummary, weeklyTrend, prs };
