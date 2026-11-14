// The workbench: the visitor makes something on the way through the spiral.
// Screen 1: cut a piece out of a jeans leg. Screen 4: a reversible hat, one old fabric outside and
// another inside, each photographed from a garment of yours (or a sample). Screen 5: the hat, tap to turn it.
// Screen 9: save the hat as a picture to send to Katrin.
// Nothing is stored: every visit starts with an uncut pair of jeans and an empty hat.

import { sound } from './sound.js';
import { bindImageExport } from './image-export.js';

// a side the visitor hasn't filled yet is sewn from Katrin's default
const DEFAULT = { out: 'scraps', in: 'denim' };
let made = { out: null, in: null };

// squares the visitor cut from photos of their own old garments, one per side (data URLs, in memory only)
const ownSrc = { out: null, in: null };
export function fabricSrc(f) {
  return f.startsWith('own-') ? ownSrc[f.slice(4)] : `${import.meta.env.BASE_URL}swatch/${f}.webp`;
}

// the reversible hat for the try-on: whatever the visitor has chosen, the empty sides in the default
export function madeSides() {
  return { out: made.out || DEFAULT.out, in: made.in || DEFAULT.in, mine: !!(made.out || made.in) };
}

export function initWorkbench({ tr, reduced }) {
  // clear anything an earlier version of the site kept in this browser
  try { localStorage.removeItem('ribisl-made'); } catch {}
  const state = made;
  const imgs = {};
  const pendingImgs = {};
  const loadFabric = (f) => {
    if (f.startsWith('own-')) return Promise.resolve(imgs[f]);
    if (!pendingImgs[f]) {
      const im = new Image();
      im.decoding = 'async';
      imgs[f] = im;
      pendingImgs[f] = new Promise((res) => {
        im.onload = im.onerror = () => res(im);
        im.src = fabricSrc(f);
      });
    }
    return pendingImgs[f];
  };
  const ready = () => {
    const { out, in: inside } = madeSides();
    return Promise.all([loadFabric(out), loadFabric(inside)]);
  };

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

  /* ---------- 4 · the reversible hat: outside and inside ---------- */

  const board = document.querySelector('.board');
  const cells = [...board.querySelectorAll('.cell')];
  const hint = board.querySelector('.board-hint');
  const ownFile = board.querySelector('.own-file');
  const swatches = [...document.querySelectorAll('.swatch[data-fabric]')];
  const other = (side) => (side === 'out' ? 'in' : 'out');

  function markCutSwatch() {
    document.querySelector('.swatch[data-fabric="denim"]')?.classList.toggle('is-yours', !!state.cut);
  }

  function renderBoard(flashSide = null) {
    for (const c of cells) {
      const f = state[c.dataset.side];
      c.style.backgroundImage = f ? `url(${fabricSrc(f)})` : '';
      c.classList.toggle('is-filled', !!f);
      if (c.dataset.side === flashSide && !reduced()) {
        c.animate([{ transform: 'scale(0.4) rotate(-14deg)' }, { transform: 'scale(1.12) rotate(3deg)', offset: 0.6 }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      }
    }
    const full = !!(state.out && state.in);
    if (full && !board.classList.contains('is-sewn')) sound.pop();
    board.classList.toggle('is-sewn', full);
    hint.dataset.i18n = full ? 's3.boardDone' : 's3.boardHint';
    hint.textContent = tr(hint.dataset.i18n);
    if (state.out || state.in || hatWanted) refreshHat();
  }

  // a sample tapped without a side goes to the empty one; once both are sewn, it takes turns
  function place(fabric, side) {
    if (!side) {
      side = !state.out ? 'out' : !state.in ? 'in' : (state.next || 'out');
      if (state.out && state.in) state.next = other(side);
    }
    state[side] = fabric;
    sound.stitch();
    save();
    renderBoard(side);
  }

  // tap a side to photograph an old garment and cut that side's fabric out of it
  let photoSide = null;
  cells.forEach((c) => c.addEventListener('click', () => {
    photoSide = c.dataset.side;
    ownFile.click();
  }));
  ownFile.addEventListener('change', async () => {
    const file = ownFile.files?.[0];
    const side = photoSide;
    ownFile.value = '';
    if (!file || !side) return;
    const { openCutter } = await import('./cutter.js');
    const url = await openCutter(file, { tr, reduced });
    board.querySelector(`.cell[data-side="${side}"]`).focus({ preventScroll: true });
    if (!url) return;
    ownSrc[side] = url;
    const im = new Image();
    await new Promise((res) => { im.onload = im.onerror = res; im.src = url; });
    imgs[`own-${side}`] = im;
    place(`own-${side}`, side);
  });

  // tap a sample to put it on the next side, or drag it onto one
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
        if (over) place(sw.dataset.fabric, over.dataset.side);
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
  const hatTurn = hatFrame.querySelector('.hat-turn');
  const hatCanvas = hatFrame.querySelector('canvas');
  const madeBox = document.querySelector('.made');
  const thumb = madeBox.querySelector('canvas');
  const saveBtn = document.getElementById('save-hat');
  const setExportFile = bindImageExport({
    downloadButton: saveBtn,
    shareButton: document.getElementById('share-hat'),
    status: document.getElementById('hat-export-status'),
    help: madeBox.querySelector('.image-help'),
    tr,
  });
  let exportVersion = 0;
  let hatDrawn = false;
  let hatWanted = false;

  const sideImgs = () => {
    const { out, in: inside } = madeSides();
    return [imgs[out], imgs[inside]];
  };

  function refreshHat() {
    const version = ++exportVersion;
    hatDrawn = true;
    setExportFile(null);
    const mine = !!(state.out && state.in);
    ready().then(() => {
      if (version !== exportVersion) return;
      drawReversible(hatCanvas, ...sideImgs(), hatTurn.dataset.front);
      hatFrame.classList.add('has-hat');
      hatFrame.classList.toggle('is-yours', mine);
      madeBox.hidden = !mine;
      if (mine) {
        drawReversible(thumb, ...sideImgs());
        const c = document.createElement('canvas');
        c.width = 1200; c.height = 900;
        drawReversible(c, ...sideImgs(), 'out', true);
        c.toBlob((blob) => {
          if (blob && version === exportVersion) setExportFile(new File([blob], 'ribisl-hat.png', { type: 'image/png' }));
        }, 'image/png');
      }
    });
  }

  function ensureHat() {
    if (hatWanted) return;
    hatWanted = true;
    if (!hatDrawn) refreshHat();
  }

  // tap the hat on screen 5 and it turns inside out
  hatTurn.addEventListener('click', async () => {
    const front = other(hatTurn.dataset.front);
    hatTurn.dataset.front = front;
    hatTurn.setAttribute('aria-pressed', String(front === 'in'));
    sound.pop();
    if (!reduced()) await hatCanvas.animate([{ transform: 'none' }, { transform: 'scaleX(0) rotate(-6deg)' }], { duration: 170, easing: 'ease-in' }).finished;
    await ready();
    drawReversible(hatCanvas, ...sideImgs(), front);
    if (!reduced()) hatCanvas.animate([{ transform: 'scaleX(0) rotate(6deg)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  });

  markCutSwatch();
  renderBoard();

  // re-translate the board hint after a language change
  return { relabel: () => { hint.textContent = tr(hint.dataset.i18n); }, ensureHat };
}


/* ---------- drawing the hat ---------- */

const SMILE = [new Path2D('M42 15v35M59 15v35'), new Path2D('M19 37v9a31 31 0 0 0 62 0v-9')];

// A bucket hat seen straight on, at eye height, as the camera sees it in a selfie: a compact crown with
// nearly upright sides and a broad flat top, and a short brim angled down towards you, its front edge
// curving gently round the face. In a 400 × 300 box.
const CROWN = new Path2D('M104 166 L108 120 Q110 106 128 104 Q200 98 272 104 Q290 106 292 120 L296 166 Q200 178 104 166 Z');
const BAND = new Path2D('M101 166 Q200 178 299 166 L301 182 Q200 194 99 182 Z');
const BRIM = new Path2D('M99 182 Q200 194 301 182 Q320 202 332 222 Q335 232 322 235 Q200 252 78 235 Q65 232 68 222 Q80 202 99 182 Z');

// The hat sewn from one fabric all over; `shadow` adds its shadow on the table (not in a selfie).
export function drawHat(canvas, fabric, { shadow = true } = {}) {
  const ctx = canvas.getContext('2d');
  const k = canvas.width / 400;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(k, 0, 0, k, 0, (canvas.height / k - 300) / 2 * k);

  if (shadow) {
    ctx.save();
    ctx.filter = `blur(${7 * k}px)`;
    ctx.fillStyle = 'rgba(30, 24, 26, 0.28)';
    ctx.beginPath();
    ctx.ellipse(200, 253, 132, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const fill = (path) => {
    ctx.save();
    ctx.clip(path);
    if (fabric?.naturalWidth) {
      // the fabric, scaled to cover the whole hat
      const s = Math.max(360 / fabric.naturalWidth, 250 / fabric.naturalHeight);
      ctx.drawImage(fabric, 200 - (fabric.naturalWidth * s) / 2, 172 - (fabric.naturalHeight * s) / 2, fabric.naturalWidth * s, fabric.naturalHeight * s);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(0, 0, 400, 300);
    }
    ctx.restore();
  };
  fill(BRIM);
  fill(CROWN);
  fill(BAND);

  // light and shade, so it reads as a hat and not a flat shape, light enough that a print keeps its colour
  const shade = (path, g) => { ctx.save(); ctx.clip(path); ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300); ctx.restore(); };
  let g = ctx.createLinearGradient(97, 0, 303, 0);
  g.addColorStop(0, 'rgba(20, 12, 16, 0.38)'); g.addColorStop(0.45, 'rgba(255, 255, 255, 0.08)'); g.addColorStop(1, 'rgba(20, 12, 16, 0.34)');
  shade(CROWN, g);
  g = ctx.createLinearGradient(0, 60, 0, 100);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.18)'); g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  shade(CROWN, g);
  shade(BAND, 'rgba(20, 12, 16, 0.22)');
  // the brim slopes away from the light under the crown, and catches it towards its edge
  g = ctx.createLinearGradient(0, 182, 0, 248);
  g.addColorStop(0, 'rgba(20, 12, 16, 0.42)'); g.addColorStop(1, 'rgba(20, 12, 16, 0.06)');
  shade(BRIM, g);

  // outlines, and rows of topstitching following the brim's front edge
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(30, 24, 26, 0.6)';
  ctx.lineWidth = 1.6;
  for (const p of [BRIM, CROWN, BAND]) ctx.stroke(p);
  ctx.save();
  ctx.clip(BRIM);
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = 'rgba(255, 246, 230, 0.7)';
  ctx.lineWidth = 1;
  for (const d of [8, 16, 24]) {
    ctx.beginPath();
    ctx.moveTo(78 + d * 0.7, 234 - d);
    ctx.quadraticCurveTo(200, 251 - d * 1.05, 322 - d * 0.7, 234 - d);
    ctx.stroke();
  }
  ctx.restore();

  // the smiley label, sewn on the band
  ctx.save();
  ctx.translate(246, 160);
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
}

// The reversible hat, as on the market screen: both sides, one in front, the other turned behind it.
// `front` says which side faces you; drawn into a 400 × 300 box.
export function drawReversible(canvas, outside, inside, front = 'out', withBackground = false) {
  const side = (fabric) => {
    const c = document.createElement('canvas');
    c.width = canvas.width; c.height = canvas.width * 0.75;
    drawHat(c, fabric);
    return c;
  };
  const [first, second] = front === 'out' ? [outside, inside] : [inside, outside];
  const ctx = canvas.getContext('2d');
  const k = canvas.width / 400;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (withBackground) {
    ctx.fillStyle = '#B6D363';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.setTransform(k, 0, 0, k, 0, (canvas.height / k - 300) / 2 * k);
  const put = (c, x, y, scale, deg, dim) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((deg * Math.PI) / 180);
    if (dim) ctx.filter = 'brightness(0.92)';
    ctx.drawImage(c, -200 * scale, -150 * scale, 400 * scale, 300 * scale);
    ctx.restore();
  };
  // behind: smaller, raised and turned the other way; in front: big and a little cocky
  // (the hat is drawn front on, as in the try-on, and fills less of its box, so both come up a size)
  put(side(second), 262, 110, 0.76, 9, true);
  put(side(first), 172, 158, 0.98, -4, false);

  if (withBackground) {
    ctx.fillStyle = '#1E181A';
    ctx.font = '600 13px Gabarito, sans-serif';
    ctx.fillText('designed with ribisl design · @ribisl_design', 14, 20);
  }
}
