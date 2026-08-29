const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function getAll(collection) {
  const MAX = 1000;
  const first = await db.collection(collection).limit(MAX).get();
  if (first.data.length < MAX) return first.data;
  const rest = await db.collection(collection).skip(MAX).limit(MAX).get();
  return first.data.concat(rest.data);
}

exports.main = async () => {
  const [exercises, templates] = await Promise.all([
    getAll('exercises'),
    getAll('templates')
  ]);
  return { ok: true, data: { exercises, templates } };
};
