const test = require('node:test');
const assert = require('node:assert/strict');
const search = require('../miniprogram/utils/search');
const exercises = require('../miniprogram/data/exercises');

const ids = (q) => search.filter(exercises, q).map((e) => e.id);

test('search: 空查询返回全部', () => {
  assert.equal(search.filter(exercises, '').length, exercises.length);
  assert.equal(search.filter(exercises, '   ').length, exercises.length);
});

test('search: 中文子串匹配', () => {
  const r = ids('卧推');
  assert.ok(r.includes('bench-press'), '应命中杠铃卧推');
  assert.ok(r.includes('incline-bench-press'), '应命中上斜杠铃卧推');
  assert.ok(r.length > 3, '应命中多个卧推类动作');
});

test('search: 跳字匹配（斜卧推 → 上斜杠铃卧推）', () => {
  assert.ok(ids('斜卧推').includes('incline-bench-press'));
});

test('search: 英文关键词匹配', () => {
  assert.ok(ids('bench').includes('bench-press'));
  assert.ok(ids('pull-up').includes('pull-up'));
});

test('search: 拼音首字母与全拼匹配', () => {
  assert.ok(ids('wt').includes('bench-press'), 'wt 应命中卧推类');
  assert.ok(ids('wotui').includes('bench-press'), 'wotui 应命中卧推类');
  assert.ok(ids('sxglwt').includes('incline-bench-press'), 'sxglwt 应命中上斜杠铃卧推');
});

test('search: 器械与部位匹配', () => {
  assert.ok(ids('哑铃').length > 5);
  assert.ok(ids('壶铃').length >= 2);
});

test('search: 完整名称排在最前且短名称优先', () => {
  assert.equal(ids('杠铃深蹲')[0], 'squat');
  const r = ids('深蹲');
  assert.ok(r.length > 3, '深蹲应命中多个');
  assert.ok(r.indexOf('squat') >= 0);
  assert.ok(r[0].length <= r[r.length - 1].length, '短名称应更靠前');
});

test('search: 多关键词需全部命中', () => {
  const r = ids('哑铃 卧推');
  assert.ok(r.length > 0);
  assert.ok(r.every((id) => {
    const e = exercises.find((x) => x.id === id);
    return /哑铃/.test(e.name) || /哑铃/.test(e.equipment);
  }));
});

test('search: 品牌器械可按品牌名与型号搜索', () => {
  assert.ok(ids('rosen').length >= 20, 'rosen 应命中 ROSEN 器械');
  assert.ok(ids('forward').length >= 60, 'forward 应命中 FORWARD 器械');
});
