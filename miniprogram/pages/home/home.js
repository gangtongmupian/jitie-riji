const { call } = require('../../utils/cloud');
const { formatVolume, formatDuration, formatDate } = require('../../utils/format');

Page({
  data: {
    greeting: '你好',
    weekCount: 0,
    weekDuration: '0 分钟',
    weekVolume: '0kg',
    recent: [],
    newPr: null
  },
  onShow() {
    const hour = new Date().getHours();
    this.setData({
      greeting: hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
    });
    this.loadHome();
  },
  async loadHome() {
    try {
      const data = await call('stats', { scope: 'home' });
      const h = data.home;
      const recent = h.recent.map((w) => ({
        id: w.id,
        title: formatDate(w.createdAt) + ' · ' + w.templateName,
        duration: formatDuration(w.durationMin),
        detail: w.totalSets + ' 组 · ' + formatVolume(w.totalVolumeKg)
      }));
      this.setData({
        weekCount: h.weekCount,
        weekDuration: formatDuration(h.weekMinutes),
        weekVolume: formatVolume(h.weekVolume),
        recent
      });
      this.checkPr();
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  checkPr() {
    const last = getApp().globalData.lastWorkout || {};
    const list = last.newPrs || [];
    if (!list.length) {
      this.setData({ newPr: null });
      return;
    }
    const first = list[0];
    this.setData({
      newPr: { text: first.name + ' ' + first.weightKg + 'kg', time: '刚刚刷新' }
    });
  },
  goWorkout() {
    wx.navigateTo({ url: '/pages/workout/workout' });
  },
  goHistory() {
    wx.reLaunch({ url: '/pages/history/history' });
  }
});
