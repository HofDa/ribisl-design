import '@fontsource-variable/gabarito/wght.css';
import '@fontsource-variable/caveat/wght.css';
import '@fontsource-variable/outfit/wght.css';
import './style.css';
import { t, detectLang } from './i18n.js';
import { Thread } from './thread.js';
import { initWorkbench } from './workbench.js';
import { sound } from './sound.js';
import { PATHS } from './site.js';

// Counter-clockwise inward spiral: down the left, along the bottom, up the right, back along the top, into the center.
const ORDER = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0], [1, 1]];
const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

// Nine offcuts sewn into one cloth, indexed by spiral position: real fabric scans (CC0, polyhaven.com).
// base is each fabric's average colour, painted until its scan has loaded. The busier scans are kept at
// 768 px and drawn larger (scale), so every weave shows at the same size as at 1024 px.
const PATCHES = [
  { fabric: 'yellow', base: '#F7AB28', scale: 0.8 },
  { fabric: 'pink', base: '#EE6EA4', scale: 1.07 },
  { fabric: 'denim', base: '#4D718D', scale: 1.2 },
  { fabric: 'orange', base: '#E5770F', scale: 0.8 },
  { fabric: 'plaid', base: '#8EA390', scale: 0.73 },
  { fabric: 'lime', base: '#B6D363', scale: 0.8 },
  { fabric: 'cobalt', base: '#054896', scale: 1.07 },
  { fabric: 'scuba', base: '#056F81', scale: 0.8 },
  { fabric: 'linen', base: '#91ABCD', scale: 1.07 },
];
const MAT = '#3D6A5A'; // the cutting mat beyond the cloth, seen in dips and the overview

const root = document.documentElement;
const plate = document.getElementById('plate');
const canvas = document.getElementById('cloth');
const ctx = canvas.getContext('2d');
const screens = [...document.querySelectorAll('.screen')];
const nextBtn = document.getElementById('next');
const plateBtn = document.getElementById('plate-btn');
const menuBtn = document.getElementById('menu-btn');
const menuList = document.getElementById('menu-list');
const announce = document.getElementById('announce');
const endTag = document.getElementById('end-tag');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');

let lang = detectLang();
let W = innerWidth, H = innerHeight;
let current = 0; // 0-based spiral index
let overview = false;
const cam = { cx: 0.5, cy: 0.5, s: 1, r: 0 }; // r: a little swing, in radians
let anim = null;
let grain;
const fabrics = [];

/* ---------- copy ---------- */

function applyLang(l) {
  lang = l;
  try { localStorage.setItem('ribisl-lang', l); } catch {}
  root.lang = l;
  // keep the address on the language's own page, so a shared or reloaded link opens in it
  const here = import.meta.env.BASE_URL + PATHS[l];
  if (location.pathname !== here) history.replaceState(null, '', here + location.hash);
  document.title = t(l, 'meta.title');
  document.querySelector('meta[name="description"]').content = t(l, 'meta.desc');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(l, el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(l, el.dataset.i18nLabel));
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === l));
  if (thread) thread.phew = t(l, 'thread.phew');
  fitArcs();
  buildMap();
  updateHud();
  updateNext();
}

// the names sewn round the patches on screen 7: shrink any that would run past their half of the circle
function fitArcs() {
  for (const text of document.querySelectorAll('.patch-badge text.arc')) {
    text.style.fontSize = '';
    const path = document.querySelector(text.firstElementChild.getAttribute('href'));
    const room = path.getTotalLength() * 0.93;
    const len = text.getComputedTextLength();
    if (len > room) text.style.fontSize = `${(10 * room) / len}px`;
  }
}
document.fonts?.ready.then(fitArcs);

// Screen 7: the pennant chain runs across the whole screen. It is rebuilt for the screen's width,
// so the pennants keep their shape and just get more (or fewer) along the line.
const PENNANTS = ['url(#pb-dots)', '#FFC066', 'url(#pb-check)', '#86DEC9', 'url(#pb-stripe)', '#C4122F',
  'url(#pb-denim)', '#F2C14E', 'url(#pb-dots2)', '#FBF9F4', 'url(#pb-check2)', '#5B80A2'];
function buildBunting() {
  const svg = document.querySelector('.stall-bunting');
  if (!svg) return;
  const W = Math.max(200, Math.round(svg.getBoundingClientRect().width)), H = 44;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const sag = Math.min(16, 6 + W / 120);
  const y = (x) => 5 + sag * (1 - ((x - W / 2) / (W / 2)) ** 2);
  const pw = 21, n = Math.max(6, Math.floor((W - 8) / (pw + 4)));
  const gap = (W - 8 - n * pw) / (n - 1);
  let out = `<path d="M0 ${y(0).toFixed(1)}Q${W / 2} ${(5 + 2 * sag).toFixed(1)} ${W} ${y(W).toFixed(1)}" fill="none" stroke="#FBF9F4" stroke-width="1.4"/>`;
  for (let i = 0; i < n; i++) {
    const x0 = 4 + i * (pw + gap), x1 = x0 + pw, xm = (x0 + x1) / 2;
    out += `<g class="pennant" style="--i:${i % 24}"><path d="M${x0.toFixed(1)} ${y(x0).toFixed(1)}L${x1.toFixed(1)} ${y(x1).toFixed(1)}L${xm.toFixed(1)} ${(y(xm) + 24).toFixed(1)}z" fill="${PENNANTS[i % PENNANTS.length]}"/>`
      + `<path d="M${(x0 + 3).toFixed(1)} ${(y(x0) + 1.8).toFixed(1)}L${(x1 - 3).toFixed(1)} ${(y(x1) + 1.8).toFixed(1)}L${xm.toFixed(1)} ${(y(xm) + 20).toFixed(1)}z" fill="none" stroke="rgba(30,24,26,0.4)" stroke-width="0.6" stroke-dasharray="1.6 1.2"/></g>`;
  }
  svg.querySelector('.bunting-line').innerHTML = out;
}
buildBunting();
addEventListener('resize', buildBunting);

