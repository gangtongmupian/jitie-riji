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
    myOpenid: '',
    tip: config.INVITE_TIP
  },
  onLoad() {
    share.enableShareMenu();
    this.load();
  },
  load() {
    let openid = '';
    cloud.ensureLogin().then((user) => {
      const profile = storage.getProfile() || {};
      openid = (user && user.openid) || profile.openid || '';
      this.setData({
        myOpenid: openid,
        rewardUnlocked: !!(user && user.inviteReward) || !!(profile && profile.inviteReward)
      });
      return cloud.getInviteStatus();
    }).then((d) => {
      this.setData({ inviteCount: d.inviteCount || 0, rewardUnlocked: !!(d.rewardUnlocked || this.data.rewardUnlocked) });
      if (openid) return cloud.call('qrcode', { scene: openid });
      return null;
    }).then((qr) => {
      if (qr && qr.fileID) this.setData({ qrFileID: qr.fileID });
      this.setData({ loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
  onShareAppMessage() {
    return share.appMessage('我在牛来举铁记录训练，邀请你一起打卡，解锁进阶计划！', '/pages/home/home');
  },
  onShareTimeline() {
    return share.timeline('我在牛来举铁记录训练，邀请你一起打卡，解锁进阶计划！');
  }
});
