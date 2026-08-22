const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const users = db.collection('users');

const BODY_FAT = {
  male: { underweight: '<10%', normal: '10–20%', overweight: '20–25%', obese: '>25%' },
  female: { underweight: '<15%', normal: '15–25%', overweight: '25–30%', obese: '>30%' }
};

function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}
function bmiLevel(v) {
  if (v < 18.5) return 'underweight';
  if (v < 24) return 'normal';
  if (v < 28) return 'overweight';
  return 'obese';
}
function bmr(gender, age, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const gender = event.gender;
  const age = Number(event.age);
  const heightCm = Number(event.heightCm);
  const weightKg = Number(event.weightKg);
  const goal = event.goal;
  const frequency = event.frequency == null ? null : Number(event.frequency);
  const nickname = event.nickname === undefined ? null : String(event.nickname).trim().slice(0, 12);

  if (!(gender === 'male' || gender === 'female')) return { ok: false, error: '请选择性别' };
  if (!(age >= 6 && age <= 100)) return { ok: false, error: '年龄需在 6–100 岁之间' };
  if (!(heightCm >= 80 && heightCm <= 250)) return { ok: false, error: '身高需在 80–250cm 之间' };
  if (!(weightKg >= 20 && weightKg <= 300)) return { ok: false, error: '体重需在 20–300kg 之间' };
  if (!goal) return { ok: false, error: '请选择健身目标' };
  if (frequency != null && !(frequency >= 1 && frequency <= 7)) return { ok: false, error: '每周训练频率需在 1–7 次' };

  const bmiValue = bmi(weightKg, heightCm);
  const level = bmiLevel(bmiValue);
  const metrics = {
    bmi: bmiValue,
    bmiLevel: level,
    bodyFatRef: BODY_FAT[gender][level],
    bmr: bmr(gender, age, heightCm, weightKg)
  };

  const data = { gender, age, heightCm, weightKg, goal, ...metrics, updatedAt: db.serverDate() };
  if (frequency != null) data.frequency = frequency;
  if (nickname !== null) data.nickname = nickname;

  const found = await users.where({ openid: OPENID }).limit(1).get();
  if (found.data[0]) {
    await users.doc(found.data[0]._id).update({ data });
  } else {
    await users.add({ data: { openid: OPENID, createdAt: db.serverDate(), ...data } });
  }
  return { ok: true, data: metrics };
};
