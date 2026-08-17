// 初始化云数据库:自动创建集合并写入种子数据(幂等,可重复执行)
// 注意:与 miniprogram/data/exercises.js、templates.js 保持同步(引导期专用)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = ['users', 'exercises', 'templates', 'workouts', 'prs'];

const exercises = [
  { id: 'squat', name: '杠铃深蹲', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'bench', name: '杠铃卧推', bodyPart: '胸', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'deadlift', name: '硬拉', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.6, 0.9], intermediate: [0.9, 1.2], advanced: [1.2, 1.5] }, female: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] } } },
  { id: 'row', name: '坐姿划船', bodyPart: '背', equipment: '器械', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'ohp', name: '哑铃推举', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] }, female: { novice: [0.08, 0.14], intermediate: [0.14, 0.2], advanced: [0.2, 0.26] } } },
  { id: 'curl', name: '哑铃弯举', bodyPart: '手臂', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] }, female: { novice: [0.05, 0.08], intermediate: [0.08, 0.12], advanced: [0.12, 0.15] } } },
  { id: 'pushdown', name: '绳索下压', bodyPart: '手臂', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'legpress', name: '腿举', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [1.0, 1.4], intermediate: [1.4, 1.8], advanced: [1.8, 2.2] }, female: { novice: [0.7, 1.0], intermediate: [1.0, 1.3], advanced: [1.3, 1.6] } } },
  { id: 'pullup', name: '引体向上', bodyPart: '背', equipment: '自重', weighted: false },
  { id: 'pushup', name: '俯卧撑', bodyPart: '胸', equipment: '自重', weighted: false },
  { id: 'crunch', name: '卷腹', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'hipbridge', name: '臀桥', bodyPart: '臀腿', equipment: '自重', weighted: false }
];

const templates = [
  {
    id: 'full-body-m', name: '全身分化 · 男版', goal: '减脂', genderHint: 'male', frequency: 3,
    exercises: [
      { exerciseId: 'squat', sets: 4, repRange: [8, 12] },
      { exerciseId: 'bench', sets: 4, repRange: [8, 12] },
      { exerciseId: 'row', sets: 3, repRange: [10, 12] },
      { exerciseId: 'ohp', sets: 3, repRange: [10, 12] }
    ]
  },
  {
    id: 'full-body-f', name: '全身分化 · 女版', goal: '减脂', genderHint: 'female', frequency: 3,
    exercises: [
      { exerciseId: 'hipbridge', sets: 4, repRange: [12, 15] },
      { exerciseId: 'legpress', sets: 4, repRange: [10, 12] },
      { exerciseId: 'row', sets: 3, repRange: [10, 12] },
      { exerciseId: 'pushup', sets: 3, repRange: [8, 15] }
    ]
  },
  {
    id: 'ppl', name: '推-拉-腿 PPL', goal: '增肌', genderHint: 'all', frequency: 5,
    exercises: [
      { exerciseId: 'bench', sets: 4, repRange: [8, 12] },
      { exerciseId: 'ohp', sets: 3, repRange: [8, 12] },
      { exerciseId: 'pushdown', sets: 3, repRange: [10, 15] },
      { exerciseId: 'pullup', sets: 4, repRange: [6, 10] },
      { exerciseId: 'row', sets: 3, repRange: [8, 12] },
      { exerciseId: 'squat', sets: 4, repRange: [6, 10] }
    ]
  },
  {
    id: 'upper-lower', name: '上下肢分化', goal: '增力', genderHint: 'all', frequency: 4,
    exercises: [
      { exerciseId: 'bench', sets: 5, repRange: [3, 6] },
      { exerciseId: 'row', sets: 4, repRange: [5, 8] },
      { exerciseId: 'ohp', sets: 3, repRange: [5, 8] },
      { exerciseId: 'squat', sets: 5, repRange: [3, 6] },
      { exerciseId: 'deadlift', sets: 3, repRange: [3, 5] }
    ]
  }
];

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

async function seed(name, rows) {
  let added = 0;
  for (const row of rows) {
    const { id, ...rest } = row;
    const col = db.collection(name);
    const found = await col.doc(id).get().catch(() => null);
    if (!found || !found.data) {
      await col.doc(id).set({ data: Object.assign({}, rest) });
      added += 1;
    }
  }
  return added;
}

exports.main = async () => {
  const created = await ensureCollections();
  const exAdded = await seed('exercises', exercises);
  const tpAdded = await seed('templates', templates);
  return {
    ok: true,
    data: {
      createdCollections: created,
      exercisesAdded: exAdded,
      templatesAdded: tpAdded
    }
  };
};
