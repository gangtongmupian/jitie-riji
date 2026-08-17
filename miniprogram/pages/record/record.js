const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const standards = require('../../utils/standards');
const stats = require('../../utils/stats');
const format = require('../../utils/format');

const BODY_ORDER = ['胸', '背', '腿', '肩', '手臂', '核心', '臀腿'];

Page({
  data: {
    loading: true,
    mode: 'free',
    templates: [],
    allExercises: [],
    groupedExercises: [],
    showTemplatePicker: false,
    showExercisePicker: false,
    exercises: [],
    totals: { sets: 0, volume: 0 },
    totalsText: { volume: '0kg' },
    saving: false
  },
  onLoad() {
    this.startedAt = Date.now();
    this.saved = false;
    if (wx.enableAlertBeforeUnload) {
      wx.enableAlertBeforeUnload({ message: '训练尚未完成，确定退出吗？' });
    }
    this.loadCatalog();
  },
  onUnload() {
    if (!this.saved && this.data.exercises && this.data.exercises.length) {
      storage.saveDraft(this.buildWorkout());
    }
  },
  noop() {},
  genId() {
    this._seq = (this._seq || 0) + 1;
    return 's' + this._seq;
  },
  loadCatalog() {
    cloud.getCatalog().then((catalog) => {
      const profile = storage.getProfile();
      const gender = profile && profile.gender;
      const exercises = (catalog.exercises || []).map((e) => {
        let rangeText = e.equipment || '';
        if (e.weighted && gender) {
          const rec = standards.recommendedWeight(gender, profile.weightKg, e);
          if (rec) rangeText = `推荐 ${rec.novice[0]}–${rec.novice[1]}kg`;
        }
        return Object.assign({}, e, { rangeText });
      });
      const templates = (catalog.templates || []).slice().sort((a, b) => {
        const ga = a.genderHint === gender ? 0 : (a.genderHint === 'all' ? 1 : 2);
        const gb = b.genderHint === gender ? 0 : (b.genderHint === 'all' ? 1 : 2);
        return ga - gb;
      });
      const grouped = [];
      BODY_ORDER.forEach((bp) => {
        const items = exercises.filter((e) => e.bodyPart === bp);
        if (items.length) grouped.push({ bodyPart: bp, items });
      });
      exercises.forEach((e) => {
        if (!BODY_ORDER.includes(e.bodyPart)) {
          const g = grouped.find((x) => x.bodyPart === e.bodyPart);
          if (g) g.items.push(e); else grouped.push({ bodyPart: e.bodyPart, items: [e] });
        }
      });
      this.setData({ loading: false, allExercises: exercises, templates, groupedExercises: grouped });
    }).catch(() => {
      this.setData({ loading: false });
      this.toast('动作库加载失败，请稍后重试');
    });
  },
  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },
  openTemplates() {
    this.setData({ showTemplatePicker: true });
  },
  closePickers() {
    this.setData({ showTemplatePicker: false, showExercisePicker: false });
  },
  openExercises() {
    this.setData({ showExercisePicker: true });
  },
  pickTemplate(e) {
    const t = this.data.templates.find((x) => x.id === e.currentTarget.dataset.id);
    if (!t) return this.toast('模板不存在或未加载');
    const exercises = (t.exercises || []).map((item) => {
      const ex = this.data.allExercises.find((x) => x.id === item.exerciseId);
      const reps = Math.round(((item.repRange && item.repRange[0] + item.repRange[1]) / 2) || 10);
      return {
        exerciseId: item.exerciseId,
        name: ex ? ex.name : item.exerciseId,
        bodyPart: ex ? ex.bodyPart : '',
        equipment: ex ? ex.equipment : '',
        weighted: ex ? !!ex.weighted : false,
        sets: Array.from({ length: item.sets || 3 }, () => ({ reps: String(reps), weight: '', _key: this.genId() }))
      };
    });
    this.setData({ exercises, showTemplatePicker: false, templateId: t.id, templateName: t.name, mode: 'template' });
    this.recalc();
  },
  pickExercise(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.exercises.some((x) => x.exerciseId === id)) {
      this.setData({ showExercisePicker: false });
      return this.toast('该动作已添加');
    }
    const ex = this.data.allExercises.find((x) => x.id === id);
    if (!ex) return this.toast('动作不存在');
    const item = {
      exerciseId: ex.id,
      name: ex.name,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      weighted: !!ex.weighted,
      sets: [{ reps: '', weight: '', _key: this.genId() }]
    };
    this.setData({ exercises: this.data.exercises.concat([item]), showExercisePicker: false });
    this.recalc();
  },
  onSetInput(e) {
    const { ei, si, field } = e.currentTarget.dataset;
    this.setData({ [`exercises[${ei}].sets[${si}].${field}`]: e.detail.value });
    this.recalc();
  },
  addSet(e) {
    const ei = e.currentTarget.dataset.ei;
    const exercises = this.data.exercises.slice();
    const ex = exercises[ei];
    const last = ex.sets[ex.sets.length - 1] || { reps: '', weight: '' };
    exercises[ei] = Object.assign({}, ex, { sets: ex.sets.concat([{ reps: last.reps, weight: last.weight, _key: this.genId() }]) });
    this.setData({ exercises });
    this.recalc();
  },
  removeSet(e) {
    const { ei, si } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    const ex = exercises[ei];
    const sets = ex.sets.slice();
    sets.splice(si, 1);
    if (sets.length === 0) {
      exercises.splice(ei, 1);
    } else {
      exercises[ei] = Object.assign({}, ex, { sets });
    }
    this.setData({ exercises });
    this.recalc();
  },
  removeExercise(e) {
    const ei = e.currentTarget.dataset.ei;
    const exercises = this.data.exercises.slice();
    exercises.splice(ei, 1);
    this.setData({ exercises });
    this.recalc();
  },
  recalc() {
    const sets = stats.totalSets(this.data.exercises);
    const volume = stats.totalVolume(this.data.exercises);
    this.setData({ totals: { sets, volume }, totalsText: { volume: format.formatVolume(volume) } });
  },
  buildWorkout() {
    return {
      date: format.today(),
      startedAt: this.startedAt,
      endedAt: Date.now(),
      mode: this.data.mode,
      templateId: this.data.templateId || null,
      templateName: this.data.templateName || null,
      exercises: this.data.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        weighted: ex.weighted,
        sets: ex.sets.map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 }))
      }))
    };
  },
  finish() {
    if (!this.data.exercises.length) return this.toast('请至少添加一个动作');
    for (const ex of this.data.exercises) {
      if (!ex.sets.length) return this.toast(`「${ex.name}」至少需要一组`);
      if (ex.sets.some((s) => !(Number(s.reps) > 0))) return this.toast(`「${ex.name}」请填写每组次数`);
    }
    const workout = this.buildWorkout();
    this.setData({ saving: true });
    storage.saveDraft(workout);
    cloud.saveWorkout(workout).then((saved) => {
      storage.clearDraft();
      const shareData = Object.assign({}, workout, saved, {
        totalSets: stats.totalSets(this.data.exercises),
        totalVolume: stats.totalVolume(this.data.exercises)
      });
      wx.setStorageSync('jitie.lastWorkout', shareData);
      this.saved = true;
      if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload();
      this.setData({ saving: false });
      wx.redirectTo({ url: '/pages/share/share' });
    }).catch(() => {
      this.setData({ saving: false });
      this.toast('保存失败，已存草稿，稍后自动重试');
    });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  }
});
