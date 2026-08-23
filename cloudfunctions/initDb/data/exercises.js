// 动作库:name/部位/器械/中英文术语;weighted=true 的动作按"性别+体重倍数"给推荐区间
// 与 cloudfunctions/initDb/index.js 保持同步
const exercises = [
  // ---- 胸 ----
  { id: 'bench', name: '杠铃卧推', enName: 'Barbell Bench Press', bodyPart: '胸', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'incline-bench', name: '上斜杠铃卧推', enName: 'Incline Barbell Press', bodyPart: '胸', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] }, female: { novice: [0.18, 0.3], intermediate: [0.3, 0.45], advanced: [0.45, 0.6] } } },
  { id: 'decline-bench', name: '下斜杠铃卧推', enName: 'Decline Barbell Press', bodyPart: '胸', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'db-bench', name: '哑铃卧推', enName: 'Dumbbell Bench Press', bodyPart: '胸', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.08, 0.14], intermediate: [0.14, 0.2], advanced: [0.2, 0.26] } } },
  { id: 'incline-db', name: '上斜哑铃卧推', enName: 'Incline Dumbbell Press', bodyPart: '胸', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.13, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.35] }, female: { novice: [0.07, 0.12], intermediate: [0.12, 0.18], advanced: [0.18, 0.24] } } },
  { id: 'chest-press', name: '坐姿推胸', enName: 'Machine Chest Press', bodyPart: '胸', equipment: '器械', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'peck-deck', name: '蝴蝶机夹胸', enName: 'Pec Deck Fly', bodyPart: '胸', equipment: '器械', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'cable-fly', name: '绳索夹胸', enName: 'Cable Crossover', bodyPart: '胸', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'fly', name: '哑铃飞鸟', enName: 'Dumbbell Fly', bodyPart: '胸', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] }, female: { novice: [0.05, 0.08], intermediate: [0.08, 0.12], advanced: [0.12, 0.15] } } },
  { id: 'pushup', name: '俯卧撑', enName: 'Push-Up', bodyPart: '胸', equipment: '自重', weighted: false },
  { id: 'dip', name: '双杠臂屈伸', enName: 'Chest Dip', bodyPart: '胸', equipment: '自重', weighted: false },

  // ---- 背 ----
  { id: 'deadlift', name: '硬拉', enName: 'Deadlift', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.6, 0.9], intermediate: [0.9, 1.2], advanced: [1.2, 1.5] }, female: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] } } },
  { id: 'row', name: '坐姿划船', enName: 'Seated Cable Row', bodyPart: '背', equipment: '器械', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'bentover-row', name: '杠铃俯身划船', enName: 'Barbell Bent-Over Row', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'one-arm-row', name: '单臂哑铃划船', enName: 'One-Arm Dumbbell Row', bodyPart: '背', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'lat-pulldown', name: '高位下拉', enName: 'Lat Pulldown', bodyPart: '背', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.45, 0.6], intermediate: [0.6, 0.75], advanced: [0.75, 0.9] }, female: { novice: [0.3, 0.45], intermediate: [0.45, 0.6], advanced: [0.6, 0.75] } } },
  { id: 'pullup', name: '引体向上', enName: 'Pull-Up', bodyPart: '背', equipment: '自重', weighted: false },
  { id: 'chinup', name: '反手引体向上', enName: 'Chin-Up', bodyPart: '背', equipment: '自重', weighted: false },
  { id: 'tbar-row', name: 'T杠划船', enName: 'T-Bar Row', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'shrug', name: '杠铃耸肩', enName: 'Barbell Shrug', bodyPart: '背', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.45], intermediate: [0.45, 0.6], advanced: [0.6, 0.75] } } },
  { id: 'face-pull', name: '面拉', enName: 'Face Pull', bodyPart: '背', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.2], intermediate: [0.2, 0.25], advanced: [0.25, 0.3] }, female: { novice: [0.1, 0.14], intermediate: [0.14, 0.18], advanced: [0.18, 0.22] } } },

  // ---- 腿 ----
  { id: 'squat', name: '杠铃深蹲', enName: 'Barbell Back Squat', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'front-squat', name: '杠铃前蹲', enName: 'Front Squat', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'legpress', name: '腿举', enName: 'Leg Press', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [1.0, 1.4], intermediate: [1.4, 1.8], advanced: [1.8, 2.2] }, female: { novice: [0.7, 1.0], intermediate: [1.0, 1.3], advanced: [1.3, 1.6] } } },
  { id: 'hack-squat', name: '哈克深蹲', enName: 'Hack Squat', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.5], intermediate: [0.5, 0.7], advanced: [0.7, 0.9] } } },
  { id: 'goblet-squat', name: '高脚杯深蹲', enName: 'Goblet Squat', bodyPart: '腿', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.15, 0.25], intermediate: [0.25, 0.35], advanced: [0.35, 0.45] }, female: { novice: [0.1, 0.18], intermediate: [0.18, 0.26], advanced: [0.26, 0.34] } } },
  { id: 'rdl', name: '罗马尼亚硬拉', enName: 'Romanian Deadlift', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.45], intermediate: [0.45, 0.6], advanced: [0.6, 0.75] } } },
  { id: 'lunge', name: '哑铃弓步蹲', enName: 'Dumbbell Lunge', bodyPart: '腿', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.15, 0.25], intermediate: [0.25, 0.35], advanced: [0.35, 0.45] }, female: { novice: [0.1, 0.18], intermediate: [0.18, 0.26], advanced: [0.26, 0.34] } } },
  { id: 'leg-extension', name: '腿屈伸', enName: 'Leg Extension', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'leg-curl', name: '俯卧腿弯举', enName: 'Lying Leg Curl', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'calf-raise', name: '站姿提踵', enName: 'Standing Calf Raise', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.45], intermediate: [0.45, 0.6], advanced: [0.6, 0.75] } } },
  { id: 'sumo-deadlift', name: '相扑硬拉', enName: 'Sumo Deadlift', bodyPart: '腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.55, 0.8], intermediate: [0.8, 1.1], advanced: [1.1, 1.4] }, female: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] } } },

  // ---- 臀腿 ----
  { id: 'hipbridge', name: '臀桥', enName: 'Hip Bridge', bodyPart: '臀腿', equipment: '自重', weighted: false },
  { id: 'hip-thrust', name: '杠铃臀推', enName: 'Barbell Hip Thrust', bodyPart: '臀腿', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] } } },
  { id: 'glute-kickback', name: '绳索后踢腿', enName: 'Cable Glute Kickback', bodyPart: '臀腿', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.1, 0.15], intermediate: [0.15, 0.2], advanced: [0.2, 0.25] }, female: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] } } },
  { id: 'hip-abduction', name: '坐姿腿外展', enName: 'Hip Abduction', bodyPart: '臀腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] } } },

  // ---- 肩 ----
  { id: 'ohp', name: '哑铃推举', enName: 'Dumbbell Shoulder Press', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] }, female: { novice: [0.08, 0.14], intermediate: [0.14, 0.2], advanced: [0.2, 0.26] } } },
  { id: 'barbell-ohp', name: '杠铃推举', enName: 'Overhead Press', bodyPart: '肩', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] }, female: { novice: [0.15, 0.25], intermediate: [0.25, 0.35], advanced: [0.35, 0.45] } } },
  { id: 'arnold-press', name: '阿诺德推举', enName: 'Arnold Press', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] }, female: { novice: [0.06, 0.1], intermediate: [0.1, 0.14], advanced: [0.14, 0.18] } } },
  { id: 'lateral-raise', name: '哑铃侧平举', enName: 'Dumbbell Lateral Raise', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.06, 0.1], intermediate: [0.1, 0.14], advanced: [0.14, 0.18] }, female: { novice: [0.04, 0.07], intermediate: [0.07, 0.1], advanced: [0.1, 0.13] } } },
  { id: 'front-raise', name: '哑铃前平举', enName: 'Dumbbell Front Raise', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.06, 0.1], intermediate: [0.1, 0.14], advanced: [0.14, 0.18] }, female: { novice: [0.04, 0.07], intermediate: [0.07, 0.1], advanced: [0.1, 0.13] } } },
  { id: 'rear-delt-fly', name: '俯身哑铃飞鸟', enName: 'Rear Delt Fly', bodyPart: '肩', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.06, 0.1], intermediate: [0.1, 0.14], advanced: [0.14, 0.18] }, female: { novice: [0.04, 0.07], intermediate: [0.07, 0.1], advanced: [0.1, 0.13] } } },
  { id: 'upright-row', name: '杠铃直立划船', enName: 'Barbell Upright Row', bodyPart: '肩', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },

  // ---- 手臂 ----
  { id: 'curl', name: '哑铃弯举', enName: 'Dumbbell Curl', bodyPart: '手臂', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] }, female: { novice: [0.05, 0.08], intermediate: [0.08, 0.12], advanced: [0.12, 0.15] } } },
  { id: 'barbell-curl', name: '杠铃弯举', enName: 'Barbell Curl', bodyPart: '手臂', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'hammer-curl', name: '锤式弯举', enName: 'Hammer Curl', bodyPart: '手臂', equipment: '哑铃', weighted: true, pcts: { male: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] }, female: { novice: [0.05, 0.08], intermediate: [0.08, 0.12], advanced: [0.12, 0.15] } } },
  { id: 'preacher-curl', name: '牧师椅弯举', enName: 'Preacher Curl', bodyPart: '手臂', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'pushdown', name: '绳索下压', enName: 'Triceps Pushdown', bodyPart: '手臂', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'skull-crusher', name: '仰卧杠铃臂屈伸', enName: 'Skull Crusher', bodyPart: '手臂', equipment: '杠铃', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'overhead-extension', name: '绳索过头臂屈伸', enName: 'Overhead Triceps Extension', bodyPart: '手臂', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.12, 0.18], intermediate: [0.18, 0.24], advanced: [0.24, 0.3] }, female: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] } } },
  { id: 'bench-dip', name: '凳上臂屈伸', enName: 'Bench Dip', bodyPart: '手臂', equipment: '自重', weighted: false },

  // ---- 核心 ----
  { id: 'crunch', name: '卷腹', enName: 'Crunch', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'plank', name: '平板支撑', enName: 'Plank', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'side-plank', name: '侧平板支撑', enName: 'Side Plank', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'russian-twist', name: '俄罗斯转体', enName: 'Russian Twist', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'leg-raise', name: '悬垂举腿', enName: 'Hanging Leg Raise', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'mountain-climber', name: '登山跑', enName: 'Mountain Climber', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'dead-bug', name: '死虫式', enName: 'Dead Bug', bodyPart: '核心', equipment: '自重', weighted: false },
  { id: 'cable-crunch', name: '绳索卷腹', enName: 'Cable Crunch', bodyPart: '核心', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.25, 0.35], intermediate: [0.35, 0.45], advanced: [0.45, 0.55] }, female: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] } } },

  // ---- ROSEN 固定器械(HM 挂片系列 / LJ 插片系列)----
  // ---- 胸 ----
  { id: 'rosen-hm-bench-press', name: 'ROSEN分动式平卧推胸机', enName: 'Plate-Loaded Chest Press (HM-1009)', bodyPart: '胸', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'rosen-hm-incline-press', name: 'ROSEN分动式上斜推胸机', enName: 'Incline Chest Press (HM-1004)', bodyPart: '胸', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] }, female: { novice: [0.18, 0.3], intermediate: [0.3, 0.45], advanced: [0.45, 0.6] } } },
  { id: 'rosen-hm-decline-press', name: 'ROSEN分动式下斜推胸机', enName: 'Decline Chest Press', bodyPart: '胸', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.4, 0.6], intermediate: [0.6, 0.8], advanced: [0.8, 1.0] }, female: { novice: [0.2, 0.35], intermediate: [0.35, 0.5], advanced: [0.5, 0.65] } } },
  { id: 'rosen-sel-chest-press', name: 'ROSEN插片坐姿推胸机', enName: 'Selectorized Chest Press', bodyPart: '胸', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.35, 0.5], intermediate: [0.5, 0.65], advanced: [0.65, 0.8] }, female: { novice: [0.18, 0.3], intermediate: [0.3, 0.42], advanced: [0.42, 0.55] } } },
  { id: 'rosen-cable-fly', name: 'ROSEN小飞鸟训练器', enName: 'Crossover (LJ-1027)', bodyPart: '胸', equipment: '绳索', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },

  // ---- 背 ----
  { id: 'rosen-hm-lat-pulldown', name: 'ROSEN分动式前高拉背机', enName: 'Plate-Loaded High Row (HM-1002)', bodyPart: '背', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'rosen-hm-seated-row', name: 'ROSEN分动式划艇拉背机', enName: 'Plate-Loaded Row (HM-1001)', bodyPart: '背', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'rosen-hm-low-row', name: 'ROSEN分动式划艇低拉背机', enName: 'Plate-Loaded Low Row (HM-1014)', bodyPart: '背', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'rosen-hm-pullover', name: 'ROSEN臂下压背肌机', enName: 'Pullover (HM-1017)', bodyPart: '背', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'rosen-sel-lat-pulldown', name: 'ROSEN插片高拉背机', enName: 'Selectorized Lat Pulldown', bodyPart: '背', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },
  { id: 'rosen-sel-seated-row', name: 'ROSEN插片坐姿划船机', enName: 'Selectorized Seated Row', bodyPart: '背', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.4, 0.55], intermediate: [0.55, 0.7], advanced: [0.7, 0.85] }, female: { novice: [0.25, 0.4], intermediate: [0.4, 0.55], advanced: [0.55, 0.7] } } },

  // ---- 腿 ----
  { id: 'rosen-leg-press45', name: 'ROSEN 45°腿举机', enName: '45° Leg Press', bodyPart: '腿', equipment: '器械', weighted: true, pcts: { male: { novice: [1.2, 1.6], intermediate: [1.6, 2.0], advanced: [2.0, 2.4] }, female: { novice: [0.8, 1.2], intermediate: [1.2, 1.5], advanced: [1.5, 1.8] } } },
  { id: 'rosen-hack-squat', name: 'ROSEN摆锤深蹲机', enName: 'Pendulum Squat', bodyPart: '腿', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.5], intermediate: [0.5, 0.7], advanced: [0.7, 0.9] } } },
  { id: 'rosen-sel-leg-extension', name: 'ROSEN插片腿屈伸机', enName: 'Selectorized Leg Extension', bodyPart: '腿', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'rosen-sel-leg-curl', name: 'ROSEN插片俯卧腿弯举机', enName: 'Selectorized Lying Leg Curl', bodyPart: '腿', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'rosen-sel-calf', name: 'ROSEN插片坐姿提踵机', enName: 'Selectorized Seated Calf Raise', bodyPart: '腿', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.3, 0.45], intermediate: [0.45, 0.6], advanced: [0.6, 0.75] } } },

  // ---- 肩 ----
  { id: 'rosen-hm-shoulder-press', name: 'ROSEN分动式推肩机', enName: 'Plate-Loaded Shoulder Press (HM-1020)', bodyPart: '肩', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } },
  { id: 'rosen-sel-shoulder-press', name: 'ROSEN坐式举肩训练器', enName: 'Seated Shoulder Press (LJ-1005)', bodyPart: '肩', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.18, 0.28], intermediate: [0.28, 0.38], advanced: [0.38, 0.48] }, female: { novice: [0.1, 0.18], intermediate: [0.18, 0.26], advanced: [0.26, 0.34] } } },
  { id: 'rosen-sel-lateral', name: 'ROSEN插片侧平举机', enName: 'Selectorized Lateral Raise', bodyPart: '肩', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.06, 0.1], intermediate: [0.1, 0.14], advanced: [0.14, 0.18] }, female: { novice: [0.04, 0.07], intermediate: [0.07, 0.1], advanced: [0.1, 0.13] } } },

  // ---- 手臂 ----
  { id: 'rosen-hm-bicep', name: 'ROSEN坐式二头肌训练器', enName: 'Plate-Loaded Biceps Curl (HM-1015)', bodyPart: '手臂', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'rosen-hm-tricep', name: 'ROSEN坐式下压三头肌训练器', enName: 'Plate-Loaded Triceps Extension (HM-1016)', bodyPart: '手臂', equipment: '悍马', weighted: true, pcts: { male: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] }, female: { novice: [0.1, 0.16], intermediate: [0.16, 0.22], advanced: [0.22, 0.28] } } },
  { id: 'rosen-sel-bicep', name: 'ROSEN二头肌训练器', enName: 'Biceps Curl (LJ-1002)', bodyPart: '手臂', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.12, 0.18], intermediate: [0.18, 0.24], advanced: [0.24, 0.3] }, female: { novice: [0.08, 0.12], intermediate: [0.12, 0.16], advanced: [0.16, 0.2] } } },

  // ---- 臀腿 ----
  { id: 'rosen-sel-hip', name: 'ROSEN大腿内外侧训练器', enName: 'Hip Adduction/Abduction (LJ-1017)', bodyPart: '臀腿', equipment: '插片机', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] } } },
  { id: 'rosen-hip-thrust', name: 'ROSEN臀推机', enName: 'Hip Thrust Machine', bodyPart: '臀腿', equipment: '器械', weighted: true, pcts: { male: { novice: [0.5, 0.7], intermediate: [0.7, 0.9], advanced: [0.9, 1.1] }, female: { novice: [0.35, 0.55], intermediate: [0.55, 0.75], advanced: [0.75, 0.95] } } },

  // ---- 核心 ----
  { id: 'rosen-ab-crunch', name: 'ROSEN腹肌训练器', enName: 'Ab Crunch Machine', bodyPart: '核心', equipment: '器械', weighted: true, pcts: { male: { novice: [0.25, 0.35], intermediate: [0.35, 0.45], advanced: [0.45, 0.55] }, female: { novice: [0.15, 0.22], intermediate: [0.22, 0.3], advanced: [0.3, 0.38] } } },
  { id: 'rosen-back-extension', name: 'ROSEN罗马椅挺身', enName: 'Back Extension Bench', bodyPart: '背', equipment: '器械', weighted: true, pcts: { male: { novice: [0.2, 0.3], intermediate: [0.3, 0.4], advanced: [0.4, 0.5] }, female: { novice: [0.12, 0.2], intermediate: [0.2, 0.28], advanced: [0.28, 0.36] } } }
];

module.exports = exercises;
