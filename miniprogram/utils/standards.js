const BMI_LABELS = {
  underweight: '偏瘦',
  normal: '正常',
  overweight: '超重',
  obese: '肥胖'
};

function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function bmiLevel(bmiValue) {
  if (bmiValue < 18.5) return 'underweight';
  if (bmiValue < 24) return 'normal';
  if (bmiValue < 28) return 'overweight';
  return 'obese';
}

function bmiLevelLabel(level) {
  return BMI_LABELS[level] || '未知';
}

function bodyFatRange(gender) {
  return gender === 'female'
    ? { min: 15, max: 25 }
    : { min: 10, max: 20 };
}

function bmr(gender, age, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

function strengthRange(weightKg, pctMin, pctMax) {
  const round25 = (v) => Math.round(v / 2.5) * 2.5;
  return { min: round25(weightKg * pctMin), max: round25(weightKg * pctMax) };
}

function validateProfile(p) {
  const errors = [];
  if (!p.gender || (p.gender !== 'male' && p.gender !== 'female')) errors.push('请选择性别');
  if (!(p.age >= 6 && p.age <= 100)) errors.push('年龄需在 6–100 岁之间');
  if (!(p.heightCm >= 80 && p.heightCm <= 250)) errors.push('身高需在 80–250cm 之间');
  if (!(p.weightKg >= 20 && p.weightKg <= 300)) errors.push('体重需在 20–300kg 之间');
  if (!p.goal) errors.push('请选择健身目标');
  if (!(p.frequency >= 2 && p.frequency <= 7)) errors.push('每周训练频率需在 2–7 次');
  return { ok: errors.length === 0, errors };
}

module.exports = {
  bmi, bmiLevel, bmiLevelLabel, bodyFatRange, bmr, strengthRange, validateProfile
};
