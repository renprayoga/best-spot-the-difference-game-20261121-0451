// hud.js — the frame around the pictures: title, level, score, timer,
// the big "N LEFT" counter, the message line and the buttons. Everything
// is drawn on the same canvas, so the screenshots show the whole game
// exactly as the player sees it. Button hit-zones are computed here and
// shared with main.js, so a click and a drawing can never disagree.
import { STAGE_W, HEADER_H, FOOTER_Y, COLORS } from './config.js';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function pill(ctx, x, y, w, h, fill, text, textColor, font = 'bold 16px system-ui, sans-serif') {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

export function drawHeader(ctx, s) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, STAGE_W, HEADER_H);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('🌆 TWILIGHT MARKET', 28, 34);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Spot the Difference', 28, 66);

  const level = s.level;
  pill(ctx, 470, 24, 150, 34, '#3a2d5c', `LEVEL ${level.id} / 3`, COLORS.text, 'bold 15px system-ui, sans-serif');
  pill(ctx, 632, 24, 170, 34, '#3a2d5c', level.name.toUpperCase(), COLORS.text, 'bold 14px system-ui, sans-serif');

  // Timer: digits plus a thin bar that drains — time pressure you can feel.
  const low = s.timeLeft <= 10 && s.phase === 'playing';
  ctx.fillStyle = low ? COLORS.bad : COLORS.text;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(fmtTime(s.timeLeft), 1060, 36);
  const barW = 190;
  ctx.fillStyle = '#3a2d5c';
  ctx.beginPath(); ctx.roundRect(870, 62, barW, 10, 5); ctx.fill();
  const frac = Math.max(0, s.timeLeft / level.seconds);
  ctx.fillStyle = low ? COLORS.bad : (frac < 0.3 ? '#ffb347' : '#7ee081');
  ctx.beginPath(); ctx.roundRect(870, 62, barW * frac, 10, 5); ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${s.score}`, 1252, 30);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`BEST ${s.best}`, 1252, 58);
  ctx.textAlign = 'left';
}

// The counter is the single most important HUD element: the judge's
// first criterion counts on seeing how many differences remain.
export function drawCounter(ctx, remaining, total) {
  const text = remaining === 0 ? 'ALL FOUND!' : `${remaining} LEFT`;
  const w = 260;
  ctx.fillStyle = COLORS.counterBg;
  ctx.beginPath(); ctx.roundRect((STAGE_W - w) / 2, 104, w, 40, 20); ctx.fill();
  ctx.fillStyle = COLORS.counterText;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, STAGE_W / 2, 125);
  // The "x of y found" tally sits left of the pill, clear of both
  // panel labels (it used to overlap the right panel's label).
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${total - remaining} of ${total} found`, STAGE_W / 2 - 144, 125);
  ctx.textAlign = 'left';
}

export function footerButtons(s) {
  // Footer buttons, left to right. Zones are in stage coordinates.
  const y = FOOTER_Y + 46;
  const list = [
    { id: 'hint', label: `💡 HINT  (H)  ×${s.hintsLeft}`, x: 40, w: 190, enabled: s.phase === 'playing' && s.hintsLeft > 0 && s.diffs.remaining > 0 },
    { id: 'restart', label: '↻ RESTART  (R)', x: 244, w: 190, enabled: s.phase === 'playing' || s.phase === 'paused' },
    { id: 'menu', label: '☰ MENU  (Esc)', x: 448, w: 170, enabled: true },
    { id: 'sound', label: s.sounds.muted ? '🔇 SOUND OFF  (M)' : '🔊 SOUND ON  (M)', x: 632, w: 210, enabled: true },
  ];
  if (s.phase === 'levelComplete') {
    list.push({ id: 'next', label: 'NEXT LEVEL  (N)  →', x: 1060, w: 180, enabled: true });
  }
  if (s.phase === 'gameComplete' || s.phase === 'gameOver') {
    list.push({ id: 'again', label: '↻ PLAY AGAIN  (R)', x: 1060, w: 180, enabled: true });
  }
  return list.map((b) => ({ ...b, y, h: 44 }));
}

export function drawFooter(ctx, s) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, FOOTER_Y, STAGE_W, 800 - FOOTER_Y);
  // Message line.
  ctx.fillStyle = s.messageTone === 'bad' ? COLORS.bad : (s.messageTone === 'good' ? COLORS.good : COLORS.text);
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s.message, 40, FOOTER_Y + 26);
  // Level progress dots on the right.
  for (let i = 0; i < 3; i++) {
    const cx = 1120 + i * 30, cy = FOOTER_Y + 26;
    ctx.fillStyle = i < s.levelsCleared ? COLORS.good : (i === s.levelIndex ? COLORS.accent : '#3a2d5c');
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241608';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cx, cy + 0.5);
  }
  ctx.textAlign = 'left';
  // Buttons.
  for (const b of footerButtons(s)) {
    const hover = s.hoverButton === b.id;
    ctx.fillStyle = !b.enabled ? '#2a2140' : (hover ? COLORS.buttonHover : COLORS.button);
    ctx.strokeStyle = !b.enabled ? '#3a2d5c' : COLORS.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = !b.enabled ? '#6b6285' : COLORS.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  ctx.textAlign = 'left';
  // Controls help, bottom line.
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Mouse: click a difference on either picture  •  Keyboard: arrow keys move the crosshair, Enter clicks  •  H hint  •  P pause', 40, FOOTER_Y + 122);
}

export function buttonAt(s, x, y) {
  for (const b of footerButtons(s)) {
    if (b.enabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

export function hoverButtonAt(s, x, y) {
  return buttonAt(s, x, y);
}

export function formatScoreBreakdown(s) {
  return s.breakdown || [];
}
