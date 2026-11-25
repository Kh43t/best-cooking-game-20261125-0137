// Warung Senja — data.js
// Every ingredient, dish and recipe in the game, plus the look of the kitchen.
// Nothing here is copied from any other game: the dishes are Indonesian
// street food, the names are ours, the palette is a sunset warung.

export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',      short: 'NASI',   color: '#f5ecd7', dark: '#cbb98d', key: '1', kind: 'base' },
  mie:    { id: 'mie',    name: 'Mie',       short: 'MIE',    color: '#f2c94c', dark: '#c99a2e', key: '2', kind: 'base' },
  telur:  { id: 'telur',  name: 'Telur',     short: 'TELUR',  color: '#fff3d6', dark: '#e0a458', key: '3', kind: 'add' },
  ayam:   { id: 'ayam',   name: 'Ayam',      short: 'AYAM',   color: '#f6b8a0', dark: '#d97b5f', key: '4', kind: 'chop' },
  cabai:  { id: 'cabai',  name: 'Cabai',     short: 'CABAI',  color: '#e74c3c', dark: '#a93226', key: '5', kind: 'add' },
  sayur:  { id: 'sayur',  name: 'Sayur',     short: 'SAYUR',  color: '#7bc96f', dark: '#4e9a44', key: '6', kind: 'chop' },
};

// A dish is finished when its wok or grill holds exactly its parts.
// `station` is where it cooks, `cookSecs` how long the fire takes.
export const DISHES = {
  nasgor: {
    id: 'nasgor', name: 'Nasi Goreng', price: 18, station: 'wok', cookSecs: 4,
    parts: ['nasi', 'telur', 'cabai'],
    desc: 'Nasi + telur + cabai, goreng di wajan',
  },
  migor: {
    id: 'migor', name: 'Mie Goreng', price: 20, station: 'wok', cookSecs: 5,
    parts: ['mie', 'ayam', 'sayur'],
    desc: 'Mie + ayam + sayur, goreng di wajan',
  },
  sate: {
    id: 'sate', name: 'Sate Ayam', price: 22, station: 'grill', cookSecs: 6,
    parts: ['ayam', 'cabai'],
    desc: 'Ayam + cabai, bakar di panggangan',
  },
  dadar: {
    id: 'dadar', name: 'Telur Dadar', price: 14, station: 'wok', cookSecs: 3,
    parts: ['telur', 'sayur'],
    desc: 'Telur + sayur, dadar cepat di wajan',
  },
};

export const DISH_LIST = [DISHES.nasgor, DISHES.migor, DISHES.sate, DISHES.dadar];

// Chopping turns a raw item into its chopped twin, which is what recipes want.
export function choppedId(id) {
  return id + '_cincang';
}

export function choppedName(id) {
  return INGREDIENTS[id].name + ' Cincang';
}

// The set of parts a station needs, with chopped items counted as their raw id.
export function partsKey(parts) {
  return [...parts].sort().join('+');
}

export function recipeFor(parts) {
  const key = partsKey(parts);
  for (const dish of DISH_LIST) {
    if (partsKey(dish.parts) === key) return dish;
  }
  return null;
}

// Which raw items a recipe needs on the board, before chopping.
export function rawPartsOf(dish) {
  return dish.parts.map((p) => (INGREDIENTS[p].kind === 'chop' ? p : p));
}

export const PALETTE = {
  skyTop: '#2b1a4d',
  skyMid: '#7a2d5e',
  skyLow: '#e2603f',
  sun: '#ffd166',
  wall: '#3d2b5c',
  floorA: '#4a2f6b',
  floorB: '#422863',
  counterTop: '#8a5a33',
  counterFront: '#6b4423',
  steel: '#9aa5b1',
  steelDark: '#6e7a88',
  board: '#caa06a',
  plate: '#f8f4ec',
  cream: '#fff6e3',
  ink: '#2a1a3a',
  gold: '#ffc93c',
  red: '#e74c3c',
  green: '#58b368',
  teal: '#2ec4b6',
};

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 48;
export const ORDER_SPAWN_EVERY = 13;
export const RUSH_AT = 30; // seconds left when rush hour starts
export const START_HEARTS = 3;
