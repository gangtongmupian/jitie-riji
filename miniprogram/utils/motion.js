// 动作动画与器械图示解析
// - resolveMotion: 按动作 id 返回动画类型(火柴人骨架往复演示)
// - resolveGlyph: 按动作 id 返回器械图示 key(images/glyphs/<key>.png)
// - poseAt: 给定动画类型与相位 t(0..1) 返回插值后的骨架姿态
// 坐标空间: x 0..100, y 0..100(y 向下), 地面约 y=84

const MOTIONS = {
  'back-extension': { view: 'side', keys: [{ head: { x: 40, y: 48 }, neck: { x: 42, y: 52 }, hip: { x: 50, y: 62 }, knee: { x: 56, y: 70 }, ankle: { x: 62, y: 82 }, foot: { x: 66, y: 82 }, shoulder: { x: 43, y: 54 }, elbow: { x: 46, y: 60 }, wrist: { x: 44, y: 66 } }, { head: { x: 36, y: 36 }, neck: { x: 38, y: 42 }, hip: { x: 50, y: 62 }, knee: { x: 56, y: 70 }, ankle: { x: 62, y: 82 }, foot: { x: 66, y: 82 }, shoulder: { x: 39, y: 44 }, elbow: { x: 42, y: 50 }, wrist: { x: 40, y: 56 } }] },
  'bench-press': { view: 'side', keys: [{ head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 51, y: 64 }, wrist: { x: 54, y: 60 } }, { head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 52, y: 60 }, wrist: { x: 52, y: 50 } }] },
  'calf-raise': { view: 'side', keys: [{ head: { x: 50, y: 16 }, neck: { x: 50, y: 22 }, hip: { x: 50, y: 40 }, knee: { x: 50, y: 56 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 25 }, elbow: { x: 47, y: 36 }, wrist: { x: 47, y: 48 } }, { head: { x: 50, y: 12 }, neck: { x: 50, y: 18 }, hip: { x: 50, y: 36 }, knee: { x: 50, y: 52 }, ankle: { x: 50, y: 78 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 21 }, elbow: { x: 47, y: 32 }, wrist: { x: 47, y: 44 } }] },
  'chest-fly': { view: 'front', keys: [{ head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 41, y: 34 }, elbow_l: { x: 27, y: 38 }, wrist_l: { x: 15, y: 44 }, shoulder_r: { x: 59, y: 34 }, elbow_r: { x: 73, y: 38 }, wrist_r: { x: 85, y: 44 } }, { head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 43, y: 34 }, elbow_l: { x: 42, y: 26 }, wrist_l: { x: 50, y: 30 }, shoulder_r: { x: 57, y: 34 }, elbow_r: { x: 58, y: 26 }, wrist_r: { x: 50, y: 30 } }] },
  'crunch': { view: 'side', keys: [{ head: { x: 28, y: 61 }, neck: { x: 33, y: 63 }, hip: { x: 48, y: 64 }, knee: { x: 57, y: 66 }, ankle: { x: 64, y: 70 }, foot: { x: 68, y: 71 }, shoulder: { x: 35, y: 62 }, elbow: { x: 36, y: 70 }, wrist: { x: 35, y: 76 } }, { head: { x: 43, y: 51 }, neck: { x: 46, y: 55 }, hip: { x: 48, y: 64 }, knee: { x: 57, y: 66 }, ankle: { x: 64, y: 70 }, foot: { x: 68, y: 71 }, shoulder: { x: 44, y: 57 }, elbow: { x: 45, y: 64 }, wrist: { x: 44, y: 70 } }] },
  'curl': { view: 'front', keys: [{ head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 42, y: 34 }, elbow_l: { x: 41, y: 47 }, wrist_l: { x: 40, y: 60 }, shoulder_r: { x: 58, y: 34 }, elbow_r: { x: 59, y: 47 }, wrist_r: { x: 60, y: 60 } }, { head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 42, y: 34 }, elbow_l: { x: 44, y: 43 }, wrist_l: { x: 48, y: 34 }, shoulder_r: { x: 58, y: 34 }, elbow_r: { x: 56, y: 43 }, wrist_r: { x: 52, y: 34 } }] },
  'dead-bug': { view: 'side', keys: [{ head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 38, y: 74 }, knee: { x: 38, y: 78 }, ankle: { x: 38, y: 82 }, foot: { x: 42, y: 82 }, shoulder: { x: 54, y: 71 }, elbow: { x: 52, y: 60 }, wrist: { x: 56, y: 52 } }, { head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 38, y: 74 }, knee: { x: 42, y: 72 }, ankle: { x: 48, y: 68 }, foot: { x: 52, y: 66 }, shoulder: { x: 54, y: 71 }, elbow: { x: 50, y: 56 }, wrist: { x: 48, y: 48 } }] },
  'deadlift': { view: 'side', keys: [{ head: { x: 50, y: 18 }, neck: { x: 50, y: 24 }, hip: { x: 50, y: 42 }, knee: { x: 50, y: 56 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 27 }, elbow: { x: 48, y: 46 }, wrist: { x: 49, y: 64 } }, { head: { x: 42, y: 30 }, neck: { x: 40, y: 35 }, hip: { x: 34, y: 56 }, knee: { x: 48, y: 66 }, ankle: { x: 52, y: 84 }, foot: { x: 58, y: 84 }, shoulder: { x: 42, y: 38 }, elbow: { x: 47, y: 54 }, wrist: { x: 50, y: 68 } }] },
  'decline-press': { view: 'side', keys: [{ head: { x: 65, y: 62 }, neck: { x: 60, y: 66 }, hip: { x: 38, y: 74 }, knee: { x: 29, y: 74 }, ankle: { x: 20, y: 73 }, foot: { x: 16, y: 73 }, shoulder: { x: 58, y: 65 }, elbow: { x: 53, y: 62 }, wrist: { x: 56, y: 58 } }, { head: { x: 65, y: 62 }, neck: { x: 60, y: 66 }, hip: { x: 38, y: 74 }, knee: { x: 29, y: 74 }, ankle: { x: 20, y: 73 }, foot: { x: 16, y: 73 }, shoulder: { x: 58, y: 65 }, elbow: { x: 58, y: 56 }, wrist: { x: 58, y: 47 } }] },
  'dip': { view: 'side', keys: [{ head: { x: 52, y: 30 }, neck: { x: 52, y: 36 }, hip: { x: 52, y: 58 }, knee: { x: 50, y: 70 }, ankle: { x: 49, y: 82 }, foot: { x: 53, y: 82 }, shoulder: { x: 50, y: 38 }, elbow: { x: 49, y: 46 }, wrist: { x: 49, y: 55 } }, { head: { x: 52, y: 34 }, neck: { x: 52, y: 40 }, hip: { x: 52, y: 62 }, knee: { x: 50, y: 73 }, ankle: { x: 49, y: 83 }, foot: { x: 53, y: 83 }, shoulder: { x: 50, y: 42 }, elbow: { x: 47, y: 50 }, wrist: { x: 46, y: 59 } }] },
  'face-pull': { view: 'side', keys: [{ head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 52, y: 36 }, wrist: { x: 52, y: 46 } }, { head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 44, y: 30 }, wrist: { x: 46, y: 36 } }] },
  'front-raise': { view: 'side', keys: [{ head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 48, y: 38 }, wrist: { x: 48, y: 48 } }, { head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 54, y: 20 }, wrist: { x: 58, y: 12 } }] },
  'glute-kickback': { view: 'side', keys: [{ head: { x: 36, y: 56 }, neck: { x: 38, y: 60 }, hip: { x: 48, y: 66 }, knee: { x: 50, y: 70 }, ankle: { x: 52, y: 80 }, foot: { x: 56, y: 80 }, shoulder: { x: 40, y: 62 }, elbow: { x: 44, y: 68 }, wrist: { x: 42, y: 74 } }, { head: { x: 36, y: 56 }, neck: { x: 38, y: 60 }, hip: { x: 48, y: 66 }, knee: { x: 50, y: 70 }, ankle: { x: 56, y: 60 }, foot: { x: 60, y: 57 }, shoulder: { x: 40, y: 62 }, elbow: { x: 44, y: 68 }, wrist: { x: 42, y: 74 } }] },
  'hack-squat': { view: 'side', keys: [{ head: { x: 50, y: 16 }, neck: { x: 50, y: 22 }, hip: { x: 50, y: 40 }, knee: { x: 51, y: 54 }, ankle: { x: 52, y: 82 }, foot: { x: 58, y: 82 }, shoulder: { x: 49, y: 25 }, elbow: { x: 48, y: 34 }, wrist: { x: 49, y: 42 } }, { head: { x: 56, y: 38 }, neck: { x: 54, y: 44 }, hip: { x: 48, y: 62 }, knee: { x: 60, y: 70 }, ankle: { x: 58, y: 82 }, foot: { x: 64, y: 82 }, shoulder: { x: 53, y: 46 }, elbow: { x: 53, y: 54 }, wrist: { x: 53, y: 61 } }] },
  'hip-abduction': { view: 'front', keys: [{ head: { x: 50, y: 22 }, neck: { x: 50, y: 29 }, hip: { x: 50, y: 52 }, knee_l: { x: 44, y: 68 }, ankle_l: { x: 44, y: 84 }, knee_r: { x: 56, y: 68 }, ankle_r: { x: 56, y: 84 }, shoulder_l: { x: 42, y: 32 }, elbow_l: { x: 40, y: 43 }, wrist_l: { x: 39, y: 54 }, shoulder_r: { x: 58, y: 32 }, elbow_r: { x: 60, y: 43 }, wrist_r: { x: 61, y: 54 } }, { head: { x: 50, y: 22 }, neck: { x: 50, y: 29 }, hip: { x: 50, y: 52 }, knee_l: { x: 36, y: 70 }, ankle_l: { x: 30, y: 84 }, knee_r: { x: 64, y: 70 }, ankle_r: { x: 70, y: 84 }, shoulder_l: { x: 42, y: 32 }, elbow_l: { x: 40, y: 43 }, wrist_l: { x: 39, y: 54 }, shoulder_r: { x: 58, y: 32 }, elbow_r: { x: 60, y: 43 }, wrist_r: { x: 61, y: 54 } }] },
  'hip-thrust': { view: 'side', keys: [{ head: { x: 31, y: 65 }, neck: { x: 36, y: 66 }, hip: { x: 48, y: 72 }, knee: { x: 58, y: 68 }, ankle: { x: 66, y: 66 }, foot: { x: 70, y: 67 }, shoulder: { x: 35, y: 64 }, elbow: { x: 34, y: 70 }, wrist: { x: 34, y: 76 } }, { head: { x: 31, y: 61 }, neck: { x: 36, y: 63 }, hip: { x: 48, y: 60 }, knee: { x: 58, y: 66 }, ankle: { x: 66, y: 66 }, foot: { x: 70, y: 67 }, shoulder: { x: 35, y: 62 }, elbow: { x: 34, y: 68 }, wrist: { x: 34, y: 74 } }] },
  'incline-press': { view: 'side', keys: [{ head: { x: 66, y: 59 }, neck: { x: 61, y: 63 }, hip: { x: 40, y: 74 }, knee: { x: 31, y: 74 }, ankle: { x: 22, y: 73 }, foot: { x: 18, y: 73 }, shoulder: { x: 59, y: 62 }, elbow: { x: 54, y: 58 }, wrist: { x: 57, y: 53 } }, { head: { x: 66, y: 59 }, neck: { x: 61, y: 63 }, hip: { x: 40, y: 74 }, knee: { x: 31, y: 74 }, ankle: { x: 22, y: 73 }, foot: { x: 18, y: 73 }, shoulder: { x: 59, y: 62 }, elbow: { x: 65, y: 54 }, wrist: { x: 68, y: 46 } }] },
  'lat-pulldown': { view: 'side', keys: [{ head: { x: 55, y: 39 }, neck: { x: 54, y: 44 }, hip: { x: 52, y: 64 }, knee: { x: 60, y: 68 }, ankle: { x: 60, y: 82 }, foot: { x: 65, y: 82 }, shoulder: { x: 52, y: 47 }, elbow: { x: 60, y: 34 }, wrist: { x: 64, y: 27 } }, { head: { x: 55, y: 39 }, neck: { x: 54, y: 44 }, hip: { x: 52, y: 64 }, knee: { x: 60, y: 68 }, ankle: { x: 60, y: 82 }, foot: { x: 65, y: 82 }, shoulder: { x: 52, y: 47 }, elbow: { x: 54, y: 55 }, wrist: { x: 54, y: 62 } }] },
  'lateral-raise': { view: 'front', keys: [{ head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 42, y: 34 }, elbow_l: { x: 41, y: 46 }, wrist_l: { x: 40, y: 58 }, shoulder_r: { x: 58, y: 34 }, elbow_r: { x: 59, y: 46 }, wrist_r: { x: 60, y: 58 } }, { head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 42, y: 34 }, elbow_l: { x: 34, y: 25 }, wrist_l: { x: 27, y: 17 }, shoulder_r: { x: 58, y: 34 }, elbow_r: { x: 66, y: 25 }, wrist_r: { x: 73, y: 17 } }] },
  'leg-curl': { view: 'side', keys: [{ head: { x: 32, y: 61 }, neck: { x: 37, y: 62 }, hip: { x: 48, y: 62 }, knee: { x: 58, y: 63 }, ankle: { x: 66, y: 66 }, foot: { x: 70, y: 67 }, shoulder: { x: 36, y: 60 }, elbow: { x: 36, y: 67 }, wrist: { x: 36, y: 74 } }, { head: { x: 32, y: 61 }, neck: { x: 37, y: 62 }, hip: { x: 48, y: 62 }, knee: { x: 58, y: 63 }, ankle: { x: 60, y: 56 }, foot: { x: 61, y: 53 }, shoulder: { x: 36, y: 60 }, elbow: { x: 36, y: 67 }, wrist: { x: 36, y: 74 } }] },
  'leg-extension': { view: 'side', keys: [{ head: { x: 54, y: 40 }, neck: { x: 54, y: 46 }, hip: { x: 50, y: 64 }, knee: { x: 62, y: 66 }, ankle: { x: 58, y: 82 }, foot: { x: 63, y: 84 }, shoulder: { x: 52, y: 48 }, elbow: { x: 50, y: 58 }, wrist: { x: 49, y: 68 } }, { head: { x: 54, y: 40 }, neck: { x: 54, y: 46 }, hip: { x: 50, y: 64 }, knee: { x: 62, y: 66 }, ankle: { x: 76, y: 60 }, foot: { x: 80, y: 57 }, shoulder: { x: 52, y: 48 }, elbow: { x: 50, y: 58 }, wrist: { x: 49, y: 68 } }] },
  'leg-press': { view: 'side', keys: [{ head: { x: 52, y: 34 }, neck: { x: 52, y: 40 }, hip: { x: 48, y: 60 }, knee: { x: 64, y: 52 }, ankle: { x: 74, y: 44 }, foot: { x: 78, y: 41 }, shoulder: { x: 50, y: 43 }, elbow: { x: 48, y: 53 }, wrist: { x: 47, y: 63 } }, { head: { x: 52, y: 34 }, neck: { x: 52, y: 40 }, hip: { x: 48, y: 60 }, knee: { x: 56, y: 68 }, ankle: { x: 62, y: 78 }, foot: { x: 66, y: 82 }, shoulder: { x: 50, y: 43 }, elbow: { x: 48, y: 53 }, wrist: { x: 47, y: 63 } }] },
  'leg-raise': { view: 'side', keys: [{ head: { x: 50, y: 26 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 60 }, knee: { x: 50, y: 72 }, ankle: { x: 50, y: 84 }, foot: { x: 55, y: 84 }, shoulder: { x: 49, y: 34 }, elbow: { x: 48, y: 42 }, wrist: { x: 48, y: 50 } }, { head: { x: 50, y: 26 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 60 }, knee: { x: 56, y: 66 }, ankle: { x: 62, y: 58 }, foot: { x: 67, y: 55 }, shoulder: { x: 49, y: 34 }, elbow: { x: 48, y: 42 }, wrist: { x: 48, y: 50 } }] },
  'lunge': { view: 'side', keys: [{ head: { x: 48, y: 18 }, neck: { x: 48, y: 24 }, hip: { x: 48, y: 42 }, knee: { x: 46, y: 58 }, ankle: { x: 46, y: 84 }, foot: { x: 52, y: 84 }, shoulder: { x: 47, y: 27 }, elbow: { x: 45, y: 36 }, wrist: { x: 45, y: 46 } }, { head: { x: 50, y: 34 }, neck: { x: 49, y: 40 }, hip: { x: 46, y: 60 }, knee: { x: 62, y: 68 }, ankle: { x: 68, y: 82 }, foot: { x: 72, y: 82 }, shoulder: { x: 48, y: 43 }, elbow: { x: 46, y: 50 }, wrist: { x: 44, y: 58 } }] },
  'mountain-climber': { view: 'side', keys: [{ head: { x: 27, y: 58 }, neck: { x: 32, y: 59 }, hip: { x: 48, y: 62 }, knee_l: { x: 56, y: 64 }, ankle_l: { x: 62, y: 68 }, foot_l: { x: 66, y: 69 }, knee_r: { x: 56, y: 64 }, ankle_r: { x: 62, y: 68 }, foot_r: { x: 66, y: 69 }, shoulder: { x: 34, y: 60 }, elbow: { x: 35, y: 66 }, wrist: { x: 35, y: 70 } }, { head: { x: 27, y: 58 }, neck: { x: 32, y: 59 }, hip: { x: 48, y: 62 }, knee_l: { x: 52, y: 74 }, ankle_l: { x: 50, y: 82 }, foot_l: { x: 54, y: 82 }, knee_r: { x: 60, y: 66 }, ankle_r: { x: 66, y: 70 }, foot_r: { x: 70, y: 71 }, shoulder: { x: 34, y: 60 }, elbow: { x: 35, y: 66 }, wrist: { x: 35, y: 70 } }] },
  'overhead-extension': { view: 'side', keys: [{ head: { x: 50, y: 22 }, neck: { x: 50, y: 28 }, hip: { x: 50, y: 48 }, knee: { x: 50, y: 62 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 30 }, elbow: { x: 56, y: 24 }, wrist: { x: 58, y: 17 } }, { head: { x: 50, y: 22 }, neck: { x: 50, y: 28 }, hip: { x: 50, y: 48 }, knee: { x: 50, y: 62 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 30 }, elbow: { x: 54, y: 20 }, wrist: { x: 50, y: 14 } }] },
  'plank': { view: 'side', keys: [{ head: { x: 27, y: 58 }, neck: { x: 32, y: 59 }, hip: { x: 48, y: 60 }, knee: { x: 57, y: 61 }, ankle: { x: 66, y: 62 }, foot: { x: 70, y: 63 }, shoulder: { x: 34, y: 60 }, elbow: { x: 35, y: 66 }, wrist: { x: 35, y: 70 } }, { head: { x: 27, y: 56 }, neck: { x: 32, y: 57 }, hip: { x: 48, y: 58 }, knee: { x: 57, y: 59 }, ankle: { x: 66, y: 60 }, foot: { x: 70, y: 61 }, shoulder: { x: 34, y: 58 }, elbow: { x: 35, y: 64 }, wrist: { x: 35, y: 68 } }] },
  'pullover': { view: 'side', keys: [{ head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 50, y: 60 }, wrist: { x: 56, y: 54 } }, { head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 58, y: 50 }, wrist: { x: 66, y: 44 } }] },
  'pullup': { view: 'side', keys: [{ head: { x: 52, y: 26 }, neck: { x: 52, y: 32 }, hip: { x: 52, y: 76 }, knee: { x: 52, y: 80 }, ankle: { x: 52, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 50, y: 34 }, elbow: { x: 52, y: 42 }, wrist: { x: 50, y: 50 } }, { head: { x: 52, y: 22 }, neck: { x: 52, y: 28 }, hip: { x: 52, y: 70 }, knee: { x: 52, y: 75 }, ankle: { x: 52, y: 80 }, foot: { x: 56, y: 80 }, shoulder: { x: 50, y: 30 }, elbow: { x: 47, y: 36 }, wrist: { x: 49, y: 44 } }] },
  'pushup': { view: 'side', keys: [{ head: { x: 27, y: 60 }, neck: { x: 32, y: 61 }, hip: { x: 48, y: 64 }, knee: { x: 57, y: 65 }, ankle: { x: 66, y: 66 }, foot: { x: 70, y: 67 }, shoulder: { x: 34, y: 62 }, elbow: { x: 34, y: 68 }, wrist: { x: 33, y: 72 } }, { head: { x: 27, y: 56 }, neck: { x: 32, y: 57 }, hip: { x: 48, y: 58 }, knee: { x: 57, y: 59 }, ankle: { x: 66, y: 60 }, foot: { x: 70, y: 61 }, shoulder: { x: 35, y: 56 }, elbow: { x: 35, y: 62 }, wrist: { x: 35, y: 66 } }] },
  'rdl': { view: 'side', keys: [{ head: { x: 50, y: 18 }, neck: { x: 50, y: 24 }, hip: { x: 50, y: 42 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 27 }, elbow: { x: 48, y: 42 }, wrist: { x: 48, y: 58 } }, { head: { x: 34, y: 28 }, neck: { x: 33, y: 33 }, hip: { x: 30, y: 52 }, knee: { x: 48, y: 68 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 35, y: 36 }, elbow: { x: 42, y: 54 }, wrist: { x: 49, y: 68 } }] },
  'rear-delt': { view: 'side', keys: [{ head: { x: 40, y: 30 }, neck: { x: 41, y: 35 }, hip: { x: 50, y: 42 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 43, y: 38 }, elbow: { x: 46, y: 48 }, wrist: { x: 50, y: 56 } }, { head: { x: 40, y: 30 }, neck: { x: 41, y: 35 }, hip: { x: 50, y: 42 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 43, y: 38 }, elbow: { x: 37, y: 30 }, wrist: { x: 32, y: 24 } }] },
  'row': { view: 'side', keys: [{ head: { x: 57, y: 41 }, neck: { x: 56, y: 46 }, hip: { x: 52, y: 66 }, knee: { x: 60, y: 70 }, ankle: { x: 58, y: 82 }, foot: { x: 63, y: 82 }, shoulder: { x: 54, y: 49 }, elbow: { x: 66, y: 52 }, wrist: { x: 75, y: 48 } }, { head: { x: 57, y: 41 }, neck: { x: 56, y: 46 }, hip: { x: 52, y: 66 }, knee: { x: 60, y: 70 }, ankle: { x: 58, y: 82 }, foot: { x: 63, y: 82 }, shoulder: { x: 54, y: 49 }, elbow: { x: 52, y: 44 }, wrist: { x: 48, y: 38 } }] },
  'russian-twist': { view: 'front', keys: [{ head: { x: 50, y: 24 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 58 }, knee_l: { x: 44, y: 70 }, ankle_l: { x: 43, y: 82 }, knee_r: { x: 56, y: 70 }, ankle_r: { x: 57, y: 82 }, shoulder_l: { x: 43, y: 35 }, elbow_l: { x: 40, y: 47 }, wrist_l: { x: 38, y: 58 }, shoulder_r: { x: 57, y: 35 }, elbow_r: { x: 60, y: 47 }, wrist_r: { x: 62, y: 58 } }, { head: { x: 50, y: 24 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 58 }, knee_l: { x: 44, y: 70 }, ankle_l: { x: 43, y: 82 }, knee_r: { x: 56, y: 70 }, ankle_r: { x: 57, y: 82 }, shoulder_l: { x: 40, y: 35 }, elbow_l: { x: 37, y: 45 }, wrist_l: { x: 35, y: 55 }, shoulder_r: { x: 60, y: 35 }, elbow_r: { x: 63, y: 45 }, wrist_r: { x: 65, y: 55 } }] },
  'shoulder-press': { view: 'side', keys: [{ head: { x: 50, y: 26 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 52 }, knee: { x: 50, y: 66 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 34 }, elbow: { x: 56, y: 40 }, wrist: { x: 62, y: 48 } }, { head: { x: 50, y: 26 }, neck: { x: 50, y: 32 }, hip: { x: 50, y: 52 }, knee: { x: 50, y: 66 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 34 }, elbow: { x: 54, y: 26 }, wrist: { x: 52, y: 17 } }] },
  'shrug': { view: 'side', keys: [{ head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 48, y: 40 }, wrist: { x: 48, y: 52 } }, { head: { x: 50, y: 16 }, neck: { x: 50, y: 22 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 24 }, elbow: { x: 48, y: 36 }, wrist: { x: 48, y: 48 } }] },
  'side-plank': { view: 'side', keys: [{ head: { x: 27, y: 56 }, neck: { x: 32, y: 57 }, hip: { x: 48, y: 58 }, knee: { x: 57, y: 59 }, ankle: { x: 66, y: 60 }, foot: { x: 70, y: 61 }, shoulder: { x: 34, y: 57 }, elbow: { x: 35, y: 63 }, wrist: { x: 35, y: 67 } }, { head: { x: 27, y: 54 }, neck: { x: 32, y: 55 }, hip: { x: 48, y: 57 }, knee: { x: 57, y: 58 }, ankle: { x: 66, y: 59 }, foot: { x: 70, y: 60 }, shoulder: { x: 34, y: 56 }, elbow: { x: 35, y: 62 }, wrist: { x: 35, y: 66 } }] },
  'skull-crusher': { view: 'side', keys: [{ head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 52, y: 56 }, wrist: { x: 52, y: 64 } }, { head: { x: 61, y: 70 }, neck: { x: 56, y: 72 }, hip: { x: 36, y: 74 }, knee: { x: 27, y: 76 }, ankle: { x: 18, y: 75 }, foot: { x: 14, y: 75 }, shoulder: { x: 54, y: 71 }, elbow: { x: 52, y: 56 }, wrist: { x: 53, y: 48 } }] },
  'squat': { view: 'side', keys: [{ head: { x: 50, y: 14 }, neck: { x: 50, y: 20 }, hip: { x: 50, y: 38 }, knee: { x: 50, y: 54 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 23 }, elbow: { x: 46, y: 36 }, wrist: { x: 46, y: 48 } }, { head: { x: 52, y: 34 }, neck: { x: 51, y: 40 }, hip: { x: 46, y: 58 }, knee: { x: 58, y: 70 }, ankle: { x: 54, y: 84 }, foot: { x: 60, y: 84 }, shoulder: { x: 50, y: 42 }, elbow: { x: 48, y: 52 }, wrist: { x: 46, y: 62 } }] },
  'triceps-pushdown': { view: 'front', keys: [{ head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 43, y: 34 }, elbow_l: { x: 43, y: 42 }, wrist_l: { x: 43, y: 44 }, shoulder_r: { x: 57, y: 34 }, elbow_r: { x: 57, y: 42 }, wrist_r: { x: 57, y: 44 } }, { head: { x: 50, y: 24 }, neck: { x: 50, y: 31 }, hip: { x: 50, y: 52 }, shoulder_l: { x: 43, y: 34 }, elbow_l: { x: 43, y: 42 }, wrist_l: { x: 43, y: 60 }, shoulder_r: { x: 57, y: 34 }, elbow_r: { x: 57, y: 42 }, wrist_r: { x: 57, y: 60 } }] },
  'upright-row': { view: 'side', keys: [{ head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 48, y: 40 }, wrist: { x: 48, y: 52 } }, { head: { x: 50, y: 20 }, neck: { x: 50, y: 26 }, hip: { x: 50, y: 44 }, knee: { x: 50, y: 58 }, ankle: { x: 50, y: 84 }, foot: { x: 56, y: 84 }, shoulder: { x: 49, y: 28 }, elbow: { x: 52, y: 33 }, wrist: { x: 54, y: 38 } }] },
};

