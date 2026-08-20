const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const format = require('../../utils/format');
const share = require('../../utils/share');

Page({
  data: {
    loading: true,
    week: { count: 0, durationSec: 0, volume: 0 },
    weekText: { duration: '0 分钟', calories: '0 kcal' },
    recent: null
  },
  onShow() {
    share.enableShareMenu();
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
        const calories = Number(r.calories) || 0;
        recent = {
          date: r.date,
          mode: r.mode,
          totalSets: r.totalSets,
          exerciseCount: (r.exercises || []).length,
          calories,
          dateLabel: format.formatDate(r.date),
          displayText: calories > 0
            ? calories + ' kcal'
            : ((r.exercises || []).length) + ' 个动作 · ' + (r.totalSets || 0) + ' 组'
        };
      }
      this.setData({
        loading: false,
        week,
        recent,
        weekText: {
          duration: format.formatDuration(week.durationSec),
          calories: (week.calories || 0) + ' kcal'
        }
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
  start() {
    wx.switchTab({ url: '/pages/record/record' });
  },
  onShareAppMessage() {
    const count = (this.data.week && this.data.week.count) || 0;
    const title = count > 0 ? ('牛来举铁 · 本周训练 ' + count + ' 次，一起变强！') : '牛来举铁 · 科学健身记录';
    return share.appMessage(title, '/pages/home/home');
  },
  onShareTimeline() {
    const count = (this.data.week && this.data.week.count) || 0;
    return share.timeline(count > 0 ? ('牛来举铁 · 本周训练 ' + count + ' 次，一起变强！') : '牛来举铁 · 科学健身记录');
  }
});
