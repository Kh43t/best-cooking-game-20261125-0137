// Warung Senja — render.js
// Every pixel of the game is drawn here, on one canvas, from shapes:
// the sunset warung, the counters, the food, the cook and the HUD.
// No images are loaded anywhere: the art is code.

import { DISHES, DISH_LIST, INGREDIENTS, MAX_ORDERS, PALETTE, SHIFT_SECONDS } from './data.js';
import {
  BIN_ROW, BOARD_PANEL, BOARD_STATION, CHEF_LANE_Y, GRILL_STATION,
  HAND_PANEL, MUTE_BUTTON, ORDER_SLOTS, PAUSE_BUTTON, PLATE_COUNTER,
  RECIPE_PANEL, STAGE_H, STAGE_W, TOPBAR, TRASH, WOK_STATION, binRect,
  center, inside,
} from './layout.js';
import { choppedLabel, handLabel } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// --- Food icons, drawn from shapes ----------------------------------------

export function drawIngredient(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = '#f5ecd7';
    ctx.beginPath();
    ctx.arc(0, 2, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8d9b0';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-s * 0.25 + i * s * 0.12, -s * 0.08 - (i % 2) * s * 0.08, s * 0.05, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#c9a86a';
    ctx.fillRect(-s * 0.42, s * 0.02, s * 0.84, s * 0.07);
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.34 - i * 0.09), 0.4 + i, 5.2 + i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c99a2e';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.16, 0, 7);
    ctx.stroke();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.48, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(0, s * 0.05, s * 0.2, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffdf8a';
    ctx.beginPath();
    ctx.arc(-s * 0.05, 0, s * 0.08, 0, 7);
    ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#f6b8a0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.05, s * 0.3, s * 0.36, -0.4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#e89a7d';
    ctx.beginPath();
    ctx.ellipse(s * 0.05, -s * 0.12, s * 0.16, s * 0.2, -0.4, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#f8f4ec';
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.moveTo(s * 0.22, s * 0.2);
    ctx.lineTo(s * 0.42, s * 0.42);
    ctx.stroke();
  } else if (id === 'cabai') {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.1);
    ctx.quadraticCurveTo(0, -s * 0.45, s * 0.38, s * 0.05);
    ctx.quadraticCurveTo(s * 0.42, s * 0.28, s * 0.2, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.28, -s * 0.4, -s * 0.1);
    ctx.fill();
    ctx.strokeStyle = '#4e9a44';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, -s * 0.12);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.35, -s * 0.3, -s * 0.38);
    ctx.stroke();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#7bc96f';
    ctx.beginPath();
    ctx.arc(-s * 0.14, -s * 0.08, s * 0.26, 0, 7);
    ctx.arc(s * 0.16, s * 0.05, s * 0.26, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#4e9a44';
    ctx.lineWidth = s * 0.05;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.18, -s * 0.3);
      ctx.lineTo(i * s * 0.18, s * 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDishIcon(ctx, dishId, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  // Plate
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.36, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#d8cdb8';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (dishId === 'nasgor') {
    ctx.fillStyle = '#f0c96a';
    ctx.beginPath();
    ctx.arc(0, -s * 0.04, s * 0.3, Math.PI, 0);
    ctx.fill();
    drawIngredient(ctx, 'telur', s * 0.05, -s * 0.12, s * 0.5);
    drawIngredient(ctx, 'cabai', -s * 0.22, s * 0.05, s * 0.5);
  } else if (dishId === 'migor') {
    ctx.strokeStyle = '#e8a93c';
    ctx.lineWidth = s * 0.06;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.3 - i * 0.08), 0.5 + i, 5 + i);
      ctx.stroke();
    }
    drawIngredient(ctx, 'ayam', s * 0.18, -s * 0.05, s * 0.55);
    drawIngredient(ctx, 'sayur', -s * 0.2, s * 0.06, s * 0.5);
  } else if (dishId === 'sate') {
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, i * s * 0.14);
      ctx.lineTo(s * 0.42, i * s * 0.14);
      ctx.stroke();
      ctx.fillStyle = '#c97b4a';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(-s * 0.28 + k * s * 0.28, i * s * 0.14, s * 0.09, 0, 7);
        ctx.fill();
      }
    }
    drawIngredient(ctx, 'cabai', s * 0.3, -s * 0.2, s * 0.45);
  } else if (dishId === 'dadar') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.36, s * 0.26, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#e8a93c';
    ctx.beginPath();
    ctx.ellipse(s * 0.05, -s * 0.06, s * 0.18, s * 0.12, 0.3, 0, 7);
    ctx.fill();
    drawIngredient(ctx, 'sayur', -s * 0.18, s * 0.08, s * 0.5);
  }
  ctx.restore();
}

