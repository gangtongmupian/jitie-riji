const cloud = require('../../utils/cloud');

Page({
  data: {
    loading: true,
    trend: [],
    prsList: [],
    calendar: [],
    monthLabel: '',
    hasData: false
  },
  onLoad() {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    cloud.getStats().then((data) => {
      this.allDates = new Set(data.dates || []);
      const trend = (data.trend || []).map((b) => ({
        weekStart: b.weekStart,
        count: b.count,
        volume: b.volume,
        label: b.weekStart.slice(5).replace('-', '/')
      }));
      const max = Math.max(1, ...trend.map((b) => b.volume));
      trend.forEach((b) => { b.h = Math.round((b.volume / max) * 100); });
      const prsList = Object.keys(data.prs || {})
        .map((k) => data.prs[k])
        .filter((p) => p.bestWeight > 0)
        .sort((a, b) => b.bestWeight - a.bestWeight);
      this.setData({
        loading: false,
        trend,
        prsList,
        hasData: prsList.length > 0 || (data.dates || []).length > 0
      });
      this.buildCalendar();
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
  buildCalendar() {
    const year = this.year;
    const month = this.month;
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ key: 'b' + i, day: '', date: '', active: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ key: date, day: d, date, active: this.allDates.has(date) });
    }
    while (cells.length % 7 !== 0) cells.push({ key: 'a' + cells.length, day: '', date: '', active: false });
    this.setData({ calendar: cells, monthLabel: `${year}年${month + 1}月` });
  },
  prevMonth() {
    this.month -= 1;
    if (this.month < 0) { this.month = 11; this.year -= 1; }
    this.buildCalendar();
  },
  nextMonth() {
    this.month += 1;
    if (this.month > 11) { this.month = 0; this.year += 1; }
    this.buildCalendar();
  }
});
