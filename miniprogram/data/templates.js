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

module.exports = templates;
