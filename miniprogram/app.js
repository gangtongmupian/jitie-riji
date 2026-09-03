const storage = require('./utils/storage');

App({
  globalData: {
    profile: null,
    catalog: null
  },
  onLaunch(options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
      return;
    }
    wx.cloud.init({ env: 'cloudbase-d9gyqv3ea400083a0', traceUser: true });
    this.globalData.profile = storage.getProfile();
    // 来源追踪：search / invite / share / direct
    const q = (options && (options.query || {})) || {};
    const rawSource = (options && options.scene != null) ? String(options.scene) : (q.inviter ? 'invite' : (q.source || ''));
    const s = decodeURIComponent(rawSource || '');
    const source = s.indexOf('search') >= 0 ? 'search' : (s.indexOf('invite') >= 0 || q.inviter ? 'invite' : (s.indexOf('share') >= 0 ? 'share' : 'direct'));
    storage.setSource(source);
    const track = require('./utils/track');
    track.track('app_open');
    this.flushDraft();
  },
  flushDraft() {
    const draft = storage.loadDraft();
    if (!draft) return;
    const cloud = require('./utils/cloud');
    cloud.saveWorkout(draft).then(() => storage.clearDraft()).catch(() => {});
  }
});
