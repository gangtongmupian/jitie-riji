// 训练提醒：每日定时执行，给当天尚未训练且已开启提醒的用户发送订阅消息
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection('users');
const workouts = db.collection('workouts');

// 订阅消息模板 ID（微信公众平台「订阅消息」）
const TEMPLATE_ID = 'c3xdncU-7EZv4m47saS7f83x9AH4rvGBBpOAvMyQjHQ';

function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

exports.main = async () => {
  if (!TEMPLATE_ID) return { ok: false, reason: '未配置订阅消息模板' };
  const today = isoDate(new Date());
  const res = await users.where({ remindEnabled: true }).limit(100).get();
  const sent = { ok: 0, fail: 0, skipped: 0 };
  for (const u of res.data) {
    const done = await workouts.where({ openid: u.openid, date: today }).limit(1).get();
    if (done.data.length) { sent.skipped += 1; continue; }
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: u.openid,
        templateId: TEMPLATE_ID,
        page: 'pages/record/record',
        data: {
          thing1: { value: '今天还没有训练，来打卡吧' },
          time2: { value: today + ' 20:00' }
        }
      });
      sent.ok += 1;
    } catch (e) {
      sent.fail += 1;
    }
  }
  return { ok: true, data: sent };
};
