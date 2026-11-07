// One red thread, sewn in running stitch along the seam allowance of the nine patches.
// It follows the visitor's spiral (down the left, along the bottom, up the right, back along the top)
// and ends in the center by sewing on Katrin's smiley label.

export const RED = '#C4122F';

const STEP = 2;      // sampling distance along the route, px
const PERIOD = 15;   // one stitch plus one gap
const STITCH = 9;    // visible part of a stitch

export class Thread {
  constructor(order) {
    this.order = order;
    this.pts = [];      // [x, y] samples
    this.cum = [];      // arc length at each sample
    this.stitches = [];
    this.entries = [];  // arc length where the route enters each spiral screen
    this.exits = [];    // ... and leaves it
    this.total = 0;
    this.drawn = 0;
    this.target = 0;
    this.sewn = new Set();
    this.done = false;
    this.onDone = null;
    this.tangleAt = -1e9; // when the visitor last tangled the thread by scrolling back and forth
    this.phew = 'phew!';
    this.animating = false;
  }

  tangle(now) { this.tangleAt = now; }

  // m: inset from the screen edge; end: the point beside the label where the thread finishes
  layout(W, H, m, end, instant) {
    const oldTotal = this.total;
    const route = [
      [m, H * 0.14],
      [m, 3 * H - m],
      [3 * W - m, 3 * H - m],
      [3 * W - m, m],
      [W + m, m],
      [W + m, end.y],
      [end.x, end.y],
    ];
    const raw = sampleRounded(route, Math.min(70, Math.max(18, m * 2.2)));

    // a hand-sewn line is never quite straight
    this.pts = [];
    this.cum = [];
    let s = 0;
    for (let i = 0; i < raw.length; i++) {
      if (i) s += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
      const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
      const fade = Math.min(1, s / 40, (raw.length - 1 - i) * STEP / 40);
      const w = (1.3 * Math.sin(s / 53) + 0.7 * Math.sin(s / 17 + 1)) * fade;
      this.pts.push([raw[i][0] + nx * w, raw[i][1] + ny * w]);
      this.cum.push(s);
    }
    this.total = s;

    // stitches, each a little uneven
    this.stitches = [];
    for (let s0 = 2; s0 + STITCH <= this.total; s0 += PERIOD) {
      const a = this.at(s0), b = this.at(s0 + STITCH);
      const j = () => (Math.random() - 0.5) * 0.9;
      this.stitches.push({ s0, s1: s0 + STITCH, x0: a[0] + j(), y0: a[1] + j(), x1: b[0] + j(), y1: b[1] + j() });
    }

    // where the route crosses each screen
    this.entries = Array(9).fill(Infinity);
    this.exits = Array(9).fill(0);
    this.pts.forEach(([x, y], i) => {
      const c = Math.floor(x / W), r = Math.floor(y / H);
      const k2 = this.order.findIndex(([oc, or]) => oc === c && or === r);
      if (k2 < 0) return;
      this.entries[k2] = Math.min(this.entries[k2], this.cum[i]);
      this.exits[k2] = Math.max(this.exits[k2], this.cum[i]);
    });

    // keep the same place along the route after a resize
    const f = oldTotal ? this.total / oldTotal : 0;
    this.drawn = Math.min(this.total, this.drawn * f);
    this.target = Math.min(this.total, this.target * f);
    if (instant) this.drawn = this.target;
    this.update();
  }

  // the stretch of thread that belongs to spiral screen k
  span(k) {
    const a = k === 0 ? 0 : this.entries[k];
    const b = k >= 8 ? this.total : this.exits[k] + 4;
    return [a, Math.min(this.total, b)];
  }

  // where the needle should be: p = 0 at the screen's entry, 1 at its exit
  setProgress(k, p) {
    const [a, b] = this.span(k);
    this.target = a + (b - a) * Math.max(0, Math.min(1, p));
  }

