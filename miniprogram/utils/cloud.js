const storage = require('./storage');
const bundledExercises = require('../data/exercises');
const bundledTemplates = require('../data/templates');

function call(name, data) {
  return wx.cloud.callFunction({ name, data }).then((res) => {
    const r = res.result;
    if (!r || r.ok === false) throw new Error((r && r.error) || '请求失败');
    return r.data;
  });
}

function ensureLogin() {
  return call('login').then((data) => {
    const user = data.user || null;
    if (user) {
      const profile = Object.assign({}, storage.getProfile(), user);
      storage.setProfile(profile);
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

function getCatalog() {
  const cached = storage.loadCatalogCache();
  if (cached && cached.exercises && cached.exercises.length) {
    return Promise.resolve(normalizeCatalog(cached));
  }
  return call('catalog').then((data) => {
    const catalog = normalizeCatalog({ exercises: data.exercises || [], templates: data.templates || [] });
    if (catalog.exercises.length || catalog.templates.length) storage.cacheCatalog(catalog);
    return catalog;
  }).catch(() => normalizeCatalog({ exercises: bundledExercises, templates: bundledTemplates }));
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
  return call('stats');
}

module.exports = { call, ensureLogin, getCatalog, saveProfile, saveWorkout, getStats };
