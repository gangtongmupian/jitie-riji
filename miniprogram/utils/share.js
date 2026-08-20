// 分享能力统一封装：右上角菜单「转发 / 分享到朋友圈」
function enableShareMenu() {
  if (!wx.showShareMenu) return;
  try {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
  } catch (e) { /* 低版本基础库忽略 */ }
}

function appMessage(title, path) {
  return { title, path };
}

function timeline(title) {
  return { title };
}

module.exports = { enableShareMenu, appMessage, timeline };
