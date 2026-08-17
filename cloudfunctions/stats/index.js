const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // 周一为 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const scope = (event && event.scope) || 'home';
  const workouts = db.collection('workouts');
  const prs = db.collection('prs');
  const out = {};

  if (scope === 'home' || scope === 'all') {
    const weekStart = startOfWeek(new Date());
    const week = await workouts.where({ openid: OPENID, createdAt: _.gte(weekStart) }).limit(1000).get();
    let weekCount = 0, weekMinutes = 0, weekVolume = 0;
    week.data.forEach((w) => {
      weekCount += 1;
      weekMinutes += w.durationMin || 0;
      weekVolume += w.totalVolumeKg || 0;
    });
    const recent = await workouts.where({ openid: OPENID }).orderBy('createdAt', 'desc').limit(3).get();
    out.home = {
      weekCount, weekMinutes, weekVolume,
      recent: recent.data.map((w) => ({
        id: w._id, templateName: w.templateName, durationMin: w.durationMin,
        totalSets: w.totalSets, totalVolumeKg: w.totalVolumeKg, createdAt: w.createdAt
      }))
    };
  }

  if (scope === 'history' || scope === 'all') {
    const year = (event && event.year) || new Date().getFullYear();
    const month = (event && event.month) || new Date().getMonth() + 1;
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);
    const monthWorkouts = await workouts.where({ openid: OPENID, createdAt: _.gte(from).and(_.lt(to)) }).limit(1000).get();
    const daySet = {};
    monthWorkouts.data.forEach((w) => {
      const d = new Date(w.createdAt);
      const key = d.getDate();
      daySet[key] = true;
    });
    // 近 8 周容量
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const ws = startOfWeek(now);
      const a = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() - i * 7);
      const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7);
      const got = await workouts.where({ openid: OPENID, createdAt: _.gte(a).and(_.lt(b)) }).limit(1000).get();
      weeks.push({ weekStart: a.getTime(), volumeKg: got.data.reduce((s, x) => s + (x.totalVolumeKg || 0), 0) });
    }
    const prList = await prs.where({ openid: OPENID }).orderBy('updatedAt', 'desc').limit(50).get();
    out.history = { days: daySet, weeks, prs: prList.data };
  }

  return { ok: true, data: out };
};
