const { formatVolume, formatDuration, formatDate } = require('../../utils/format');

Page({
  data: {
    detail: null,
    totalVolume: '0kg',
    duration: '0 分钟',
    dateText: '',
    bgPath: '',
    usePhoto: false,
    actions: 0,
    groups: 0,
    exercises: [],
    qrPath: ''
  },
  onLoad() {
    const detail = getApp().globalData.lastWorkoutDetail;
    if (!detail) {
      wx.redirectTo({ url: '/pages/home/home' });
      return;
    }
    const sum = getApp().globalData.lastWorkout || {};
    const actions = detail.exercises.length;
    const groups = detail.exercises.reduce((s, e) => s + e.sets.length, 0);
    const exercises = detail.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      setText: ex.sets.map((s) => s.weightKg + 'kg×' + s.reps).join(' / ')
    }));
    this.setData({
      detail,
      totalVolume: formatVolume(sum.totalVolumeKg || 0),
      duration: formatDuration(detail.durationMin || 0),
      dateText: formatDate(Date.now()),
      actions,
      groups,
      exercises
    });
    this.loadQr();
  },
  loadQr() {
    const { call } = require('../../utils/cloud');
    call('qrcode')
      .then((data) => wx.cloud.getTempFileURL({ fileList: [data.fileID] }))
      .then((res) => this.setData({ qrPath: res.fileList[0].tempFileURL }))
      .catch(() => { /* 小程序未发布时无码,不影响分享卡 */ });
  },
  toggleBg() {
    if (this.data.usePhoto) {
      this.setData({ usePhoto: false, bgPath: '' });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ usePhoto: true, bgPath: res.tempFiles[0].tempFilePath });
      }
    });
  },
  drawCard(cb) {
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const W = res[0].width;
      const H = res[0].height;
      ctx.clearRect(0, 0, W, H);
      const paint = (img) => {
        if (img) {
          ctx.drawImage(img, 0, 0, W, H);
          ctx.fillStyle = 'rgba(10,10,12,0.62)';
          ctx.fillRect(0, 0, W, H);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);
        }
        this.drawContent(ctx, W, H);
        if (this.data.qrPath) {
          const qr = canvas.createImage();
          qr.onload = () => { ctx.drawImage(qr, W - 170, H - 190, 120, 120); cb(canvas); };
          qr.onerror = () => cb(canvas);
          qr.src = this.data.qrPath;
        } else {
          cb(canvas);
        }
      };
      if (this.data.bgPath) {
        const img = canvas.createImage();
        img.onload = () => paint(img);
        img.src = this.data.bgPath;
      } else {
        paint(null);
      }
    });
  },
  drawContent(ctx, W, H) {
    const pad = 40;
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('牛来举铁', pad, 80);
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#5d5b54';
    ctx.font = '24px sans-serif';
    ctx.fillText(this.data.dateText, W - pad, 80);
    ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(this.data.totalVolume, pad, 190);
    ctx.font = '28px sans-serif';
    ctx.fillText(this.data.actions + ' 个动作 · ' + this.data.groups + ' 组 · ' + this.data.duration, pad, 250);
    let y = 300;
    ctx.font = '28px sans-serif';
    this.data.exercises.forEach((ex) => {
      ctx.fillStyle = this.data.bgPath ? 'rgba(255,255,255,0.75)' : '#5d5b54';
      ctx.fillText(ex.name, pad, y);
      ctx.fillStyle = this.data.bgPath ? '#ffffff' : '#1a1a1a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(ex.setText, pad, y + 40);
      ctx.font = '28px sans-serif';
      y += 96;
    });
    ctx.fillStyle = this.data.bgPath ? 'rgba(255,255,255,0.75)' : '#5d5b54';
    ctx.fillText('坚持训练,见证改变', pad, H - 90);
  },
  save() {
    this.drawCard((canvas) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.showToast({ title: '保存失败,请检查相册权限', icon: 'none' })
          });
        }
      });
    });
  },
  share() {
    this.drawCard((canvas) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.shareAppMessage({
            title: '今日训练完成,总容量 ' + this.data.totalVolume,
            imageUrl: res.tempFilePath
          });
        }
      });
    });
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
