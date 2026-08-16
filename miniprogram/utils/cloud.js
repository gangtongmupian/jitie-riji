function call(name, data) {
  return wx.cloud.callFunction({ name, data }).then((res) => {
    const r = res.result;
    if (!r || r.ok === false) {
      throw new Error((r && r.error) || '请求失败');
    }
    return r.data;
  });
}

module.exports = { call };