// 每个动作 id -> 动画类型
const MOTION_BY_ID = {
  bench: 'bench-press', 'incline-bench': 'incline-press', 'decline-bench': 'decline-press',
  'db-bench': 'bench-press', 'incline-db': 'incline-press', 'chest-press': 'bench-press',
  'peck-deck': 'chest-fly', 'cable-fly': 'chest-fly', fly: 'chest-fly', pushup: 'pushup', dip: 'dip',
  deadlift: 'deadlift', row: 'row', 'bentover-row': 'row', 'one-arm-row': 'row',
  'lat-pulldown': 'lat-pulldown', pullup: 'pullup', chinup: 'pullup', 'tbar-row': 'row',
  shrug: 'shrug', 'face-pull': 'face-pull',
  squat: 'squat', 'front-squat': 'squat', legpress: 'leg-press', 'hack-squat': 'hack-squat',
  'goblet-squat': 'squat', rdl: 'rdl', lunge: 'lunge', 'leg-extension': 'leg-extension',
  'leg-curl': 'leg-curl', 'calf-raise': 'calf-raise', 'sumo-deadlift': 'deadlift',
  hipbridge: 'hip-thrust', 'hip-thrust': 'hip-thrust', 'glute-kickback': 'glute-kickback',
  'hip-abduction': 'hip-abduction',
  ohp: 'shoulder-press', 'barbell-ohp': 'shoulder-press', 'arnold-press': 'shoulder-press',
  'lateral-raise': 'lateral-raise', 'front-raise': 'front-raise', 'rear-delt-fly': 'rear-delt',
  'upright-row': 'upright-row',
  curl: 'curl', 'barbell-curl': 'curl', 'hammer-curl': 'curl', 'preacher-curl': 'curl',
  pushdown: 'triceps-pushdown', 'skull-crusher': 'skull-crusher',
  'overhead-extension': 'overhead-extension', 'bench-dip': 'dip',
  crunch: 'crunch', plank: 'plank', 'side-plank': 'side-plank', 'russian-twist': 'russian-twist',
  'leg-raise': 'leg-raise', 'mountain-climber': 'mountain-climber', 'dead-bug': 'dead-bug',
  'cable-crunch': 'crunch',
  // ROSEN 固定器械
  'rosen-hm-bench-press': 'bench-press', 'rosen-hm-incline-press': 'incline-press',
  'rosen-hm-decline-press': 'decline-press', 'rosen-sel-chest-press': 'bench-press',
  'rosen-cable-fly': 'chest-fly', 'rosen-hm-lat-pulldown': 'lat-pulldown',
  'rosen-hm-seated-row': 'row', 'rosen-hm-low-row': 'row', 'rosen-hm-pullover': 'pullover',
  'rosen-sel-lat-pulldown': 'lat-pulldown', 'rosen-sel-seated-row': 'row',
  'rosen-leg-press45': 'leg-press', 'rosen-hack-squat': 'hack-squat',
  'rosen-sel-leg-extension': 'leg-extension', 'rosen-sel-leg-curl': 'leg-curl',
  'rosen-sel-calf': 'calf-raise', 'rosen-hm-shoulder-press': 'shoulder-press',
  'rosen-sel-shoulder-press': 'shoulder-press', 'rosen-sel-lateral': 'lateral-raise',
  'rosen-hm-bicep': 'curl', 'rosen-hm-tricep': 'triceps-pushdown', 'rosen-sel-bicep': 'curl',
  'rosen-sel-hip': 'hip-abduction', 'rosen-hip-thrust': 'hip-thrust',
  'rosen-ab-crunch': 'crunch', 'rosen-back-extension': 'back-extension'
};

