const BMI_LABELS = { underweight: '偏瘦', normal: '正常', overweight: '超重', obese: '肥胖' };
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

function bmiLevelLabel(level) {
  return BMI_LABELS[level] || '未知';
}

function bodyFatRange(gender, level) {
  return (BODY_FAT[gender] && BODY_FAT[gender][level]) || '';
}

function bmr(gender, age, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

function roundWeight(v) {
  return Math.round(v / 2.5) * 2.5;
}

function recommendedWeight(gender, weightKg, exercise) {
  if (!exercise || !exercise.weighted) return null;
  const pcts = exercise.pcts && exercise.pcts[gender];
  if (!pcts) return null;
  const out = {};
  ['novice', 'intermediate', 'advanced'].forEach((k) => {
    const range = pcts[k];
    out[k] = [roundWeight(weightKg * range[0]), roundWeight(weightKg * range[1])];
  });
  return out;
}

function validateProfile(p) {
  const errors = [];
  if (p.gender !== 'male' && p.gender !== 'female') errors.push('请选择性别');
  if (!(p.age >= 6 && p.age <= 100)) errors.push('年龄需在 6–100 岁之间');
  if (!(p.heightCm >= 80 && p.heightCm <= 250)) errors.push('身高需在 80–250cm 之间');
  if (!(p.weightKg >= 20 && p.weightKg <= 300)) errors.push('体重需在 20–300kg 之间');
  if (!p.goal) errors.push('请选择健身目标');
  if (p.frequency != null && !(p.frequency >= 1 && p.frequency <= 7)) errors.push('每周训练频率需在 1–7 次');
  return { ok: errors.length === 0, errors };
}

module.exports = { bmi, bmiLevel, bmiLevelLabel, bodyFatRange, bmr, recommendedWeight, roundWeight, validateProfile };
