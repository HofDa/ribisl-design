// Try the bucket hat on: the front camera, a face found on the device, and the hat sat on your head.
// Loaded only when someone taps "Try it on". Nothing leaves the phone: the face model and its runtime
// are served with the site, and the picture is only saved or shared if you take one.
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { drawHat, madeSides, fabricSrc } from './workbench.js';
import { bindImageExport, canShareImage, downloadImage } from './image-export.js';

// Seen from the front: the real fabric of each side of the reversible hat, sewn onto a frontal hat shape,
// so it sits straight on a face looking into the camera.
const BASE = import.meta.env.BASE_URL;
const SIDES = { swirl: `${BASE}pieces/fabric-swirl.webp`, ink: `${BASE}pieces/fabric-ink.webp` };

// the front camera, as the try-on wants it
export function getCamera() {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
}

let detectorPromise = null;
function getDetector() {
  detectorPromise ??= FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`).then((files) =>
    FaceDetector.createFromOptions(files, {
      baseOptions: { modelAssetPath: `${BASE}mediapipe/blaze_face_short_range.tflite`, delegate: 'GPU' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    }));
  return detectorPromise;
}

export async function openTryOn({ tr, reduced, firstStream = null }) {
  const root = document.documentElement;
  const ui = document.createElement('div');
  ui.className = 'tryon';
  ui.setAttribute('role', 'dialog');
  ui.setAttribute('aria-modal', 'true');
  ui.setAttribute('aria-label', tr('tryon.title'));
  ui.innerHTML = `
    <video class="tryon-video" playsinline muted></video>
    <div class="tryon-hat" aria-hidden="true"></div>
    <p class="tryon-status label" aria-live="polite"></p>
    <button type="button" class="tryon-close btn" aria-label="${tr('tryon.close')}">×</button>
    <div class="tryon-bar">
      <div class="tryon-pick" role="group" aria-label="${tr('tryon.pick')}"></div>
      <button type="button" class="tryon-shot" aria-label="${tr('tryon.photo')}"><span></span></button>
      <p class="tryon-note">${tr('tryon.private')}</p>
    </div>`;
  document.body.append(ui);
  root.classList.add('is-tryon');

  const video = ui.querySelector('video');
  const hatBox = ui.querySelector('.tryon-hat');
  const status = ui.querySelector('.tryon-status');
  const pick = ui.querySelector('.tryon-pick');
  const say = (k) => { status.textContent = k ? tr(k) : ''; status.hidden = !k; };
  // where the hat is: its anchor point on screen, its width and its tilt
  const pose = { x: innerWidth / 2, y: innerHeight * 0.35, w: innerWidth * 0.7, r: 0, seen: 0 };
  let manual = false;
  let preview = null; // the photo just taken, while it's on screen

  /* ---------- the hats to choose from ---------- */

  const hats = {};
  for (const [key, src] of Object.entries(SIDES)) hats[key] = await frontalHat(await loadImg(src));
  // the toadstool hat is photographed, not drawn: it goes on as it is
  hats.toadstool = { src: `${BASE}pieces/hat-toadstool-cut.webp`, bottom: 0.95 };
  // the reversible hat from screen 4, both its sides; it's "yours" once you've chosen a fabric there
  const made = madeSides();
  const { mine } = made;
  for (const side of ['out', 'in']) hats[side] = await frontalHat(await loadImg(fabricSrc(made[side])));
  const label = (key) => (key === 'out' || key === 'in' ? tr(`tryon.${mine ? 'yours' : 'sample'}.${key}`) : tr(`tryon.${key}`));
  let current = 'swirl';
  const hatImg = new Image();
  for (const [key, h] of Object.entries(hats)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tryon-choice';
    b.dataset.hat = key;
    b.setAttribute('aria-label', label(key));
    if (key === 'out' || key === 'in') b.classList.add('tryon-choice--yours');
    b.style.backgroundImage = `url(${h.src})`;
    b.addEventListener('click', () => choose(key));
    pick.append(b);
  }
  // the box takes the hat's own proportions, so its brim always sits at the bottom edge
  hatImg.onload = () => { hatBox.style.aspectRatio = `${hatImg.naturalWidth} / ${hatImg.naturalHeight}`; render(); };
  function choose(key) {
    current = key;
    hatImg.src = hats[key].src;
    hatBox.style.backgroundImage = `url(${hats[key].src})`;
    pick.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hat === key)));
  }
  choose(mine ? 'out' : 'swirl');

  /* ---------- camera ---------- */

  let stream = null;
  async function startCamera() {
    try {
      // the first time, the camera was already asked for on the tap itself (some phone browsers only allow it then)
      const pending = firstStream;
      firstStream = null;
      stream = await (pending || getCamera());
      video.srcObject = stream;
      await video.play();
      return true;
    } catch {
      say('tryon.denied');
      ui.classList.add('is-denied');
      return false;
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  say('tryon.starting');
  await startCamera();

  /* ---------- tracking ---------- */

  let detector = null;
  if (stream) {
    say('tryon.searching');
    getDetector().then((d) => { detector = d; }).catch(() => { say('tryon.manual'); manual = true; place(innerWidth / 2, innerHeight * 0.38, innerWidth * 0.7, 0); });
  }
  let raf = 0, lastT = -1;

  // where a point of the video lands on screen: the video fills the screen (cover) and is mirrored
  function toScreen(px, py) {
    const W = innerWidth, H = innerHeight, vw = video.videoWidth, vh = video.videoHeight;
    const s = Math.max(W / vw, H / vh);
    const x = (W - vw * s) / 2 + px * s, y = (H - vh * s) / 2 + py * s;
    return [W - x, y];
  }

  function place(x, y, w, r) {
    pose.x = x; pose.y = y; pose.w = w; pose.r = r;
    render();
  }

  function render() {
    const h = hats[current];
    hatBox.style.width = `${pose.w}px`;
    hatBox.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.r}rad) translate(-50%, -${(h.bottom - 0.08) * 100}%)`;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!detector || manual || video.readyState < 2 || video.currentTime === lastT) return;
    lastT = video.currentTime;
    let res;
    try { res = detector.detectForVideo(video, now); } catch { return; }
    const d = res.detections?.[0];
    if (!d || d.keypoints.length < 2) {
      if (now - pose.seen > 700) { hatBox.classList.remove('is-on'); say('tryon.searching'); }
      return;
    }
    pose.seen = now;
    say('');
    hatBox.classList.add('is-on');
    const vw = video.videoWidth, vh = video.videoHeight;
    const [e1, e2] = d.keypoints;
    const a = toScreen(e1.x * vw, e1.y * vh), b = toScreen(e2.x * vw, e2.y * vh);
    // the eyes give the tilt and the scale; the hat sits a little above them
    const ex = (a[0] + b[0]) / 2, ey = (a[1] + b[1]) / 2;
    let r = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (r > Math.PI / 2) r -= Math.PI; else if (r < -Math.PI / 2) r += Math.PI;
    const eyes = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const faceW = Math.max(eyes * 2.4, d.boundingBox.width * Math.max(innerWidth / vw, innerHeight / vh));
    const lift = eyes * 0.75;
    const tx = ex + Math.sin(r) * lift, ty = ey - Math.cos(r) * lift;
    const k = reduced() ? 1 : 0.45; // a little smoothing so it doesn't jitter
    place(pose.x + (tx - pose.x) * k, pose.y + (ty - pose.y) * k, pose.w + (faceW * 1.75 - pose.w) * k, pose.r + (r - pose.r) * k);
  }
  raf = requestAnimationFrame(loop);

  // without face tracking, the hat can be pushed into place by hand
  let drag = null;
  hatBox.addEventListener('pointerdown', (e) => {
    if (!manual) return;
    drag = { x: e.clientX - pose.x, y: e.clientY - pose.y };
    hatBox.setPointerCapture(e.pointerId);
  });
  hatBox.addEventListener('pointermove', (e) => { if (drag) place(e.clientX - drag.x, e.clientY - drag.y, pose.w, 0); });
  hatBox.addEventListener('pointerup', () => { drag = null; });

  /* ---------- photo ---------- */

  ui.querySelector('.tryon-shot').addEventListener('click', async () => {
    if (!stream) return;
    ui.classList.remove('is-flash');
    void ui.offsetWidth;
    ui.classList.add('is-flash');
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const vw = video.videoWidth, vh = video.videoHeight, s = Math.max(W / vw, H / vh);
    g.save();
    g.translate(W, 0); g.scale(-1, 1);
    g.drawImage(video, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s);
    g.restore();
    if (hatBox.classList.contains('is-on') || manual) {
      await hatImg.decode().catch(() => {});
      const w = pose.w, h = (w * hatImg.naturalHeight) / hatImg.naturalWidth;
      g.save();
      g.translate(pose.x, pose.y);
      g.rotate(pose.r);
      g.drawImage(hatImg, -w / 2, -h * (hats[current].bottom - 0.08), w, h);
      g.restore();
    }
    await drawLogo(g, W, H);
    c.toBlob((blob) => blob && showPreview(blob), 'image/jpeg', 0.92);
  });

  /* ---------- after the shot: look at it, share it to Instagram, save it, or take another ---------- */

  function showPreview(blob) {
    const url = URL.createObjectURL(blob);
    const file = new File([blob], 'ribisl-hat.jpg', { type: 'image/jpeg' });
    const sheet = document.createElement('div');
    sheet.className = 'tryon-preview';
    sheet.innerHTML = `
      <img alt="" src="${url}">
      <button type="button" class="tryon-close btn tryon-preview-close" aria-label="${tr('tryon.back')}">×</button>
      <div class="tryon-preview-bar">
        <button type="button" class="btn tryon-ig"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg><span>${tr('tryon.shareIg')}</span></button>
        <button type="button" class="btn tryon-share" hidden>${tr('image.share')}</button>
        <button type="button" class="btn tryon-save">${tr('tryon.save')}</button>
        <button type="button" class="btn tryon-again">${tr('tryon.again')}</button>
        <p class="tryon-preview-help">${tr('image.hint')}</p>
        <p class="tryon-preview-note" aria-live="polite"></p>
      </div>`;
    ui.append(sheet);
    // the phone's back button (or gesture) returns from the photo to the camera
    history.pushState({ ribisl: 'preview' }, '');
    const bar = sheet.querySelector('.tryon-preview-bar');
    const resizeObserver = new ResizeObserver(() => sheet.style.setProperty('--bar-h', `${bar.offsetHeight}px`));
    resizeObserver.observe(bar);
    preview = { sheet, url, resizeObserver };
    const note = sheet.querySelector('.tryon-preview-note');
    const setExportFile = bindImageExport({ downloadButton: sheet.querySelector('.tryon-save'), shareButton: sheet.querySelector('.tryon-share'), status: note, tr });
    setExportFile(file);
    sheet.querySelector('.tryon-ig').addEventListener('click', async () => {
      const caption = tr('tryon.caption');
      // Instagram often drops shared text, so the caption also goes on the clipboard to paste
      navigator.clipboard?.writeText(caption).catch(() => {});
      if (canShareImage(file)) {
        try {
          await navigator.share({ files: [file], text: caption });
          note.dataset.i18n = 'tryon.copied';
          note.textContent = tr('tryon.copied');
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return;
        }
      }
      // no share sheet here (most computers): save the photo and open Katrin's Instagram
      downloadImage(file);
      note.dataset.i18n = 'tryon.saved';
      note.textContent = tr('tryon.saved');
      window.open('https://www.instagram.com/ribisl_design/', '_blank', 'noopener');
    });
    sheet.querySelector('.tryon-again').addEventListener('click', () => history.back());
    sheet.querySelector('.tryon-preview-close').addEventListener('click', () => history.back());
    sheet.querySelector('.tryon-ig').focus();
  }

  /* ---------- closing ---------- */

  const opener = document.activeElement;
  // Back steps out one level at a time: photo → camera → site. Every way out goes through history,
  // so the phone's back button and the on-screen buttons always agree.
  history.pushState({ ribisl: 'tryon' }, '');
  function closePreview() {
    if (!preview) return;
    preview.resizeObserver.disconnect();
    preview.sheet.remove();
    URL.revokeObjectURL(preview.url);
    preview = null;
    if (!stream) startCamera();
    ui.querySelector('.tryon-shot').focus();
  }
  function close() {
    cancelAnimationFrame(raf);
    stopCamera();
    if (preview) { preview.resizeObserver.disconnect(); URL.revokeObjectURL(preview.url); preview = null; }
    removeEventListener('keydown', onKey, true);
    removeEventListener('popstate', onPop);
    document.removeEventListener('visibilitychange', onVisibility);
    ui.remove();
    root.classList.remove('is-tryon');
    opener?.focus?.({ preventScroll: true });
  }
  const onPop = () => { if (preview) closePreview(); else close(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); history.back(); } };
  // in the background (another app, the share sheet) the camera rests; it starts again on return
  const onVisibility = () => {
    if (document.hidden) stopCamera();
    else if (!preview && !stream) startCamera();
  };
  addEventListener('popstate', onPop);
  addEventListener('keydown', onKey, true);
  document.addEventListener('visibilitychange', onVisibility);
  ui.querySelector('.tryon-close').addEventListener('click', () => history.back());
  ui.querySelector('.tryon-close').focus();
}

