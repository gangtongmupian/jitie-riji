const { call } = require('../../utils/cloud');
const standards = require('../../utils/standards');

Page({
  data: {
    tpl: null,
    exercises: []
  },
  onLoad(query) {
    this.tplId = query.id;
    this.load();
  },
  async load() {
    try {
      let cat = getApp().globalData.catalog;
      if (!cat) {
        cat = await call('catalog');
        getApp().globalData.catalog = cat;
      }
      const tpl = cat.templates.find((t) => t.id === this.tplId);
      if (!tpl) {
        wx.showToast({ title: '模板不存在或已失效', icon: 'none' });
        return;
      }
      const profile = getApp().globalData.profile;
      const weightKg = profile ? profile.weightKg : 70;
      const gender = profile ? profile.gender : 'male';
      const exercises = tpl.exercises.map((item) => {
        const ex = cat.exercises.find((x) => x.id === item.exerciseId);
        let tip = '';
        if (ex && ex.weighted && ex.pcts && ex.pcts[gender]) {
          const r = standards.strengthRange(weightKg, ex.pcts[gender].novice[0], ex.pcts[gender].novice[1]);
          tip = '推荐 ' + r.min + '–' + r.max + 'kg × ' + item.repRange[0] + '–' + item.repRange[1];
        } else if (ex) {
          tip = '自重动作 · 每组 ' + item.repRange[0] + '–' + item.repRange[1] + ' 次';
        }
        return {
          exerciseId: item.exerciseId,
          name: ex ? ex.name : item.exerciseId,
          bodyPart: ex ? ex.bodyPart : '',
          equipment: ex ? ex.equipment : '',
          sets: item.sets,
          repRange: item.repRange,
          tip
        };
      });
      this.setData({ tpl, exercises });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  start() {
    const tpl = this.data.tpl;
    if (!tpl) {
      wx.showToast({ title: '模板尚未加载完成', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/record/record?mode=template&templateId=' + tpl.id + '&templateName=' + encodeURIComponent(tpl.name)
    });
  },
  goBack() {
    wx.navigateBack();
  },
  fav() {
    wx.showToast({ title: '已收藏模板', icon: 'none' });
  }
});