// 每个动作 id -> 器械图示 key(images/glyphs/<key>.png)
const GLYPH_BY_ID = {
  bench: 'barbell', 'incline-bench': 'barbell', 'decline-bench': 'barbell',
  'db-bench': 'dumbbell-pair', 'incline-db': 'dumbbell-pair', 'chest-press': 'machine-chest-press',
  'peck-deck': 'machine-fly', 'cable-fly': 'cable', fly: 'dumbbell-pair', pushup: 'bodyweight', dip: 'dip-bars',
  deadlift: 'barbell', row: 'machine-row', 'bentover-row': 'barbell', 'one-arm-row': 'dumbbell',
  'lat-pulldown': 'machine-lat-pulldown', pullup: 'pullup-bar', chinup: 'pullup-bar',
  'tbar-row': 'tbar', shrug: 'barbell', 'face-pull': 'cable',
  squat: 'barbell', 'front-squat': 'barbell', legpress: 'machine-leg-press',
  'hack-squat': 'machine-hack-squat', 'goblet-squat': 'dumbbell', rdl: 'barbell',
  lunge: 'dumbbell-pair', 'leg-extension': 'machine-leg-extension', 'leg-curl': 'machine-leg-curl',
  'calf-raise': 'machine-calf', 'sumo-deadlift': 'barbell',
  hipbridge: 'bodyweight', 'hip-thrust': 'barbell', 'glute-kickback': 'cable',
  'hip-abduction': 'machine-hip-abduction',
  ohp: 'dumbbell-pair', 'barbell-ohp': 'barbell', 'arnold-press': 'dumbbell-pair',
  'lateral-raise': 'dumbbell-pair', 'front-raise': 'dumbbell-pair', 'rear-delt-fly': 'dumbbell-pair',
  'upright-row': 'barbell',
  curl: 'dumbbell-pair', 'barbell-curl': 'barbell', 'hammer-curl': 'dumbbell-pair',
  'preacher-curl': 'barbell', pushdown: 'cable', 'skull-crusher': 'barbell',
  'overhead-extension': 'cable', 'bench-dip': 'bench',
  crunch: 'bodyweight', plank: 'bodyweight', 'side-plank': 'bodyweight',
  'russian-twist': 'bodyweight', 'leg-raise': 'pullup-bar', 'mountain-climber': 'bodyweight',
  'dead-bug': 'bodyweight', 'cable-crunch': 'cable',
  // ROSEN 固定器械
  'rosen-hm-bench-press': 'machine-chest-press', 'rosen-hm-incline-press': 'machine-chest-press',
  'rosen-hm-decline-press': 'machine-chest-press', 'rosen-sel-chest-press': 'machine-chest-press',
  'rosen-cable-fly': 'cable', 'rosen-hm-lat-pulldown': 'machine-lat-pulldown',
  'rosen-hm-seated-row': 'machine-row', 'rosen-hm-low-row': 'machine-low-row',
  'rosen-hm-pullover': 'machine-pullover', 'rosen-sel-lat-pulldown': 'machine-lat-pulldown',
  'rosen-sel-seated-row': 'machine-row', 'rosen-leg-press45': 'machine-leg-press',
  'rosen-hack-squat': 'machine-hack-squat', 'rosen-sel-leg-extension': 'machine-leg-extension',
  'rosen-sel-leg-curl': 'machine-leg-curl', 'rosen-sel-calf': 'machine-calf',
  'rosen-hm-shoulder-press': 'machine-shoulder-press', 'rosen-sel-shoulder-press': 'machine-shoulder-press',
  'rosen-sel-lateral': 'machine-lateral', 'rosen-hm-bicep': 'machine-curl',
  'rosen-hm-tricep': 'machine-triceps', 'rosen-sel-bicep': 'machine-curl',
  'rosen-sel-hip': 'machine-hip-abduction', 'rosen-hip-thrust': 'machine-hip-thrust',
  'rosen-ab-crunch': 'machine-crunch', 'rosen-back-extension': 'roman-chair'
};