function loadImg(src) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = im.onerror = () => res(im);
    im.src = src;
  });
}

// draw a frontal hat from one fabric and crop it to the hat itself
async function frontalHat(fabric) {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 600;
  drawHat(c, fabric);
  // crop to the hat itself, so it sits like the photographed ones
  const crop = document.createElement('canvas');
  crop.width = 704; crop.height = 470;
  crop.getContext('2d').drawImage(c, 48, 118, 704, 470, 0, 0, 704, 470);
  return { src: crop.toDataURL('image/png'), bottom: 0.93 };
}

// The ribisl label in the corner of every photo: white cotton, stitched edge, the smiley and the name.
const SMILE_EYES = new Path2D('M42 15v35M59 15v35');
const SMILE_MOUTH = new Path2D('M19 37v9a31 31 0 0 0 62 0v-9');
async function drawLogo(g, W, H) {
  try { await document.fonts.load("200 40px 'Outfit Variable'"); await document.fonts.load("600 14px 'Gabarito Variable'"); } catch {}
  const w = Math.min(W * 0.46, 260), h = w * 0.42;
  const x = 16, y = H - h - 16;
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(-0.035);
  g.translate(-w / 2, -h / 2);
  g.shadowColor = 'rgba(0, 0, 0, 0.3)';
  g.shadowBlur = 10;
  g.shadowOffsetY = 3;
  g.fillStyle = '#FBF9F4';
  g.fillRect(0, 0, w, h);
  g.shadowColor = 'transparent';
  g.setLineDash([3, 2.5]);
  g.strokeStyle = 'rgba(30, 24, 26, 0.45)';
  g.lineWidth = 1;
  g.strokeRect(5, 5, w - 10, h - 10);
  g.setLineDash([]);
  // the smiley: red copy a touch down and right, then black
  const sm = h * 0.62, sx = w * 0.06, sy = (h - sm) / 2 - h * 0.02;
  for (const [dx, col] of [[sm * 0.05, '#C4122F'], [0, '#1E181A']]) {
    g.save();
    g.translate(sx + dx, sy + dx * 0.8);
    g.scale(sm / 100, sm / 100);
    g.lineCap = 'round';
    g.lineWidth = 10;
    g.strokeStyle = col;
    g.stroke(SMILE_EYES);
    g.stroke(SMILE_MOUTH);
    g.restore();
  }
  g.fillStyle = '#1E181A';
  g.textBaseline = 'alphabetic';
  g.font = `200 ${Math.round(h * 0.5)}px 'Outfit Variable', Outfit, sans-serif`;
  g.fillText('ribisl', sx + sm + w * 0.05, h * 0.6);
  g.font = `600 ${Math.max(10, Math.round(h * 0.15))}px 'Gabarito Variable', Gabarito, sans-serif`;
  g.fillText('@ribisl_design', sx + sm + w * 0.055, h * 0.82);
  g.restore();
}
