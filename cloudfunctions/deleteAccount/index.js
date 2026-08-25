// 注销账号：删除该用户云端全部数据（档案、训练记录、邀请关系、头像文件）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function removeAll(collection, where) {
  // 服务端 where().remove() 单次最多删除 1000 条，循环直到删完
  for (let i = 0; i < 10; i++) {
    const res = await db.collection(collection).where(where).remove();
    const removed = res.stats && res.stats.removed ? res.stats.removed : 0;
    if (removed === 0) break;
  }
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { ok: false, error: '未登录' };

  // 删除头像文件（不阻断注销流程）
  try {
    const me = (await db.collection('users').where({ openid: OPENID }).limit(1).get()).data[0];
    if (me && me.avatarFileID) {
      await cloud.deleteFile({ fileList: [me.avatarFileID] });
    }
  } catch (e) { /* 忽略 */ }

  await removeAll('workouts', { openid: OPENID });
  await removeAll('invites', { inviter: OPENID });
  await removeAll('invites', { invitee: OPENID });
  await removeAll('users', { openid: OPENID });

  return { ok: true, data: { deleted: true } };
};
