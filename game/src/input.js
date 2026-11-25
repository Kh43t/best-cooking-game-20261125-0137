// Warung Senja — input.js
// Mouse and keyboard, translated into game actions.
// Every click lands on a station rect from layout.js and calls one
// small state function; nothing here draws or plays sound.

import {
  BIN_ROW, BOARD_STATION, GRILL_STATION, HAND_PANEL, MUTE_BUTTON,
  PAUSE_BUTTON, PLATE_COUNTER, TRASH, WOK_STATION, binRect, inside,
} from './layout.js';
import {
  addToStation, chop, clearStation, putOnBoard, putOnPlate, servePlate,
  takeFromStation, takeIngredient,
} from './state.js';
import { DISHES, INGREDIENTS } from './data.js';

const BIN_IDS = ['nasi', 'mie', 'telur', 'ayam', 'cabai', 'sayur'];

export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

export function handleClick(state, px, py, ui) {
  if (state.phase === 'title') {
    ui.start();
    return;
  }
  if (state.phase === 'over') {
    ui.restart();
    return;
  }
  if (inside(MUTE_BUTTON, px, py)) {
    ui.toggleMute();
    return;
  }
  if (inside(PAUSE_BUTTON, px, py)) {
    ui.togglePause();
    return;
  }
  if (state.paused) return;

  // Ingredient bins: pick one up, or swap the hand back by clicking its bin.
  for (let i = 0; i < BIN_IDS.length; i++) {
    if (inside(binRect(i), px, py)) {
      if (!state.hand) takeIngredient(state, BIN_IDS[i]);
      return;
    }
  }

  if (inside(BOARD_STATION, px, py)) {
    if (state.board.item) chop(state);
    else putOnBoard(state);
    ui.chefGoTo(BOARD_STATION);
    return;
  }

  if (inside(WOK_STATION, px, py)) {
    if (state.wok.done) takeFromStation(state, 'wok');
    else if (state.wok.burnt) clearStation(state, 'wok');
    else addToStation(state, 'wok');
    ui.chefGoTo(WOK_STATION);
    return;
  }

  if (inside(GRILL_STATION, px, py)) {
    if (state.grill.done) takeFromStation(state, 'grill');
    else if (state.grill.burnt) clearStation(state, 'grill');
    else addToStation(state, 'grill');
    ui.chefGoTo(GRILL_STATION);
    return;
  }

  if (inside(PLATE_COUNTER, px, py)) {
    if (state.plate.dish) servePlate(state);
    else putOnPlate(state);
    ui.chefGoTo(PLATE_COUNTER);
    return;
  }

  if (inside(TRASH, px, py)) {
    if (state.wok.burnt || state.wok.parts.length) clearStation(state, 'wok');
    else if (state.grill.burnt || state.grill.parts.length) clearStation(state, 'grill');
    else if (state.hand) ui.dropHand();
    return;
  }

  if (inside(HAND_PANEL, px, py)) {
    // Clicking the hand panel drops what the cook carries.
    ui.dropHand();
  }
}

export function handleKey(state, key, ui) {
  const lower = key.toLowerCase();
  if (state.phase === 'title' && (lower === 'enter' || lower === ' ')) {
    ui.start();
    return;
  }
  if (state.phase === 'over' && (lower === 'enter' || lower === 'r')) {
    ui.restart();
    return;
  }
  if (state.phase !== 'playing') return;

  if (lower === 'm') {
    ui.toggleMute();
    return;
  }
  if (lower === 'p') {
    ui.togglePause();
    return;
  }
  if (state.paused) return;

  if (lower === ' ') {
    if (state.plate.dish) servePlate(state);
    else putOnPlate(state);
    return;
  }
  if (lower === 'c') {
    chop(state);
    return;
  }
  if (lower === 'x') {
    ui.dropHand();
    return;
  }
  const index = ['1', '2', '3', '4', '5', '6'].indexOf(lower);
  if (index >= 0 && !state.hand) takeIngredient(state, BIN_IDS[index]);
}

// Hover labels: what would this click do? Used by the render layer.
export function hoverHint(state, px, py) {
  if (state.phase !== 'playing') return '';
  for (let i = 0; i < BIN_IDS.length; i++) {
    if (inside(binRect(i), px, py)) {
      const ing = INGREDIENTS[BIN_IDS[i]];
      return state.hand ? 'Tangan penuh' : 'Ambil ' + ing.name + '  [ ' + ing.key + ' ]';
    }
  }
  if (inside(BOARD_STATION, px, py)) {
    if (state.board.item) return 'Cincang! (' + state.board.chops + '/3)  [ klik / C ]';
    return 'Taruh ayam / sayur untuk dicincang';
  }
  if (inside(WOK_STATION, px, py)) {
    if (state.wok.done) return 'Angkat ' + DISHES[state.wok.cooking].name + '!';
    if (state.wok.burnt) return 'Gosong — klik untuk buang';
    return 'Wajan: taruh bahan resep di sini';
  }
  if (inside(GRILL_STATION, px, py)) {
    if (state.grill.done) return 'Angkat ' + DISHES[state.grill.cooking].name + '!';
    if (state.grill.burnt) return 'Gosong — klik untuk buang';
    return 'Panggangan: sate dibakar di sini';
  }
  if (inside(PLATE_COUNTER, px, py)) {
    if (state.plate.dish) return 'Sajikan ' + DISHES[state.plate.dish].name + '  [ Spasi ]';
    return 'Piring saji: taruh hidangan matang di sini';
  }
  if (inside(TRASH, px, py)) return 'Tempat sampah: buang gosong / bahan';
  return '';
}
