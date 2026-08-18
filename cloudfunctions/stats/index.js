const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const workouts = db.collection('workouts');

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

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const res = await workouts.where({ openid: OPENID }).limit(1000).get();
  const list = res.data
    .filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.date || ''))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const now = new Date();
  const ws = weekStart(now);
  const we = new Date(ws.getTime() + 7 * 86400000);
  const inWeek = list.filter((w) => {
    const t = new Date(w.date + 'T00:00:00');
    return t >= ws && t < we;
  });
  const week = {
    count: inWeek.length,
    durationSec: inWeek.reduce((s, w) => s + (w.durationSec || 0), 0),
    volume: inWeek.reduce((s, w) => s + (w.totalVolume || 0), 0),
    calories: inWeek.reduce((s, w) => s + (w.calories || 0), 0)
  };

  const buckets = [];
  for (let i = 7; i >= 0; i--) {
    buckets.push({ weekStart: isoDate(new Date(ws.getTime() - i * 7 * 86400000)), count: 0, volume: 0 });
  }
  list.forEach((w) => {
    const k = isoDate(weekStart(new Date(w.date + 'T00:00:00')));
    const b = buckets.find((x) => x.weekStart === k);
    if (b) { b.count += 1; b.volume += (w.totalVolume || 0); }
  });

  const prMap = {};
  list.forEach((w) => (w.exercises || []).forEach((ex) => {
    if (!prMap[ex.exerciseId]) {
      prMap[ex.exerciseId] = { name: ex.name, bestWeight: 0, bestWeightDate: '', bestVolume: 0, bestVolumeDate: '' };
    }
    const rec = prMap[ex.exerciseId];
    (ex.sets || []).forEach((s) => {
      const wt = Number(s.weight) || 0;
      const vol = wt * (Number(s.reps) || 0);
      if (wt > rec.bestWeight) { rec.bestWeight = wt; rec.bestWeightDate = w.date; }
      if (vol > rec.bestVolume) { rec.bestVolume = vol; rec.bestVolumeDate = w.date; }
    });
  }));

  const dates = Array.from(new Set(list.map((w) => w.date).filter(Boolean)));
  return { ok: true, data: { week, trend: buckets, prs: prMap, recent: list.slice(0, 5), dates } };
};
