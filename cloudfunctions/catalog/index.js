const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const [exercises, templates] = await Promise.all([
    db.collection('exercises').limit(100).get(),
    db.collection('templates').limit(100).get()
  ]);
  return { ok: true, data: { exercises: exercises.data, templates: templates.data } };
};
