const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const workouts = db.collection('workouts');

function totalSets(exercises) {
  return exercises.reduce((n, ex) => n + (ex.sets ? ex.sets.length : 0), 0);
}
function totalVolume(exercises) {
  return exercises.reduce((sum, ex) =>
    sum + (ex.sets || []).reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0);
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { date, startedAt, endedAt, mode, templateId, templateName, exercises, calories } = event;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: '日期无效' };
  if (!Array.isArray(exercises) || exercises.length === 0) return { ok: false, error: '请至少记录一个动作' };
  if (mode !== 'free' && mode !== 'template') return { ok: false, error: '训练模式无效' };
  const caloriesNum = Number(calories) || 0;
  if (caloriesNum < 0 || caloriesNum > 10000) return { ok: false, error: '热量数值无效' };

  const now = Date.now();
  const started = Number(startedAt) || now;
  const ended = Number(endedAt) || now;
  const durationSec = Math.max(0, Math.round((ended - started) / 1000));

  const doc = {
    openid: OPENID,
    date,
    startedAt: started,
    endedAt: ended,
    durationSec,
    calories: caloriesNum,
    mode,
    exercises,
    totalSets: totalSets(exercises),
    totalVolume: totalVolume(exercises),
    createdAt: db.serverDate()
  };
  if (templateId) doc.templateId = templateId;
  if (templateName) doc.templateName = templateName;

  const res = await workouts.add({ data: doc });
  return { ok: true, data: { _id: res._id, totalSets: doc.totalSets, totalVolume: doc.totalVolume } };
};
