App({
  globalData: {
    profile: null,
    catalog: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      // 若账号下有多个云环境,请把 env 设为你的环境 ID,例如 env: 'jitie-prod';
      // 省略 env 时自动使用默认环境
      traceUser: true
    });
  }
});
