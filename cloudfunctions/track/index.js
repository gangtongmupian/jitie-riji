const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 轻量漏斗埋点：把 { event, source, meta } 写入 events 集合，失败不阻塞主流程
exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const ev = String(event.event || 'unknown').slice(0, 40);
  const source = String(event.source || 'direct').slice(0, 20);
  const meta = event.meta || {};
  const ts = event.ts || Date.now();
  try {
    const res = await db.collection('events').add({
      data: {
        openid: OPENID,
        event: ev,
        source,
        ts,
        meta,
        createdAt: db.serverDate()
      }
    });
    return { ok: true, data: { _id: res._id } };
  } catch (e) {
    // 集合不存在时自动创建后再写入一次
    try {
      await db.createCollection('events');
      const res = await db.collection('events').add({
        data: { openid: OPENID, event: ev, source, ts, meta, createdAt: db.serverDate() }
      });
      return { ok: true, data: { _id: res._id } };
    } catch (e2) {
      return { ok: false, error: 'track failed' };
    }
  }
};
