const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const col = db.collection('users');
  const found = await col.where({ openid: OPENID }).limit(1).get();
  if (found.data.length > 0) {
    return { ok: true, data: { isNew: false, profile: found.data[0] } };
  }
  const profile = {
    openid: OPENID,
    gender: null,
    age: null,
    heightCm: null,
    weightKg: null,
    goal: null,
    frequency: null,
    metrics: null,
    createdAt: db.serverDate()
  };
  const res = await col.add({ data: profile });
  return { ok: true, data: { isNew: true, profile: Object.assign({ _id: res._id }, profile) } };
};
