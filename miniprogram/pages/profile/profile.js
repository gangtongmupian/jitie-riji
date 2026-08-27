const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const standards = require('../../utils/standards');
const share = require('../../utils/share');
const config = require('../../config');

Page({
  data: {
    profile: null,
    metrics: null,
    inviteCount: 0,
    rewardUnlocked: false,
    remindEnabled: false,
    showRemind: !!config.TRAIN_REMIND_TMPL,
    showGroup: !!config.GROUP_QR,
    showContact: !!config.SERVICE_WECHAT
  },
  onShow() {
    share.enableShareMenu();
    const profile = storage.getProfile();
    if (!profile || !profile.gender) {
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.setData({ profile, remindEnabled: !!(profile.remindEnabled) });
    this.setMetrics(profile);
    cloud.ensureLogin().then((user) => {
      if (user && user.gender) {
        const merged = Object.assign({}, profile, user);
        storage.setProfile(merged);
        this.setData({ profile: merged, remindEnabled: !!merged.remindEnabled });
        this.setMetrics(merged);
      }
    }).catch(() => {});
    cloud.getInviteStatus().then((d) => {
      this.setData({ inviteCount: d.inviteCount || 0, rewardUnlocked: !!d.rewardUnlocked });
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
  invite() {
    wx.navigateTo({ url: '/pages/invite/invite' });
  },
  toggleRemind(e) {
    const v = !!e.detail.value;
    if (v && !config.TRAIN_REMIND_TMPL) {
      this.setData({ remindEnabled: false });
      return this.toast('提醒功能准备中，敬请期待');
    }
    if (!v) return this.saveRemind(false);
    wx.requestSubscribeMessage({
      tmplIds: [config.TRAIN_REMIND_TMPL],
      success: (r) => {
        const accepted = r[config.TRAIN_REMIND_TMPL] === 'accept';
        this.setData({ remindEnabled: accepted });
        if (accepted) this.saveRemind(true);
        else this.toast('未授权，无法发送提醒');
      },
      fail: () => {
        this.setData({ remindEnabled: false });
        this.toast('订阅失败，请重试');
      }
    });
  },
  saveRemind(v) {
    const p = storage.getProfile();
    cloud.saveProfile(Object.assign({}, p, { remindEnabled: v })).then(() => {
      const merged = Object.assign({}, storage.getProfile(), { remindEnabled: v });
      storage.setProfile(merged);
      wx.showToast({ title: v ? '已开启训练提醒' : '已关闭训练提醒', icon: 'none' });
    }).catch(() => {
      this.setData({ remindEnabled: !v });
      this.toast('保存失败，请重试');
    });
  },
  joinGroup() {
    if (!config.GROUP_QR) return;
    wx.previewImage({ urls: [config.GROUP_QR] });
  },
  contact() {
    if (!config.SERVICE_WECHAT) return;
    wx.setClipboardData({
      data: config.SERVICE_WECHAT,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'none' })
    });
  },
  about() {
    wx.showModal({
      title: '关于牛来举铁',
      content: '记录每次训练，看见进步，分享成果。\n\n动作演示插画来自 Bryl Lim / Everkinetic 的 Workout Guide（CC BY-SA 4.0），在此致谢。',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  privacy() {
    wx.showModal({
      title: '隐私说明',
      content: '本小程序仅收集实现功能所必需的信息（性别、年龄、身高、体重、健身目标、训练记录、头像），用于记录训练与统计，不对外共享。可通过「注销账号」永久删除云端全部数据。',
      showCancel: false
    });
  },
  logout() {
    wx.showModal({
      title: '注销账号',
      content: '注销后将永久删除云端全部数据（档案、训练记录、邀请关系、头像），不可恢复。确定继续吗？',
      confirmColor: '#e03131',
      success: (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '注销中' });
        cloud.deleteAccount().then(() => {
          wx.hideLoading();
          storage.clearAllLocal();
          wx.reLaunch({ url: '/pages/onboarding/onboarding' });
          wx.showToast({ title: '已注销', icon: 'success' });
        }).catch(() => {
          wx.hideLoading();
          this.toast('注销失败，请稍后重试');
        });
      }
    });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  },
  onShareAppMessage() {
    return share.appMessage('牛来举铁 · 科学健身记录', '/pages/profile/profile');
  },
  onShareTimeline() {
    return share.timeline('牛来举铁 · 科学健身记录');
  }
});
