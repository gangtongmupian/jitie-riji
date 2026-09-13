const exercises = require('../../data/exercises');

const BODY_ORDER = ['胸', '背', '腿', '臀腿', '肩', '手臂', '核心'];

Page({
  data: {
    parts: ['全部'].concat(BODY_ORDER),
    active: '全部',
    groups: [],
    total: 0
  },
  onLoad(options) {
    // 支持从分享/搜索直达指定部位: ?part=胸
    const part = options && options.part;
    if (part && BODY_ORDER.indexOf(part) >= 0) this.setData({ active: part });
    this.build();
  },
  build() {
    const active = this.data.active;
    const list = active === '全部' ? exercises : exercises.filter((e) => e.bodyPart === active);
    const groups = [];
    BODY_ORDER.forEach((bp) => {
      const items = list.filter((e) => e.bodyPart === bp);
      if (items.length) groups.push({ bodyPart: bp, items });
    });
    // 部位不在标准顺序内的兜底
    list.filter((e) => BODY_ORDER.indexOf(e.bodyPart) < 0).forEach((e) => {
      let g = groups.find((x) => x.bodyPart === e.bodyPart);
      if (!g) { g = { bodyPart: e.bodyPart, items: [] }; groups.push(g); }
      g.items.push(e);
    });
    this.setData({ groups, total: exercises.length });
  },
  selectPart(e) {
    const part = e.currentTarget.dataset.value;
    this.setData({ active: part });
    this.build();
  }
});
