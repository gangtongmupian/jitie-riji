const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const standards = require('../../utils/standards');
const stats = require('../../utils/stats');
const format = require('../../utils/format');
const share = require('../../utils/share');
const exerciseDetails = require('../../data/exercise-details');
const motion = require('../../utils/motion');
const config = require('../../config');
const rosenMachines = require('../../data/rosen-machines');

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
    activeRest: null,
    saving: false,
    showCustomForm: false,
    customForm: { name: '', bodyPart: '胸', equipment: '哑铃', weighted: true },
    detail: null,
    showDetail: false,
    showFinishSheet: false,
    finishCalories: '',
    estimatedCalories: 0,
    bodyParts: ['胸', '背', '腿', '肩', '手臂', '核心', '臀腿'],
    bodyPartTabs: ['全部', '胸', '背', '腿', '肩', '手臂', '核心', '臀腿'],
    activeBodyPart: '全部',
    filteredGroups: []
  },
  onLoad() {
    share.enableShareMenu();
    this.startedAt = Date.now();
    this.saved = false;
    this._finishing = false;
    this._restTimers = {};
    this._vibeTimers = [];
    if (wx.enableAlertBeforeUnload) {
      wx.enableAlertBeforeUnload({ message: '训练尚未完成，确定退出吗？' });
    }
    this.loadCatalog();
  },
  onShow() {
    this.resumeRests();
  },
  onHide() {
    this.persistActiveRest();
  },
  onUnload() {
    this.clearRestTimers();
    this.clearVibeTimers();
    this.persistActiveRest();
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
      const unlocked = !!(profile && profile.inviteReward);
      const exercises = this.enrich(catalog.exercises || []);
      const templates = (catalog.templates || []).slice().sort((a, b) => {
        const ga = a.genderHint === gender ? 0 : (a.genderHint === 'all' ? 1 : 2);
        const gb = b.genderHint === gender ? 0 : (b.genderHint === 'all' ? 1 : 2);
        return ga - gb;
      }).map((t) => Object.assign({}, t, {
        genderText: t.genderHint === 'male' ? '男士' : (t.genderHint === 'female' ? '女士' : '通用'),
        locked: !!(t.premium && !unlocked)
      }));
      this.setData({ loading: false, allExercises: exercises, templates, groupedExercises: this.buildGroups(exercises) });
      this.applyFilter();
    }).catch(() => {
      this.setData({ loading: false });
      this.toast('动作库加载失败，请稍后重试');
    });
  },
  enrichOne(e) {
    const profile = storage.getProfile();
    const gender = profile && profile.gender;
    let rangeText = e.equipment || '';
    if (e.enName) rangeText = e.enName + (e.equipment ? ' · ' + e.equipment : '');
    if (e.weighted && gender && e.pcts) {
      const rec = standards.recommendedWeight(gender, profile.weightKg, e);
      if (rec) rangeText += ' · 推荐 ' + rec.novice[0] + '–' + rec.novice[1] + 'kg';
    }
    return Object.assign({}, e, {
      rangeText,
      glyph: motion.resolveGlyph(e),
      motion: motion.resolveMotion(e),
      animKey: motion.resolveAnimSlug(e),
      machine: rosenMachines[e.id] || null
    });
  },
  enrich(exercises) {
    return exercises.map((e) => this.enrichOne(e));
  },
  buildGroups(exercises) {
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
    return grouped;
  },
  applyFilter() {
    const active = this.data.activeBodyPart;
    const all = this.data.groupedExercises;
    this.setData({
      filteredGroups: active === '全部' ? all : all.filter((g) => g.bodyPart === active)
    });
  },
  selectBodyPart(e) {
    const active = e.currentTarget.dataset.value;
    const all = this.data.groupedExercises;
    this.setData({
      activeBodyPart: active,
      filteredGroups: active === '全部' ? all : all.filter((g) => g.bodyPart === active)
    });
  },
  openCustomForm() {
    this.setData({ showExercisePicker: false, showCustomForm: true });
  },
  closeCustomForm() {
    this.setData({ showCustomForm: false });
  },
  onCustomInput(e) {
    this.setData({ ['customForm.' + e.currentTarget.dataset.field]: e.detail.value });
  },
  pickCustomBodyPart(e) {
    this.setData({ 'customForm.bodyPart': e.currentTarget.dataset.value });
  },
  toggleCustomWeighted(e) {
    this.setData({ 'customForm.weighted': e.currentTarget.dataset.value === 'true' });
  },
  saveCustomExercise() {
    const f = this.data.customForm;
    const name = (f.name || '').trim();
    if (!name) return this.toast('请填写动作名称');
    const ex = {
      id: 'custom_' + Date.now(),
      name,
      bodyPart: f.bodyPart || '胸',
      equipment: (f.equipment || '').trim() || '器械',
      weighted: !!f.weighted,
      custom: true
    };
    storage.addCustomExercise(ex);
    const allExercises = this.data.allExercises.slice();
    allExercises.unshift(this.enrichOne(ex));
    this.setData({
      customForm: { name: '', bodyPart: '胸', equipment: '哑铃', weighted: true },
      showCustomForm: false,
      allExercises,
      groupedExercises: this.buildGroups(allExercises)
    });
    this.applyFilter();
    this.toast('已添加自定义动作');
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
    if (t.locked) {
      this.setData({ showTemplatePicker: false });
      wx.showModal({
        title: '进阶计划',
        content: config.INVITE_TIP,
        confirmText: '去邀请',
        cancelText: '再看看',
        success: (r) => { if (r.confirm) wx.navigateTo({ url: '/pages/invite/invite' }); }
      });
      return;
    }
    const exercises = (t.exercises || []).map((item) => {
      const ex = this.data.allExercises.find((x) => x.id === item.exerciseId);
      const reps = Math.round(((item.repRange && item.repRange[0] + item.repRange[1]) / 2) || 10);
      return {
        exerciseId: item.exerciseId,
        name: ex ? ex.name : item.exerciseId,
        bodyPart: ex ? ex.bodyPart : '',
        equipment: ex ? ex.equipment : '',
        weighted: ex ? !!ex.weighted : false,
        restMinutes: 3,
        restSeconds: 0,
        restRunning: false,
        restRemaining: 0,
        restText: '',
        sets: Array.from({ length: item.sets || 3 }, () => ({ reps: String(reps), weight: '', _key: this.genId() }))
      };
    });
    this.setData({ exercises, showTemplatePicker: false, templateId: t.id, templateName: t.name, mode: 'template' });
    this.recalc();
  },
  pickExercise(e) {
    this.addExerciseById(e.currentTarget.dataset.id);
  },
  addExerciseById(id) {
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
      restMinutes: 3,
      restSeconds: 0,
      restRunning: false,
      restRemaining: 0,
      restText: '',
      sets: [{ reps: '', weight: '', _key: this.genId() }]
    };
    this.setData({ exercises: this.data.exercises.concat([item]), showExercisePicker: false });
    this.recalc();
  },
  pickExerciseFromDetail(e) {
    this.setData({ showDetail: false });
    this.addExerciseById(e.currentTarget.dataset.id);
  },
  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const ex = this.data.allExercises.find((x) => x.id === id);
    if (!ex) return;
    const d = exerciseDetails[id] || {};
    const profile = storage.getProfile();
    let weights = null;
    if (ex.weighted && profile && profile.gender && profile.weightKg) {
      const rec = standards.recommendedWeight(profile.gender, profile.weightKg, ex);
      if (rec) weights = rec;
    }
    this.setData({
      detail: {
        id: ex.id,
        name: ex.name,
        enName: ex.enName || '',
        bodyPart: ex.bodyPart,
        equipment: ex.equipment || '',
        glyph: ex.glyph || motion.resolveGlyph(ex),
        motion: ex.motion || motion.resolveMotion(ex),
        animKey: ex.animKey || motion.resolveAnimSlug(ex),
        machine: ex.machine || rosenMachines[ex.id] || null,
        targets: d.targets || [],
        steps: d.steps || [],
        tips: d.tips || [],
        weights
      },
      showDetail: true
    });
  },
  closeDetail() {
    this.setData({ showDetail: false });
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
    this.stopRest(ex);
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
    this.stopRest(exercises[ei]);
    exercises.splice(ei, 1);
    this.setData({ exercises });
    this.recalc();
  },
  recalc() {
    const sets = stats.totalSets(this.data.exercises);
    const volume = stats.totalVolume(this.data.exercises);
    this.setData({
      totals: { sets, volume, exercises: this.data.exercises.length },
      totalsText: { volume: format.formatVolume(volume) }
    });
  },
  incRest(e) {
    this.changeRest(e, 1);
  },
  decRest(e) {
    this.changeRest(e, -1);
  },
  changeRest(e, delta) {
    const ei = e.currentTarget.dataset.ei;
    const exercises = this.data.exercises.slice();
    const ex = Object.assign({}, exercises[ei]);
    const base = ex.restMinutes == null ? 3 : ex.restMinutes;
    ex.restMinutes = Math.max(0, Math.min(30, base + delta));
    exercises[ei] = ex;
    this.setData({ exercises });
  },
  incRestSec(e) {
    this.changeRestSec(e, 5);
  },
  decRestSec(e) {
    this.changeRestSec(e, -5);
  },
  changeRestSec(e, delta) {
    const ei = e.currentTarget.dataset.ei;
    const exercises = this.data.exercises.slice();
    const ex = Object.assign({}, exercises[ei]);
    let sec = (ex.restSeconds || 0) + delta;
    if (sec < 0) sec = 55;
    if (sec > 55) sec = 0;
    ex.restSeconds = sec;
    exercises[ei] = ex;
    this.setData({ exercises });
  },
  toggleRest(e) {
    const ei = e.currentTarget.dataset.ei;
    const ex = this.data.exercises[ei];
    if (!ex) return;
    if (ex.restRunning) this.stopRest(ex);
    else this.startRest(ex);
  },
  startRest(ex) {
    const exercises = this.data.exercises.map((x) => Object.assign({}, x));
    const idx = exercises.findIndex((x) => x.exerciseId === ex.exerciseId);
    if (idx < 0) return;
    const item = exercises[idx];
    item.restRunning = true;
    const totalSec = (item.restMinutes || 0) * 60 + (item.restSeconds || 0);
    item.restEndAt = Date.now() + totalSec * 1000;
    item.restRemaining = totalSec;
    item.restText = this.fmtTime(item.restRemaining);
    exercises[idx] = item;
    this.startRestTimer(item.exerciseId);
    this.setData({ exercises, activeRest: { exerciseId: item.exerciseId, name: item.name, text: item.restText } });
    this.persistActiveRest();
  },
  stopRest(ex) {
    this.stopRestTimer(ex.exerciseId);
    this.clearVibeTimers();
    const exercises = this.data.exercises.map((x) => Object.assign({}, x));
    const idx = exercises.findIndex((x) => x.exerciseId === ex.exerciseId);
    if (idx >= 0) {
      exercises[idx].restRunning = false;
      exercises[idx].restEndAt = 0;
      exercises[idx].restRemaining = 0;
      exercises[idx].restText = '';
    }
    const activeRest = this.data.activeRest && this.data.activeRest.exerciseId === ex.exerciseId ? null : this.data.activeRest;
    this.setData({ exercises, activeRest });
    this.persistActiveRest();
  },
  stopRestActive() {
    const active = this.data.activeRest;
    if (!active) return;
    const ex = this.data.exercises.find((x) => x.exerciseId === active.exerciseId);
    if (ex) this.stopRest(ex);
  },
  startRestTimer(exerciseId) {
    this.stopRestTimer(exerciseId);
    this._restTimers[exerciseId] = setInterval(() => this.tickRest(exerciseId), 1000);
  },
  stopRestTimer(exerciseId) {
    if (this._restTimers && this._restTimers[exerciseId]) {
      clearInterval(this._restTimers[exerciseId]);
      delete this._restTimers[exerciseId];
    }
  },
  clearRestTimers() {
    if (!this._restTimers) return;
    Object.keys(this._restTimers).forEach((id) => clearInterval(this._restTimers[id]));
    this._restTimers = {};
  },
  tickRest(exerciseId) {
    const idx = this.data.exercises.findIndex((x) => x.exerciseId === exerciseId);
    if (idx < 0) { this.stopRestTimer(exerciseId); return; }
    const ex = this.data.exercises[idx];
    if (!ex.restEndAt) { this.stopRestTimer(exerciseId); return; }
    const remaining = Math.max(0, Math.ceil((ex.restEndAt - Date.now()) / 1000));
    if (remaining <= 0) {
      this.finishRest(ex);
      return;
    }
    const exercises = this.data.exercises.slice();
    const updated = Object.assign({}, ex, { restRemaining: remaining, restText: this.fmtTime(remaining) });
    exercises[idx] = updated;
    const activeRest = this.data.activeRest && this.data.activeRest.exerciseId === exerciseId
      ? Object.assign({}, this.data.activeRest, { text: updated.restText })
      : this.data.activeRest;
    this.setData({ exercises, activeRest });
  },
  finishRest(ex) {
    this.stopRestTimer(ex.exerciseId);
    const exercises = this.data.exercises.map((x) => Object.assign({}, x));
    const idx = exercises.findIndex((x) => x.exerciseId === ex.exerciseId);
    let done = null;
    if (idx >= 0) {
      exercises[idx] = Object.assign({}, exercises[idx], {
        restRunning: false,
        restEndAt: 0,
        restRemaining: 0,
        restText: ''
      });
      done = { exerciseId: exercises[idx].exerciseId, name: exercises[idx].name, text: '00:00', done: true };
    }
    this.setData({ exercises, activeRest: done });
    this.persistActiveRest();
    this.vibrateFinish();
    wx.showToast({ title: '休息结束，开始下一组！', icon: 'none', duration: 2500 });
  },
  vibrateFinish() {
    this.clearVibeTimers();
    const burst = () => {
      if (wx.vibrateLong) wx.vibrateLong();
      if (wx.vibrateShort) {
        try { wx.vibrateShort({ type: 'heavy' }); } catch (e) { /* 忽略低版本 */ }
      }
    };
    burst();
    this._vibeTimers.push(setTimeout(burst, 1200));
    this._vibeTimers.push(setTimeout(burst, 2600));
  },
  clearVibeTimers() {
    (this._vibeTimers || []).forEach((t) => clearTimeout(t));
    this._vibeTimers = [];
  },
  persistActiveRest() {
    const active = this.data.activeRest;
    if (active && !active.done) {
      const ex = this.data.exercises.find((x) => x.exerciseId === active.exerciseId);
      if (ex && ex.restRunning && ex.restEndAt) {
        wx.setStorageSync('jitie.activeRest', { exerciseId: ex.exerciseId, name: ex.name, restEndAt: ex.restEndAt });
        return;
      }
    }
    wx.removeStorageSync('jitie.activeRest');
  },
  resumeRests() {
    let finished = null;
    const exercises = this.data.exercises.map((x) => Object.assign({}, x));
    let changed = false;
    exercises.forEach((ex) => {
      if (!ex.restRunning || !ex.restEndAt) return;
      const remaining = Math.max(0, Math.ceil((ex.restEndAt - Date.now()) / 1000));
      if (remaining <= 0) {
        finished = finished || ex;
      } else {
        ex.restRemaining = remaining;
        ex.restText = this.fmtTime(remaining);
        this.startRestTimer(ex.exerciseId);
        changed = true;
      }
    });
    if (changed) this.setData({ exercises });
    if (finished) { this.finishRest(finished); return; }
    const saved = wx.getStorageSync('jitie.activeRest');
    if (!saved || !saved.restEndAt) return;
    const idx = this.data.exercises.findIndex((x) => x.exerciseId === saved.exerciseId);
    if (idx < 0) { wx.removeStorageSync('jitie.activeRest'); return; }
    const ex = Object.assign({}, this.data.exercises[idx]);
    const remaining = Math.max(0, Math.ceil((saved.restEndAt - Date.now()) / 1000));
    ex.restRunning = true;
    ex.restEndAt = saved.restEndAt;
    ex.restRemaining = remaining;
    ex.restText = this.fmtTime(remaining);
    const arr = this.data.exercises.slice();
    arr[idx] = ex;
    if (remaining <= 0) {
      this.setData({ exercises: arr });
      this.finishRest(ex);
    } else {
      this.setData({ exercises: arr, activeRest: { exerciseId: ex.exerciseId, name: ex.name, text: ex.restText } });
      this.startRestTimer(ex.exerciseId);
    }
  },
  fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
  },
  buildWorkout(caloriesOverride) {
    const profile = storage.getProfile();
    const endedAt = Date.now();
    const totalVolume = stats.totalVolume(this.data.exercises);
    const durationSec = Math.max(0, Math.round((endedAt - this.startedAt) / 1000));
    const estimated = stats.estimateCalories(profile && profile.weightKg, durationSec, totalVolume);
    return {
      date: format.today(),
      startedAt: this.startedAt,
      endedAt,
      durationSec,
      mode: this.data.mode,
      templateId: this.data.templateId || null,
      templateName: this.data.templateName || null,
      calories: caloriesOverride != null ? caloriesOverride : estimated,
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
    if (this.data.saving || this._finishing) return;
    if (!this.data.exercises.length) return this.toast('请至少添加一个动作');
    for (const ex of this.data.exercises) {
      if (!ex.sets.length) return this.toast(`「${ex.name}」至少需要一组`);
      if (ex.sets.some((s) => !(Number(s.reps) > 0))) return this.toast(`「${ex.name}」请填写每组次数`);
    }
    const profile = storage.getProfile();
    const totalVolume = stats.totalVolume(this.data.exercises);
    const durationSec = Math.max(0, Math.round((Date.now() - this.startedAt) / 1000));
    const estimated = stats.estimateCalories(profile && profile.weightKg, durationSec, totalVolume);
    this.setData({
      showFinishSheet: true,
      estimatedCalories: estimated,
      finishCalories: estimated > 0 ? String(estimated) : ''
    });
  },
  onFinishCaloriesInput(e) {
    this.setData({ finishCalories: e.detail.value });
  },
  closeFinishSheet() {
    this.setData({ showFinishSheet: false });
  },
  confirmFinish() {
    if (this.data.saving || this._finishing) return;
    this._finishing = true;
    const v = Number(this.data.finishCalories);
    const calories = v > 0 ? Math.round(v) : this.data.estimatedCalories;
    this.setData({ showFinishSheet: false, saving: true });
    const workout = this.buildWorkout(calories);
    this.clearRestTimers();
    this.setData({ activeRest: null });
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
      this._finishing = false;
      this.setData({ saving: false });
      this.toast('保存失败，已存草稿，稍后自动重试');
    });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  },
  onShareAppMessage() {
    return share.appMessage('我在牛来举铁记录训练，一起打卡！', '/pages/record/record');
  },
  onShareTimeline() {
    return share.timeline('我在牛来举铁记录训练，一起打卡！');
  }
});
