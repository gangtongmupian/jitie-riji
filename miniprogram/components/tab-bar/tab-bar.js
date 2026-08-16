Component({
  properties: {
    current: { type: String, value: 'home' }
  },
  methods: {
    go(e) {
      const target = e.currentTarget.dataset.page;
      if (target === this.data.current) return;
      wx.reLaunch({ url: '/pages/' + target + '/' + target });
    }
  }
});
