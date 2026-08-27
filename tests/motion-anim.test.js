const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const exercises = require('../miniprogram/data/exercises');
const motion = require('../miniprogram/utils/motion');

test('anim: 每个动作都能解析出三帧插图并已打包', () => {
  for (const e of exercises) {
    const slug = motion.resolveAnimSlug(e);
    assert.ok(slug, `${e.id} 缺少三帧插图动作映射`);
    for (const n of [1, 2, 3]) {
      const file = path.join(__dirname, '../miniprogram/images/anim', slug + '-' + n + '.png');
      assert.ok(fs.existsSync(file), `${e.id} -> ${slug} 帧${n} 图片缺失: ${slug}-${n}.png`);
    }
  }
});

test('anim: 自定义动作按部位兜底且文件存在', () => {
  const customs = [
    { id: 'custom-1', bodyPart: '胸' },
    { id: 'custom-2', bodyPart: '背' },
    { id: 'custom-3', bodyPart: '腿' },
    { id: 'custom-4', bodyPart: '肩' },
    { id: 'custom-5', bodyPart: '手臂' },
    { id: 'custom-6', bodyPart: '核心' },
    { id: 'custom-7', bodyPart: '臀腿' }
  ];
  for (const c of customs) {
    const slug = motion.resolveAnimSlug(c);
    assert.ok(slug, `${c.bodyPart} 兜底映射缺失`);
    for (const n of [1, 2, 3]) {
      const file = path.join(__dirname, '../miniprogram/images/anim', slug + '-' + n + '.png');
      assert.ok(fs.existsSync(file), `${c.bodyPart} -> ${slug} 帧${n} 缺失`);
    }
  }
});

test('anim: ROSEN 器械动作也映射到有效插图', () => {
  const rosen = exercises.filter((e) => e.id.indexOf('rosen-') === 0);
  assert.ok(rosen.length >= 20, 'ROSEN 动作数量异常');
  for (const e of rosen) {
    const slug = motion.resolveAnimSlug(e);
    assert.ok(slug && motion.ANIM_BY_ID[e.id], `${e.id} 未显式映射`);
  }
});
