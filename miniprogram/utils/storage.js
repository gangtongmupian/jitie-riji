const PROFILE_KEY = 'jitie.profile';
const DRAFT_KEY = 'jitie.draft';
const CATALOG_KEY = 'jitie.catalog.v3';
const CATALOG_TTL = 24 * 60 * 60 * 1000;
const CUSTOM_KEY = 'jitie.customExercises';
const INVITER_KEY = 'jitie.inviter';
const SOURCE_KEY = 'jitie.source';

function getProfile() {
  return wx.getStorageSync(PROFILE_KEY) || null;
}

function setProfile(profile) {
  wx.setStorageSync(PROFILE_KEY, profile);
}

function clearProfile() {
  wx.removeStorageSync(PROFILE_KEY);
}

function saveDraft(workout) {
  wx.setStorageSync(DRAFT_KEY, workout);
}

function loadDraft() {
  return wx.getStorageSync(DRAFT_KEY) || null;
}

function clearDraft() {
  wx.removeStorageSync(DRAFT_KEY);
}

function cacheCatalog(catalog) {
  wx.setStorageSync(CATALOG_KEY, {
    savedAt: Date.now(),
    exercises: catalog.exercises,
    templates: catalog.templates
  });
}

function loadCatalogCache() {
  const c = wx.getStorageSync(CATALOG_KEY);
  if (!c || !c.exercises || !c.exercises.length) return null;
  if (Date.now() - (c.savedAt || 0) > CATALOG_TTL) return null;
  return { exercises: c.exercises, templates: c.templates };
}

function getCustomExercises() {
  return wx.getStorageSync(CUSTOM_KEY) || [];
}

function addCustomExercise(exercise) {
  const list = getCustomExercises();
  list.push(exercise);
  wx.setStorageSync(CUSTOM_KEY, list);
  return list;
}

function getInviter() {
  return wx.getStorageSync(INVITER_KEY) || '';
}

function setInviter(openid) {
  if (openid) wx.setStorageSync(INVITER_KEY, openid);
}

function clearInviter() {
  wx.removeStorageSync(INVITER_KEY);
}

function getSource() {
  return wx.getStorageSync(SOURCE_KEY) || '';
}

function setSource(source) {
  if (source) wx.setStorageSync(SOURCE_KEY, source);
}

function clearAllLocal() {
  wx.removeStorageSync(PROFILE_KEY);
  wx.removeStorageSync(DRAFT_KEY);
  wx.removeStorageSync(CATALOG_KEY);
  wx.removeStorageSync(CUSTOM_KEY);
  wx.removeStorageSync(INVITER_KEY);
  wx.removeStorageSync(SOURCE_KEY);
  wx.removeStorageSync('jitie.lastWorkout');
  wx.removeStorageSync('jitie.activeRest');
}

module.exports = {
  getProfile, setProfile, clearProfile,
  saveDraft, loadDraft, clearDraft,
  cacheCatalog, loadCatalogCache,
  getCustomExercises, addCustomExercise,
  getInviter, setInviter, clearInviter, getSource, setSource,
  clearAllLocal
};
