// 分享能力统一封装：右上角菜单「转发 / 分享到朋友圈」
const storage = require('./storage');

function enableShareMenu() {
  if (!wx.showShareMenu) return;
  try {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
  } catch (e) { /* 低版本基础库忽略 */ }
}

function inviterQuery() {
  const p = storage.getProfile();
  const oid = (p && p.openid) || storage.getInviter();
  return oid ? 'inviter=' + oid : '';
}

function appMessage(title, path) {
  const q = inviterQuery();
  return { title, path: q ? (path + (path.indexOf('?') >= 0 ? '&' : '?') + q) : path };
}

function timeline(title) {
  const q = inviterQuery();
  return q ? { title, query: q } : { title };
}

module.exports = { enableShareMenu, appMessage, timeline };