/* ---------- spiral map ---------- */

function buildMap() {
  const map = document.getElementById('map');
  const pts = ORDER.map(([c, r]) => `${c * 20 + 9},${r * 20 + 9}`).join(' ');
  map.innerHTML = `<svg class="map-path" viewBox="0 0 58 58" aria-hidden="true"><polyline points="${pts}"/></svg>`;
  const here = document.createElement('span');
  here.className = 'map-here';
  map.append(here);
  ORDER.forEach(([c, r], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-cell';
    b.style.gridArea = `${r + 1} / ${c + 1}`;
    b.textContent = i + 1;
    b.setAttribute('aria-label', `${i + 1}. ${t(lang, 't' + (i + 1))}`);
    b.addEventListener('click', () => go(i));
    map.append(b);
  });
}

function updateHud() {
  document.querySelectorAll('.map-cell').forEach((b, i) => {
    b.classList.toggle('is-here', i === current && !overview);
    b.classList.toggle('is-sewn', !!thread?.sewn.has(i));
    if (i === current) b.setAttribute('aria-current', 'location');
    else b.removeAttribute('aria-current');
  });
  menuList.querySelectorAll('a').forEach((a, i) => {
    if (i === current) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
  const [c, r] = ORDER[current];
  const here = document.querySelector('.map-here');
  here.style.transform = `translate(${c * 20}px, ${r * 20}px)`;
  here.classList.toggle('is-off', overview);
  plateBtn.setAttribute('aria-pressed', String(overview));
  plateBtn.querySelector('span').textContent = t(lang, overview ? 'hud.plateExit' : 'hud.plate');
  document.getElementById('r-n').textContent = current + 1;
  document.getElementById('r-title').textContent = t(lang, 't' + (current + 1));
}

// the one button that points along the spiral
function updateNext() {
  const dir = screens[current].dataset.next;
  nextBtn.hidden = !dir || overview;
  if (dir) {
    nextBtn.dataset.dir = dir;
    nextBtn.querySelector('.next-label').textContent =
      current === 0 ? t(lang, 's1.go') : `${t(lang, 'next')}: ${t(lang, 't' + (current + 2))}`;
  }
}

// On the move the next button steps away, and returns at its new edge once the camera lands.
let nextTimer;
function renext(delay) {
  clearTimeout(nextTimer);
  if (reducedQuery.matches || !delay) { nextBtn.style.opacity = ''; updateNext(); return; }
  nextBtn.getAnimations().forEach((a) => a.cancel());
  if (!nextBtn.hidden) {
    nextBtn.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.94)' }],
      { duration: 160, easing: 'cubic-bezier(0.4, 0, 1, 1)' });
  }
  nextBtn.style.opacity = '0';
  nextTimer = setTimeout(() => {
    nextBtn.getAnimations().forEach((a) => a.cancel());
    nextBtn.style.opacity = '';
    updateNext();
    if (!nextBtn.hidden) {
      nextBtn.animate([{ opacity: 0, transform: 'translateY(14px) scale(0.8)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(0.34, 1.7, 0.6, 1)' });
    }
  }, delay);
}

// Only the screen under the lens is in focus; the destination resolves as the camera lands.
let focusTimer, settleTimer;
function focusOn(i, delay) {
  clearTimeout(focusTimer);
  clearTimeout(settleTimer);
  screens.forEach((s, k) => {
    s.classList.remove('is-arriving');
    s.classList.toggle('is-away', !overview && (k !== i || delay > 0));
  });
  if (overview || !delay) return;
  focusTimer = setTimeout(() => {
    screens[i].classList.remove('is-away');
    screens[i].classList.add('is-arriving');
    settleTimer = setTimeout(() => screens[i].classList.remove('is-arriving'), 1700);
  }, delay);
}

/* ---------- camera ---------- */

function target(i) {
  const [c, r] = ORDER[i];
  return { cx: c + 0.5, cy: r + 0.5, s: 1 };
}

const HUD_BAND = 120; // bottom strip kept clear for the map in overview

function overviewCam() {
  const s = Math.min((W - 40) / (3 * W), (H - HUD_BAND - 70) / (3 * H));
  const yc = (H - HUD_BAND) / 2 + 20;
  return { cx: 1.5, cy: 1.5 + (H / 2 - yc) / (s * H), s };
}

function applyCamera() {
  const tx = W / 2 - cam.s * cam.cx * W;
  const ty = H / 2 - cam.s * cam.cy * H;
  // the swing turns the whole cloth about the middle of the window, like fabric flicked across a table
  plate.style.transform = cam.r
    ? `translate(${W / 2}px, ${H / 2}px) rotate(${cam.r}rad) translate(${-W / 2}px, ${-H / 2}px) translate3d(${tx}px, ${ty}px, 0) scale(${cam.s})`
    : `translate3d(${tx}px, ${ty}px, 0) scale(${cam.s})`;
}

// a small wind-up before it goes and a small overshoot when it lands: quick, and a bit cheeky
const C = 0.9 * 1.525;
const ease = (x) => (x < 0.5
  ? (Math.pow(2 * x, 2) * ((C + 1) * 2 * x - C)) / 2
  : (Math.pow(2 * x - 2, 2) * ((C + 1) * (x * 2 - 2) + C) + 2) / 2);

function fly(to, { dip = 0 } = {}) {
  if (reducedQuery.matches) {
    Object.assign(cam, to);
    anim = null;
    applyCamera();
    kick();
    return 0;
  }
  const from = { ...cam };
  const dist = Math.hypot(to.cx - from.cx, to.cy - from.cy);
  const dur = 560 + dist * 170 + Math.abs(to.s - from.s) * 300;
  // swing toward the direction of travel
  const swing = to.s === from.s && dist ? 0.035 * Math.sign((to.cx - from.cx) - (to.cy - from.cy) || 1) : 0;
  anim = { from, to, t0: performance.now(), dur, swing, dip: dip * Math.min(1, dist) + (dist > 1.2 ? 0.1 : 0) };
  kick();
  return dur;
}

function stepCamera(now) {
  if (!anim) return false;
  const p = Math.min(1, (now - anim.t0) / anim.dur);
  const e = ease(p);
  cam.cx = anim.from.cx + (anim.to.cx - anim.from.cx) * e;
  cam.cy = anim.from.cy + (anim.to.cy - anim.from.cy) * e;
  // pull back mid-flight so the neighbouring patches and the thread come into view
  cam.s = (anim.from.s + (anim.to.s - anim.from.s) * e) * (1 - anim.dip * Math.sin(Math.PI * Math.min(1, p * 1.05)));
  cam.r = anim.swing * Math.sin(Math.PI * p);
  applyCamera();
  if (p === 1) { anim = null; cam.r = 0; applyCamera(); }
  return true;
}

/* ---------- navigation ---------- */

function setInert() {
  screens.forEach((s, i) => { s.inert = overview || i !== current; });
}

// how far into a screen the needle has sewn: 0 at its entry, 1 at its exit
let progress = 0;
const LEAD = 0.14; // on arrival the needle has just come in, so you can see where it's going

function go(i, { instant = false, focus = true, prog } = {}) {
  i = Math.max(0, Math.min(8, i));
  if (!menuList.hidden) toggleMenu(false, false);
  const wasOverview = overview;
  overview = false;
  root.classList.remove('is-overview');
  const back = i < current;
  current = i;
  screens.forEach((s, k) => s.classList.toggle('is-here', k === i));
  if (i === 1) snipAlong();
  // arriving forward the needle has just entered; stepping back it waits near that screen's exit
  progress = prog ?? (back ? 0.86 : LEAD);
  thread?.setProgress(i, progress);
  updateSteps();
  setInert();
  updateHud();
  history.replaceState(null, '', '#' + screens[i].id);
  announce.textContent = t(lang, 'hud.announce', { n: i + 1, title: t(lang, 't' + (i + 1)) });
  let dur = 0;
  if (instant) { anim = null; Object.assign(cam, target(i)); applyCamera(); kick(); }
  else dur = fly(target(i), { dip: wasOverview ? 0 : 0.26 });
  focusOn(i, dur * 0.5);
  renext(dur * 0.62);
  if (focus) screens[i].querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
}

// Scrolling sews: the needle follows the wheel or the finger, sewing on through the screen or
// unpicking back. Sew to a screen's edge and the camera carries you over to the next one.
const sewSpan = () => Math.max(720, H * 0.95); // scroll distance that sews one screen

// scroll back and forth too wildly and the thread gets in a tangle
let lastSign = 0;
const flips = [];
function checkTangle(d) {
  const sgn = Math.abs(d) > 3 ? Math.sign(d) : 0;
  if (!sgn) return;
  const now = performance.now();
  if (lastSign && sgn !== lastSign) {
    flips.push(now);
    while (flips.length && now - flips[0] > 1500) flips.shift();
    if (flips.length >= 5 && now - thread.tangleAt > 2500 && !reducedQuery.matches) {
      thread.tangle(now);
      flips.length = 0;
      sound.boing();
      kick();
    }
  }
  lastSign = sgn;
}

function sew(d) {
  if (overview || anim) return; // let the camera land first; it also soaks up a fling's momentum
  checkTangle(d);
  progress += d / sewSpan();
  if (progress >= 1 && current < 8) return go(current + 1);
  if (progress < 0 && current > 0) return go(current - 1);
  progress = Math.max(0, Math.min(1, progress));
  thread.setProgress(current, progress);
  updateSteps();
  kick();
}

function step(d) {
  if (overview) return;
  // on the process screen, moving on first brings out the next numbered step
  if (d > 0 && current === STEPS_AT && stepsShown() < steps.length) {
    progress = Math.min(0.99, STEP_AT(stepsShown()) + 0.01);
    thread.setProgress(current, progress);
    updateSteps();
    kick();
    return;
  }
  go(current + d);
}

// Screen 2: tap Katrin and she pushes her sunglasses up into her hair (and back down)
const katrinBtn = document.querySelector('.katrin-btn');
katrinBtn?.addEventListener('click', () => {
  const up = katrinBtn.classList.toggle('is-up');
  katrinBtn.setAttribute('aria-pressed', String(up));
  sound.pop?.();
});

// Screen 5: some frames hold a little stack of pieces. Tap one, or wait a moment, and the next comes to the top
for (const stack of document.querySelectorAll('.piece--stack')) {
  const photos = [...stack.querySelectorAll('.piece-photo')];
  const notes = [...stack.querySelectorAll('.piece-note')];
  const show = (k) => {
    stack.dataset.show = String(k);
    photos.forEach((p, i) => p.classList.toggle('is-top', i === k));
    // one note for the whole stack stays put; otherwise each piece brings its own
    notes.forEach((n, i) => n.classList.toggle('is-top', notes.length === 1 || i === k));
  };
  show(0);
  const flip = () => show((Number(stack.dataset.show) + 1) % photos.length);
  let timer = 0;
  const autoFlip = (delay) => {
    clearInterval(timer);
    timer = setInterval(() => {
      if (document.querySelector('.s5.is-here') && !reducedQuery.matches && !document.hidden) flip();
    }, delay);
  };
  // a tap turns to the next piece and gives you the full wait before it turns again on its own
  stack.querySelector('.piece-flip').addEventListener('click', () => { flip(); sound.pop?.(); autoFlip(4500); });
  // the stacks take turns, so the screen never flips everything at once
  autoFlip(4500 + [...document.querySelectorAll('.piece--stack')].indexOf(stack) * 1300);
}

// Screen 8: tap the Schmunzelsteinchen and it turns once all the way round and lands
const stoneBtn = document.querySelector('.stone-btn');
stoneBtn?.addEventListener('click', () => {
  stoneBtn.classList.remove('is-turning');
  void stoneBtn.offsetWidth; // restart the turn if it's tapped again mid-spin
  stoneBtn.classList.add('is-turning');
  sound.pop?.();
});
stoneBtn?.addEventListener('animationend', (e) => { if (e.animationName === 'stone-turn') stoneBtn.classList.remove('is-turning'); });

// Screen 3: the numbered steps come out one by one as the needle sews along beneath them.
const STEPS_AT = 2; // spiral index of the process screen
const steps = [...document.querySelectorAll('.stages li')];
const STEP_AT = (k) => LEAD + k * (0.8 / steps.length); // progress at which step k appears, spread over the screen
const stepsShown = () => steps.filter((li) => li.classList.contains('is-shown')).length;
function updateSteps() {
  const p = current === STEPS_AT ? progress : current > STEPS_AT ? 1 : 0;
  steps.forEach((li, k) => li.classList.toggle('is-shown', p >= STEP_AT(k) - 0.001));
}

function toggleOverview(on = !overview) {
  overview = on;
  root.classList.toggle('is-overview', on);
  setInert();
  updateHud();
  if (on) { fly(overviewCam()); focusOn(current, 0); renext(0); }
  else go(current);
}

// direction-aware: an arrow or swipe toward the next screen moves on, toward the previous one goes back
function moveToward(dx, dy) {
  const nd = DIRS[screens[current].dataset.next];
  const prev = current > 0 ? DIRS[screens[current - 1].dataset.next] : null;
  if (nd && nd[0] === dx && nd[1] === dy) return step(1);
  if (prev && prev[0] === -dx && prev[1] === -dy) return step(-1);
  step(dx + dy > 0 ? 1 : -1);
}

function canScroll(el, dy) {
  const s = el?.closest?.('.screen');
  if (!s || s.scrollHeight <= s.clientHeight + 2) return false;
  return dy > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight - 2 : s.scrollTop > 2;
}

// a full-screen tool is open (camera try-on, fabric cutter): the site underneath stays still
const tryingOn = () => root.classList.contains('is-tryon') || root.classList.contains('is-cutter');

addEventListener('wheel', (e) => {
  if (overview || tryingOn()) return;
  let d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (canScroll(e.target, d)) return;
  e.preventDefault();
  if (e.deltaMode === 1) d *= 32; // lines
  else if (e.deltaMode === 2) d *= H; // pages
  sew(Math.max(-240, Math.min(240, d)));
}, { passive: false });

// on touch, dragging up and down sews; a sideways swipe still moves along the spiral
let touch = null;
addEventListener('touchstart', (e) => {
  // hands at work on the workbench (cutting, patchwork) don't sew or swipe
  if (tryingOn() || e.target.closest?.('[data-hands]')) { touch = null; return; }
  const p = e.touches[0];
  touch = { x: p.clientX, y: p.clientY, lx: p.clientX, ly: p.clientY, el: e.target, axis: null };
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (!touch || overview) return;
  const p = e.touches[0];
  const dx = p.clientX - touch.lx, dy = p.clientY - touch.ly;
  touch.lx = p.clientX; touch.ly = p.clientY;
  if (!touch.axis) {
    const tx = p.clientX - touch.x, ty = p.clientY - touch.y;
    if (Math.hypot(tx, ty) < 10) return;
    touch.axis = Math.abs(ty) > Math.abs(tx) ? 'y' : 'x';
  }
  if (touch.axis === 'y' && !canScroll(touch.el, -dy)) sew(-dy * 1.6);
}, { passive: true });
addEventListener('touchend', (e) => {
  if (!touch || overview) return;
  const p = e.changedTouches[0];
  const dx = p.clientX - touch.x;
  const axis = touch.axis;
  touch = null;
  if (axis === 'x' && Math.abs(dx) > 48) moveToward(dx < 0 ? 1 : -1, 0);
}, { passive: true });

addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || tryingOn()) return;
  const tag = e.target.tagName;
  const k = e.key;
  // while the menu is open, keys belong to it: Escape closes, up and down move through the sections
  if (!menuList.hidden) {
    if (k === 'Escape') return toggleMenu(false);
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      const links = [...menuList.querySelectorAll('a')];
      const at = links.indexOf(document.activeElement);
      links[(at + (k === 'ArrowDown' ? 1 : links.length - 1)) % links.length].focus();
    }
    return;
  }
  if (k === 'Escape' && overview) return toggleOverview(false);
  if (overview) return;
  const map = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (map[k]) {
    if (canScroll(e.target, map[k][1]) && map[k][0] === 0) return;
    e.preventDefault();
    return moveToward(...map[k]);
  }
  if (k === 'PageDown' || (k === ' ' && tag !== 'BUTTON' && tag !== 'A')) { e.preventDefault(); return step(1); }
  if (k === 'PageUp') { e.preventDefault(); return step(-1); }
  if (k === 'Home') { e.preventDefault(); return go(0); }
  if (k === 'End') { e.preventDefault(); return go(8); }
  if (/^[1-9]$/.test(k)) return go(+k - 1);
});

