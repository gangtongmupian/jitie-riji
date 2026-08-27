const cloud = require('../../utils/cloud');
const storage = require('../../utils/storage');
const config = require('../../config');
const share = require('../../utils/share');

Page({
  data: {
    loading: true,
    inviteCount: 0,
    rewardUnlocked: false,
    qrFileID: '',
    qrError: '',
    myOpenid: '',
    tip: config.INVITE_TIP
  },
  onLoad() {
    share.enableShareMenu();
    this.load();
  },
  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
  load() {
    let openid = '';
    this.setData({ qrError: '' });
    return cloud.ensureLogin().then((user) => {
      const profile = storage.getProfile() || {};
      openid = (user && user.openid) || profile.openid || '';
      this.setData({
        myOpenid: openid,
        rewardUnlocked: !!(user && user.inviteReward) || !!(profile && profile.inviteReward)
      });
      return cloud.getInviteStatus();
    }).then((d) => {
      this.setData({ inviteCount: d.inviteCount || 0, rewardUnlocked: !!(d.rewardUnlocked || this.data.rewardUnlocked) });
      if (!openid) return null;
      return this.genQr(openid);
    }).then((qr) => {
      if (qr && qr.fileID) this.setData({ qrFileID: qr.fileID });
      this.setData({ loading: false });
    }).catch((err) => {
      console.error('[invite] 加载失败:', err);
      this.setData({ loading: false });
      this.setData({ qrError: '二维码生成失败，请检查网络后重试' });
    });
  },
  genQr(openid) {
    return cloud.call('qrcode', { scene: openid }).then((qr) => {
      if (qr && qr.fileID) {
        this.setData({ qrFileID: qr.fileID, qrError: '' });
      } else {
        throw new Error('二维码数据为空');
      }
      return qr;
    }).catch((err) => {
      console.error('[invite] 二维码生成失败:', err);
      this.setData({ qrError: '二维码生成失败，请检查网络后重试' });
      throw err;
    });
  },
  retryQr() {
    this.setData({ qrFileID: '', qrError: '', loading: true });
    if (this.data.myOpenid) {
      this.genQr(this.data.myOpenid).catch(() => {}).then(() => this.setData({ loading: false }));
    } else {
      this.load();
    }
  },
  onShareAppMessage() {
    return share.appMessage('我在牛来举铁记录训练，邀请你一起打卡，解锁进阶计划！', '/pages/home/home');
  },
  onShareTimeline() {
    return share.timeline('我在牛来举铁记录训练，邀请你一起打卡，解锁进阶计划！');
  }
});
