const { call } = require('../../utils/cloud');
const { formatVolume } = require('../../utils/format');

Page({
  data: {
    tab: 'cal',
    year: 2026,
    month: 8,
    days: {},
    weeks: [],
    prs: [],
    today: new Date().getDate()
  },
  onShow() {
    this.load();
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.t });
  },
  async load() {
    try {
      const d = await call('stats', { scope: 'history', year: this.data.year, month: this.data.month });
      const h = d.history;
      const maxVol = Math.max.apply(null, h.weeks.map((w) => w.volumeKg).concat([1]));
      const weeks = h.weeks.map((w) => ({
        vol: w.volumeKg,
        label: formatVolume(w.volumeKg),
        h: Math.max(8, Math.round((w.volumeKg / maxVol) * 100))
      }));
      const prs = h.prs.map((p) => ({
        id: p._id,
        name: p.exerciseName,
        best: p.bestWeightKg + 'kg',
        isNew: false
      }));
      this.setData({ days: h.days, weeks, prs });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  prevMonth() {
    let m = this.data.month - 1;
    let y = this.data.year;
    if (m < 1) { m = 12; y -= 1; }
    this.setData({ month: m, year: y });
    this.load();
  },
  nextMonth() {
    let m = this.data.month + 1;
    let y = this.data.year;
    if (m > 12) { m = 1; y += 1; }
    this.setData({ month: m, year: y });
    this.load();
  }
});
