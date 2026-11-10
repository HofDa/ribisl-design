// Small workshop sounds, made in the browser (no audio files): a sewing-machine rattle, a snip, a paper tear, a pop, two boings, a found-it chime.
// Off until the visitor switches them on; the switch is a tap, which also lets the browser start audio.

let ctx = null;
let on = false;
let noise = null;
let lastClick = 0;

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // one second of white noise to cut short bursts from
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function burst({ freq, q = 1, dur, gain, type = 'bandpass', at = 0 }) {
  const a = audio();
  const t = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noise;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t, Math.random() * 0.9);
  src.stop(t + dur + 0.02);
}

function tone({ from, to, dur, gain, type = 'sine', at = 0 }) {
  const a = audio();
  const t = a.currentTime + at;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sound = {
  get on() { return on; },
  toggle() {
    on = !on;
    if (on) { audio(); this.pop(); }
    return on;
  },
  // one stitch of the sewing machine: a dull knock and a little needle tick
  stitch() {
    if (!on) return;
    const now = performance.now();
    if (now - lastClick < 38) return;
    lastClick = now;
    burst({ freq: 900, q: 0.8, dur: 0.035, gain: 0.18 });
    burst({ freq: 5200, q: 3, dur: 0.012, gain: 0.05 });
  },
  // scissors closing: two quick metallic slides
  snip() {
    if (!on) return;
    burst({ freq: 3800, q: 6, dur: 0.05, gain: 0.16 });
    burst({ freq: 6500, q: 8, dur: 0.03, gain: 0.08, at: 0.035 });
  },
  // paper tearing: a crackle of tiny fibre snaps along the rip, over a soft papery rush
  tear(dur = 0.32) {
    if (!on) return;
    burst({ freq: 2400, q: 0.6, dur: dur * 0.9, gain: 0.035 });
    const n = 26;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      // the rip starts sharp, holds, and thins out as the flap comes free
      const swell = Math.sin(Math.PI * Math.min(1, p * 1.4)) * (1 - p * 0.5);
      burst({
        freq: 1500 + Math.random() * 3200,
        q: 1 + Math.random() * 2,
        dur: 0.012 + Math.random() * 0.02,
        gain: (0.05 + Math.random() * 0.09) * swell,
        at: p * dur + Math.random() * 0.008,
      });
    }
  },
  pop() {
    if (!on) return;
    tone({ from: 520, to: 1100, dur: 0.12, gain: 0.22 });
    tone({ from: 1300, to: 900, dur: 0.1, gain: 0.08, type: 'triangle', at: 0.05 });
  },
  boing() {
    if (!on) return;
    tone({ from: 180, to: 90, dur: 0.35, gain: 0.25, type: 'triangle' });
  },
  // the lost button, found: a little rising chime, then the button clattering down, each bounce
  // quicker and softer, like a wooden button dropped on the table
  found() {
    if (!on) return;
    [[784, 0], [988, 0.07], [1319, 0.14]].forEach(([f, at]) => {
      tone({ from: f, to: f, dur: 0.22, gain: 0.11, type: 'sine', at });
      tone({ from: f * 2, to: f * 2, dur: 0.12, gain: 0.025, type: 'sine', at });
    });
    let at = 0.42, gap = 0.16, gain = 0.2;
    for (let i = 0; i < 6; i++) {
      burst({ freq: 1700 + Math.random() * 500, q: 5, dur: 0.025, gain, at });
      burst({ freq: 420, q: 2, dur: 0.03, gain: gain * 0.6, at });
      at += gap; gap *= 0.62; gain *= 0.62;
    }
  },
  // a springy boing: the pitch jumps up with the hop and wobbles as it settles, like a door spring
  spring() {
    if (!on) return;
    const a = audio();
    const t = a.currentTime;
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    // the wobble, fast at first and slowing as the spring runs down
    const lfo = a.createOscillator();
    lfo.frequency.setValueAtTime(26, t);
    lfo.frequency.exponentialRampToValueAtTime(9, t + 0.5);
    const depth = a.createGain();
    depth.gain.setValueAtTime(60, t);
    depth.gain.exponentialRampToValueAtTime(8, t + 0.5);
    lfo.connect(depth).connect(o.frequency);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g).connect(a.destination);
    o.start(t); lfo.start(t);
    o.stop(t + 0.58); lfo.stop(t + 0.58);
    // and a soft thump as the hat lands
    burst({ freq: 260, q: 0.9, dur: 0.07, gain: 0.12, type: 'lowpass', at: 0.4 });
  },
};