nextBtn.addEventListener('click', () => step(1));
plateBtn.addEventListener('click', () => toggleOverview());

plate.addEventListener('click', (e) => {
  if (!overview) return;
  const x = (e.clientX - (W / 2 - cam.s * cam.cx * W)) / cam.s;
  const y = (e.clientY - (H / 2 - cam.s * cam.cy * H)) / cam.s;
  const i = ORDER.findIndex(([c, r]) => c === Math.floor(x / W) && r === Math.floor(y / H));
  if (i >= 0) go(i);
});

document.addEventListener('click', (e) => {
  if (!menuList.hidden && !e.target.closest('.menu')) toggleMenu(false, false);
  const a = e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  if (!menuList.hidden) toggleMenu(false, false);
  go(+a.dataset.go - 1);
});

// The menu: every section by name, for visitors who'd rather skip the tour.
function toggleMenu(open = menuList.hidden, refocus = true) {
  menuList.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) (menuList.querySelector('[aria-current]') || menuList.querySelector('a')).focus();
  else if (refocus) menuBtn.focus();
}
menuBtn.addEventListener('click', () => toggleMenu());

for (const b of document.querySelectorAll('[data-lang]')) {
  b.addEventListener('click', () => { applyLang(b.dataset.lang); relayout(); });
}

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- workshop sounds ---------- */