// 部位 + 器械 兜底映射(自定义动作也会用)
const FALLBACK_GLYPH = {
  杠铃: 'barbell', 哑铃: 'dumbbell-pair', 绳索: 'cable', 自重: 'bodyweight', 器械: 'machine-generic', 悍马: 'machine-generic', 插片机: 'machine-generic'
};
const FALLBACK_MOTION = {
  胸: 'bench-press', 背: 'row', 腿: 'squat', 肩: 'shoulder-press', 手臂: 'curl', 核心: 'crunch', 臀腿: 'hip-thrust'
};

function resolveMotion(ex) {
  const key = MOTION_BY_ID[ex && ex.id];
  if (key) return key;
  return FALLBACK_MOTION[(ex && ex.bodyPart)] || 'crunch';
}

function resolveGlyph(ex) {
  const key = GLYPH_BY_ID[ex && ex.id];
  if (key) return key;
  return FALLBACK_GLYPH[(ex && ex.equipment)] || 'machine-generic';
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function easeInOut(t) {
  t = clamp01(t);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerpPose(start, end, t) {
  const out = {};
  Object.keys(start).forEach((k) => {
    const a = start[k];
    const b = end[k] || a;
    out[k] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
  return out;
}

// 相位 t(0..1) 表示一个完整往复: 0→0.5 向动作末端, 0.5→1 回到起点
function poseAt(motionKey, t) {
  const def = MOTIONS[motionKey] || MOTIONS.crunch;
  const tt = t <= 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
  return {
    view: def.view,
    key: motionKey in MOTIONS ? motionKey : 'crunch',
    pose: lerpPose(def.keys[0], def.keys[1], easeInOut(tt))
  };
}

function motionExists(key) {
  return !!MOTIONS[key];
}

function glyphExists(key) {
  return !!FALLBACK_GLYPH[key] || !!GLYPH_BY_ID[key];
}

module.exports = {
  MOTIONS,
  resolveMotion,
  resolveGlyph,
  poseAt,
  easeInOut,
  motionExists,
  glyphExists,
  FALLBACK_GLYPH
};
