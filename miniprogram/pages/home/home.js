const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const format = require('../../utils/format');

Page({
  data: {
    loading: true,
    week: { count: 0, durationSec: 0, volume: 0 },
    weekText: { duration: '0 分钟', volume: '0kg' },
    recent: null
  },
  onShow() {
    const profile = storage.getProfile();
    if (!profile || !profile.gender) {
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.refresh();
  },
  refresh() {
    cloud.getStats().then((data) => {
      const week = data.week || { count: 0, durationSec: 0, volume: 0 };
      const r = data.recent && data.recent[0];
      let recent = null;
      if (r) {
        recent = {
          date: r.date,
          mode: r.mode,
          totalSets: r.totalSets,
          totalVolume: r.totalVolume,
          dateLabel: format.formatDate(r.date),
          volumeText: format.formatVolume(r.totalVolume || 0),
          exerciseCount: (r.exercises || []).length
        };
      }
      this.setData({
        loading: false,
        week,
        recent,
        weekText: {
          duration: format.formatDuration(week.durationSec),
          volume: format.formatVolume(week.volume)
        }
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
  start() {
    wx.switchTab({ url: '/pages/record/record' });
  }
});
