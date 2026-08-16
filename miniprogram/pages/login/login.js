const { call } = require('../../utils/cloud');

Page({
  data: {
    agreed: false
  },
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },
  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中' });
    try {
      const data = await call('login');
      getApp().globalData.profile = data.profile;
      wx.hideLoading();
      wx.reLaunch({
        url: data.isNew ? '/pages/onboarding/onboarding' : '/pages/home/home'
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
  },
  onStandard() {
    wx.showModal({
      title: '标准说明',
      content: '体质指标按中国标准计算:BMI 分级(<18.5 偏瘦 / 18.5–23.9 正常 / 24–27.9 超重 / ≥28 肥胖),体脂与基础代谢按性别区分,力量参考按性别与体重给出区间。',
      showCancel: false
    });
  }
});
