const { call } = require('../../utils/cloud');
const { summarizeWorkout } = require('../../utils/stats');

Page({
  data: {
    mode: 'free',
    title: '自由训练',
    exercises: [],
    totalSets: 0,
    totalVolume: '0kg',
    seconds: 0,
    timerText: '00:00'
  },
  onLoad(query) {
    this.mode = query.mode || 'free';
    this.tplId = query.templateId || null;
    const title = query.templateName ? decodeURIComponent(query.templateName) : '自由训练';
    this.setData({ title, mode: this.mode });
    if (this.mode === 'template' && query.templateId) {
      this.buildFromTemplate(query.templateId);
    } else {
      this.setData({ exercises: this.buildFreeExercises() });
    }
    this.restoreDraft();
    this.startTimer();
  },
  buildFreeExercises() {
    const cat = getApp().globalData.catalog;
    if (!cat || !cat.exercises.length) return [];
    const ex = cat.exercises[0];
    return [{
      exerciseId: ex.id,
      name: ex.name,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      sets: [{ weightKg: 0, reps: 0 }]
    }];
  },
  buildFromTemplate(templateId) {
    const cat = getApp().globalData.catalog;
    const tpl = cat.templates.find((t) => t.id === templateId);
    const exercises = tpl.exercises.map((item) => {
      const ex = cat.exercises.find((x) => x.id === item.exerciseId);
      const sets = [];
      for (let i = 0; i < item.sets; i++) sets.push({ weightKg: 0, reps: 0 });
      return {
        exerciseId: item.exerciseId,
        name: ex ? ex.name : item.exerciseId,
        bodyPart: ex ? ex.bodyPart : '',
        equipment: ex ? ex.equipment : '',
        sets
      };
    });
    this.setData({ exercises });
  },
  startTimer() {
    this.timer = setInterval(() => {
      const seconds = this.data.seconds + 1;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      this.setData({ seconds, timerText: m + ':' + s });
    }, 1000);
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },
  inputSet(e) {
    const { ei, si, f } = e.currentTarget.dataset;
    const key = f === 'w' ? 'weightKg' : 'reps';
    this.setData({ [`exercises[${ei}].sets[${si}].${key}`]: Number(e.detail.value) });
    this.updateTotals();
  },
  addSet(e) {
    const ei = Number(e.currentTarget.dataset.ei);
    this.setData({ [`exercises[${ei}].sets`]: this.data.exercises[ei].sets.concat([{ weightKg: 0, reps: 0 }]) });
    this.updateTotals();
  },
  delSet(e) {
    const { ei, si } = e.currentTarget.dataset;
    const sets = this.data.exercises[ei].sets.slice();
    sets.splice(si, 1);
    this.setData({ [`exercises[${ei}].sets`]: sets });
    this.updateTotals();
  },
  updateTotals() {
    const sum = summarizeWorkout(this.data.exercises);
    this.setData({
      totalSets: sum.sets,
      totalVolume: sum.volumeKg >= 10000 ? (sum.volumeKg / 1000).toFixed(1) + 't' : sum.volumeKg + 'kg'
    });
  },
  saveDraft() {
    wx.setStorageSync('workout_draft', {
      mode: this.mode,
      tplId: this.tplId,
      title: this.data.title,
      exercises: this.data.exercises,
      seconds: this.data.seconds
    });
  },
  restoreDraft() {
    const draft = wx.getStorageSync('workout_draft');
    if (!draft) return;
    wx.showModal({
      title: '发现未完成的训练',
      content: '是否继续上次的记录?',
      success: (res) => {
        if (res.confirm) {
          this.mode = draft.mode;
          this.tplId = draft.tplId;
          this.setData({
            mode: draft.mode,
            title: draft.title,
            exercises: draft.exercises,
            seconds: draft.seconds
          });
          this.updateTotals();
        }
        wx.removeStorageSync('workout_draft');
      }
    });
  },
  addExercise() {
    const cat = getApp().globalData.catalog;
    if (!cat || !cat.exercises.length) {
      wx.showToast({ title: '动作库加载中,请稍后', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: cat.exercises.map((ex) => ex.name + ' · ' + ex.bodyPart),
      success: (res) => {
        const ex = cat.exercises[res.tapIndex];
        const exercises = this.data.exercises.concat([{
          exerciseId: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          sets: [{ weightKg: 0, reps: 0 }]
        }]);
        this.setData({ exercises });
        this.updateTotals();
      }
    });
  },
  quit() {
    wx.showModal({
      title: '退出训练',
      content: '训练还没保存,确定要退出吗?',
      success: (res) => {
        if (res.confirm) wx.navigateBack();
      }
    });
  },
  async finish() {
    const empty = this.data.exercises.some((ex) => ex.sets.some((s) => !s.weightKg || !s.reps));
    if (empty) {
      wx.showToast({ title: '还有未填完的组', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中' });
    try {
      const payload = {
        mode: this.mode,
        templateId: this.mode === 'template' ? this.tplId : null,
        templateName: this.data.title,
        durationMin: Math.round(this.data.seconds / 60),
        exercises: this.data.exercises
      };
      const data = await call('saveWorkout', payload);
      wx.hideLoading();
      wx.removeStorageSync('workout_draft');
      getApp().globalData.lastWorkout = data;
      getApp().globalData.lastWorkoutDetail = payload;
      wx.redirectTo({ url: '/pages/share/share' });
    } catch (e) {
      wx.hideLoading();
      this.saveDraft();
      wx.showToast({ title: '保存失败,已存为草稿', icon: 'none' });
    }
  }
});
