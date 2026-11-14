// The fabric cutter: place a square on a photo of an old garment and cut it out.
import './cutter.css';
import { sound } from './sound.js';

export function openCutter(file, { tr, reduced }) {
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
