// Warung Senja — shots.js
// Staged states for the screenshots: real game state, frozen mid-play,
// so each shot shows the kitchen at its best — orders on the board,
// a dish mid-assembly, the timer running, a plate ready to serve.
// The game itself never reads these except through ?shot=.

import { DISHES, ORDER_PATIENCE } from './data.js';

function order(id, dishId, patience) {
  return { id, dish: dishId, patience, maxPatience: ORDER_PATIENCE, bornAt: 0 };
}

export function stageShot(state, name) {
  state.phase = 'playing';
  state.frozen = true; // freeze the clock: the shot is a still frame
  state.seed = 7;
  state.orders = [];
  state.wok = { parts: [], cooking: null, progress: 0, done: false, burnt: false };
  state.grill = { parts: [], cooking: null, progress: 0, done: false, burnt: false };
  state.board = { item: null, chops: 0, chopsNeeded: 3 };
  state.plate = { dish: null, ready: false };
  state.hand = null;
  state.handKind = null;
  state.message = null;

  if (name === 'cover' || name === 'start') {
    // The money shot: two orders waiting, nasi goreng frying in the wok,
    // a plate of sate ready to serve, timer mid-shift.
    state.timeLeft = 134;
    state.elapsed = 46;
    state.coins = 86;
    state.served = 4;
    state.combo = 2;
    state.hearts = 3;
    state.orders = [order(1, 'migor', 31), order(2, 'sate', 18)];
    state.wok = { parts: ['nasi', 'telur', 'cabai'], cooking: 'nasgor', progress: 2.6, done: false, burnt: false };
    state.grill = { parts: ['ayam', 'cabai'], cooking: 'sate', progress: 4.8, done: false, burnt: false };
    state.plate = { dish: 'dadar', ready: true };
    state.hand = 'sayur_cincang';
    state.handKind = 'ingredient';
    state.message = 'Telur Dadar siap disajikan!';
    state.messageAt = 46;
  } else if (name === 'play') {
    // Hands-on moment: chopping chicken, wok half full, one order urgent.
    state.timeLeft = 97;
    state.elapsed = 83;
    state.coins = 142;
    state.served = 7;
    state.combo = 3;
    state.hearts = 2;
    state.orders = [order(3, 'nasgor', 9), order(4, 'migor', 36)];
    state.board = { item: 'ayam', chops: 2, chopsNeeded: 3 };
    state.wok = { parts: ['mie', 'sayur'], cooking: null, progress: 0, done: false, burnt: false };
    state.hand = 'cabai';
    state.handKind = 'ingredient';
    state.message = 'Cincang 2/3 — sekali lagi!';
    state.messageAt = 83;
  } else if (name === 'rush') {
    // Rush hour: three orders, a finished dish on the wok, plate ready.
    state.timeLeft = 24;
    state.elapsed = 156;
    state.coins = 268;
    state.served = 13;
    state.combo = 5;
    state.hearts = 2;
    state.rush = true;
    state.orders = [order(5, 'sate', 14), order(6, 'nasgor', 26), order(7, 'dadar', 41)];
    state.wok = { parts: ['nasi', 'telur', 'cabai'], cooking: 'nasgor', progress: 4, done: true, burnt: false };
    state.grill = { parts: ['ayam', 'cabai'], cooking: 'sate', progress: 3.1, done: false, burnt: false };
    state.plate = { dish: 'migor', ready: true };
    state.message = null;
    state.messageAt = 156;
  } else if (name === 'end') {
    // The shift is over: final tally on screen.
    state.phase = 'over';
    state.timeLeft = 0;
    state.elapsed = 180;
    state.coins = 312;
    state.served = 15;
    state.missed = 2;
    state.bestCombo = 5;
    state.hearts = 1;
    state.overReason = 'Waktu habis — shift selesai!';
    state.orders = [];
  }
  return state;
}

export const SHOT_NAMES = ['cover', 'play', 'rush', 'end'];
