const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const format = require('../../utils/format');
const share = require('../../utils/share');
const track = require('../../utils/track');
const suggest = require('../../utils/suggest');

Page({
  data: {
    loading: true,
    loadError: false,
    nickname: '',
    avatar: '',
    week: { count: 0, durationSec: 0, volume: 0 },
    weekText: { duration: '0 分钟', calories: '0 kcal' },
    recent: null,
    streak: 0,
    totalWorkouts: 0,
    achievements: [],
    suggestion: null,
    needProfile: true
  },
  onLoad(options) {
    const inviter = this.parseInviter(options);
    if (inviter && !storage.getProfile()) storage.setInviter(inviter);
    const source = this.parseSource(options);
    if (source) storage.setSource(source);
  },
  parseInviter(options) {
    const raw = (options && (options.inviter || options.scene)) || '';
    if (!raw) return '';
    let v = raw;
    if (v.indexOf('inviter=') >= 0) v = v.split('inviter=')[1] || '';
    try { v = decodeURIComponent(v); } catch (e) { /* 保持原值 */ }
    return v.replace(/[^0-9a-zA-Z_\-]/g, '');
  },
  parseSource(options) {
    const raw = (options && (options.source || options.scene)) || '';
    const s = decodeURIComponent(raw);
    if (s.indexOf('search') >= 0) return 'search';
    if (s.indexOf('invite') >= 0) return 'invite';
    if (s.indexOf('share') >= 0) return 'share';
    return storage.getInviter() ? 'invite' : 'direct';
  },
  onShow() {
    share.enableShareMenu();
    const profile = storage.getProfile();
    this.setData({ needProfile: !(profile && profile.gender) });
    track.track('home_view');
    this.refresh();
  },
  refresh() {
    cloud.getStats().then((data) => {
      const week = data.week || { count: 0, durationSec: 0, volume: 0 };
      const r = data.recent && data.recent[0];
      let recent = null;
      if (r) {
        const calories = Number(r.calories) || 0;
        recent = {
          date: r.date,
          mode: r.mode,
          totalSets: r.totalSets,
          exerciseCount: (r.exercises || []).length,
          calories,
          dateLabel: format.formatDate(r.date),
          displayText: calories > 0
            ? calories + ' kcal'
            : ((r.exercises || []).length) + ' 个动作 · ' + (r.totalSets || 0) + ' 组'
        };
      }
      this.setData({
        loading: false,
        loadError: false,
        nickname: (storage.getProfile() && storage.getProfile().nickname) || '牛来举铁',
        avatar: (storage.getProfile() && storage.getProfile().avatarFileID) || '',
        week,
        recent,
        streak: data.streak || 0,
        totalWorkouts: data.totalWorkouts || 0,
        achievements: data.achievements || [],
        weekText: {
          duration: format.formatDuration(week.durationSec),
          calories: (week.calories || 0) + ' kcal'
        }
      });
      const suggestion = suggest.suggest(r || null);
      if (suggestion.hasLast) track.track('suggestion_seen');
      this.setData({ suggestion });
    }).catch(() => {
      this.setData({ loading: false, loadError: true });
    });
  },
  retry() {
    this.setData({ loading: true, loadError: false });
    this.refresh();
  },
  start() {
    track.track('workout_start');
    wx.switchTab({ url: '/pages/record/record' });
  },
  goSetProfile() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },
  editProfile() {
    wx.showActionSheet({
      itemList: ['修改昵称', '更换头像'],
      success: (r) => {
        if (r.tapIndex === 0) this.editNickname();
        else if (r.tapIndex === 1) this.chooseAvatar();
      }
    });
  },
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const profile = storage.getProfile() || {};
        const openid = profile.openid || 'user';
        const ext = (file.tempFilePath.match(/\.(\w+)$/) || [])[1] || 'jpg';
        wx.showLoading({ title: '上传中' });
        wx.cloud.uploadFile({
          cloudPath: 'avatars/' + openid + '-' + Date.now() + '.' + ext,
          filePath: file.tempFilePath,
          success: (up) => {
            const merged = Object.assign({}, storage.getProfile(), { avatarFileID: up.fileID });
            storage.setProfile(merged);
            this.setData({ avatar: up.fileID });
            cloud.saveProfile(merged).then(() => {
              wx.hideLoading();
              wx.showToast({ title: '头像已更新', icon: 'success' });
            }).catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '头像已保存在本地', icon: 'none' });
            });
          },
          fail: () => {
            wx.hideLoading();
            this.toast('上传失败，请重试');
          }
        });
      },
      fail: () => {}
    });
  },
  editNickname() {
    const profile = storage.getProfile();
    const current = (profile && profile.nickname) || '';
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '输入你的昵称',
      content: current,
      confirmText: '保存',
      success: (r) => {
        if (!r.confirm) return;
        const name = (r.content || '').trim().slice(0, 8);
        if (!name) return this.toast('昵称不能为空');
        const merged = Object.assign({}, storage.getProfile(), { nickname: name });
        storage.setProfile(merged);
        this.setData({ nickname: name });
        cloud.saveProfile(merged).then(() => {
          wx.showToast({ title: '昵称已更新', icon: 'success' });
        }).catch(() => {
          wx.showToast({ title: '昵称已保存在本地', icon: 'none' });
        });
      }
    });
  },
  toast(title) {
    wx.showToast({ title, icon: 'none' });
  },
  onShareAppMessage() {
    const count = (this.data.week && this.data.week.count) || 0;
    const title = count > 0 ? ('牛来举铁 · 本周训练 ' + count + ' 次，一起变强！') : '牛来举铁 · 科学健身记录';
    return share.appMessage(title, '/pages/home/home');
  },
  onShareTimeline() {
    const count = (this.data.week && this.data.week.count) || 0;
    return share.timeline(count > 0 ? ('牛来举铁 · 本周训练 ' + count + ' 次，一起变强！') : '牛来举铁 · 科学健身记录');
  }
});
