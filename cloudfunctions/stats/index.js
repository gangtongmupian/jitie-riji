const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const workouts = db.collection('workouts');
const users = db.collection('users');
const streak = require('./streak');

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

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const res = await workouts.where({ openid: OPENID }).limit(1000).get();
  // 按 开始时间+组数+容量 去重,防止历史重复提交影响"训练次数"统计
  const seenWorkouts = new Set();
  const list = res.data
    .filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.date || ''))
    .filter((w) => {
      const started = Number(w.startedAt) || 0;
      if (!started) return true;
      const key = started + '|' + (w.totalSets || 0) + '|' + (w.totalVolume || 0);
      if (seenWorkouts.has(key)) return false;
      seenWorkouts.add(key);
      return true;
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const userRes = await users.where({ openid: OPENID }).limit(1).get();
  const weightKg = Number(userRes.data[0] && userRes.data[0].weightKg) || 0;
  const calOf = (w) => (Number(w.calories) > 0 ? Number(w.calories) : estimateCalories(weightKg, w.durationSec, w.totalVolume));

  // 按日查询：返回当天训练明细（训练日历点击）
  if (event.date && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
    const day = list.filter((w) => w.date === event.date).map((w) => Object.assign({}, w, { calories: calOf(w) }));
    return { ok: true, data: { day } };
  }

  const now = new Date();
  const ws = weekStart(now);
  const we = new Date(ws.getTime() + 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const week = { count: 0, durationSec: 0, volume: 0, calories: 0 };
  const month = { count: 0, volume: 0, calories: 0 };
  const year = { count: 0, volume: 0, calories: 0 };

  list.forEach((w) => {
    const t = new Date(w.date + 'T00:00:00');
    const cal = calOf(w);
    if (t >= ws && t < we) {
      week.count += 1;
      week.durationSec += (w.durationSec || 0);
      week.volume += (w.totalVolume || 0);
      week.calories += cal;
    }
    if (t >= monthStart) {
      month.count += 1;
      month.volume += (w.totalVolume || 0);
      month.calories += cal;
    }
    if (t >= yearStart) {
      year.count += 1;
      year.volume += (w.totalVolume || 0);
      year.calories += cal;
    }
  });

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
  return {
    ok: true,
    data: {
      week,
      month,
      year,
      trend: buckets,
      prs: prMap,
      recent: list.slice(0, 5).map((w) => Object.assign({}, w, { calories: calOf(w) })),
      dates,
      streak: streak.currentStreak(dates),
      maxStreak: streak.maxStreak(dates),
      totalWorkouts: list.length,
      achievements: streak.achievements(dates, list.reduce((s, w) => s + (w.totalSets || 0), 0), list.reduce((s, w) => s + (w.totalVolume || 0), 0))
    }
  };
};
