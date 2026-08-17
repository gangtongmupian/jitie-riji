const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection('users');

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const found = await users.where({ openid: OPENID }).limit(1).get();
  let user = found.data[0] || null;
  if (!user) {
    const now = db.serverDate();
    const doc = { openid: OPENID, createdAt: now, updatedAt: now };
    const res = await users.add({ data: doc });
    user = { _id: res._id, ...doc };
  }
  return { ok: true, data: { openid: OPENID, user } };
};
