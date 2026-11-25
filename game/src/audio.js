// Warung Senja — audio.js
// All sound is synthesised live with WebAudio: no audio files, no network.
// A small gamelan-flavoured pluck loop for music, short synth hits for play.

let ctx = null;
let musicTimer = null;
let musicStep = 0;
let muted = false;
let sizzleNode = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(value) {
  muted = value;
  if (muted) stopMusic();
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

// One pluck: a bright triangle note with a fast decay, like a metallophone.
function pluck(freq, vol = 0.12) {
  tone(freq, 0.5, 'triangle', vol);
  tone(freq * 2, 0.22, 'sine', vol * 0.4);
}

const MELODY = [
  523.25, 0, 587.33, 659.25, 0, 587.33, 523.25, 0,
  440.0, 0, 523.25, 587.33, 659.25, 0, 587.33, 0,
  523.25, 0, 587.33, 659.25, 783.99, 0, 659.25, 587.33,
  523.25, 587.33, 440.0, 0, 392.0, 0, 0, 0,
];
const BASS = [130.81, 0, 0, 0, 98.0, 0, 0, 0, 110.0, 0, 0, 0, 98.0, 0, 146.83, 0,
  130.81, 0, 0, 0, 98.0, 0, 0, 0, 110.0, 0, 146.83, 0, 98.0, 0, 0, 0];

export function startMusic() {
  if (!ctx || musicTimer || muted) return;
  musicStep = 0;
  musicTimer = window.setInterval(() => {
    if (muted || !ctx) return;
    const note = MELODY[musicStep % MELODY.length];
    const bass = BASS[musicStep % BASS.length];
    if (note) pluck(note, 0.09);
    if (bass) tone(bass, 0.5, 'sine', 0.07);
    musicStep += 1;
  }, 210);
}

export function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
}

export function playEvent(type) {
  if (!ctx || muted) return;
  switch (type) {
    case 'pickup':
      tone(660, 0.08, 'sine', 0.12);
      break;
    case 'place':
      tone(392, 0.09, 'triangle', 0.14);
      tone(523.25, 0.12, 'triangle', 0.1, 0.05);
      break;
    case 'chop':
      noiseBurst(0.07, 0.25, 900);
      tone(180, 0.08, 'square', 0.08, 0, 90);
      break;
    case 'cook':
      noiseBurst(0.3, 0.12, 2400);
      tone(220, 0.2, 'sawtooth', 0.05, 0, 440);
      break;
    case 'plate':
      tone(784, 0.1, 'sine', 0.12);
      tone(1046.5, 0.16, 'sine', 0.1, 0.07);
      break;
    case 'serve': {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => tone(n, 0.18, 'triangle', 0.13, i * 0.07));
      break;
    }
    case 'order':
      tone(880, 0.12, 'sine', 0.1);
      tone(1174.66, 0.14, 'sine', 0.08, 0.09);
      break;
    case 'miss':
      tone(311, 0.25, 'sawtooth', 0.08, 0, 155);
      break;
    case 'error':
      tone(160, 0.16, 'square', 0.08, 0, 110);
      break;
    case 'trash':
      noiseBurst(0.18, 0.18, 600);
      break;
    case 'over': {
      const notes = [392.0, 523.25, 659.25, 783.99];
      notes.forEach((n, i) => tone(n, 0.3, 'triangle', 0.11, i * 0.12));
      break;
    }
    default:
      break;
  }
}

export function startSizzle() {
  if (!ctx || muted || sizzleNode) return;
  const len = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4200;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
  sizzleNode = { src, gain };
}

export function stopSizzle() {
  if (!sizzleNode) return;
  try {
    sizzleNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    sizzleNode.src.stop(ctx.currentTime + 0.3);
  } catch {
    // Already stopped; nothing to do.
  }
  sizzleNode = null;
}
