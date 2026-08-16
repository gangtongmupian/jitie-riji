const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function thousand(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatVolume(kg) {
  if (kg >= 1000) return (kg / 1000).toFixed(1) + 't';
  return thousand(kg) + 'kg';
}

function formatDuration(min) {
  if (min < 60) return min + ' 分钟';
  return (Math.round((min / 60) * 10) / 10) + 'h';
}

function formatDate(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKS[d.getDay()];
}

module.exports = { formatVolume, formatDuration, formatDate };