  remaining() { return Math.abs(this.target - this.drawn); }

  // sew toward the target, or unpick back to it
  tick(speed) {
    const d = this.target - this.drawn;
    if (Math.abs(d) < 0.01) { if (d) { this.drawn = this.target; this.update(); } return false; }
    this.drawn += Math.sign(d) * Math.min(Math.abs(d), speed);
    this.update();
    return true;
  }

  fastForward() {
    if (this.drawn !== this.target) { this.drawn = this.target; this.update(); }
  }

  update() {
    this.sewn = new Set();
    this.entries.forEach((e, k) => { if (this.drawn > e + 1) this.sewn.add(k); });
    const done = !!this.total && this.drawn >= this.total - 0.5;
    if (done !== this.done) {
      this.done = done;
      this.onDone?.(done);
    }
  }

  at(s) {
    const c = this.cum;
    if (s <= 0) return this.pts[0];
    if (s >= this.total) return this.pts[this.pts.length - 1];
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] <= s) lo = mid; else hi = mid; }
    const f = (s - c[lo]) / (c[hi] - c[lo] || 1);
    const a = this.pts[lo], b = this.pts[hi];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  render(ctx, view, now = 0, sewing = false) {
    this.idleBob = false;
    const tk = (now - this.tangleAt) / 1700; // 0..1 while a tangle is being worked free
    this.animating = tk >= 0 && tk < 1;
    if (!this.total || this.drawn <= 0) return;
    const pad = 12;
    const vis = (x0, y0, x1, y1) =>
      Math.max(x0, x1) > view.x - pad && Math.min(x0, x1) < view.x + view.w + pad &&
      Math.max(y0, y1) > view.y - pad && Math.min(y0, y1) < view.y + view.h + pad;

    const segs = [];
    let lastEnd = 0;
    for (const st of this.stitches) {
      if (st.s0 >= this.drawn) break;
      let { x1, y1 } = st;
      if (st.s1 > this.drawn) { [x1, y1] = this.at(this.drawn); lastEnd = this.drawn; }
      else lastEnd = st.s1;
      if (vis(st.x0, st.y0, x1, y1)) segs.push([st.x0, st.y0, x1, y1]);
    }

    ctx.lineCap = 'round';
    const pass = (style, width, dx, dy, trim) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (const [x0, y0, x1, y1] of segs) {
        const tx = (x1 - x0) * trim, ty = (y1 - y0) * trim;
        ctx.moveTo(x0 + tx + dx, y0 + ty + dy);
        ctx.lineTo(x1 - tx + dx, y1 - ty + dy);
      }
      ctx.stroke();
    };
    pass('rgba(255, 246, 238, 0.4)', 4.6, 0, 0, -0.04); // a pale halo, so red reads on dark cloth too
    pass('rgba(80, 10, 22, 0.3)', 3.2, 0.7, 1.2, 0);   // the thread's shadow on the cloth
    pass(RED, 2.4, 0, 0, 0);
    pass('rgba(255, 214, 218, 0.5)', 0.8, -0.4, -0.5, 0.22); // the twist catching light

    // the knot it starts from
    const [sx, sy] = this.pts[0];
    if (vis(sx, sy, sx, sy)) {
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.done) return;

    // the needle, parked at the tip until the visitor moves on
    const tip = this.at(this.drawn);
    const back = this.at(Math.max(0, this.drawn - 8));
    let dx = tip[0] - back[0], dy = tip[1] - back[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    if (this.animating) {
      // tangled: the needle wriggles to work itself free
      const a = Math.sin(now / 30) * 0.6 * (1 - tk);
      [dx, dy] = [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
    }
    const n = 34;
    // the needle dips in and out while it sews, and taps its foot while it waits
    const bob = sewing ? Math.sin(now / 38) * 6 : Math.sin(now / 260) * 1.6;
    const e = [tip[0] + dx * (4 + bob), tip[1] + dy * (4 + bob)]; // eye end
    const p = [e[0] + dx * n, e[1] + dy * n];            // point
    if (!vis(back[0], back[1], p[0], p[1])) return;

    // the length of thread between the last stitch and the eye
    if (this.drawn - lastEnd > 0.5 || lastEnd < this.drawn) {
      const l = this.at(lastEnd);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(l[0], l[1]);
      ctx.lineTo(e[0] + dx * 3, e[1] + dy * 3);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(30, 24, 26, 0.22)';
    ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(e[0] + 0.8, e[1] + 1.4); ctx.lineTo(p[0] + 0.8, p[1] + 1.4); ctx.stroke();
    ctx.strokeStyle = '#8A9097';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(p[0] - dx * 6, p[1] - dy * 6); ctx.stroke();
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(p[0] - dx * 7, p[1] - dy * 7); ctx.lineTo(p[0], p[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(e[0] + dx * 9 - dy * 0.5, e[1] + dy * 9 + dx * 0.5); ctx.lineTo(p[0] - dx * 8, p[1] - dy * 8); ctx.stroke();
    // the eye
    ctx.strokeStyle = '#F4F0E8';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(e[0] + dx * 1.5, e[1] + dy * 1.5); ctx.lineTo(e[0] + dx * 5.5, e[1] + dy * 5.5); ctx.stroke();

    if (this.animating) this.drawTangle(ctx, tip, tk, now);
  }

  // a knot of loops round the needle that shrinks away, then a little "phew"
  drawTangle(ctx, [x, y], k, now) {
    const shrink = k < 0.45 ? 1 : Math.max(0, 1 - (k - 0.45) / 0.35);
    if (shrink > 0) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = i * 2.39 + now / 400;
        const r = (5 + (i % 4) * 2.6) * shrink;
        ctx.moveTo(x + Math.cos(a) * r * 2 + r, y + Math.sin(a) * r);
        ctx.ellipse(x + Math.cos(a) * r * 2, y + Math.sin(a) * r, r, r * 0.7, a, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    if (k > 0.55) {
      const f = (k - 0.55) / 0.45;
      ctx.globalAlpha = Math.min(1, (1 - f) * 2.2);
      ctx.font = "700 17px 'Caveat Variable', Caveat, cursive";
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(251, 249, 244, 0.9)';
      ctx.strokeText(this.phew, x + 12, y - 14 - f * 14); // a pale edge so it reads on any cloth
      ctx.fillStyle = '#1E181A';
      ctx.fillText(this.phew, x + 12, y - 14 - f * 14);
      ctx.globalAlpha = 1;
    }
  }
}

// A polyline with its corners eased into quarter turns, sampled every STEP px.
function sampleRounded(route, radius) {
  const out = [];
  const line = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len / STEP));
    for (let i = out.length ? 1 : 0; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  };
  const quad = (a, c, b) => {
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]) + Math.hypot(b[0] - c[0], b[1] - c[1]);
    const n = Math.max(2, Math.ceil(len / STEP));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
  };
  let from = route[0];
  for (let i = 1; i < route.length - 1; i++) {
    const p = route[i - 1], c = route[i], nx = route[i + 1];
    const lin = Math.hypot(c[0] - p[0], c[1] - p[1]), lout = Math.hypot(nx[0] - c[0], nx[1] - c[1]);
    const r = Math.min(radius, lin / 2, lout / 2);
    const a = [c[0] - ((c[0] - p[0]) / (lin || 1)) * r, c[1] - ((c[1] - p[1]) / (lin || 1)) * r];
    const b = [c[0] + ((nx[0] - c[0]) / (lout || 1)) * r, c[1] + ((nx[1] - c[1]) / (lout || 1)) * r];
    line(from, a);
    if (r > 0.5) quad(a, c, b);
    from = b;
  }
  line(from, route[route.length - 1]);
  return out;
}
