// 动作模糊搜索：支持 中文名 / 英文名 / 器械 / 部位 / 拼音首字母 / 全拼
// 多关键词用空格分隔（全部命中才算匹配），并按相关度排序

function norm(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
}

// needle 的字符是否按顺序出现在 hay 中（用于「上斜推胸」匹配「上斜杠铃卧推」这类跳字）
function isSubsequence(needle, hay) {
  if (!needle) return true;
  let i = 0;
  for (let k = 0; k < hay.length; k++) {
    if (hay[k] === needle[i]) {
      i++;
      if (i >= needle.length) return true;
    }
  }
  return false;
}

// 单条动作的匹配得分：越小越靠前；-1 表示不匹配
function scoreOf(ex, tokens) {
  const name = norm(ex.name);
  const en = norm(ex.enName);
  const py = norm(ex.py);
  const pyf = norm(ex.pyf);
  const all = name + ' ' + en + ' ' + norm(ex.equipment) + ' ' + norm(ex.bodyPart) + ' ' + py + ' ' + pyf;
  let score = 0;
  for (const t of tokens) {
    let s = -1;
    if (name.indexOf(t) === 0) s = 0;
    else if (name.indexOf(t) > 0) s = 1;
    else if (py && py.indexOf(t) === 0) s = 2;
    else if (pyf && pyf.indexOf(t) === 0) s = 3;
    else if (en.indexOf(t) >= 0) s = 4;
    else if (all.indexOf(t) >= 0) s = 5;
    else if (isSubsequence(t, name)) s = 6;
    if (s < 0) return -1;
    score += s;
  }
  return score;
}

function filter(list, query) {
  const q = norm(query);
  if (!q) return list || [];
  const tokens = q.split(' ').filter(Boolean);
  return (list || [])
    .map((e, i) => ({ e, i, s: scoreOf(e, tokens) }))
    .filter((x) => x.s >= 0)
    // 相关度相同时，名称更短（更贴近查询）的排前面
    .sort((a, b) => (a.s - b.s) || (a.e.name.length - b.e.name.length) || (a.i - b.i))
    .map((x) => x.e);
}

module.exports = { filter, scoreOf, isSubsequence };
