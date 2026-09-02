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

// 记录「要从分享页分享的某次训练历史」，避免被 lastWorkout 覆盖
function setShareTarget(workout) {
  wx.setStorageSync('jitie.shareWorkout', workout);
}

function clearShareTarget() {
  try { wx.removeStorageSync('jitie.shareWorkout'); } catch (e) {}
}

module.exports = { enableShareMenu, appMessage, timeline, setShareTarget, clearShareTarget };
