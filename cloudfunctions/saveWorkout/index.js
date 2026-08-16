const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const exs = event.exercises || [];
  if (!exs.length) return { ok: false, error: '没有可保存的训练组' };

  let totalSets = 0;
  let totalVolumeKg = 0;
  exs.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      totalSets += 1;
      totalVolumeKg += s.weightKg * s.reps;
    });
  });

  const res = await db.collection('workouts').add({
    data: {
      openid: OPENID,
      mode: event.mode || 'template',
      templateId: event.templateId || null,
      templateName: event.templateName || '自由训练',
      durationMin: event.durationMin || 0,
      exercises: exs,
      totalSets,
      totalVolumeKg,
      createdAt: db.serverDate()
    }
  });

  // 更新 PR:每动作历史最大重量与最重单次容量;记录本次新纪录
  const newPrs = [];
  for (const ex of exs) {
    let bestW = 0;
    let bestV = 0;
    (ex.sets || []).forEach((s) => {
      if (s.weightKg > bestW) bestW = s.weightKg;
      if (s.weightKg * s.reps > bestV) bestV = s.weightKg * s.reps;
    });
    const prs = db.collection('prs');
    const found = await prs.where({ openid: OPENID, exerciseId: ex.exerciseId }).limit(1).get();
    if (!found.data.length) {
      newPrs.push({ name: ex.name || ex.exerciseId, weightKg: bestW });
      await prs.add({
        data: {
          openid: OPENID,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name || '',
          bestWeightKg: bestW,
          bestVolumeKg: bestV,
          updatedAt: db.serverDate()
        }
      });
    } else {
      const pr = found.data[0];
      const upd = {};
      if (bestW > pr.bestWeightKg) upd.bestWeightKg = bestW;
      if (bestV > pr.bestVolumeKg) upd.bestVolumeKg = bestV;
      if (Object.keys(upd).length) {
        if (upd.bestWeightKg) newPrs.push({ name: ex.name || ex.exerciseId, weightKg: bestW });
        upd.updatedAt = db.serverDate();
        await prs.doc(pr._id).update({ data: upd });
      }
    }
  }

  return { ok: true, data: { workoutId: res._id, totalSets, totalVolumeKg, newPrs } };
};
