const storage = require('./utils/storage');

App({
  globalData: {
    profile: null,
    catalog: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
      return;
    }
    wx.cloud.init({ env: 'cloudbase-d9gyqv3ea400083a0', traceUser: true });
    this.globalData.profile = storage.getProfile();
    this.flushDraft();
  },
  flushDraft() {
    const draft = storage.loadDraft();
    if (!draft) return;
    const cloud = require('./utils/cloud');
    cloud.saveWorkout(draft).then(() => storage.clearDraft()).catch(() => {});
  }
});
