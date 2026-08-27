const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event = {}) => {
  try {
    const scene = String(event.scene || 'share').slice(0, 32);
    const page = event.page || 'pages/home/home';
    const res = await cloud.openapi.wxacode.getUnlimited({
      scene,
      page,
      width: 430,
      checkPath: false
    });
    const upload = await cloud.uploadFile({
      cloudPath: 'qrcodes/' + Date.now() + '.png',
      fileContent: res.buffer
    });
    return { ok: true, data: { fileID: upload.fileID } };
  } catch (e) {
    console.error('[qrcode] 生成失败:', e);
    const msg = (e && (e.errMsg || e.message)) || String(e);
    return { ok: false, error: String(msg).slice(0, 300) };
  }
};
