const PROFILE_KEY = 'jitie.profile';
const DRAFT_KEY = 'jitie.draft';
const CATALOG_KEY = 'jitie.catalog';

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
  wx.setStorageSync(CATALOG_KEY, catalog);
}

function loadCatalogCache() {
  return wx.getStorageSync(CATALOG_KEY) || null;
}

module.exports = {
  getProfile, setProfile, clearProfile,
  saveDraft, loadDraft, clearDraft,
  cacheCatalog, loadCatalogCache
};
