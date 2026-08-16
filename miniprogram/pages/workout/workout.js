const { call } = require('../../utils/cloud');

Page({
  data: {
    mode: 'template',
    templates: []
  },
  onShow() {
    this.loadCatalog();
  },
  async loadCatalog() {
    try {
      if (!getApp().globalData.catalog) {
        getApp().globalData.catalog = await call('catalog');
      }
      const tpls = getApp().globalData.catalog.templates.map((t) => ({
        id: t.id,
        name: t.name,
        sub: t.frequency + ' 次/周 · ' + t.goal + ' · 约 60 分钟'
      }));
      this.setData({ templates: tpls });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  pickMode(e) {
    this.setData({ mode: e.currentTarget.dataset.m });
  },
  openTemplate(e) {
    wx.navigateTo({ url: '/pages/template/template?id=' + e.currentTarget.dataset.id });
  },
  startFree() {
    wx.navigateTo({ url: '/pages/record/record?mode=free' });
  }
});
