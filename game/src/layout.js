// Warung Senja — layout.js
// One place that says where everything sits on the 1280x720 stage.
// render.js draws from these rects; input.js hit-tests against them,
// so a button never drifts away from its picture.

export const STAGE_W = 1280;
export const STAGE_H = 720;

export const TOPBAR = { x: 0, y: 0, w: 1280, h: 64 };

export const BOARD_PANEL = { x: 8, y: 72, w: 316, h: 316 };
export const ORDER_SLOTS = [
  { x: 16, y: 104, w: 300, h: 88 },
  { x: 16, y: 200, w: 300, h: 88 },
  { x: 16, y: 296, w: 300, h: 88 },
];

export const RECIPE_PANEL = { x: 8, y: 396, w: 316, h: 304 };

export const BIN_ROW = { x: 348, y: 80, w: 146, h: 118, gap: 8 };
export function binRect(index) {
  return {
    x: BIN_ROW.x + index * (BIN_ROW.w + BIN_ROW.gap),
    y: BIN_ROW.y,
    w: BIN_ROW.w,
    h: BIN_ROW.h,
  };
}

export const BOARD_STATION = { x: 348, y: 226, w: 290, h: 216 };
export const WOK_STATION = { x: 654, y: 226, w: 290, h: 216 };
export const GRILL_STATION = { x: 960, y: 226, w: 304, h: 216 };

export const PLATE_COUNTER = { x: 348, y: 466, w: 420, h: 158 };
export const TRASH = { x: 784, y: 466, w: 140, h: 158 };
export const HAND_PANEL = { x: 940, y: 466, w: 324, h: 158 };

export const CHEF_LANE_Y = 668;

export const MUTE_BUTTON = { x: 1212, y: 12, w: 56, h: 40 };
export const PAUSE_BUTTON = { x: 1148, y: 12, w: 56, h: 40 };

export function inside(rect, px, py) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function center(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
