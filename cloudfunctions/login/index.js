const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection('users');
const invites = db.collection('invites');

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const found = await users.where({ openid: OPENID }).limit(1).get();
  let user = found.data[0] || null;
  if (!user) {
    const now = db.serverDate();
    const doc = { openid: OPENID, createdAt: now, updatedAt: now };
    const res = await users.add({ data: doc });
    user = { _id: res._id, ...doc };
  }

  // 邀请绑定：新用户通过好友分享首次进入时，双方解锁进阶计划
  const inviter = (event && typeof event.inviter === 'string' && event.inviter.trim()) || '';
  if (inviter && inviter !== OPENID) {
    const mine = await invites.where({ invitee: OPENID }).limit(1).get();
    if (!mine.data.length) {
      const inviterUser = (await users.where({ openid: inviter }).limit(1).get()).data[0];
      if (inviterUser) {
        await invites.add({ data: { inviter, invitee: OPENID, createdAt: db.serverDate() } });
        await users.doc(inviterUser._id).update({ data: { inviteReward: true, updatedAt: db.serverDate() } });
        user = Object.assign({}, user, { inviteReward: true });
        const selfRes = await users.where({ openid: OPENID }).limit(1).get();
        if (selfRes.data[0]) {
          await users.doc(selfRes.data[0]._id).update({ data: { inviteReward: true, updatedAt: db.serverDate() } });
        }
      }
    } else {
      user = Object.assign({}, user, { inviteReward: true });
    }
  } else if (!user.inviteReward) {
    const mine = await invites.where({ invitee: OPENID }).limit(1).get();
    if (mine.data.length) user = Object.assign({}, user, { inviteReward: true });
  }

  return { ok: true, data: { openid: OPENID, user } };
};
