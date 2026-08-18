const format = require('../../utils/format');

Page({
  data: {
    workout: null,
    summaries: [],
    volumeText: '0kg',
    calories: 0,
    headline: { label: '训练完成', value: '' },
    dateLabel: '',
    bg: 'white',
    photoPath: '',
    generating: false,
    saved: false
  },
  onLoad() {
    const workout = wx.getStorageSync('jitie.lastWorkout');
    if (!workout) {
      this.setData({ workout: null });
      return;
    }
    const summaries = (workout.exercises || []).map((ex) => {
      const sets = ex.sets || [];
      const best = sets.reduce((a, b) => ((Number(b.weight) > Number(a.weight)) ? b : a), sets[0]);
      const label = ex.weighted
        ? `${best ? best.weight : 0}kg×${best ? best.reps : 0}`
        : `自重×${best ? best.reps : 0}`;
      return { name: ex.name, count: sets.length, label };
    });
    const calories = Number(workout.calories) || 0;
    const totalSets = workout.totalSets || 0;
    const exCount = (workout.exercises || []).length;
    const headline = calories > 0
      ? { label: '本次消耗热量', value: calories + ' kcal' }
      : { label: '训练完成', value: exCount + ' 个动作 · ' + totalSets + ' 组' };
    this.setData({
      workout,
      summaries,
      calories,
      headline,
      dateLabel: format.formatDate(workout.date)
    });
    this.drawCard();
  },
  drawCard(cb) {
    const workout = this.data.workout;
    if (!workout) return;
    const w = 750;
    const h = 1000;
    const ctx = wx.createCanvasContext('shareCanvas', this);
    const dark = this.data.bg === 'photo' && this.data.photoPath;

    if (dark) {
      ctx.drawImage(this.data.photoPath, 0, 0, w, h);
      ctx.setFillStyle('rgba(0,0,0,0.5)');
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, w, h);
    }
    const ink = dark ? '#ffffff' : '#1a1a1a';
    const muted = dark ? 'rgba(255,255,255,0.72)' : '#787671';

    ctx.setFillStyle(ink);
    ctx.setFontSize(34);
    ctx.fillText('牛来举铁', 48, 84);

    ctx.setFillStyle('#5645d4');
    ctx.fillRect(48, 116, 132, 46);
    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(24);
    ctx.fillText('训练打卡', 62, 148);

    ctx.setFillStyle(muted);
    ctx.setFontSize(26);
    ctx.fillText(this.data.headline.label, 48, 300);

    ctx.setFillStyle(ink);
    if (this.data.calories > 0) {
      ctx.setFontSize(96);
      ctx.fillText(this.data.headline.value, 48, 400);
    } else {
      ctx.setFontSize(52);
      ctx.fillText(this.data.headline.value, 48, 400);
    }

    ctx.setFillStyle(dark ? 'rgba(255,255,255,0.35)' : '#e5e3df');
    ctx.fillRect(48, 452, w - 96, 2);

    let y = 520;
    ctx.setFontSize(28);
    this.data.summaries.slice(0, 8).forEach((s) => {
      ctx.setFillStyle(ink);
      ctx.fillText(s.name, 48, y);
      ctx.setFillStyle(muted);
      ctx.fillText(`${s.count} 组 · ${s.label}`, 48, y + 34);
      y += 78;
    });

    ctx.setFillStyle(muted);
    ctx.setFontSize(24);
    ctx.fillText(format.formatDate(workout.date), 48, 920);

    ctx.draw(false, () => {
      this.setData({ generating: false });
      if (cb) cb();
    });
  },
  chooseBg() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        this.setData({ bg: 'photo', photoPath: file.tempFilePath, generating: true });
        this.drawCard();
      }
    });
  },
  resetBg() {
    this.setData({ bg: 'white', photoPath: '', generating: true });
    this.drawCard();
  },
  save() {
    if (this.saving) return;
    this.saving = true;
    this.setData({ generating: true });
    this.drawCard(() => {
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              this.saving = false;
              this.setData({ saved: true });
              wx.showToast({ title: '已保存到相册' });
            },
            fail: (err) => {
              this.saving = false;
              this.handleAlbumError(err);
            }
          });
        },
        fail: () => {
          this.saving = false;
          wx.showToast({ title: '生成图片失败，请重试', icon: 'none' });
        }
      });
    });
  },
  handleAlbumError(err) {
    if (err && err.errMsg && err.errMsg.indexOf('auth') >= 0) {
      wx.showModal({
        title: '需要相册权限',
        content: '请在设置中允许保存到相册后重试。',
        confirmText: '去设置',
        success: (r) => { if (r.confirm) wx.openSetting(); }
      });
    } else {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },
  done() {
    wx.switchTab({ url: '/pages/home/home' });
  },
  onShareAppMessage() {
    return { title: '我的训练打卡', path: '/pages/home/home' };
  }
});