const soundBtn = document.getElementById('sound-btn');
soundBtn.addEventListener('click', () => soundBtn.setAttribute('aria-pressed', String(sound.toggle())));

// the scissors on screen 2 cut for about 1.7s after a short wait (matching the CSS); snip along with them
let snipTimers = [];
function snipAlong() {
  snipTimers.forEach(clearTimeout);
  snipTimers = [];
  for (let ms = 750; ms < 2450; ms += 220) snipTimers.push(setTimeout(() => current === 1 && sound.snip(), ms));
}

/* ---------- the smiley on the last screen watches you, and winks at the links ---------- */

const eyes = endTag.querySelector('svg');
let lookRaf = 0, look = [0, 0];
function lookAt(x, y) {
  look = [x, y];
  if (lookRaf) return;
  lookRaf = requestAnimationFrame(() => {
    lookRaf = 0;
    eyes.style.setProperty('--ex', `${look[0] * 4}px`);
    eyes.style.setProperty('--ey', `${look[1] * 3}px`);
  });
}
addEventListener('pointermove', (e) => {
  if (current !== 8 || e.pointerType !== 'mouse') return;
  const r = endTag.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 220);
  lookAt((dx / d) * k, (dy / d) * k);
}, { passive: true });
// on a phone, tilting it moves the eyes (where the browser allows it without asking)
addEventListener('deviceorientation', (e) => {
  if (current !== 8 || e.gamma == null) return;
  lookAt(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25)));
}, { passive: true });
let winkTimer;
for (const a of document.querySelectorAll('.s9 .reach a')) {
  a.addEventListener('pointerenter', () => {
    endTag.classList.remove('is-winking');
    void endTag.offsetWidth;
    endTag.classList.add('is-winking');
    clearTimeout(winkTimer);
    winkTimer = setTimeout(() => endTag.classList.remove('is-winking'), 1200);
  });
}

