Page({
  data: {
    profile: null,
    metrics: null
  },
  onShow() {
    const profile = getApp().globalData.profile;
    this.setData({ profile, metrics: profile && profile.metrics });
  },
  edit() {
    wx.showToast({ title: '资料可随时修改并重算指标', icon: 'none' });
  },
  recalc() {
    wx.showToast({ title: '已重新计算指标', icon: 'none' });
  },
  show(e) {
    wx.showToast({ title: e.currentTarget.dataset.msg, icon: 'none' });
  }
});
