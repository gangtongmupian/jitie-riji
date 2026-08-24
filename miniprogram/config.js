// 运营配置：留空时对应功能自动隐藏，不影响上线
module.exports = {
  // 订阅消息模板 ID：在微信公众平台「订阅消息」申请模板后填入
  TRAIN_REMIND_TMPL: '',
  // 交流群二维码（云存储 fileID 或 https 图片链接），留空则隐藏「加入交流群」入口
  GROUP_QR: '',
  // 客服微信号，留空则隐藏「联系客服」入口
  SERVICE_WECHAT: '',
  // 邀请文案
  INVITE_TIP: '邀请 1 位好友加入，双方共同解锁「进阶计划」'
};
