// render.js — paints the two pictures and everything that sits on them.
// The scene is painted ONCE per level into two offscreen canvases (left =
// original, right = changed); every frame only blits them and draws the
// markers, hint ring and crosshair on top. That keeps the frame cheap
// and the screenshots pixel-identical between runs.
import { PANEL_W, PANEL_H, PANEL_Y, LEFT_X, RIGHT_X, COLORS, MARKER_RING_MS, HINT_PULSE_MS } from './config.js';

export function makePanelCanvases(scene) {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = PANEL_W; c.height = PANEL_H;
    return c;
  };
  const left = mk();
  const right = mk();
  scene.paint(left.getContext('2d'), new Set());
  scene.paint(right.getContext('2d'), new Set(scene.diffs.map((d) => d.id)));
  return { left, right };
}

function panelLabel(ctx, x, text) {
  // A small chip inside the top-left corner of the picture, so the label
  // never collides with the counter pill above the panels.
  ctx.font = 'bold 14px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = 'rgba(12, 8, 24, 0.62)';
  ctx.beginPath(); ctx.roundRect(x + 10, PANEL_Y + 10, w, 26, 13); ctx.fill();
  ctx.fillStyle = COLORS.panelLabel;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 20, PANEL_Y + 24);
}

export function drawPanels(ctx, panels) {
  for (const [x, img] of [[LEFT_X, panels.left], [RIGHT_X, panels.right]]) {
    ctx.drawImage(img, x, PANEL_Y);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 1.5, PANEL_Y - 1.5, PANEL_W + 3, PANEL_H + 3);
  }
  // Labels after the pictures: they sit on top of the panels, not under.
  panelLabel(ctx, LEFT_X, 'ORIGINAL');
  panelLabel(ctx, RIGHT_X, 'FIND THE DIFFERENCES');
}

// A found difference gets the same marker on BOTH panels: a glowing ring
// that pops in, then settles, with its find number in the middle.
export function drawMarkers(ctx, diffs, nowMs) {
  for (const d of diffs.found) {
    const age = Math.min(1, (nowMs - d.foundAt) / MARKER_RING_MS);
    const pop = 1 + 0.6 * (1 - age); // starts big, shrinks into place
    const r = d.r * pop;
    const idx = diffs.found.indexOf(d) + 1;
    for (const px of [LEFT_X, RIGHT_X]) {
      const cx = px + d.x, cy = PANEL_Y + d.y;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * age;
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff9d2e'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath(); ctx.arc(cx, cy - r - 2, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#241608';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(idx), cx, cy - r - 1);
    }
  }
}

// The hint ring pulses around one difference the player has not found.
export function drawHintRing(ctx, hint, nowMs) {
  if (!hint) return;
  const pulse = 0.5 + 0.5 * Math.sin((nowMs / HINT_PULSE_MS) * Math.PI * 2);
  const r = hint.r + 4 + pulse * 7;
  for (const px of [LEFT_X, RIGHT_X]) {
    const cx = px + hint.x, cy = PANEL_Y + hint.y;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.4 * pulse;
    ctx.strokeStyle = '#7ac8ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// A miss leaves a brief red X where the player clicked.
export function drawMiss(ctx, miss, nowMs) {
  if (!miss) return;
  const age = (nowMs - miss.at) / 600;
  if (age >= 1) return;
  const s = 12;
  ctx.save();
  ctx.globalAlpha = 1 - age;
  ctx.strokeStyle = COLORS.bad;
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(miss.x - s, miss.y - s); ctx.lineTo(miss.x + s, miss.y + s);
  ctx.moveTo(miss.x + s, miss.y - s); ctx.lineTo(miss.x - s, miss.y + s);
  ctx.stroke();
  ctx.restore();
}

// Keyboard crosshair: a small ring with ticks, so keyboard players can
// see exactly where Enter will click.
export function drawCrosshair(ctx, cross) {
  if (!cross.visible) return;
  const { x, y } = cross;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 18, y); ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y); ctx.lineTo(x + 18, y);
  ctx.moveTo(x, y - 18); ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 18);
  ctx.stroke();
  ctx.restore();
}

export function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(12, 8, 24, 0.72)';
  ctx.fillRect(0, 0, 1280, 800);
}

export function card(ctx, x, y, w, h) {
  ctx.fillStyle = '#241c3d';
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill(); ctx.stroke();
}
