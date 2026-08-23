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
  },
  {
    id: 'rosen-machine-m', name: '铁馆器械 · 男版', goal: '增肌', genderHint: 'male', frequency: 3,
    exercises: [
      { exerciseId: 'rosen-hm-bench-press', sets: 4, repRange: [8, 12] },
      { exerciseId: 'rosen-hm-lat-pulldown', sets: 4, repRange: [10, 12] },
      { exerciseId: 'rosen-hm-seated-row', sets: 3, repRange: [10, 12] },
      { exerciseId: 'rosen-hm-shoulder-press', sets: 3, repRange: [8, 12] },
      { exerciseId: 'rosen-leg-press45', sets: 4, repRange: [10, 15] },
      { exerciseId: 'rosen-hm-bicep', sets: 3, repRange: [10, 15] }
    ]
  },
  {
    id: 'rosen-machine-f', name: '铁馆器械 · 女版', goal: '塑形', genderHint: 'female', frequency: 3,
    exercises: [
      { exerciseId: 'rosen-sel-chest-press', sets: 3, repRange: [10, 12] },
      { exerciseId: 'rosen-sel-lat-pulldown', sets: 3, repRange: [10, 12] },
      { exerciseId: 'rosen-hip-thrust', sets: 4, repRange: [12, 15] },
      { exerciseId: 'rosen-sel-hip', sets: 3, repRange: [15, 20] },
      { exerciseId: 'rosen-sel-leg-extension', sets: 3, repRange: [12, 15] },
      { exerciseId: 'rosen-sel-calf', sets: 3, repRange: [15, 20] }
    ]
  }
];

module.exports = templates;
