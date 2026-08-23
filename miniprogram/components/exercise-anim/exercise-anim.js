const motion = require('../../utils/motion');

const REP_SEC = {
  'bench-press': 2.8, 'incline-press': 2.8, 'decline-press': 2.8, pushup: 2.4, dip: 2.8,
  'chest-fly': 2.4, row: 2.4, 'lat-pulldown': 2.8, pullup: 3.2, deadlift: 3.6, rdl: 3.6,
  squat: 3.4, 'hack-squat': 3.2, 'leg-press': 3.0, 'leg-extension': 2.4, 'leg-curl': 2.4,
  'calf-raise': 2.0, lunge: 3.2, 'hip-thrust': 3.0, 'glute-kickback': 2.2, 'hip-abduction': 2.4,
  'shoulder-press': 2.8, 'lateral-raise': 2.2, 'front-raise': 2.2, 'rear-delt': 2.2,
  'upright-row': 2.4, curl: 2.0, 'triceps-pushdown': 2.0, 'skull-crusher': 2.4,
  'overhead-extension': 2.4, crunch: 2.0, plank: 1.6, 'side-plank': 1.6,
  'russian-twist': 2.0, 'leg-raise': 2.8, 'mountain-climber': 2.0, 'dead-bug': 2.8,
  shrug: 2.0, 'face-pull': 2.2, pullover: 2.8, 'back-extension': 2.4
};

// requestAnimationFrame 在部分基础库/调试环境不可用,降级为 setTimeout
const raf = typeof requestAnimationFrame === 'function'
  ? requestAnimationFrame
  : (cb) => setTimeout(() => cb(Date.now()), 16);
const caf = typeof cancelAnimationFrame === 'function'
  ? cancelAnimationFrame
  : (id) => clearTimeout(id);

