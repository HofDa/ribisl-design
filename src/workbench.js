// The workbench: the visitor makes something on the way through the spiral.
// Screen 1: cut a piece out of a jeans leg. Screen 3: tap or drag fabrics into a patchwork.
// Screen 5: the patchwork becomes a bucket hat. Screen 9: save the hat as a picture to send to Katrin.
// Nothing is stored: every visit starts with an uncut pair of jeans and an empty patchwork.

import { sound } from './sound.js';

const FABRICS = ['denim', 'scraps', 'rope', 'knit'];
let made = { cells: [null, null, null, null] };

// a square the visitor cut from a photo of their own old garment (a data URL, in memory only)
let ownSrc = null;
export function fabricSrc(f) {
  return f === 'own' ? ownSrc : `${import.meta.env.BASE_URL}swatch/${f}.webp`;
}

// the patchwork for the try-on: whatever the visitor has placed, the empty squares in Katrin's default mix
export function madeCells() {
  return { cells: made.cells.map((c, i) => c || FABRICS[i]), mine: made.cells.some(Boolean) };
}

export function initWorkbench({ tr, reduced }) {
  // clear anything an earlier version of the site kept in this browser
  try { localStorage.removeItem('ribisl-made'); } catch {}
  const state = made;
  const imgs = {};
  const ready = Promise.all(FABRICS.map((f) => new Promise((res) => {
    const im = new Image();
    im.onload = im.onerror = () => res();
    im.src = fabricSrc(f);
    imgs[f] = im;
  })));

  function save() {} // in memory only, on purpose

  /* ---------- 1 · cut a piece out of the jeans ---------- */

  const bench = document.querySelector('.bench--jeans');
  const svg = bench.querySelector('.jeans');
  const guide = svg.querySelector('.cut-guide');
  const done = svg.querySelector('.cut-done');
  const sc = svg.querySelector('.cut-scissors');
  const cutBtn = bench.querySelector('.cut-btn');
  const N = 240;
  const len = guide.getTotalLength();
  const pts = Array.from({ length: N + 1 }, (_, i) => guide.getPointAtLength((len * i) / N));
  let cut = 0;
  let dragging = false;
  let lastSnip = 0;
  const snipAt = () => { if (cut - lastSnip > 0.06) { lastSnip = cut; sound.snip(); } };

  function placeScissors() {
    const i = Math.min(N - 1, Math.round(cut * N));
    const a = pts[i], b = pts[i + 1];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    sc.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang}) translate(-12 0)`);
    done.style.strokeDashoffset = String(100 - cut * 100);
    snipAt();
  }

  function finishCut() {
    cut = 1;
    placeScissors();
    bench.classList.remove('is-cutting');
    bench.classList.add('is-cut');
    cutBtn.disabled = true;
    sound.pop();
    if (!state.cut) { state.cut = true; save(); markCutSwatch(); }
  }

  function toSvg(e) {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { x: ((e.clientX - r.left) / r.width) * vb.width, y: ((e.clientY - r.top) / r.height) * vb.height };
  }

  // the scissors only go forward along the line, and only while the pointer stays near it
  function follow(e) {
    const p = toSvg(e);
    let best = -1, bestD = 30 * 30;
    const from = Math.max(0, Math.floor((cut - 0.03) * N)), to = Math.min(N, Math.ceil((cut + 0.14) * N));
    for (let i = from; i <= to; i++) {
      const d = (pts[i].x - p.x) ** 2 + (pts[i].y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0 && best / N > cut) {
      cut = best / N;
      placeScissors();
      if (cut > 0.985) finishCut();
    }
  }

  let downAt = null;
  svg.addEventListener('pointerdown', (e) => {
    if (state.cut && bench.classList.contains('is-cut')) return;
    dragging = true;
    downAt = { x: e.clientX, y: e.clientY, moved: false };
    svg.setPointerCapture(e.pointerId);
    bench.classList.add('is-cutting');
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) downAt.moved = true;
    follow(e);
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    bench.classList.remove('is-cutting');
    // a tap without dragging: the scissors cut it out on their own
    if (!downAt.moved && cut < 1) autoCut();
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  cutBtn.addEventListener('click', () => autoCut());

  function autoCut() {
    if (bench.classList.contains('is-cut')) return;
    if (reduced()) return finishCut();
    bench.classList.add('is-cutting');
    const start = cut, t0 = performance.now(), dur = 1100 * (1 - start);
    const tick = (now) => {
      cut = Math.min(1, start + ((now - t0) / dur) * (1 - start));
      placeScissors();
      if (cut < 1) requestAnimationFrame(tick);
      else finishCut();
    };
    requestAnimationFrame(tick);
  }

  placeScissors();

  /* ---------- 3 · patchwork ---------- */

  const board = document.querySelector('.board');
  const cells = [...board.querySelectorAll('.cell')];
  const hint = board.querySelector('.board-hint');
  const swatches = [...document.querySelectorAll('.swatch[data-fabric]')];

  // the two seams across the board, in zigzag stitch
  board.querySelectorAll('.zig').forEach((pl) => {
    const vertical = pl.classList.contains('zig--v');
    const p = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 5, b = 50 + (i % 2 ? 3 : -3);
      p.push(vertical ? `${b},${a}` : `${a},${b}`);
    }
    pl.setAttribute('points', p.join(' '));
    pl.setAttribute('pathLength', '100');
  });

  function markCutSwatch() {
    document.querySelector('.swatch[data-fabric="denim"]')?.classList.toggle('is-yours', !!state.cut);
  }

  function renderBoard(flashIndex = -1) {
    cells.forEach((c, i) => {
      const f = state.cells[i];
      c.style.backgroundImage = f ? `url(${fabricSrc(f)})` : '';
      c.classList.toggle('is-filled', !!f);
      if (i === flashIndex && !reduced()) {
        c.animate([{ transform: 'scale(0.4) rotate(-14deg)' }, { transform: 'scale(1.12) rotate(3deg)', offset: 0.6 }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      }
    });
    const full = state.cells.every(Boolean);
    if (full && !board.classList.contains('is-sewn')) sound.pop();
    board.classList.toggle('is-sewn', full);
    hint.dataset.i18n = full ? 's3.boardDone' : 's3.boardHint';
    hint.textContent = tr(hint.dataset.i18n);
    refreshHat();
  }

  function place(fabric, at) {
    let i = at ?? state.cells.findIndex((c) => !c);
    if (i < 0) { i = state.next ?? 0; state.next = (i + 1) % 4; } // full: replace round the board
    state.cells[i] = fabric;
    sound.stitch();
    save();
    renderBoard(i);
  }

  cells.forEach((c, i) => c.addEventListener('click', () => {
    if (!state.cells[i]) return;
    state.cells[i] = null;
    save();
    renderBoard();
  }));

  // tap a swatch to put it in the next free square, or drag it onto a square
  for (const sw of swatches) {
    let drag = null;
    sw.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
      sw.setPointerCapture(e.pointerId);
    });
    sw.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
        const r = sw.getBoundingClientRect();
        drag.ghost = sw.cloneNode(true);
        drag.ghost.className = 'swatch swatch-ghost';
        drag.ghost.style.width = r.width + 'px';
        drag.ghost.style.height = r.height + 'px';
        drag.dx = r.left - e.clientX; drag.dy = r.top - e.clientY;
        document.body.append(drag.ghost);
      }
      if (drag.ghost) {
        drag.ghost.style.left = e.clientX + drag.dx + 'px';
        drag.ghost.style.top = e.clientY + drag.dy + 'px';
        const over = cellAt(e.clientX, e.clientY);
        cells.forEach((c) => c.classList.toggle('is-target', c === over));
      }
    });
    const end = (e, cancelled) => {
      if (!drag) return;
      const { ghost } = drag;
      drag = null;
      cells.forEach((c) => c.classList.remove('is-target'));
      if (ghost) {
        ghost.remove();
        const over = !cancelled && cellAt(e.clientX, e.clientY);
        if (over) place(sw.dataset.fabric, cells.indexOf(over));
      } else if (!cancelled) {
        place(sw.dataset.fabric);
      }
    };
    sw.addEventListener('pointerup', (e) => end(e, false));
    sw.addEventListener('pointercancel', (e) => end(e, true));
    // keyboard: Enter or Space places it, like a tap
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); place(sw.dataset.fabric); }
    });
  }

  function cellAt(x, y) {
    return cells.find((c) => {
      const r = c.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }

  /* ---------- 5 + 9 · the hat ---------- */

  const hatFrame = document.querySelector('.piece--hat');
  const hatCanvas = hatFrame.querySelector('canvas');
  const madeBox = document.querySelector('.made');
  const thumb = madeBox.querySelector('canvas');
  const saveBtn = document.getElementById('save-hat');

  function hatCells() {
    // squares not filled yet use Katrin's default mix
    return state.cells.map((c, i) => c || FABRICS[i]);
  }

  function refreshHat() {
    const mine = state.cells.every(Boolean);
    ready.then(() => {
      drawHat(hatCanvas, hatCells(), imgs);
      hatFrame.classList.add('has-hat');
      hatFrame.classList.toggle('is-yours', mine);
      madeBox.hidden = !mine;
      if (mine) drawHat(thumb, hatCells(), imgs);
    });
  }

  saveBtn.addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = 1200; c.height = 900;
    drawHat(c, hatCells(), imgs, true);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ribisl-hat.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });

  /* ---------- 3 · upcycle anything: your own fabric ---------- */

  const own = board.querySelector('.own');
  const ownAdd = own.querySelector('.own-add');
  const ownFile = own.querySelector('.own-file');
  const ownSwatch = own.querySelector('.swatch--own');
  ownAdd.addEventListener('click', () => ownFile.click());
  ownFile.addEventListener('change', async () => {
    const file = ownFile.files?.[0];
    ownFile.value = '';
    if (!file) return;
    const url = await openCutter(file, { tr, reduced });
    ownAdd.focus({ preventScroll: true });
    if (!url) return;
    ownSrc = url;
    const im = new Image();
    await new Promise((res) => { im.onload = im.onerror = res; im.src = url; });
    imgs.own = im;
    ownSwatch.querySelector('img').src = url;
    ownSwatch.hidden = false;
    // a new fabric replaces any older one already in the patchwork
    state.cells = state.cells.map((c) => (c === 'own' ? null : c));
    place('own');
  });

  markCutSwatch();
  renderBoard();

  // re-translate the board hint after a language change
  return { relabel: () => { hint.textContent = tr(hint.dataset.i18n); } };
}


/* ---------- drawing the hat ---------- */

const CROWN = new Path2D('M106 104 Q107 80 140 75 Q200 68 260 75 Q293 80 294 104 L303 168 Q200 184 97 168 Z');
const BAND = new Path2D('M100 168 Q200 184 300 168 L305 193 Q200 210 95 193 Z');
const BRIM = new Path2D('M95 193 Q200 210 305 193 Q356 206 374 234 Q378 264 300 276 Q200 292 100 276 Q22 264 26 234 Q44 206 95 193 Z');
const SMILE = [new Path2D('M42 15v35M59 15v35'), new Path2D('M19 37v9a31 31 0 0 0 62 0v-9')];

// A bucket hat seen from the front, in a 400 × 300 box: sewn from four squares of fabric,
// or, when `fabric` is given, from one fabric all over (used for the try-on).
export function drawHat(canvas, cells, imgs, withBackground = false, fabric = null) {
  const ctx = canvas.getContext('2d');
  const k = canvas.width / 400;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (withBackground) {
    ctx.fillStyle = '#B6D363';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.setTransform(k, 0, 0, k, 0, (canvas.height / k - 300) / 2 * k);

  // shadow on the table
  ctx.save();
  ctx.filter = `blur(${7 * k}px)`;
  ctx.fillStyle = 'rgba(30, 24, 26, 0.28)';
  ctx.beginPath();
  ctx.ellipse(200, 284, 168, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const quads = [[0, 40, 200, 146], [200, 40, 200, 146], [0, 186, 200, 114], [200, 186, 200, 114]];
  const fill = (path) => {
    ctx.save();
    ctx.clip(path);
    if (fabric?.naturalWidth) {
      // one fabric, scaled to cover the whole hat
      const s = Math.max(360 / fabric.naturalWidth, 250 / fabric.naturalHeight);
      ctx.drawImage(fabric, 200 - (fabric.naturalWidth * s) / 2, 172 - (fabric.naturalHeight * s) / 2, fabric.naturalWidth * s, fabric.naturalHeight * s);
      ctx.restore();
      return;
    }
    quads.forEach(([x, y, w, h], i) => {
      const im = imgs[cells[i]];
      if (im?.naturalWidth) {
        const s = Math.max(w, h);
        ctx.drawImage(im, x + (w - s) / 2, y + (h - s) / 2, s, s);
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x, y, w, h);
      }
    });
    // the seams where the four squares meet
    ctx.strokeStyle = 'rgba(30, 24, 26, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 300); ctx.moveTo(0, 186); ctx.lineTo(400, 186); ctx.stroke();
    ctx.restore();
  };
  fill(BRIM);
  fill(CROWN);
  fill(BAND);

  // light and shade, so it reads as a hat and not a flat shape
  // a printed fabric keeps its colour better under lighter shading
  const shade = (path, g) => { ctx.save(); ctx.clip(path); ctx.globalAlpha = fabric ? 0.5 : 1; ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300); ctx.restore(); };
  let g = ctx.createLinearGradient(97, 0, 303, 0);
  g.addColorStop(0, 'rgba(20, 12, 16, 0.38)'); g.addColorStop(0.45, 'rgba(255, 255, 255, 0.08)'); g.addColorStop(1, 'rgba(20, 12, 16, 0.34)');
  shade(CROWN, g);
  g = ctx.createLinearGradient(0, 60, 0, 100);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.18)'); g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  shade(CROWN, g);
  shade(BAND, 'rgba(20, 12, 16, 0.22)');
  g = ctx.createRadialGradient(200, 200, 60, 200, 230, 210);
  g.addColorStop(0, 'rgba(20, 12, 16, 0.05)'); g.addColorStop(1, 'rgba(20, 12, 16, 0.42)');
  shade(BRIM, g);

  // outlines and the rows of topstitching round the brim
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(30, 24, 26, 0.6)';
  ctx.lineWidth = 1.6;
  for (const p of [BRIM, CROWN, BAND]) ctx.stroke(p);
  ctx.save();
  ctx.clip(BRIM);
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = 'rgba(255, 246, 230, 0.7)';
  ctx.lineWidth = 1;
  for (const d of [12, 24, 36]) {
    ctx.beginPath();
    ctx.ellipse(200, 236, 176 - d, 45 - d * 0.55, 0, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // the smiley label, sewn on the band
  ctx.save();
  ctx.translate(244, 170);
  ctx.rotate(0.04);
  ctx.fillStyle = '#FBF9F4';
  ctx.fillRect(0, 0, 24, 21);
  ctx.strokeStyle = 'rgba(30, 24, 26, 0.45)';
  ctx.setLineDash([1.5, 1.2]);
  ctx.lineWidth = 0.6;
  ctx.strokeRect(1.6, 1.6, 20.8, 17.8);
  ctx.setLineDash([]);
  ctx.translate(5, 3);
  ctx.scale(0.14, 0.14);
  ctx.lineCap = 'round';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#1E181A';
  for (const p of SMILE) ctx.stroke(p);
  ctx.restore();

  if (withBackground) {
    ctx.fillStyle = '#1E181A';
    ctx.font = '600 13px Gabarito, sans-serif';
    ctx.fillText('designed with ribisl design · @ribisl_design', 14, 20);
  }
}

/* ---------- the cutter: place a square on a photo of an old garment and cut it out ---------- */

function openCutter(file, { tr, reduced }) {
  return new Promise((resolve) => {
    const root = document.documentElement;
    const src = URL.createObjectURL(file);
    const ui = document.createElement('div');
    ui.className = 'cutter';
    ui.setAttribute('role', 'dialog');
    ui.setAttribute('aria-modal', 'true');
    ui.setAttribute('aria-label', tr('cutter.title'));
    ui.innerHTML = `
      <p class="label cutter-hint">${tr('cutter.hint')}</p>
      <div class="cutter-stage"><div class="cutter-pic"><img alt="" draggable="false"><div class="cutter-frame"></div></div></div>
      <div class="cutter-bar">
        <label class="cutter-size"><span>${tr('cutter.size')}</span><input type="range" min="20" max="100" value="60"></label>
        <button type="button" class="btn cutter-cancel">${tr('cutter.cancel')}</button>
        <button type="button" class="btn cutter-cut">✂ ${tr('cutter.cut')}</button>
        <p class="cutter-note">${tr('cutter.private')}</p>
      </div>`;
    document.body.append(ui);
    root.classList.add('is-cutter');
    const img = ui.querySelector('img');
    const frame = ui.querySelector('.cutter-frame');
    const size = ui.querySelector('input');
    // the square, as a centre point (fractions of the picture) and a size (percent of its shorter side)
    const f = { cx: 0.5, cy: 0.5 };

    function layout() {
      const w = img.clientWidth, h = img.clientHeight;
      if (!w) return;
      const side = (Math.min(w, h) * size.value) / 100;
      const x = Math.max(side / 2, Math.min(w - side / 2, f.cx * w));
      const y = Math.max(side / 2, Math.min(h - side / 2, f.cy * h));
      f.cx = x / w; f.cy = y / h;
      Object.assign(frame.style, { width: `${side}px`, height: `${side}px`, left: `${x - side / 2}px`, top: `${y - side / 2}px` });
    }
    img.onload = layout;
    img.src = src;
    size.addEventListener('input', layout);
    addEventListener('resize', layout);

    // drag the square, or tap the picture to move it there
    let drag = null;
    const pic = ui.querySelector('.cutter-pic');
    pic.addEventListener('pointerdown', (e) => {
      const r = img.getBoundingClientRect();
      drag = { r };
      pic.setPointerCapture(e.pointerId);
      move(e);
    });
    const move = (e) => {
      if (!drag) return;
      f.cx = (e.clientX - drag.r.left) / drag.r.width;
      f.cy = (e.clientY - drag.r.top) / drag.r.height;
      layout();
    };
    pic.addEventListener('pointermove', move);
    pic.addEventListener('pointerup', () => { drag = null; });

    function close(result) {
      removeEventListener('resize', layout);
      removeEventListener('keydown', onKey, true);
      URL.revokeObjectURL(src);
      ui.remove();
      root.classList.remove('is-cutter');
      resolve(result);
    }
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } };
    addEventListener('keydown', onKey, true);
    ui.querySelector('.cutter-cancel').addEventListener('click', () => close(null));
    ui.querySelector('.cutter-cut').addEventListener('click', () => {
      // cut the square out of the full-size photo
      const k = img.naturalWidth / img.clientWidth;
      const side = ((Math.min(img.clientWidth, img.clientHeight) * size.value) / 100) * k;
      const c = document.createElement('canvas');
      c.width = c.height = 360;
      c.getContext('2d').drawImage(img, f.cx * img.naturalWidth - side / 2, f.cy * img.naturalHeight - side / 2, side, side, 0, 0, 360, 360);
      const url = c.toDataURL('image/jpeg', 0.86);
      sound.snip();
      if (reduced()) return close(url);
      frame.classList.add('is-cut');
      setTimeout(() => close(url), 520);
    });
    ui.querySelector('.cutter-cut').focus();
  });
}