/* ---------- courses: sewing-pattern envelopes you tear open ---------- */

const envelopes = [...document.querySelectorAll('.env')];
function setEnvelope(env, open) {
  const front = env.querySelector('.env-front'), back = env.querySelector('.env-back');
  front.setAttribute('aria-expanded', String(open));
  back.inert = !open;
  front.inert = open;
  if (!open) {
    env.classList.remove('is-open', 'is-tearing');
    return;
  }
  envelopes.forEach((o) => o !== env && o.classList.contains('is-open') && setEnvelope(o, false));
  const turn = () => {
    env.classList.remove('is-tearing');
    env.classList.add('is-open');
    sound.pop();
    back.querySelector('a')?.focus({ preventScroll: true });
  };
  if (reducedQuery.matches) return turn();
  env.classList.add('is-tearing');
  sound.tear();
  setTimeout(turn, 300);
}
for (const env of envelopes) {
  env.querySelector('.env-back').inert = true;
  env.querySelector('.env-front').addEventListener('click', () => setEnvelope(env, true));
  env.querySelector('.env-back').addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    setEnvelope(env, false);
    env.querySelector('.env-front').focus({ preventScroll: true });
  });
}

/* ---------- the lost button: find it in the cobalt terry and it gets sewn onto the label ---------- */