// --- The room ---------------------------------------------------------------

function drawRoom(ctx, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_W, 300);
  // Sun, low over the warung roofline
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(1120, 150 + Math.sin(t * 0.2) * 3, 46, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
  ctx.beginPath();
  ctx.arc(1120, 150, 66, 0, 7);
  ctx.fill();
  // Distant rooftops
  ctx.fillStyle = '#241335';
  ctx.fillRect(0, 238, 240, 62);
  ctx.fillRect(300, 252, 180, 48);
  ctx.fillRect(980, 246, 300, 54);
  // Wall + floor
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 300, STAGE_W, 34);
  ctx.fillStyle = '#5b3a7a';
  ctx.fillRect(0, 300, STAGE_W, 6);
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 334, STAGE_W, STAGE_H - 334);
  ctx.fillStyle = PALETTE.floorB;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(col * 128 + (row % 2) * 64, 334 + row * 78, 128, 78);
      }
    }
  }
  // String lights
  ctx.strokeStyle = 'rgba(255, 220, 130, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 316);
  ctx.quadraticCurveTo(640, 344, 1280, 316);
  ctx.stroke();
  for (let i = 0; i < 13; i++) {
    const x = 50 + i * 100;
    const y = 318 + Math.sin((x / 1280) * Math.PI) * 14;
    ctx.fillStyle = i % 2 ? '#ffd166' : '#ff8fa3';
    ctx.beginPath();
    ctx.arc(x, y + 8, 5, 0, 7);
    ctx.fill();
  }
}

// --- Top bar ----------------------------------------------------------------

function drawTopbar(ctx, state) {
  ctx.fillStyle = 'rgba(20, 8, 36, 0.92)';
  ctx.fillRect(TOPBAR.x, TOPBAR.y, TOPBAR.w, TOPBAR.h);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 64, STAGE_W, 3);
  text(ctx, 'WARUNG SENJA', 20, 26, 26, PALETTE.gold, 'bold');
  text(ctx, 'dapur kilat · masak, sajikan, ulangi', 20, 50, 12, '#cbb7e8', 'normal');

  // Shift timer — big, with a bar the eye can read at a glance.
  const low = state.timeLeft <= 30;
  const timerColor = low ? '#ff6b5e' : PALETTE.cream;
  text(ctx, '⏱ ' + fmtTime(state.timeLeft), 470, 26, 30, timerColor, 'bold');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 470, 46, 220, 8, 4);
  ctx.fill();
  ctx.fillStyle = low ? '#ff6b5e' : PALETTE.teal;
  rr(ctx, 470, 46, 220 * (state.timeLeft / SHIFT_SECONDS), 8, 4);
  ctx.fill();

  text(ctx, '🪙 ' + state.coins, 740, 26, 26, PALETTE.gold, 'bold');
  text(ctx, 'disajikan ' + state.served, 740, 50, 12, '#cbb7e8', 'normal');
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < state.hearts ? '❤' : '🖤';
  text(ctx, hearts, 900, 26, 22, '#ff6b8a', 'bold');
  if (state.combo >= 2) {
    text(ctx, 'KOMBO x' + state.combo + ' 🔥', 900, 50, 14, '#ff9f43', 'bold');
  }
  if (state.rush) {
    text(ctx, 'RUSH HOUR!', 1020, 50, 14, '#ff6b5e', 'bold');
  }

  for (const [rect, label] of [[PAUSE_BUTTON, state.paused ? '▶' : '⏸'], [MUTE_BUTTON, state.muted ? '🔇' : '🔊']]) {
    ctx.fillStyle = '#3d2b5c';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 18, PALETTE.cream, 'bold', 'center');
  }
}

