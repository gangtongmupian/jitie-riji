const format = require('../../utils/format');
const share = require('../../utils/share');
const cloud = require('../../utils/cloud');
const track = require('../../utils/track');
const storage = require('../../utils/storage');

Page({
  data: {
    workout: null,
    summaries: [],
    volumeText: '0kg',
    durationText: '',
    calories: 0,
    headline: { label: '训练完成', value: '' },
    dateLabel: '',
    deltaText: '',
    deltaUp: false,
    firstTime: false,
    totalSets: 0,
    exerciseCount: 0,
    showReminder: false,
    reminderChoice: '',
    bg: 'white',
    photoPath: '',
    photoReady: false,
    generating: false,
    saved: false,
    streak: 0
  },
  onLoad() {
    share.enableShareMenu();
    const workout = wx.getStorageSync('jitie.shareWorkout') || wx.getStorageSync('jitie.lastWorkout');
    if (!workout) {
      this.setData({ workout: null });
      return;
    }
    const summaries = (workout.exercises || []).map((ex) => {
      const sets = ex.sets || [];
      const best = sets.reduce((a, b) => ((Number(b.weight) > Number(a.weight)) ? b : a), sets[0]);
      const weighted = ex.weighted || sets.some((s) => Number(s.weight) > 0);
      const label = weighted
        ? `${best ? best.weight : 0}kg×${best ? best.reps : 0}`
        : `自重×${best ? best.reps : 0}`;
      return { name: ex.name, count: sets.length, label };
    });
    const calories = Number(workout.calories) || 0;
    const totalSets = workout.totalSets || 0;
    const exCount = (workout.exercises || []).length;
    const volume = Number(workout.totalVolume) || 0;
    const durationMin = Math.max(1, Math.round((Number(workout.durationSec) || 0) / 60) || exCount);
    const headline = calories > 0
      ? { label: '本次消耗热量', value: calories + ' kcal' }
      : { label: '训练完成', value: exCount + ' 个动作 · ' + totalSets + ' 组' };
    this.setData({
      workout,
      summaries,
      calories,
      totalSets,
      exerciseCount: exCount,
      volumeText: format.formatVolume(volume),
      durationText: durationMin + ' 分钟',
      headline,
      dateLabel: format.formatDate(workout.date),
      showReminder: true
    });
    this.drawCard();
    cloud.getStats().then((data) => {
      const recent = (data.recent || []).filter((w) => w._id !== (workout._id || ''));
      const prev = recent[0];
      if (!prev) {
        this.setData({ firstTime: true, deltaText: '首次记录，已为你保存 · 下次会给你建议' });
      } else {
        const prevVol = Number(prev.totalVolume) || 0;
        const curVol = Number(volume) || 0;
        const diff = curVol - prevVol;
        this.setData({
          deltaText: diff > 0 ? ('比上次 +' + format.formatVolume(diff)) : (diff < 0 ? ('比上次 ' + format.formatVolume(diff)) : '与上次持平'),
          deltaUp: diff >= 0
        });
      }
      this.setData({ streak: data.streak || 0 });
      this.drawCard();
    }).catch(() => {});
    track.track('share_view', { totalSets, exCount, volume });
  },
  drawCard(cb) {
    const workout = this.data.workout;
    if (!workout) return;
    const w = 750;
    const h = 1000;
    const ctx = wx.createCanvasContext('shareCanvas', this);
    const dark = this.data.bg === 'photo' && this.data.photoReady && this._photo;

    if (dark) {
      ctx.drawImage(this._photo, 0, 0, w, h);
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
    if (this.data.streak > 0) {
      ctx.setFillStyle(muted);
      ctx.setFontSize(24);
      ctx.fillText('已连续训练 ' + this.data.streak + ' 天', 48, 960);
    }

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
        this.setData({ generating: true, saved: false });
        wx.getImageInfo({
          src: file.tempFilePath,
          success: (info) => {
            this._photo = info.path || file.tempFilePath;
            this.setData({ bg: 'photo', photoPath: info.path || file.tempFilePath, photoReady: true });
            if (this.data.workout) this.drawCard();
            else this.setData({ generating: false });
          },
          fail: () => {
            this.setData({ bg: 'white', photoPath: '', photoReady: false, generating: false, saved: false });
            wx.showToast({ title: '图片读取失败，请重试', icon: 'none' });
          }
        });
      }
    });
  },
  resetBg() {
    this.setData({ bg: 'white', photoPath: '', photoReady: false, generating: true, saved: false });
    this.drawCard();
  },
  chooseReminder(e) {
    const choice = e.currentTarget.dataset.choice;
    const profile = (storage.getProfile && storage.getProfile()) || {};
    const updated = Object.assign({}, profile, { reminderSchedule: choice, remindEnabled: choice !== 'none' });
    storage.setProfile(updated);
    if (cloud.saveProfile) cloud.saveProfile(updated).catch(() => {});
    track.track('reminder_optin', { choice });
    if (choice !== 'none' && wx.requestSubscribeMessage) {
      wx.requestSubscribeMessage({ tmplIds: ['c3xdncU-7EZv4m47saS7f83x9AH4rvGBBpOAvMyQjHQ'] }).catch(() => {});
    }
    this.setData({ reminderChoice: choice, showReminder: false });
    wx.showToast({ title: choice === 'none' ? '好的，不提醒' : '已设置训练提醒', icon: 'none' });
  },
  goHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  },
  save() {
    if (this.saving) return;
    this.saving = true;
    this.setData({ generating: true });
    const finalize = () => {
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
    };
    // 若背景照片尚未预载完成，先读取再绘制，避免画布取不到大图
    if (this.data.bg === 'photo' && this.data.photoPath && !this.data.photoReady) {
      wx.getImageInfo({
        src: this.data.photoPath,
        success: (info) => {
          this._photo = info.path || this.data.photoPath;
          this.setData({ photoReady: true });
          finalize();
        },
        fail: () => {
          this.saving = false;
          this.setData({ generating: false });
          wx.showToast({ title: '图片读取失败，请重试', icon: 'none' });
        }
      });
    } else {
      finalize();
    }
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
    const value = this.data.headline && this.data.headline.value;
    return share.appMessage(value ? ('我的训练打卡 · ' + value) : '我的训练打卡', '/pages/home/home');
  },
  onShareTimeline() {
    const value = this.data.headline && this.data.headline.value;
    return share.timeline(value ? ('我的训练打卡 · ' + value) : '我的训练打卡');
  }
});
