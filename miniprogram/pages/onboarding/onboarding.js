const standards = require('../../utils/standards');
const { call } = require('../../utils/cloud');

Page({
  data: {
    step: 1,
    gender: 'male',
    age: 28,
    heightCm: 175,
    weightKg: 70,
    goal: '减脂',
    frequency: 3,
    metrics: null,
    freqOptions: [2, 3, 4, 5],
    goalOptions: [
      { value: '增肌', em: '💪', hint: '8–12 次/组', tint: 'lavender' },
      { value: '减脂', em: '🔥', hint: '12–15 次/组', tint: 'peach' },
      { value: '增力', em: '⚡', hint: '3–6 次/组', tint: 'sky' },
      { value: '保持健康', em: '🧘', hint: '全身均衡', tint: 'mint' }
    ]
  },
  pickGender(e) { this.setData({ gender: e.currentTarget.dataset.v }); },
  stepAge(e) {
    const d = e.currentTarget.dataset.d;
    this.setData({ age: Math.min(100, Math.max(6, this.data.age + d)) });
  },
  onInput(e) {
    const k = e.currentTarget.dataset.k;
    this.setData({ [k]: Number(e.detail.value) });
  },
  pickGoal(e) { this.setData({ goal: e.currentTarget.dataset.v }); },
  pickFreq(e) { this.setData({ frequency: Number(e.currentTarget.dataset.v) }); },
  next() {
    if (this.data.step < 3) {
      this.setData({ step: this.data.step + 1 });
    } else {
      this.computeAndShow();
    }
  },
  computeAndShow() {
    const p = {
      gender: this.data.gender,
      age: this.data.age,
      heightCm: this.data.heightCm,
      weightKg: this.data.weightKg,
      goal: this.data.goal,
      frequency: this.data.frequency
    };
    const v = standards.validateProfile(p);
    if (!v.ok) {
      wx.showToast({ title: v.errors[0], icon: 'none' });
      return;
    }
    const bmiValue = standards.bmi(p.weightKg, p.heightCm);
    const level = standards.bmiLevel(bmiValue);
    const fat = standards.bodyFatRange(p.gender);
    const bmrValue = standards.bmr(p.gender, p.age, p.heightCm, p.weightKg);
    const metrics = {
      bmi: bmiValue,
      bmiLevel: level,
      bmiLabel: standards.bmiLevelLabel(level),
      bodyFatMin: fat.min,
      bodyFatMax: fat.max,
      bmr: bmrValue
    };
    this.setData({ metrics });
    wx.showLoading({ title: '计算中' });
    call('saveProfile', { profile: Object.assign({}, p, { metrics }) })
      .then((profile) => {
        getApp().globalData.profile = profile;
        wx.hideLoading();
        this.setData({ step: 4 });
      })
      .catch((e) => {
        wx.hideLoading();
        wx.showToast({ title: e.message, icon: 'none' });
      });
  },
  enterApp() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