const lostBtn = document.getElementById('lost-button');
lostBtn.addEventListener('click', () => {
  if (lostBtn.classList.contains('is-found')) return;
  lostBtn.classList.add('is-found');
  endTag.querySelector('.tag-button').hidden = false;
  sound.found();
  announce.textContent = t(lang, 'egg.found');
  const note = document.createElement('span');
  note.className = 'label found-note';
  note.textContent = t(lang, 'egg.found');
  lostBtn.after(note);
  setTimeout(() => note.remove(), 2600);
});

// the reversible hat: a tap turns it, and the other side squishes, hops and comes to the front
const hat = document.getElementById('hat');
hat.addEventListener('click', () => {
  const front = hat.dataset.front === 'a' ? 'b' : 'a';
  hat.dataset.front = front;
  hat.setAttribute('aria-pressed', String(front === 'b'));
  sound.spring();
  if (reducedQuery.matches) return;
  hat.querySelector(`.hat-side--${front}`).animate(
    [{ scale: '1 1', translate: '0 0' }, { scale: '0.2 1.05', translate: '0 -34px', offset: 0.35 }, { scale: '1.08 0.94', translate: '0 0', offset: 0.75 }, { scale: '1 1', translate: '0 0' }],
    { duration: 560, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  );
});

/* ---------- cloth + thread ---------- */

let thread = null;

function worldRect(el) {
  // invert the camera to get layout boxes in plate coordinates
  const r = el.getBoundingClientRect();
  const ox = W / 2 - cam.s * cam.cx * W, oy = H / 2 - cam.s * cam.cy * H;
  return { x: (r.left - ox) / cam.s, y: (r.top - oy) / cam.s, w: r.width / cam.s, h: r.height / cam.s };
}

function tile(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return ctx.createPattern(c, 'repeat');
}

// a faint uneven-yarn grain over every scan, so even the smoothest fabric has some life
function makeGrain() {
  return tile(96, (g, n) => {
    for (let i = 0; i < n; i += 2) {
      g.fillStyle = `rgba(30, 24, 26, ${Math.random() * 0.05})`;
      g.fillRect(0, i, n, 1);
      g.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
      g.fillRect(i, 0, 1, n);
    }
  });
}

// The screen you land on gets its fabric first, then its neighbours along the spiral; the rest come
// once the page is idle. Until a scan arrives, its patch is painted in the fabric's average colour.
let siteShown;
const shown = new Promise((r) => { siteShown = r; });
function loadFabrics(first) {
  const loaded = new Set();
  const load = (i) => new Promise((resolve) => {
    if (i < 0 || i >= PATCHES.length || loaded.has(i)) return resolve();
    loaded.add(i);
    const p = PATCHES[i];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const pat = ctx.createPattern(img, 'repeat');
      pat.setTransform(new DOMMatrix().scale(p.scale));
      fabrics[i] = pat;
      kick();
      resolve();
    };
    img.onerror = resolve;
    img.src = `${import.meta.env.BASE_URL}fabric/${p.fabric}.webp`;
  });
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  load(first)
    .then(() => Promise.all([load(first - 1), load(first + 1), shown]))
    .then(() => idle(() => PATCHES.forEach((_, i) => load(i))));
}

// the thread's inset from the screen edge: inside the padding, clear of the copy
function seamInset() {
  const pad = Math.min(84, Math.max(22, W * 0.05));
  return Math.round(Math.min(34, Math.max(10, pad * 0.42)));
}

function relayout(instant = true) {
  W = innerWidth; H = innerHeight;
  root.style.setProperty('--W', W + 'px');
  root.style.setProperty('--H', H + 'px');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!anim) Object.assign(cam, overview ? overviewCam() : target(current));
  applyCamera();
  const tag = worldRect(endTag);
  const end = { x: tag.x + 4, y: tag.y + tag.h * 0.5 }; // just under the label's edge, where the stitching starts
  thread.layout(W, H, seamInset(), end, instant);
  thread.setProgress(current, progress);
  if (instant) thread.fastForward();
  kick();
}