Component({
  properties: {
    motionKey: { type: String, value: 'crunch' },
    glyph: { type: String, value: 'machine-generic' },
    width: { type: Number, value: 340 },
    height: { type: Number, value: 240 }
  },
  data: {
    canvasId: 'exercise-anim'
  },
  lifetimes: {
    attached() {
      this.start();
    },
    detached() {
      this.stop();
    }
  },
  observers: {
    motionKey() {
      this.restart();
    }
  },
  methods: {
    start() {
      this.stop();
      this.ctx = wx.createCanvasContext(this.data.canvasId, this);
      this.phase = 0;
      const loop = (ts) => {
        if (!this.ctx) return;
        this.phase = (this.phase + (ts - (this._lastTs || ts)) / 1000 / this.repSec()) % 1;
        this._lastTs = ts;
        this.render();
        this._raf = raf(loop);
      };
      this._raf = raf(loop);
    },
    stop() {
      if (this._raf != null) {
        caf(this._raf);
        this._raf = null;
      }
      this._lastTs = 0;
    },
    restart() {
      if (!this.ctx) return;
      this.phase = 0;
      this._lastTs = 0;
    },
    repSec() {
      return REP_SEC[this.data.motionKey] || 2.4;
    },
    render() {
      const ctx = this.ctx;
      if (!ctx) return;
      const W = this.data.width;
      const H = this.data.height;
      const frame = motion.poseAt(this.data.motionKey, this.phase);
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, W, H);
      // 地面
      ctx.setStrokeStyle('#e8e6e3');
      ctx.setLineWidth(2);
      ctx.beginPath();
      ctx.moveTo(8, this.py(86, H));
      ctx.lineTo(W - 8, this.py(86, H));
      ctx.stroke();
      // 器械场景
      this.drawContext(ctx, frame, W, H);
      // 火柴人
      this.drawSkeleton(ctx, frame, W, H);
      ctx.draw();
    },
    px(x, W) {
      return 12 + x / 100 * (W - 24);
    },
    py(y, H) {
      return 10 + y / 100 * (H - 20);
    },
    drawSkeleton(ctx, frame, W, H) {
      const p = frame.pose;
      const px = (x) => this.px(x, W);
      const py = (y) => this.py(y, H);
      const seg = (a, b) => {
        ctx.moveTo(px(a.x), py(a.y));
        ctx.lineTo(px(b.x), py(b.y));
      };
      const color = '#5645d4';
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(5);
      ctx.setLineCap('round');
      ctx.setLineJoin('round');
      ctx.beginPath();
      if (frame.view === 'front') {
        seg(p.head, p.neck);
        seg(p.neck, p.hip);
        if (p.knee_l) {
          seg(p.hip, p.knee_l);
          seg(p.knee_l, p.ankle_l);
          seg(p.hip, p.knee_r);
          seg(p.knee_r, p.ankle_r);
        }
        seg(p.neck, p.shoulder_l);
        seg(p.shoulder_l, p.elbow_l);
        seg(p.elbow_l, p.wrist_l);
        seg(p.neck, p.shoulder_r);
        seg(p.shoulder_r, p.elbow_r);
        seg(p.elbow_r, p.wrist_r);
      } else {
        seg(p.head, p.neck);
        seg(p.neck, p.hip);
        seg(p.hip, p.knee);
        seg(p.knee, p.ankle);
        seg(p.ankle, p.foot);
        seg(p.shoulder, p.neck);
        seg(p.shoulder, p.elbow);
        seg(p.elbow, p.wrist);
        if (p.knee_l) {
          seg(p.hip, p.knee_l);
          seg(p.knee_l, p.ankle_l);
        }
      }
      ctx.stroke();
      // 头
      ctx.setFillStyle(color);
      ctx.beginPath();
      ctx.arc(px(p.head.x), py(p.head.y), 7, 0, Math.PI * 2);
      ctx.fill();
      // 关节
      ctx.setFillStyle('#ffffff');
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(2);
      const joints = frame.view === 'front'
        ? ['neck', 'hip', 'shoulder_l', 'elbow_l', 'wrist_l', 'shoulder_r', 'elbow_r', 'wrist_r', 'knee_l', 'ankle_l', 'knee_r', 'ankle_r']
        : ['neck', 'hip', 'knee', 'ankle', 'shoulder', 'elbow', 'wrist'];
      joints.forEach((k) => {
        if (!p[k]) return;
        ctx.beginPath();
        ctx.arc(px(p[k].x), py(p[k].y), 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      // 器械持握点
      this.drawHold(ctx, frame, W, H, color);
    },
    drawHold(ctx, frame, W, H, color) {
      const p = frame.pose;
      const px = (x) => this.px(x, W);
      const py = (y) => this.py(y, H);
      const wrists = frame.view === 'front'
        ? [p.wrist_l, p.wrist_r]
        : [p.wrist];
      const glyph = this.data.glyph || '';
      if (glyph.indexOf('barbell') === 0 || glyph === 'tbar') {
        // 杠铃: 腕部横杆
        ctx.setStrokeStyle('#3a3a3a');
        ctx.setLineWidth(6);
        ctx.beginPath();
        const mid = wrists[0];
        ctx.moveTo(px(mid.x - 12), py(mid.y));
        ctx.lineTo(px(mid.x + 12), py(mid.y));
        ctx.stroke();
        ctx.setFillStyle('#c9c6c0');
        wrists.forEach((w) => {
          ctx.beginPath();
          ctx.arc(px(w.x), py(w.y), 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (glyph.indexOf('dumbbell') === 0) {
        ctx.setStrokeStyle('#3a3a3a');
        ctx.setLineWidth(5);
        wrists.forEach((w) => {
          ctx.beginPath();
          ctx.moveTo(px(w.x - 8), py(w.y));
          ctx.lineTo(px(w.x + 8), py(w.y));
          ctx.stroke();
        });
        ctx.setFillStyle('#c9c6c0');
        wrists.forEach((w) => {
          ctx.beginPath();
          ctx.arc(px(w.x - 6), py(w.y), 3, 0, Math.PI * 2);
          ctx.arc(px(w.x + 6), py(w.y), 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    },
    drawContext(ctx, frame, W, H) {
      const glyph = this.data.glyph || '';
      const px = (x) => this.px(x, W);
      const py = (y) => this.py(y, H);
      const key = frame.key;
      ctx.setStrokeStyle('#b9b6c9');
      ctx.setLineWidth(4);
      ctx.setLineCap('round');
      const line = (a, b) => {
        ctx.beginPath();
        ctx.moveTo(px(a.x || a[0]), py(a.y || a[1]));
        ctx.lineTo(px(b.x || b[0]), py(b.y || b[1]));
        ctx.stroke();
      };
      const rect = (x0, y0, x1, y1) => {
        ctx.strokeRect(px(x0), py(y0), px(x1) - px(x0), py(y1) - py(y0));
      };
      if (glyph === 'cable') {
        // 龙门架
        line({ x: 18, y: 10 }, { x: 18, y: 88 });
        line({ x: 82, y: 10 }, { x: 82, y: 88 });
        ctx.beginPath();
        ctx.arc(px(18), py(12), 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (glyph.indexOf('machine-lat-pulldown') === 0) {
        line({ x: 74, y: 8 }, { x: 74, y: 90 });
        line({ x: 42, y: 8 }, { x: 74, y: 8 });
        ctx.beginPath();
        ctx.arc(px(42), py(11), 4, 0, Math.PI * 2);
        ctx.stroke();
        rect(40, 64, 58, 80);
      } else if (glyph.indexOf('machine-leg-press') === 0 || key === 'leg-press') {
        line({ x: 30, y: 88 }, { x: 78, y: 30 });
        rect(22, 72, 40, 88);
      } else if (glyph.indexOf('machine-hack-squat') === 0 || key === 'hack-squat') {
        line({ x: 32, y: 88 }, { x: 70, y: 24 });
        rect(20, 76, 38, 90);
      } else if (glyph.indexOf('machine-leg-extension') === 0 || key === 'leg-extension') {
        rect(34, 44, 50, 66);
        line({ x: 50, y: 40 }, { x: 50, y: 74 });
      } else if (glyph.indexOf('machine-leg-curl') === 0 || key === 'leg-curl') {
        rect(18, 48, 62, 58);
        line({ x: 24, y: 58 }, { x: 24, y: 80 });
      } else if (glyph.indexOf('machine-calf') === 0 || key === 'calf-raise') {
        line({ x: 34, y: 42 }, { x: 34, y: 88 });
        line({ x: 54, y: 42 }, { x: 54, y: 88 });
        line({ x: 30, y: 88 }, { x: 58, y: 88 });
      } else if (glyph.indexOf('machine-shoulder-press') === 0 || key === 'shoulder-press') {
        rect(38, 48, 54, 70);
        line({ x: 45, y: 42 }, { x: 45, y: 76 });
      } else if (glyph.indexOf('machine-') === 0 || glyph === 'machine-generic') {
        // 通用器械: 座椅 + 配重
        rect(38, 46, 56, 68);
        line({ x: 20, y: 24 }, { x: 20, y: 84 });
        rect(15, 42, 25, 62);
        line({ x: 25, y: 52 }, { x: 38, y: 52 });
      } else if (glyph === 'bench' || glyph === 'roman-chair') {
        rect(20, 52, 64, 62);
      } else if (glyph === 'pullup-bar') {
        line({ x: 14, y: 10 }, { x: 86, y: 10 });
      } else if (glyph === 'dip-bars') {
        line({ x: 24, y: 40 }, { x: 76, y: 40 });
        line({ x: 24, y: 58 }, { x: 76, y: 58 });
      }
      // 卧推凳
      if (['bench-press', 'incline-press', 'decline-press', 'skull-crusher', 'pullover'].indexOf(key) >= 0) {
        line({ x: 26, y: 72 }, { x: 60, y: 72 });
        line({ x: 30, y: 72 }, { x: 30, y: 84 });
        line({ x: 56, y: 72 }, { x: 56, y: 84 });
      }
      // 罗马椅/背屈伸
      if (key === 'back-extension') {
        line({ x: 24, y: 34 }, { x: 58, y: 52 });
        line({ x: 24, y: 34 }, { x: 24, y: 86 });
        line({ x: 58, y: 52 }, { x: 58, y: 86 });
      }
    }
  }
});