// --- Order board + recipe book ----------------------------------------------

function drawOrders(ctx, state, t) {
  ctx.fillStyle = 'rgba(20, 8, 36, 0.85)';
  rr(ctx, BOARD_PANEL.x, BOARD_PANEL.y, BOARD_PANEL.w, BOARD_PANEL.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, BOARD_PANEL.x, BOARD_PANEL.y, BOARD_PANEL.w, BOARD_PANEL.h, 12);
  ctx.stroke();
  text(ctx, '📋 PAPAN PESANAN', BOARD_PANEL.x + 14, BOARD_PANEL.y + 20, 15, PALETTE.gold, 'bold');

  state.orders.forEach((order, i) => {
    const slot = ORDER_SLOTS[i];
    if (!slot) return;
    const dish = DISHES[order.dish];
    const urgent = order.patience < 12;
    const pulse = urgent ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
    ctx.fillStyle = urgent ? 'rgba(231, 76, 60, ' + (0.25 + pulse * 0.2) + ')' : '#2e1d4e';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b5e' : '#5b3a7a';
    ctx.lineWidth = 1.5;
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.stroke();
    drawDishIcon(ctx, dish.id, slot.x + 44, slot.y + 40, 64);
    text(ctx, dish.name, slot.x + 88, slot.y + 24, 17, PALETTE.cream, 'bold');
    text(ctx, dish.price + ' koin · ' + fmtTime(order.patience), slot.x + 88, slot.y + 48, 13, '#cbb7e8', 'normal');
    const share = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    rr(ctx, slot.x + 88, slot.y + 64, 190, 8, 4);
    ctx.fill();
    ctx.fillStyle = share > 0.5 ? PALETTE.green : share > 0.25 ? '#ff9f43' : '#ff6b5e';
    rr(ctx, slot.x + 88, slot.y + 64, 190 * share, 8, 4);
    ctx.fill();
  });
  for (let i = state.orders.length; i < MAX_ORDERS; i++) {
    const slot = ORDER_SLOTS[i];
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    text(ctx, '— menunggu pesanan —', slot.x + slot.w / 2, slot.y + 44, 13, '#8a76b8', 'normal', 'center');
  }
}

function drawRecipes(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 36, 0.85)';
  rr(ctx, RECIPE_PANEL.x, RECIPE_PANEL.y, RECIPE_PANEL.w, RECIPE_PANEL.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#5b3a7a';
  ctx.lineWidth = 2;
  rr(ctx, RECIPE_PANEL.x, RECIPE_PANEL.y, RECIPE_PANEL.w, RECIPE_PANEL.h, 12);
  ctx.stroke();
  text(ctx, '📖 BUKU RESEP', RECIPE_PANEL.x + 14, RECIPE_PANEL.y + 20, 15, PALETTE.gold, 'bold');
  DISH_LIST.forEach((dish, i) => {
    const y = RECIPE_PANEL.y + 52 + i * 62;
    drawDishIcon(ctx, dish.id, RECIPE_PANEL.x + 34, y + 14, 52);
    text(ctx, dish.name + '  ·  ' + dish.price + ' koin', RECIPE_PANEL.x + 66, y + 4, 15, PALETTE.cream, 'bold');
    const parts = dish.parts.map((p) => {
      const ing = INGREDIENTS[p];
      return ing.name + (ing.kind === 'chop' ? ' ✂' : '');
    }).join(' + ');
    text(ctx, parts, RECIPE_PANEL.x + 66, y + 24, 12, '#cbb7e8', 'normal');
    text(ctx, dish.station === 'grill' ? '🔥 panggangan ' + dish.cookSecs + ' dtk' : '🍳 wajan ' + dish.cookSecs + ' dtk',
      RECIPE_PANEL.x + 66, y + 42, 11, '#8a76b8', 'normal');
  });
}

// --- Counters, bins, stations ------------------------------------------------

function drawCounter(ctx, rect, label) {
  ctx.fillStyle = PALETTE.counterFront;
  rr(ctx, rect.x, rect.y + 14, rect.w, rect.h - 14, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, rect.x - 4, rect.y, rect.w + 8, 22, 8);
  ctx.fill();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h - 16, 13, '#e8d9b0', 'bold', 'center');
}

