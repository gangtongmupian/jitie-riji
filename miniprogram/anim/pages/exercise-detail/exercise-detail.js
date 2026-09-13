const exercises = require('../../../data/exercises');
const motion = require('../../../utils/motion');
const details = require('../../../data/exercise-details');
const rosenMachines = require('../../../data/rosen-machines');
const forwardMachines = require('../../../data/forward-machines');

Page({
  data: {
    ex: null,
    d: null,
    animKey: '',
    motionKey: 'crunch',
    glyph: 'machine-generic'
    , machine: null
  },
  onLoad(options) {
    const id = options && options.ex;
    const ex = exercises.find((e) => e.id === id);
    if (!ex) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      return;
    }
    const d = details.detailsOf ? details.detailsOf(ex.id) : details[ex.id] || {};
    this.setData({
      ex,
      d,
      animKey: motion.resolveAnimSlug(ex),
      motionKey: motion.resolveMotion(ex),
      glyph: motion.resolveGlyph(ex)
      , machine: rosenMachines[ex.id] || forwardMachines[ex.id] || null
    });
    if (wx.setNavigationBarTitle) wx.setNavigationBarTitle({ title: ex.name });
  }
});
