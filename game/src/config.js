// config.js — one place for every number the game tunes by.
// Twilight Market: Spot the Difference. Canvas is a fixed 1280x800 stage
// scaled by CSS, so screenshots and hit-testing always agree.
export const STAGE_W = 1280;
export const STAGE_H = 800;

// The two picture panels: same size, side by side, with a gap in the middle.
export const PANEL_W = 560;
export const PANEL_H = 420;
export const PANEL_Y = 150;
export const LEFT_X = 40;
export const RIGHT_X = 680;
export const GAP_X = 40; // LEFT_X + PANEL_W + GAP_X === RIGHT_X

// Header / footer bands.
export const HEADER_H = 96;
export const COUNTER_Y = 104; // big "N LEFT" pill band
export const FOOTER_Y = 592;

export const LEVELS = [
  { id: 1, name: 'Lantern Market', scene: 'market', diffs: 7, seconds: 120, par: 45 },
  { id: 2, name: 'Harbor at Dusk', scene: 'harbor', diffs: 10, seconds: 150, par: 60 },
  { id: 3, name: 'Midnight Garden', scene: 'garden', diffs: 12, seconds: 180, par: 75 },
];

export const SCORE = {
  find: 100, // base points per difference found
  comboStep: 0.1, // +10% per consecutive find, capped below
  comboCap: 2.0,
  wrongClick: -25, // points lost on a miss
  wrongTime: 3, // seconds lost on a miss
  hintCost: 50, // points lost per hint
  timeBonusPerSecond: 5, // leftover seconds at level end
  perfectBonus: 250, // no wrong clicks in the level
};

export const HINTS_PER_LEVEL = 3;
export const CROSSHAIR_SPEED = 14; // px per arrow-key press
export const MARKER_RING_MS = 450; // ring pop-in animation length
export const HINT_PULSE_MS = 900; // hint ring pulse period

export const COLORS = {
  bg: '#171226',
  header: '#221a38',
  panelBorder: '#f5c86b',
  panelLabel: '#ffe9b0',
  counterBg: '#f5c86b',
  counterText: '#241608',
  accent: '#ffb347',
  good: '#7ee081',
  bad: '#ff6b6b',
  text: '#f7f1e3',
  muted: '#b9aecb',
  button: '#3a2d5c',
  buttonHover: '#4c3a78',
};

// A difference the player has not found yet is never drawn differently
// on the left panel; the right panel is the one that changes. Every
// difference is a circle in scene coordinates (560x420 per panel).
export function scenePoint(panel, x, y) {
  return { x: panel === 'left' ? LEFT_X + x : RIGHT_X + x, y: PANEL_Y + y };
}