function drawBins(ctx, state) {
  const ids = ['nasi', 'mie', 'telur', 'ayam', 'cabai', 'sayur'];
  ids.forEach((id, i) => {
    const rect = binRect(i);
    const ing = INGREDIENTS[id];
    const held = state.hand === id;
    ctx.fillStyle = held ? '#5b3a7a' : '#2e1d4e';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.strokeStyle = held ? PALETTE.gold : '#5b3a7a';
    ctx.lineWidth = held ? 3 : 1.5;
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.stroke();
    // Bin: a little bowl of the ingredient
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 62, 52, 26, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(rect.x + rect.w / 2 - 52, rect.y + 58, 104, 8);
    drawIngredient(ctx, id, rect.x + rect.w / 2, rect.y + 52, 76);
    text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 96, 14, PALETTE.cream, 'bold', 'center');
    text(ctx, '[' + ing.key + ']' + (ing.kind === 'chop' ? ' ✂ cincang dulu' : ''), rect.x + rect.w / 2, rect.y + 112, 10, '#8a76b8', 'normal', 'center');
  });
}

function stationGlow(ctx, rect, color, pulse) {
  ctx.save();
  ctx.globalAlpha = 0.25 + pulse * 0.15;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  rr(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 12);
  ctx.stroke();
  ctx.restore();
}

function drawBoardStation(ctx, state, t) {
  drawCounter(ctx, BOARD_STATION, 'TALENAN');
  const c = center(BOARD_STATION);
  ctx.fillStyle = PALETTE.board;
  rr(ctx, c.x - 95, c.y - 52, 190, 104, 8);
  ctx.fill();
  ctx.strokeStyle = '#a67c4e';
  ctx.lineWidth = 2;
  rr(ctx, c.x - 95, c.y - 52, 190, 104, 8);
  ctx.stroke();
  if (state.board.item) {
    const bob = Math.sin(t * 10) * 2;
    drawIngredient(ctx, state.board.item, c.x, c.y - 6 + bob, 110);
    const need = state.board.chopsNeeded;
    for (let i = 0; i < need; i++) {
      ctx.fillStyle = i < state.board.chops ? PALETTE.gold : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(c.x - 30 + i * 30, c.y + 40, 8, 0, 7);
      ctx.fill();
    }
    text(ctx, 'CINCANG ' + state.board.chops + '/' + need, c.x, c.y - 66, 13, PALETTE.cream, 'bold', 'center');
  } else {
    text(ctx, 'taruh ayam / sayur', c.x, c.y - 8, 14, '#6b4423', 'bold', 'center');
    text(ctx, 'lalu klik 3x untuk cincang', c.x, c.y + 14, 12, '#8a6a45', 'normal', 'center');
  }
}

