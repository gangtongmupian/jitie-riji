const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const standards = require('../../utils/standards');

Page({
  data: {
    profile: null,
    metrics: null
  },
  onShow() {
    const profile = storage.getProfile();
    if (!profile || !profile.gender) {
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.setData({ profile });
    this.setMetrics(profile);
    cloud.ensureLogin().then((user) => {
      if (user && user.gender) {
        const merged = Object.assign({}, profile, user);
        storage.setProfile(merged);
        this.setData({ profile: merged });
        this.setMetrics(merged);
      }
    }).catch(() => {});
  },
  setMetrics(p) {
    const bmiValue = p.bmi != null ? p.bmi : standards.bmi(p.weightKg, p.heightCm);
    const level = p.bmiLevel || standards.bmiLevel(bmiValue);
    this.setData({
      metrics: {
        bmi: bmiValue,
        bmiLevelLabel: standards.bmiLevelLabel(level),
        bodyFatRef: p.bodyFatRef || standards.bodyFatRange(p.gender, level),
        bmr: p.bmr != null ? p.bmr : standards.bmr(p.gender, p.age, p.heightCm, p.weightKg)
      }
    });
  },
  edit() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding?edit=1' });
  },
  about() {
    wx.showModal({ title: '关于牛来举铁', content: '记录每次训练，看见进步，分享成果。', showCancel: false });
  },
  privacy() {
    wx.showModal({
      title: '隐私说明',
      content: '本小程序仅收集实现功能所必需的信息（性别、年龄、身高、体重、健身目标），用于计算体质指标与推荐训练重量，不对外共享。',
      showCancel: false
    });
  },
  logout() {
    wx.showModal({
      title: '注销账号',
      content: '注销后将清除本地资料，云端数据按 openid 保留。确定继续吗？',
      confirmColor: '#e03131',
      success: (r) => {
        if (r.confirm) {
          storage.clearProfile();
          wx.reLaunch({ url: '/pages/onboarding/onboarding' });
        }
      }
    });
  }
});
