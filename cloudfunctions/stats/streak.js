// 连续打卡与成就计算（纯函数，供云函数与单测共用）
function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// dates: 训练日期数组 ['YYYY-MM-DD', ...]；now: 基准时间（默认当前）
// 今天没练但昨天练过时，连续天数仍然有效（到今晚结束前不算断）
function currentStreak(dates, now) {
  const set = new Set(dates);
  let streak = 0;
  const probe = new Date(now || Date.now());
  probe.setHours(0, 0, 0, 0);
  if (!set.has(isoDate(probe))) probe.setDate(probe.getDate() - 1);
  while (set.has(isoDate(probe))) {
    streak += 1;
    probe.setDate(probe.getDate() - 1);
  }
  return streak;
}

function diffDays(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

function maxStreak(dates) {
  const set = new Set(dates);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    if (prev && diffDays(prev, d) === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

function achievements(dates, totalSets, totalVolume) {
  const max = maxStreak(dates);
  return [
    { id: 'first', name: '首次训练', done: dates.length >= 1 },
    { id: 'streak3', name: '连续3天', done: max >= 3 },
    { id: 'streak7', name: '连续7天', done: max >= 7 },
    { id: 'streak30', name: '连续30天', done: max >= 30 },
    { id: 'sets100', name: '累计100组', done: totalSets >= 100 },
    { id: 'ton10', name: '累计举起10吨', done: totalVolume >= 10000 }
  ];
}

module.exports = { isoDate, currentStreak, maxStreak, achievements };
