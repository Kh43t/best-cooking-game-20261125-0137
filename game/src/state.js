// Warung Senja — state.js
// One object holds the whole shift: the clock, the orders on the board,
// what sits on every station, the hand, the coins and the combo.
// Pure logic here: no drawing, no sound, no DOM.

import {
  DISHES, DISH_LIST, INGREDIENTS, ORDER_PATIENCE, ORDER_SPAWN_EVERY,
  MAX_ORDERS, RUSH_AT, SHIFT_SECONDS, START_HEARTS, choppedId, recipeFor,
} from './data.js';

export function freshState() {
  return {
    phase: 'title', // title | playing | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    hearts: START_HEARTS,
    orders: [],
    nextOrderIn: 4,
    hand: null, // ingredient id in the cook's hand, or a cooked dish id
    handKind: null, // 'ingredient' | 'dish'
    wok: { parts: [], cooking: null, progress: 0, done: false, burnt: false },
    grill: { parts: [], cooking: null, progress: 0, done: false, burnt: false },
    board: { item: null, chops: 0, chopsNeeded: 3 },
    plate: { dish: null, ready: false },
    trashFlash: 0,
    message: null,
    messageAt: 0,
    rush: false,
    muted: false,
    paused: false,
    frozen: false, // screenshot staging: the clock stops, no pause overlay
    seed: 1,
    overReason: '',
    events: [], // { type, at } — the audio layer drains these
  };
}

function pickDish(state) {
  // Weight the cheap, fast dishes early so the first minute teaches the loop.
  const pool = state.elapsed < 45
    ? [DISHES.nasgor, DISHES.dadar, DISHES.nasgor, DISHES.migor]
    : DISH_LIST;
  const roll = Math.floor(random(state) * pool.length);
  return pool[roll];
}

export function random(state) {
  // Tiny deterministic generator so screenshot staging is repeatable.
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const dish = pickDish(state);
  state.orders.push({
    id: state.orders.length + state.served + state.missed + 1,
    dish: dish.id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
    bornAt: state.elapsed,
  });
  state.events.push({ type: 'order', at: state.elapsed });
}

export function tick(state, dt) {
  if (state.phase !== 'playing' || state.paused || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  state.rush = state.timeLeft <= RUSH_AT && state.timeLeft > 0;

  const spawnEvery = state.rush ? ORDER_SPAWN_EVERY * 0.6 : ORDER_SPAWN_EVERY;
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state);
    state.nextOrderIn = spawnEvery;
  }

  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((o) => o.patience <= 0);
  for (const gone of expired) {
    state.orders = state.orders.filter((o) => o !== gone);
    state.missed += 1;
    state.hearts -= 1;
    state.combo = 0;
    state.events.push({ type: 'miss', at: state.elapsed });
    flash(state, 'Pesanan hangus! -1 ❤');
  }

  cookStation(state, state.wok, dt);
  cookStation(state, state.grill, dt);

  if (state.trashFlash > 0) state.trashFlash -= dt;
  if (state.message && state.elapsed - state.messageAt > 2.2) state.message = null;

  if (state.timeLeft <= 0) endShift(state, 'Waktu habis — shift selesai!');
  if (state.hearts <= 0) endShift(state, 'Tiga pesanan hangus — warung tutup!');
}

function cookStation(state, station, dt) {
  if (!station.cooking) return;
  station.progress += dt;
  const dish = DISHES[station.cooking];
  if (station.progress >= dish.cookSecs) {
    station.done = true;
    station.progress = dish.cookSecs;
  } else if (station.progress > dish.cookSecs + 6 && !station.done) {
    station.burnt = true;
  }
  // A finished dish left on the fire burns after a grace window.
  if (station.done && station.progress > dish.cookSecs + 6) station.burnt = true;
}

export function endShift(state, reason) {
  if (state.phase !== 'playing') return;
  state.phase = 'over';
  state.overReason = reason;
  state.events.push({ type: 'over', at: state.elapsed });
}

export function startShift(state) {
  const keep = { muted: state.muted, seed: state.seed };
  Object.assign(state, freshState(), keep);
  state.phase = 'playing';
  state.orders = [];
  spawnOrder(state);
  spawnOrder(state);
  state.nextOrderIn = ORDER_SPAWN_EVERY;
}

export function flash(state, text) {
  state.message = text;
  state.messageAt = state.elapsed;
}

// --- The cook's hand -------------------------------------------------------

export function takeIngredient(state, id) {
  if (state.phase !== 'playing' || state.paused) return false;
  if (state.hand) return false;
  state.hand = id;
  state.handKind = 'ingredient';
  state.events.push({ type: 'pickup', at: state.elapsed });
  return true;
}

export function dropHand(state) {
  state.hand = null;
  state.handKind = null;
}

// --- The chopping board ----------------------------------------------------

export function putOnBoard(state) {
  if (!state.hand || state.handKind !== 'ingredient') return false;
  const ing = INGREDIENTS[state.hand];
  if (!ing || ing.kind !== 'chop') return false;
  if (state.board.item) return false;
  state.board.item = state.hand;
  state.board.chops = 0;
  dropHand(state);
  state.events.push({ type: 'place', at: state.elapsed });
  return true;
}

