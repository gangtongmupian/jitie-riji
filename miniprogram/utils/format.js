const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function thousand(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatWeight(kg) {
  return String(kg);
}

function formatVolume(kg) {
  if (kg >= 10000) return (kg / 1000).toFixed(1) + 't';
  return thousand(kg) + 'kg';
}

function formatDuration(sec) {
  const min = Math.round(sec / 60);
  if (min < 60) return min + ' 分钟';
  return (Math.round((min / 60) * 10) / 10) + 'h';
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKS[d.getDay()]}`;
}

module.exports = { thousand, formatWeight, formatVolume, formatDuration, today, formatDate };
