const storage = require('../../utils/storage');
const cloud = require('../../utils/cloud');
const standards = require('../../utils/standards');

const GOALS = ['增肌', '减脂', '增力', '保持'];
const FREQS = [1, 2, 3, 4, 5, 6, 7];
const AGREEMENT = '用户协议与隐私政策\n\n本小程序仅收集实现功能所必需的信息（性别、年龄、身高、体重、健身目标、每周训练频率），用于计算体质指标、推荐训练重量与训练模板。\n\n我们不会主动共享、转让或公开你的个人信息。你可以随时在「我的」页修改资料或申请注销。继续使用即表示你已阅读并同意本说明。';

Page({
  data: {
    loading: true,
    step: 0,
    agree: false,
    agreement: AGREEMENT,
    goals: GOALS,
    freqs: FREQS,
    form: { gender: '', age: '', heightCm: '', weightKg: '', goal: '增肌', frequency: 3 },
    result: null
  },
  onLoad(options) {
    this.edit = options && options.edit === '1';
    const cached = storage.getProfile();
    if (this.edit) {
      if (cached) this.prefill(cached);
      else this.setData({ loading: false });
      return;
    }
    if (cached && cached.gender) { this.goHome(); return; }
    cloud.ensureLogin().then((user) => {
      if (user && user.gender) { storage.setProfile(Object.assign({}, cached, user)); this.goHome(); return; }
      this.setData({ loading: false });
    }).catch(() => this.setData({ loading: false }));
  },
  prefill(p) {
    this.setData({
      loading: false,
      step: 1,
      agree: true,
      form: {
        gender: p.gender || '',
        age: p.age != null ? String(p.age) : '',
        heightCm: p.heightCm != null ? String(p.heightCm) : '',
        weightKg: p.weightKg != null ? String(p.weightKg) : '',
        goal: p.goal || '增肌',
        frequency: p.frequency || 3
      }
    });
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },
  finish() {
    if (this.edit) wx.navigateBack();
    else this.goHome();
  },
  toggleAgree() {
    this.setData({ agree: !this.data.agree });
  },
  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value });
  },
  pick(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.currentTarget.dataset.value });
  },
  next() {
    if (this.data.step === 0) {
      if (!this.data.agree) return this.toast('请先阅读并同意用户协议与隐私政策');
      return this.setData({ step: 1 });
    }
    if (this.data.step === 1) {
      const f = this.data.form;
      if (!f.gender) return this.toast('请选择性别');
      if (!(Number(f.age) >= 6 && Number(f.age) <= 100)) return this.toast('年龄需在 6–100 岁之间');
      if (!(Number(f.heightCm) >= 80 && Number(f.heightCm) <= 250)) return this.toast('身高需在 80–250cm 之间');
      if (!(Number(f.weightKg) >= 20 && Number(f.weightKg) <= 300)) return this.toast('体重需在 20–300kg 之间');
      return this.setData({ step: 2 });
    }
    this.submit();
  },
  prev() {
    if (this.data.step > 0) this.setData({ step: this.data.step - 1 });
  },
  submit() {
    const f = this.data.form;
    const profile = {
      gender: f.gender,
      age: Number(f.age),
      heightCm: Number(f.heightCm),
      weightKg: Number(f.weightKg),
      goal: f.goal,
      frequency: Number(f.frequency)
    };
    const v = standards.validateProfile(profile);
    if (!v.ok) return this.toast(v.errors[0]);
    wx.showLoading({ title: '计算中' });
    cloud.saveProfile(profile).then((metrics) => {
      wx.hideLoading();
      this.setData({
        result: Object.assign({}, profile, metrics, { bmiLevelLabel: standards.bmiLevelLabel(metrics.bmiLevel) }),
        step: 3
      });
    }).catch((err) => {
      wx.hideLoading();
      this.toast(err.message || '保存失败');
    });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  }
});
