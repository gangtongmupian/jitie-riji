const cloud = require('../../utils/cloud');
const share = require('../../utils/share');

Page({
  data: {
    loading: true,
    loadError: false,
    periods: { week: { count: 0, caloriesText: '0 kcal' }, month: { count: 0, caloriesText: '0 kcal' }, year: { count: 0, caloriesText: '0 kcal' } },
    prsList: [],
    calendar: [],
    monthLabel: '',
    hasData: false,
    dayDetail: null,
    showDayDetail: false,
    dayLoading: false
  },
  onLoad() {
    share.enableShareMenu();
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
      const mk = (p) => ({ count: (p && p.count) || 0, calories: (p && p.calories) || 0, caloriesText: ((p && p.calories) || 0) + ' kcal' });
      const periods = {
        week: mk(data.week),
        month: mk(data.month),
        year: mk(data.year)
      };
      const prsList = Object.keys(data.prs || {})
        .map((k) => data.prs[k])
        .filter((p) => p.bestWeight > 0)
        .sort((a, b) => b.bestWeight - a.bestWeight);
      this.setData({
        loading: false,
        loadError: false,
        periods,
        prsList,
        hasData: prsList.length > 0 || (data.dates || []).length > 0
      });
      this.buildCalendar();
    }).catch(() => {
      this.setData({ loading: false, loadError: true });
    });
  },
  retry() {
    this.setData({ loading: true, loadError: false });
    this.refresh();
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
  },
  tapDay(e) {
    const { date, active } = e.currentTarget.dataset;
    if (!active || !date) return;
    this.setData({ showDayDetail: true, dayLoading: true, dayDetail: null });
    cloud.getDayStats(date).then((data) => {
      this._dayWorkouts = data.day || [];
      const items = (data.day || []).map((w) => ({
        id: w._id,
        date: w.date,
        mode: w.mode,
        calories: w.calories || 0,
        totalSets: w.totalSets || 0,
        timeText: this.timeText(w.startedAt, w.endedAt),
        exercises: (w.exercises || []).map((ex) => ({
          name: ex.name,
          sets: (ex.sets || []).map((s) => (Number(s.weight) > 0 ? (s.weight + 'kg×' + s.reps) : (s.reps + ' 次')))
        }))
      }));
      this.setData({ dayLoading: false, dayDetail: { date, items } });
    }).catch(() => {
      this.setData({ dayLoading: false });
      this.toast('加载失败，请重试');
    });
  },
  timeText(startedAt, endedAt) {
    const fmt = (t) => {
      const d = new Date(t);
      if (isNaN(d.getTime())) return '';
      return (d.getHours() < 10 ? '0' + d.getHours() : '' + d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' + d.getMinutes() : '' + d.getMinutes());
    };
    const s = fmt(startedAt);
    const e = fmt(endedAt);
    return s && e ? (s + '–' + e) : '';
  },
  closeDayDetail() {
    this.setData({ showDayDetail: false });
  },
  shareWorkout(e) {
    const id = e.currentTarget.dataset.id;
    const w = (this._dayWorkouts || []).find((x) => x._id === id);
    if (!w) { this.toast('记录不存在，无法分享'); return; }
    share.setShareTarget({
      date: w.date,
      mode: w.mode,
      calories: w.calories || 0,
      totalSets: w.totalSets || 0,
      exercises: (w.exercises || []).map((ex) => ({ name: ex.name, sets: ex.sets || [] }))
    });
    wx.navigateTo({ url: '/pages/share/share' });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  },
  onShareAppMessage() {
    return share.appMessage('我的训练数据：趋势与 PR 都在牛来举铁', '/pages/history/history');
  },
  onShareTimeline() {
    return share.timeline('我的训练数据：趋势与 PR 都在牛来举铁');
  }
});
