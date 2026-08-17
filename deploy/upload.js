// 通过 miniprogram-ci 上传小程序代码到微信(无需开发者工具)
// 用法(先在 deploy/ 下执行 npm install):
//   set WX_APPID=你的AppID
//   set WX_PRIVATE_KEY_PATH=私钥文件路径(在 mp.weixin.qq.com 生成"小程序代码上传密钥")
//   set WX_VERSION=1.0.0
//   node upload.js
const ci = require('miniprogram-ci');

const appid = process.env.WX_APPID;
const keyPath = process.env.WX_PRIVATE_KEY_PATH;
if (!appid || !keyPath) {
  console.error('缺少环境变量:请设置 WX_APPID 和 WX_PRIVATE_KEY_PATH');
  process.exit(1);
}

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath: __dirname + '/..',
  privateKeyPath: keyPath,
  ignores: [
    'node_modules/**/*',
    'work/**/*',
    '.superpowers/**/*',
    'deploy/**/*',
    'outputs/**/*',
    'docs/**/*',
    'cloudfunctions/**/*',
    'tests/**/*'
  ]
});

ci.upload({
  project,
  version: process.env.WX_VERSION || '1.0.0',
  desc: process.env.WX_DESC || '举铁日记 MVP 首发',
  setting: {
    es6: true,
    minify: true,
    postcss: true,
    minifyWXSS: true,
    minifyWXML: true
  }
})
  .then((res) => {
    console.log('上传成功:', JSON.stringify(res));
  })
  .catch((e) => {
    console.error('上传失败:', e);
    process.exit(1);
  });
