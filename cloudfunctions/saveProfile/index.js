const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const p = event.profile || {};
  const bad = (p.age < 6 || p.age > 100) ||
    (p.heightCm < 80 || p.heightCm > 250) ||
    (p.weightKg < 20 || p.weightKg > 300) ||
    (p.gender !== 'male' && p.gender !== 'female') ||
    !p.goal || !(p.frequency >= 2 && p.frequency <= 7);
  if (bad) return { ok: false, error: '资料校验失败' };

  const users = db.collection('users');
  const found = await users.where({ openid: OPENID }).limit(1).get();
  if (!found.data.length) return { ok: false, error: '用户不存在,请重新登录' };

  const doc = found.data[0];
  const update = {
    gender: p.gender,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    goal: p.goal,
    frequency: p.frequency,
    metrics: p.metrics || null,
    updatedAt: db.serverDate()
  };
  await users.doc(doc._id).update({ data: update });
  return { ok: true, data: Object.assign({}, doc, update) };
};