let raf = 0;
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

function frame(now) {
  raf = 0;
  const moving = stepCamera(now);
  const growing = reducedQuery.matches ? (thread.fastForward(), false) : thread.tick(pace(now));

  const dpr = canvas.width / W;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = MAT;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = W / 2 - cam.s * cam.cx * W, oy = H / 2 - cam.s * cam.cy * H;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (cam.r) {
    ctx.translate((dpr * W) / 2, (dpr * H) / 2);
    ctx.rotate(cam.r);
    ctx.translate((-dpr * W) / 2, (-dpr * H) / 2);
  }
  ctx.transform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * ox, dpr * oy);
  // while it swings, the corners show a little more, so draw a little more
  const m = cam.r ? Math.max(W, H) * 0.12 / cam.s : 0;
  const view = { x: -ox / cam.s - m, y: -oy / cam.s - m, w: W / cam.s + 2 * m, h: H / cam.s + 2 * m };

  drawMat(view);
  drawCloth(view);
  const fraying = drawFray(view);
  thread.render(ctx, view, now, growing);

  // the sewing machine rattles along with the needle (only for the visitor's own sewing, not flights)
  if (growing && !anim && Math.abs(thread.drawn - lastStitchSound) > 15) { sound.stitch(); lastStitchSound = thread.drawn; }
  if (!growing) lastStitchSound = thread.drawn;

  if (growing) updateSewn();
  if (moving || growing || thread.animating || fraying) kick();
}
let lastStitchSound = 0;

/* ---------- seams fray where the mouse goes near them ---------- */

const fray = { x: 0, y: 0, tx: 0, ty: 0, vertical: true, side: 1, amt: 0, vel: 0, target: 0 };
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (overview || anim || tryingOn()) { fray.target = 0; kick(); return; }
  const wx = (e.clientX - (W / 2 - cam.s * cam.cx * W)) / cam.s;
  const wy = (e.clientY - (H / 2 - cam.s * cam.cy * H)) / cam.s;
  let best = 30, hit = null;
  for (const k of [1, 2]) {
    if (Math.abs(wx - k * W) < best && wy > 0 && wy < 3 * H) { best = Math.abs(wx - k * W); hit = { tx: k * W, ty: wy, vertical: true, side: Math.sign(wx - k * W) || 1 }; }
    if (Math.abs(wy - k * H) < best && wx > 0 && wx < 3 * W) { best = Math.abs(wy - k * H); hit = { tx: wx, ty: k * H, vertical: false, side: Math.sign(wy - k * H) || 1 }; }
  }
  if (hit) {
    if (fray.amt < 0.05) { fray.x = hit.tx; fray.y = hit.ty; }
    Object.assign(fray, hit, { target: 1 });
  } else fray.target = 0;
  kick();
}, { passive: true });

function drawFray(view) {
  fray.vel += (fray.target - fray.amt) * 0.16;
  fray.vel *= 0.7;
  fray.amt += fray.vel;
  fray.x += (fray.tx - fray.x) * 0.3;
  fray.y += (fray.ty - fray.y) * 0.3;
  const moving = Math.abs(fray.vel) > 0.002 || Math.abs(fray.target - fray.amt) > 0.002 || Math.hypot(fray.tx - fray.x, fray.ty - fray.y) > 0.5;
  if (fray.amt < 0.01) return moving;
  // loose threads in the colour of the patch they come out of, pulled toward the pointer
  const col = Math.floor((fray.x + (fray.vertical ? fray.side : 0)) / W), row = Math.floor((fray.y + (fray.vertical ? 0 : fray.side)) / H);
  const k = ORDER.findIndex(([c, r]) => c === col && r === row);
  const base = PATCHES[k]?.base || '#888';
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const along = (i - 3) * 4.5;
    const len = (12 + ((i * 37) % 19)) * fray.amt;
    const wave = Math.sin(i * 1.7) * 7 * fray.amt;
    const [x0, y0] = fray.vertical ? [fray.x, fray.y + along] : [fray.x + along, fray.y];
    const [x1, y1] = fray.vertical ? [x0 + fray.side * len, y0 + wave] : [x0 + wave, y0 + fray.side * len];
    const [cx, cy] = fray.vertical ? [x0 + fray.side * len * 0.5, y0 - wave] : [x0 - wave, y0 + fray.side * len * 0.5];
    ctx.strokeStyle = 'rgba(30, 24, 26, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x0 + 0.6, y0 + 1); ctx.quadraticCurveTo(cx + 0.6, cy + 1, x1 + 0.6, y1 + 1); ctx.stroke();
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(251, 249, 244, 0.85)' : base;
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
  }
  return moving;
}