function drawCookStation(ctx, state, stationName, rect, label, isGrill) {
  const station = state[stationName];
  drawCounter(ctx, rect, label);
  const c = center(rect);
  if (isGrill) {
    ctx.fillStyle = '#3a3a44';
    rr(ctx, c.x - 105, c.y - 40, 210, 80, 10);
    ctx.fill();
    ctx.strokeStyle = '#22222a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x - 95, c.y - 28 + i * 14);
      ctx.lineTo(c.x + 95, c.y - 28 + i * 14);
      ctx.stroke();
    }
    if (station.cooking) {
      ctx.fillStyle = 'rgba(255, 120, 40, 0.55)';
      for (let i = 0; i < 3; i++) {
        const fx = c.x - 60 + i * 60 + Math.sin(Date.now() / 300 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(fx, c.y + 30);
        ctx.quadraticCurveTo(fx - 10, c.y + 2, fx, c.y - 18);
        ctx.quadraticCurveTo(fx + 10, c.y + 2, fx, c.y + 30);
        ctx.fill();
      }
    }
  } else {
    // Wok: a wide dark pan on a burner
    ctx.fillStyle = '#22222a';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 34, 96, 18, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#3a3f4a';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 26, 108, 34, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#565e6e';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 26, 108, 34, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#2b2f3a';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 26, 92, 26, 0, Math.PI, 0);
    ctx.fill();
  }

  if (station.burnt) {
    stationGlow(ctx, rect, '#ff6b5e', 0.5);
    text(ctx, '🔥 GOSONG!', c.x, c.y - 66, 18, '#ff6b5e', 'bold', 'center');
    text(ctx, 'klik untuk buang', c.x, c.y + 62, 12, PALETTE.cream, 'normal', 'center');
    return;
  }
  if (station.cooking) {
    const dish = DISHES[station.cooking];
    const share = Math.min(1, station.progress / dish.cookSecs);
    if (station.done) {
      stationGlow(ctx, rect, PALETTE.gold, 0.8);
      drawDishIcon(ctx, dish.id, c.x, c.y - 6, 120);
      text(ctx, 'SIAP! klik untuk angkat', c.x, c.y - 72, 15, PALETTE.gold, 'bold', 'center');
    } else {
      station.parts.forEach((part, i) => {
        drawIngredient(ctx, part.replace('_cincang', ''), c.x - 44 + i * 44, c.y + 4, 64);
      });
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ctx, c.x - 70, c.y - 66, 140, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#ff9f43';
      rr(ctx, c.x - 70, c.y - 66, 140 * share, 16, 8);
      ctx.fill();
      text(ctx, dish.name + '… ' + Math.ceil(dish.cookSecs - station.progress) + ' dtk', c.x, c.y - 84, 13, PALETTE.cream, 'bold', 'center');
    }
    return;
  }
  if (station.parts.length) {
    station.parts.forEach((part, i) => {
      drawIngredient(ctx, part.replace('_cincang', ''), c.x - 44 + i * 44, c.y + 4, 64);
    });
    text(ctx, 'tambah bahan resep…', c.x, c.y - 66, 13, PALETTE.cream, 'bold', 'center');
  } else {
    text(ctx, isGrill ? 'sate dibakar di sini' : 'masak di wajan', c.x, c.y - 66, 13, '#cbb7e8', 'normal', 'center');
  }
}

