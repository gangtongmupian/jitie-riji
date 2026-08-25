const storage = require('./storage');
const bundledExercises = require('../data/exercises');
const bundledTemplates = require('../data/templates');

function call(name, data) {
  return wx.cloud.callFunction({ name, data }).then((res) => {
    const r = res.result;
    if (!r || r.ok === false) {
      const msg = (r && r.error) || '请求失败';
      console.error('[牛来举铁] 云函数', name, '失败:', msg);
      throw new Error(msg);
    }
    return r.data;
  }).catch((err) => {
    console.error('[牛来举铁] 云函数', name, '异常:', (err && err.message) || err);
    throw err;
  });
}

function ensureLogin(inviter) {
  return call('login', inviter ? { inviter } : {}).then((data) => {
    const user = data.user || null;
    if (user) {
      const profile = Object.assign({}, storage.getProfile(), user);
      storage.setProfile(profile);
      if (profile.openid && storage.getInviter() === profile.openid) storage.clearInviter();
      const app = getApp();
      if (app) app.globalData.profile = profile;
    }
    return user;
  });
}

function normalizeCatalog(catalog) {
  return {
    exercises: (catalog.exercises || []).map((e) => Object.assign({}, e, { id: e.id || e._id })),
    templates: (catalog.templates || []).map((t) => Object.assign({}, t, { id: t.id || t._id }))
  };
}

function mergeCustoms(catalog) {
  const customs = (storage.getCustomExercises() || []).map((e) => Object.assign({}, e, { id: e.id || e._id, custom: true }));
  if (!customs.length) return catalog;
  return { exercises: customs.concat(catalog.exercises), templates: catalog.templates };
}

function getCatalog() {
  const cached = storage.loadCatalogCache();
  if (cached && cached.exercises && cached.exercises.length) {
    return Promise.resolve(mergeCustoms(normalizeCatalog(cached)));
  }
  return call('catalog').then((data) => {
    const catalog = normalizeCatalog({ exercises: data.exercises || [], templates: data.templates || [] });
    if (catalog.exercises.length || catalog.templates.length) storage.cacheCatalog(catalog);
    return mergeCustoms(catalog);
  }).catch(() => mergeCustoms(normalizeCatalog({ exercises: bundledExercises, templates: bundledTemplates })));
}

function saveProfile(profile) {
  return call('saveProfile', profile).then((metrics) => {
    const merged = Object.assign({}, profile, metrics);
    storage.setProfile(merged);
    const app = getApp();
    if (app) app.globalData.profile = merged;
    return metrics;
  });
}

function saveWorkout(workout) {
  return call('saveWorkout', workout);
}

function getStats() {
  return call('stats', {});
}

function getDayStats(date) {
  return call('stats', { date });
}

function getInviteStatus() {
  return call('invite', {});
}

function deleteAccount() {
  return call('deleteAccount', {});
}

module.exports = { call, ensureLogin, getCatalog, saveProfile, saveWorkout, getStats, getDayStats, getInviteStatus, deleteAccount };
