function summarizeWorkout(exercises) {
  let sets = 0;
  let volumeKg = 0;
  exercises.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      sets += 1;
      volumeKg += s.weightKg * s.reps;
    });
  });
  return { sets, volumeKg };
}

function isNewPR(existing, candidate) {
  return existing === null || existing === undefined || candidate > existing;
}

module.exports = { summarizeWorkout, isNewPR };