export function chop(state) {
  if (!state.board.item) return false;
  state.board.chops += 1;
  state.events.push({ type: 'chop', at: state.elapsed });
  if (state.board.chops >= state.board.chopsNeeded) {
    state.hand = choppedId(state.board.item);
    state.handKind = 'ingredient';
    state.board.item = null;
    state.board.chops = 0;
    flash(state, choppedLabel(state.hand) + ' siap!');
  }
  return true;
}

export function choppedLabel(id) {
  const raw = id.replace('_cincang', '');
  return (INGREDIENTS[raw] ? INGREDIENTS[raw].name : id) + ' cincang';
}

export function handLabel(state) {
  if (!state.hand) return '';
  if (state.handKind === 'dish') return DISHES[state.hand].name;
  if (state.hand.endsWith('_cincang')) return choppedLabel(state.hand);
  return INGREDIENTS[state.hand].name;
}

// --- Wok and grill ---------------------------------------------------------

function stationFor(dishId) {
  return DISHES[dishId].station === 'grill' ? 'grill' : 'wok';
}

export function addToStation(state, stationName) {
  if (!state.hand || state.handKind !== 'ingredient') return false;
  const station = state[stationName];
  if (station.cooking || station.done || station.burnt) return false;
  if (station.parts.length >= 3) return false;
  const raw = state.hand.replace('_cincang', '');
  // Choppable items must be chopped first; the board is the only way.
  if (INGREDIENTS[raw].kind === 'chop' && !state.hand.endsWith('_cincang')) {
    flash(state, INGREDIENTS[raw].name + ' harus dicincang dulu!');
    state.events.push({ type: 'error', at: state.elapsed });
    return false;
  }
  station.parts.push(state.hand);
  dropHand(state);
  state.events.push({ type: 'place', at: state.elapsed });
  const dish = recipeFor(station.parts);
  if (dish && dish.station === stationName) {
    station.cooking = dish.id;
    station.progress = 0;
    state.events.push({ type: 'cook', at: state.elapsed });
    flash(state, dish.name + ' mulai dimasak!');
  } else if (station.parts.length === 3) {
    station.burnt = true;
    flash(state, 'Campuran salah — gosong!');
    state.events.push({ type: 'error', at: state.elapsed });
  }
  return true;
}

export function takeFromStation(state, stationName) {
  const station = state[stationName];
  if (!station.done || station.burnt) return false;
  if (state.hand) return false;
  state.hand = station.cooking;
  state.handKind = 'dish';
  station.cooking = null;
  station.parts = [];
  station.progress = 0;
  station.done = false;
  state.events.push({ type: 'pickup', at: state.elapsed });
  return true;
}

export function clearStation(state, stationName) {
  const station = state[stationName];
  if (!station.burnt && station.parts.length === 0) return false;
  station.parts = [];
  station.cooking = null;
  station.progress = 0;
  station.done = false;
  station.burnt = false;
  state.trashFlash = 0.4;
  state.events.push({ type: 'trash', at: state.elapsed });
  return true;
}

// --- Plating and serving ---------------------------------------------------

export function putOnPlate(state) {
  if (!state.hand || state.handKind !== 'dish') return false;
  if (state.plate.dish) return false;
  state.plate.dish = state.hand;
  state.plate.ready = true;
  dropHand(state);
  state.events.push({ type: 'plate', at: state.elapsed });
  flash(state, DISHES[state.plate.dish].name + ' siap disajikan!');
  return true;
}

export function servePlate(state, orderId) {
  if (!state.plate.dish) return false;
  const dishId = state.plate.dish;
  const wanted = orderId
    ? state.orders.find((o) => o.id === orderId)
    : state.orders.find((o) => o.dish === dishId);
  if (!wanted || wanted.dish !== dishId) {
    flash(state, 'Tidak ada pesanan ' + DISHES[dishId].name + '!');
    state.events.push({ type: 'error', at: state.elapsed });
    return false;
  }
  const dish = DISHES[dishId];
  const patienceShare = Math.max(0, wanted.patience / wanted.maxPatience);
  const tip = Math.round(dish.price * 0.5 * patienceShare);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = state.combo >= 3 ? Math.round(dish.price * 0.2) : 0;
  state.coins += dish.price + tip + comboBonus;
  state.served += 1;
  state.orders = state.orders.filter((o) => o !== wanted);
  state.plate.dish = null;
  state.plate.ready = false;
  state.events.push({ type: 'serve', at: state.elapsed });
  flash(state, '+' + (dish.price + tip + comboBonus) + ' koin' + (comboBonus ? ' (kombo x' + state.combo + '!)' : ''));
  return true;
}

export function stationOfDish(dishId) {
  return stationFor(dishId);
}

export function matchingOrder(state, dishId) {
  return state.orders.find((o) => o.dish === dishId) ?? null;
}