function drawPlate(ctx, state) {
  drawCounter(ctx, PLATE_COUNTER, 'PIRING SAJI');
  const c = center(PLATE_COUNTER);
  const ix = c.x - 70;
  if (state.plate.dish) {
    stationGlow(ctx, PLATE_COUNTER, PALETTE.gold, 0.7);
    drawDishIcon(ctx, state.plate.dish, ix, c.y - 26, 150);
    text(ctx, DISHES[state.plate.dish].name, ix, c.y + 34, 15, PALETTE.gold, 'bold', 'center');
    text(ctx, 'SIAP! klik piring / Spasi', ix, c.y + 52, 12, PALETTE.cream, 'normal', 'center');
  } else {
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(ix, c.y - 26, 84, 52, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#d8cdb8';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'piring kosong', ix, c.y + 34, 14, '#e8d9b0', 'bold', 'center');
    text(ctx, 'taruh hidangan matang di sini', ix, c.y + 52, 12, '#cbb7e8', 'normal', 'center');
  }
}

function drawTrashAndHand(ctx, state) {
  drawCounter(ctx, TRASH, 'SAMPAH');
  const c = center(TRASH);
  ctx.fillStyle = state.trashFlash > 0 ? '#ff6b5e' : '#565e6e';
  rr(ctx, c.x - 34, c.y - 34, 68, 68, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3f4a';
  rr(ctx, c.x - 40, c.y - 42, 80, 14, 6);
  ctx.fill();
  text(ctx, '🗑', c.x, c.y + 2, 30, PALETTE.cream, 'bold', 'center');

  ctx.fillStyle = '#2e1d4e';
  rr(ctx, HAND_PANEL.x, HAND_PANEL.y, HAND_PANEL.w, HAND_PANEL.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#5b3a7a';
  ctx.lineWidth = 1.5;
  rr(ctx, HAND_PANEL.x, HAND_PANEL.y, HAND_PANEL.w, HAND_PANEL.h, 10);
  ctx.stroke();
  text(ctx, '✋ DI TANGAN', HAND_PANEL.x + 14, HAND_PANEL.y + 20, 13, PALETTE.gold, 'bold');
  if (state.hand) {
    const hx = HAND_PANEL.x + 52;
    const hy = HAND_PANEL.y + 78;
    if (state.handKind === 'dish') drawDishIcon(ctx, state.hand, hx, hy, 84);
    else drawIngredient(ctx, state.hand.replace('_cincang', ''), hx, hy, 84);
    text(ctx, handLabel(state), HAND_PANEL.x + 100, HAND_PANEL.y + 66, 17, PALETTE.cream, 'bold');
    text(ctx, state.handKind === 'dish' ? 'bawa ke piring saji' : 'bawa ke talenan / wajan / panggangan',
      HAND_PANEL.x + 100, HAND_PANEL.y + 90, 12, '#cbb7e8', 'normal');
    text(ctx, 'klik panel ini untuk buang  [ X ]', HAND_PANEL.x + 100, HAND_PANEL.y + 112, 11, '#8a76b8', 'normal');
  } else {
    text(ctx, 'tangan kosong — ambil bahan dulu!', HAND_PANEL.x + 162, HAND_PANEL.y + 78, 14, '#8a76b8', 'normal', 'center');
  }
}

// --- The cook -----------------------------------------------------------------

function drawChef(ctx, chef, state, t) {
  const bob = Math.abs(Math.sin(t * 10)) * (chef.moving ? 5 : 1.5);
  const x = chef.x;
  const y = CHEF_LANE_Y - bob;
  const facing = chef.facing;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  // Legs
  ctx.fillStyle = '#2e1d4e';
  ctx.fillRect(-14, -26, 10, 26);
  ctx.fillRect(4, -26, 10, 26);
  // Body + apron
  ctx.fillStyle = '#ff8fa3';
  rr(ctx, -22, -66, 44, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  rr(ctx, -16, -58, 32, 30, 8);
  ctx.fill();
  // Arms
  ctx.fillStyle = '#ff8fa3';
  ctx.fillRect(-30, -60, 10, 30);
  ctx.fillRect(20, -60, 10, 30);
  // Head
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath();
  ctx.arc(0, -80, 20, 0, 7);
  ctx.fill();
  // Chef hat
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath();
  ctx.arc(-10, -96, 12, 0, 7);
  ctx.arc(0, -102, 13, 0, 7);
  ctx.arc(10, -96, 12, 0, 7);
  ctx.fill();
  ctx.fillRect(-18, -98, 36, 8);
  // Face
  ctx.fillStyle = '#2a1a3a';
  ctx.beginPath();
  ctx.arc(-7, -82, 2.5, 0, 7);
  ctx.arc(7, -82, 2.5, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#2a1a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -74, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // What the cook carries, held up high
  if (state.hand) {
    ctx.save();
    ctx.translate(26, -72);
    if (state.handKind === 'dish') drawDishIcon(ctx, state.hand, 0, 0, 56);
    else drawIngredient(ctx, state.hand.replace('_cincang', ''), 0, 0, 56);
    ctx.restore();
  }
  ctx.restore();
}

// --- Particles ----------------------------------------------------------------

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.5;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life / p.maxLife)), 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

// --- Overlays -----------------------------------------------------------------

function overlay(ctx, alpha) {
  ctx.fillStyle = 'rgba(16, 6, 32, ' + alpha + ')';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
}

function drawTitle(ctx, t) {
  overlay(ctx, 0.55);
  const pulse = 1 + Math.sin(t * 2) * 0.02;
  ctx.save();
  ctx.translate(640, 250);
  ctx.scale(pulse, pulse);
  text(ctx, '🍳 WARUNG SENJA 🍜', 0, 0, 64, PALETTE.gold, 'bold', 'center');
  ctx.restore();
  text(ctx, 'DAPUR KILAT — masak pesanan sebelum pelanggan kabur!', 640, 310, 22, PALETTE.cream, 'bold', 'center');
  text(ctx, 'Klik bahan di counter → cincang di talenan → masak di wajan / panggangan', 640, 352, 17, '#cbb7e8', 'normal', 'center');
  text(ctx, 'taruh di piring saji → sajikan ke pesanan yang cocok. Kombo = bonus koin!', 640, 380, 17, '#cbb7e8', 'normal', 'center');
  text(ctx, 'Keyboard: 1–6 ambil bahan · C cincang · Spasi sajikan · P jeda · M suara', 640, 414, 15, '#8a76b8', 'normal', 'center');
  ctx.fillStyle = PALETTE.gold;
  rr(ctx, 490, 448, 300, 64, 14);
  ctx.fill();
  text(ctx, '▶  MULAI SHIFT (3 menit)', 640, 480, 20, '#2a1a3a', 'bold', 'center');
  text(ctx, '3 hati · pesanan hangus = -1 hati · rush hour di 30 detik terakhir', 640, 540, 14, '#cbb7e8', 'normal', 'center');
}

function drawOver(ctx, state) {
  overlay(ctx, 0.6);
  text(ctx, 'SHIFT SELESAI', 640, 220, 54, PALETTE.gold, 'bold', 'center');
  text(ctx, state.overReason, 640, 272, 20, PALETTE.cream, 'normal', 'center');
  const rows = [
    ['🪙 Koin terkumpul', String(state.coins)],
    ['🍽 Hidangan disajikan', String(state.served)],
    ['💨 Pesanan hangus', String(state.missed)],
    ['🔥 Kombo terbaik', 'x' + state.bestCombo],
  ];
  rows.forEach(([label, value], i) => {
    const y = 330 + i * 44;
    text(ctx, label, 480, y, 20, '#cbb7e8', 'normal');
    text(ctx, value, 800, y, 22, PALETTE.gold, 'bold', 'right');
  });
  ctx.fillStyle = PALETTE.gold;
  rr(ctx, 490, 540, 300, 56, 14);
  ctx.fill();
  text(ctx, '↻  MAIN LAGI  [ Enter ]', 640, 568, 19, '#2a1a3a', 'bold', 'center');
}

function drawPaused(ctx) {
  overlay(ctx, 0.5);
  text(ctx, '⏸ JEDA', 640, 330, 48, PALETTE.cream, 'bold', 'center');
  text(ctx, 'tekan P untuk lanjut', 640, 380, 18, '#cbb7e8', 'normal', 'center');
}

// --- Main render --------------------------------------------------------------

export function render(ctx, state, chef, particles, hover, t, mouse = { x: 640, y: 360 }) {
  drawRoom(ctx, t);
  drawTopbar(ctx, state);
  drawOrders(ctx, state, t);
  drawRecipes(ctx);
  drawBins(ctx, state);
  drawBoardStation(ctx, state, t);
  drawCookStation(ctx, state, 'wok', WOK_STATION, 'WAJAN 🔥', false);
  drawCookStation(ctx, state, 'grill', GRILL_STATION, 'PANGGANGAN 🔥', true);
  drawPlate(ctx, state);
  drawTrashAndHand(ctx, state);
  drawParticles(ctx, particles);
  drawChef(ctx, chef, state, t);

  if (state.rush && state.phase === 'playing') {
    text(ctx, '⚠ RUSH HOUR — pesanan makin cepat! ⚠', 640, 700, 16, '#ff6b5e', 'bold', 'center');
  }
  if (state.message && state.phase === 'playing') {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(20, 8, 36, 0.9)';
    const w = ctx.measureText(state.message).width + 40;
    rr(ctx, 640 - w / 2, 636, w, 34, 10);
    ctx.fill();
    text(ctx, state.message, 640, 653, 16, PALETTE.gold, 'bold', 'center');
    ctx.restore();
  }
  if (hover && state.phase === 'playing' && !state.paused) {
    ctx.save();
    ctx.font = 'normal 13px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(hover).width + 28;
    let tx = mouse.x + 18;
    let ty = mouse.y + 20;
    if (tx + w > STAGE_W - 8) tx = mouse.x - w - 18;
    if (ty + 28 > STAGE_H - 8) ty = mouse.y - 34;
    ctx.fillStyle = 'rgba(20, 8, 36, 0.92)';
    rr(ctx, tx, ty, w, 26, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1;
    rr(ctx, tx, ty, w, 26, 8);
    ctx.stroke();
    text(ctx, hover, tx + 14, ty + 13, 13, PALETTE.cream, 'normal');
    ctx.restore();
  }

  if (state.phase === 'title') drawTitle(ctx, t);
  if (state.phase === 'over') drawOver(ctx, state);
  if (state.paused && state.phase === 'playing') drawPaused(ctx);
}