function drawMat(view) {
  // the grid of a cutting mat, outside the cloth
  const g = 40;
  ctx.lineWidth = 1 / cam.s;
  const x0 = Math.floor(view.x / g) * g, y0 = Math.floor(view.y / g) * g;
  for (const major of [false, true]) {
    ctx.strokeStyle = major ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 255, 255, 0.11)';
    ctx.beginPath();
    for (let x = x0; x < view.x + view.w; x += g) {
      if ((Math.round(x / g) % 5 === 0) !== major) continue;
      ctx.moveTo(x, view.y); ctx.lineTo(x, view.y + view.h);
    }
    for (let y = y0; y < view.y + view.h; y += g) {
      if ((Math.round(y / g) % 5 === 0) !== major) continue;
      ctx.moveTo(view.x, y); ctx.lineTo(view.x + view.w, y);
    }
    ctx.stroke();
  }
}

function drawCloth(view) {
  ORDER.forEach(([c, r], i) => {
    const x = c * W, y = r * H;
    if (x > view.x + view.w || x + W < view.x || y > view.y + view.h || y + H < view.y) return;
    const p = PATCHES[i];
    ctx.fillStyle = p.base;
    ctx.fillRect(x, y, W, H);
    const cx0 = Math.max(x, view.x), cy0 = Math.max(y, view.y);
    const cw = Math.min(x + W, view.x + view.w) - cx0, ch = Math.min(y + H, view.y + view.h) - cy0;
    if (fabrics[i]) { ctx.fillStyle = fabrics[i]; ctx.fillRect(cx0, cy0, cw, ch); }
    ctx.fillStyle = grain;
    ctx.fillRect(cx0, cy0, cw, ch);
  });

  // the seams that join the patches: a fold, its highlight, and a row of machine stitches
  ctx.lineCap = 'butt';
  const seam = (x0, y0, x1, y1, nx, ny) => {
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(40, 30, 32, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + nx * 1.5, y0 + ny * 1.5); ctx.lineTo(x1 + nx * 1.5, y1 + ny * 1.5); ctx.stroke();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(40, 30, 32, 0.3)';
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x0 + nx * 6 * side, y0 + ny * 6 * side); ctx.lineTo(x1 + nx * 6 * side, y1 + ny * 6 * side); ctx.stroke();
    }
  };
  for (const k of [1, 2]) {
    seam(k * W, 0, k * W, 3 * H, 1, 0);
    seam(0, k * H, 3 * W, k * H, 0, 1);
  }
  ctx.setLineDash([]);
}

// During a flight the needle sprints across and lands just before the camera;
// otherwise it follows the scroll closely, with a little ease so it feels like sewing.
function pace(now) {
  const left = thread.remaining();
  if (!left) return 0;
  if (anim) return Math.max(4, (left * 1.15) / (Math.max(16, anim.t0 + anim.dur * 0.8 - now) / 16.7));
  return Math.max(3, left * 0.32);
}

let lastSewn = 0;
function updateSewn() {
  if (thread.sewn.size === lastSewn) return;
  lastSewn = thread.sewn.size;
  updateHud();
}

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => relayout(true), 180);
});

/* ---------- boot ---------- */

const start = Math.max(0, screens.findIndex((s) => '#' + s.id === location.hash));
current = start;
thread = new Thread(ORDER);
// the last stitch sews the label on, and the smiley gets its red
// the label is sewn on round its edge (1.6s, as in the CSS), the machine rattling along, then the pop
let sewTimers = [];
thread.onDone = (done) => {
  endTag.classList.toggle('is-sewn', done);
  sewTimers.forEach(clearTimeout);
  sewTimers = [];
  if (!done) return;
  if (reducedQuery.matches) { sound.pop(); return; }
  for (let ms = 0; ms < 1600; ms += 130) sewTimers.push(setTimeout(() => sound.stitch(), ms));
  sewTimers.push(setTimeout(() => sound.pop(), 1600));
};
applyLang(lang);
initWorkbench({ tr: (k) => t(lang, k), reduced: () => reducedQuery.matches });

// try the hat on with the front camera; the face tracking only loads when someone asks for it
const tryBtn = document.getElementById('tryon-btn');
if (navigator.mediaDevices?.getUserMedia) {
  tryBtn.hidden = false;
  tryBtn.addEventListener('click', () => {
    tryBtn.classList.add('is-loading');
    // ask for the camera right on the tap: some phone browsers refuse it once the tap is a few seconds old
    const firstStream = navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    firstStream.catch(() => {}); // a refusal is handled (and shown) inside the try-on
    import('./tryon.js')
      .then((m) => m.openTryOn({ tr: (k) => t(lang, k), reduced: () => reducedQuery.matches, firstStream }))
      .catch(() => {
        // the try-on code changed with a newer version of the site since this page was opened: load the new one
        firstStream.then((st) => st.getTracks().forEach((tr) => tr.stop()), () => {});
        location.reload();
      })
      .finally(() => tryBtn.classList.remove('is-loading'));
  });
}
grain = makeGrain();
loadFabrics(start);
Object.assign(cam, target(start));
setInert();
// show the site once its fonts are in, but never wait longer than a moment on a slow line:
// a late font simply swaps in, and the layout is measured again when it does
const fontsOrTimeout = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
fontsOrTimeout.then(() => {
  relayout(false);
  go(start, { instant: true, focus: false });
  root.classList.add('is-ready');
  siteShown();
});
document.fonts.ready.then(() => { if (root.classList.contains('is-ready')) relayout(false); });
