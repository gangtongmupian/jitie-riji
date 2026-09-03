// 初始化云数据库:自动创建集合并同步种子数据(幂等,可重复执行)
// 动作库与模板与 miniprogram/data 保持单一来源(部署时随函数目录上传)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = ['users', 'exercises', 'templates', 'workouts', 'invites', 'events'];
const exercises = require('./data/exercises');
const templates = require('./data/templates');

async function ensureCollections() {
  const created = [];
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      created.push(name);
    } catch (e) {
      // 集合已存在时忽略
    }
  }
  return created;
}

// 幂等同步:按 id 覆盖写(存在则更新,不存在则创建)
async function seed(name, rows) {
  let count = 0;
  for (const row of rows) {
    const { id, ...rest } = row;
    await db.collection(name).doc(id).set({ data: Object.assign({}, rest) });
    count += 1;
  }
  return count;
}

exports.main = async () => {
  const created = await ensureCollections();
  const exercisesSynced = await seed('exercises', exercises);
  const templatesSynced = await seed('templates', templates);
  return {
    ok: true,
    data: {
      createdCollections: created,
      exercisesSynced,
      templatesSynced
    }
  };
};
