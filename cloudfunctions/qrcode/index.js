const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const res = await cloud.openapi.wxacode.getUnlimited({
    scene: 'share',
    page: 'pages/home/home',
    width: 430,
    checkPath: false
  });
  const upload = await cloud.uploadFile({
    cloudPath: 'qrcodes/' + Date.now() + '.png',
    fileContent: res.buffer
  });
  return { ok: true, data: { fileID: upload.fileID } };
};
