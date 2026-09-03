// 漏斗埋点：fire-and-forget，绝不阻塞主流程
const storage = require('./storage');

function sourceOf() {
  return storage.getSource() || (storage.getInviter() ? 'invite' : 'direct');
}

function track(event, meta) {
  // 轻量失败静默，避免影响体验
  return wx.cloud.callFunction({
    name: 'track',
    data: { event, source: sourceOf(), meta: meta || {}, ts: Date.now() }
  }).catch(() => {});
}

module.exports = { track, sourceOf };
