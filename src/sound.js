// Small workshop sounds, made in the browser (no audio files): a sewing-machine rattle, a snip, a pop.
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
  pop() {
    if (!on) return;
    tone({ from: 520, to: 1100, dur: 0.12, gain: 0.22 });
    tone({ from: 1300, to: 900, dur: 0.1, gain: 0.08, type: 'triangle', at: 0.05 });
  },
  boing() {
    if (!on) return;
    tone({ from: 180, to: 90, dur: 0.35, gain: 0.25, type: 'triangle' });
  },
};
