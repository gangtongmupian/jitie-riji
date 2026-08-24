const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const invites = db.collection('invites');
const users = db.collection('users');

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { ok: false, error: '未登录' };
  const countRes = await invites.where({ inviter: OPENID }).count();
  const invitedByRes = await invites.where({ invitee: OPENID }).limit(1).get();
  const me = (await users.where({ openid: OPENID }).limit(1).get()).data[0] || {};
  return {
    ok: true,
    data: {
      inviteCount: (countRes && countRes.total) || 0,
      invitedBy: (invitedByRes.data[0] && invitedByRes.data[0].inviter) || '',
      rewardUnlocked: !!(me.inviteReward || invitedByRes.data.length)
    }
  };
};
