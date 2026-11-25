// Warung Senja — main.js
// Boots the game: canvas, loop, chef walk, steam particles, and the
// wiring between input, state, audio and render. No game rule lives here.

import { DISHES, SHIFT_SECONDS } from './data.js';
import { GRILL_STATION, PLATE_COUNTER, STAGE_H, STAGE_W, WOK_STATION } from './layout.js';
import { canvasPoint, handleClick, handleKey, hoverHint } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import {
  dropHand, freshState, startShift, tick,
} from './state.js';
import {
  ensureAudio, isMuted, playEvent, setMuted, startMusic, startSizzle,
  stopMusic, stopSizzle,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = STAGE_W;
canvas.height = STAGE_H;

const state = freshState();
const chef = { x: 800, targetX: 800, facing: 1, moving: false };
const particles = [];
let hover = '';
let mouse = { x: 640, y: 360 };
let lastTime = performance.now();
let shotMode = false;

const ui = {
  start() {
    ensureAudio();
    startShift(state);
    startMusic();
  },
  restart() {
    ensureAudio();
    startShift(state);
    startMusic();
  },
  toggleMute() {
    ensureAudio();
    setMuted(!isMuted());
    if (isMuted()) stopMusic();
    else if (state.phase === 'playing') startMusic();
  },
  togglePause() {
    if (state.phase !== 'playing') return;
    state.paused = !state.paused;
    if (state.paused) stopSizzle();
  },
  dropHand() {
    dropHand(state);
  },
  chefGoTo(rect) {
    chef.targetX = Math.max(360, Math.min(1240, rect.x + rect.w / 2));
  },
};

function spawnSteam(rect, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rect.x + rect.w / 2 + (Math.random() - 0.5) * 90,
      y: rect.y + 60 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 12,
      vy: -26 - Math.random() * 22,
      size: 5 + Math.random() * 7,
      life: 0.9 + Math.random() * 0.5,
      maxLife: 1.4,
      color: '#fff6e3',
    });
  }
}

function spawnSparkle(x, y) {
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (40 + Math.random() * 60),
      vy: Math.sin(angle) * (40 + Math.random() * 60) - 30,
      size: 3 + Math.random() * 4,
      life: 0.7,
      maxLife: 0.7,
      color: i % 2 ? '#ffc93c' : '#fff6e3',
    });
  }
}

function drainEvents() {
  for (const event of state.events) {
    playEvent(event.type);
    if (event.type === 'serve') {
      const c = PLATE_COUNTER.x + PLATE_COUNTER.w / 2;
      spawnSparkle(c, PLATE_COUNTER.y + 60);
    }
  }
  state.events.length = 0;
}

function updateChef(dt) {
  const dx = chef.targetX - chef.x;
  if (Math.abs(dx) > 4) {
    chef.moving = true;
    chef.facing = dx > 0 ? 1 : -1;
    chef.x += Math.sign(dx) * Math.min(Math.abs(dx), 460 * dt);
  } else {
    chef.moving = false;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 12 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const t = now / 1000;

  if (!shotMode) {
    tick(state, dt);
    drainEvents();
    updateChef(dt);
    updateParticles(dt);
    const cooking = (state.wok.cooking && !state.wok.done) || (state.grill.cooking && !state.grill.done);
    if (cooking && state.phase === 'playing' && !state.paused) {
      startSizzle();
      if (Math.random() < dt * 14) {
        spawnSteam(state.wok.cooking ? WOK_STATION : GRILL_STATION, 1);
      }
    } else {
      stopSizzle();
    }
    if (state.phase === 'over') {
      stopSizzle();
      stopMusic();
    }
  }

  render(ctx, state, chef, particles, hover, t, mouse);
  requestAnimationFrame(frame);
}

canvas.addEventListener('click', (event) => {
  ensureAudio();
  const point = canvasPoint(canvas, event);
  mouse = point;
  handleClick(state, point.x, point.y, ui);
  hover = hoverHint(state, point.x, point.y);
});

canvas.addEventListener('mousemove', (event) => {
  const point = canvasPoint(canvas, event);
  mouse = point;
  hover = hoverHint(state, point.x, point.y);
});

canvas.addEventListener('mouseleave', () => {
  hover = '';
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  ensureAudio();
  handleKey(state, event.key, ui);
});

// Screenshot staging: ?shot=cover|play|rush|end freezes one real game state.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  shotMode = true;
  stageShot(state, shot);
  if (state.phase === 'playing') {
    chef.x = 760;
    chef.targetX = 760;
  }
}

document.getElementById('hint').textContent =
  'Klik bahan → cincang → masak → piring → sajikan · 1–6 bahan · C cincang · Spasi sajikan · P jeda · M suara';

requestAnimationFrame(frame);
