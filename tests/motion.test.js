const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const exercises = require('../miniprogram/data/exercises');
const motion = require('../miniprogram/utils/motion');

test('motion: 所有动作都有动画类型与器械图示', () => {
  for (const e of exercises) {
    const m = motion.resolveMotion(e);
    const g = motion.resolveGlyph(e);
    assert.ok(motion.MOTIONS[m], `${e.id} 动画类型缺失: ${m}`);
    const png = path.join(__dirname, '../miniprogram/images/glyphs', g + '.png');
    assert.ok(fs.existsSync(png), `${e.id} 器械图示缺失: ${g}.png`);
  }
});

test('motion: poseAt 输出坐标有限且在画布范围内', () => {
  for (const key of Object.keys(motion.MOTIONS)) {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const frame = motion.poseAt(key, t);
      assert.equal(frame.view, motion.MOTIONS[key].view, `${key} view 不一致`);
      for (const [name, pt] of Object.entries(frame.pose)) {
        assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.y), `${key}@${t} ${name} 坐标非有限`);
        assert.ok(pt.x >= -10 && pt.x <= 110, `${key}@${t} ${name}.x 越界: ${pt.x}`);
        assert.ok(pt.y >= -10 && pt.y <= 110, `${key}@${t} ${name}.y 越界: ${pt.y}`);
      }
    }
  }
});

test('motion: ROSEN 固定器械模板男女分开且引用有效', () => {
  const templates = require('../miniprogram/data/templates');
  const rosen = templates.filter((t) => t.id.indexOf('rosen-') === 0);
  assert.equal(rosen.length, 2, '应存在男/女两套铁馆器械模板');
  assert.ok(rosen.some((t) => t.genderHint === 'male'), '缺少男版器械模板');
  assert.ok(rosen.some((t) => t.genderHint === 'female'), '缺少女版器械模板');
  const ids = new Set(exercises.map((e) => e.id));
  for (const t of rosen) {
    for (const x of t.exercises) {
      assert.ok(ids.has(x.exerciseId), `模板 ${t.id} 引用了不存在的动作 ${x.exerciseId}`);
    }
  }
});
