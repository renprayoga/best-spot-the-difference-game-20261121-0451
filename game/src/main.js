// main.js — the game itself: state machine, loop, scoring, screens.
// Phases: menu → playing ⇄ paused → levelComplete → playing …
// → gameComplete, or playing → gameOver when the clock runs out.
// Every number that matters lives in config.js; every picture lives in
// scenes.js; this file only decides what happens and what to draw.
import {
  STAGE_W, STAGE_H, LEVELS, SCORE, HINTS_PER_LEVEL,
  LEFT_X, RIGHT_X, PANEL_W, PANEL_Y, PANEL_H, FOOTER_Y, COLORS,
} from './config.js';
import { SCENES } from './scenes.js';
import { DifferenceSet } from './differences.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { makePanelCanvases, drawPanels, drawMarkers, drawHintRing, drawMiss, drawCrosshair, dimScreen, card } from './render.js';
import { drawHeader, drawCounter, drawFooter, buttonAt, footerButtons } from './hud.js';
import { readShotParams, applyShot } from './shots.js';

const BEST_KEY = 'twilight-market-best-v1';

export class Game {
  constructor(canvas, statusEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = statusEl;
    this.sounds = new SoundBank();
    this.input = new Input(canvas, this);
    this.best = 0;
    try { this.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch { /* private mode */ }
    this.phase = 'menu';
    this.levelIndex = 0;
    this.scene = SCENES[this.level.scene];
    this.diffs = new DifferenceSet(this.scene.diffs);
    this.panels = makePanelCanvases(this.scene);
    this.thumbs = null; // menu thumbnails, built lazily
    this.score = 0;
    this.streak = 0;
    this.timeLeft = this.level.seconds;
    this.frozen = false; // screenshots freeze the clock
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hintTarget = null;
    this.hintAt = 0;
    this.miss = null;
    this.message = 'Find every difference — click it on either picture.';
    this.messageTone = '';
    this.hoverButton = null;
    this.levelsCleared = 0;
    this.levelFinds = 0;
    this.levelWrong = 0;
    this.levelPoints = 0;
    this.breakdown = [];
    this.stars = 0;
    this.lastTickSecond = -1;
    this.lastFrame = 0;
    this.menuCards = [];
    this._saveBest = () => {
      if (this.score > this.best) {
        this.best = this.score;
        try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* ignore */ }
      }
    };
    this.setStatus(this.message);
  }

  // ------------------------------------------------------------ state
  get level() { return LEVELS[this.levelIndex]; }

  toMenu(levelNumber = 1) {
    this.phase = 'menu';
    this.levelIndex = levelNumber - 1;
    this.scene = SCENES[this.level.scene];
    this.diffs = new DifferenceSet(this.scene.diffs);
    this.panels = makePanelCanvases(this.scene);
    this.setMessage('Pick a scene — each hides 7 to 12 differences.');
  }

  startLevel(n, { freezeTimer = false } = {}) {
    this.levelIndex = n - 1;
    this.scene = SCENES[this.level.scene];
    this.diffs = new DifferenceSet(this.scene.diffs);
    this.panels = makePanelCanvases(this.scene);
    this.timeLeft = this.level.seconds;
    this.frozen = freezeTimer;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hintTarget = null;
    this.miss = null;
    this.streak = 0;
    this.levelFinds = 0;
    this.levelWrong = 0;
    this.levelPoints = 0;
    this.lastTickSecond = -1;
    this.input.resetCrosshair();
    this.phase = 'playing';
    this.setMessage(`Level ${this.level.id}: ${this.level.name} — ${this.diffs.total} differences hiding. Good hunting!`);
  }

  restartLevel() {
    this.startLevel(this.levelIndex + 1);
  }

  finishLevel({ silent = false } = {}) {
    const timeBonus = Math.ceil(Math.max(0, this.timeLeft)) * SCORE.timeBonusPerSecond;
    const perfect = this.levelWrong === 0 ? SCORE.perfectBonus : 0;
    this.score += timeBonus + perfect;
    this.breakdown = [
      `Finds: ${this.levelFinds} × ${SCORE.find} = ${this.levelPoints} pts`,
      `Time bonus: ${Math.ceil(Math.max(0, this.timeLeft))}s × ${SCORE.timeBonusPerSecond} = ${timeBonus} pts`,
      perfect ? `Perfect round (no misses): +${perfect} pts` : 'Perfect round: — (a miss cost it)',
      `Level total: ${this.levelPoints + timeBonus + perfect} pts`,
    ];
    const timeFrac = this.timeLeft / this.level.seconds;
    this.stars = this.levelWrong === 0 && timeFrac >= 0.5 ? 3 : (timeFrac >= 0.25 ? 2 : 1);
    this.levelsCleared = Math.max(this.levelsCleared, this.levelIndex + 1);
    this._saveBest();
    this.hintTarget = null;
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.phase = 'gameComplete';
      this.setMessage('You found every difference in every scene!');
      if (!silent) this.sounds.play('gameWin');
    } else {
      this.phase = 'levelComplete';
      this.setMessage(`Scene complete — ${this.stars} star${this.stars > 1 ? 's' : ''}!`);
      if (!silent) this.sounds.play('levelWin');
    }
  }

  gameOver() {
    this.phase = 'gameOver';
    this.timeLeft = 0;
    this._saveBest();
    this.setMessage(`Time's up — ${this.diffs.remaining} difference${this.diffs.remaining === 1 ? '' : 's'} still hiding.`);
    this.sounds.play('gameOver');
  }

  // ------------------------------------------------------------ actions
  useHint() {
    if (this.phase !== 'playing' || this.hintsLeft <= 0 || this.diffs.remaining === 0) return;
    const target = this.diffs.randomUnfound();
    if (!target) return;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - SCORE.hintCost);
    this.hintTarget = target;
    this.hintAt = performance.now();
    this.sounds.play('hint');
    this.setMessage(`Hint: something near “${target.label}”… (−${SCORE.hintCost} pts)`);
  }

  pressAt(x, y) {
    const hit = DifferenceSet.locate(x, y);
    if (!hit) return false; // clicked the gap, the header, the footer
    const found = this.diffs.hitAt(hit.x, hit.y);
    if (found) {
      this.diffs.markFound(found, performance.now());
      this.levelFinds += 1;
      this.streak += 1;
      const combo = Math.min(SCORE.comboCap, 1 + (this.streak - 1) * SCORE.comboStep);
      const pts = Math.round(SCORE.find * combo);
      this.score += pts;
      this.levelPoints += pts;
      if (this.hintTarget === found) this.hintTarget = null;
      this.sounds.play('find');
      const left = this.diffs.remaining;
      this.setMessage(
        left === 0 ? 'That was the last one!' :
        `Found it — ${found.label}! ${left} more to go. (+${pts} pts${this.streak > 1 ? `, combo ×${combo.toFixed(1)}` : ''})`,
        'good',
      );
      if (this.diffs.done) this.finishLevel();
      return true;
    }
    if (this.diffs.alreadyFoundAt(hit.x, hit.y)) {
      this.setMessage('Already found — that one is circled. Look elsewhere!');
      return true; // not a miss: re-clicking a found difference is free
    }
    // A genuine miss: points and time, and the combo resets.
    this.levelWrong += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score + SCORE.wrongClick);
    if (!this.frozen) this.timeLeft = Math.max(0, this.timeLeft - SCORE.wrongTime);
    this.miss = { x, y, at: performance.now() };
    this.sounds.play('wrong');
    this.setMessage(`Not quite — nothing hides there. (−${-SCORE.wrongClick} pts, −${SCORE.wrongTime}s)`, 'bad');
    return true;
  }

  onPress(x, y, _via) {
    this.sounds.unlock();
    // Footer buttons always win over the pictures.
    const btn = buttonAt(this, x, y);
    if (btn) { this.clickButton(btn); return; }
    if (this.phase === 'menu') {
      for (const c of this.menuCards) {
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
          this.sounds.play('click');
          this.startLevel(c.level);
          return;
        }
      }
      return;
    }
    if (this.phase === 'paused') { this.phase = 'playing'; this.setMessage('Back to the hunt!'); return; }
    if (this.phase === 'levelComplete' || this.phase === 'gameComplete' || this.phase === 'gameOver') return;
    if (this.phase === 'playing') this.pressAt(x, y);
  }

  clickButton(id) {
    this.sounds.unlock();
    switch (id) {
      case 'hint': this.useHint(); break;
      case 'restart':
        if (this.phase === 'gameComplete' || this.phase === 'gameOver') this.startLevel(1);
        else this.restartLevel();
        this.sounds.play('click');
        break;
      case 'menu': this.toMenu(); this.sounds.play('click'); break;
      case 'sound': this.sounds.toggleMute(); this.sounds.play('click'); break;
      case 'next': this.startLevel(this.levelIndex + 2); this.sounds.play('click'); break;
      case 'again': this.startLevel(1); this.sounds.play('click'); break;
      default: break;
    }
  }

  onHover(x, y) {
    this.hoverButton = buttonAt(this, x, y);
    this.canvas.style.cursor = this.hoverButton ? 'pointer' : 'default';
  }

  onCrosshair() { /* crosshair position lives in Input; drawn each frame */ }

  onKey(k) {
    this.sounds.unlock();
    const lower = k.toLowerCase();
    if (lower === 'm') { this.sounds.toggleMute(); return; }
    if (this.phase === 'menu') {
      if (k >= '1' && k <= '3') this.startLevel(Number(k));
      return;
    }
    if (lower === 'p' || k === 'Escape') {
      if (this.phase === 'playing') { this.phase = 'paused'; this.setMessage('Paused — press P or click to carry on.'); }
      else if (this.phase === 'paused') { this.phase = 'playing'; this.setMessage('Back to the hunt!'); }
      else if (this.phase === 'levelComplete' || this.phase === 'gameComplete' || this.phase === 'gameOver') this.toMenu();
      return;
    }
    if (lower === 'h') { this.useHint(); return; }
    if (lower === 'r') {
      if (this.phase === 'playing' || this.phase === 'paused') this.restartLevel();
      else if (this.phase === 'gameComplete' || this.phase === 'gameOver') this.startLevel(1);
      return;
    }
    if (lower === 'n' && this.phase === 'levelComplete') { this.startLevel(this.levelIndex + 2); }
  }

  setMessage(text, tone = '') {
    this.message = text;
    this.messageTone = tone;
    this.setStatus(text);
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  // ------------------------------------------------------------ loop
  frame(nowMs) {
    const dt = this.lastFrame ? (nowMs - this.lastFrame) / 1000 : 0;
    this.lastFrame = nowMs;
    if (this.phase === 'playing' && !this.frozen) {
      this.timeLeft -= dt;
      const sec = Math.ceil(this.timeLeft);
      if (this.timeLeft <= 10 && sec !== this.lastTickSecond && this.timeLeft > 0) {
        this.lastTickSecond = sec;
        this.sounds.play('tick');
      }
      if (this.timeLeft <= 0) { this.gameOver(); }
    }
    if (this.hintTarget && nowMs - this.hintAt > 8000) this.hintTarget = null;
    this.render(nowMs);
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    const shot = readShotParams();
    if (shot) applyShot(this, shot);
    requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------ render
  render(nowMs) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    drawHeader(ctx, this);
    if (this.phase === 'menu') { this.renderMenu(ctx); return; }
    drawCounter(ctx, this.diffs.remaining, this.diffs.total);
    drawPanels(ctx, this.panels);
    drawMarkers(ctx, this.diffs, nowMs);
    drawHintRing(ctx, this.hintTarget, nowMs);
    drawMiss(ctx, this.miss, nowMs);
    drawCrosshair(ctx, this.input.cross);
    drawFooter(ctx, this);
    if (this.phase === 'paused') this.renderPaused(ctx);
    if (this.phase === 'levelComplete') this.renderLevelComplete(ctx);
    if (this.phase === 'gameComplete') this.renderGameComplete(ctx);
    if (this.phase === 'gameOver') this.renderGameOver(ctx);
  }

  renderMenu(ctx) {
    // The first scene's pictures show behind the menu card.
    drawPanels(ctx, this.panels);
    dimScreen(ctx);
    const cx = 190, cy = 120, cw = 900, ch = 560;
    card(ctx, cx, cy, cw, ch);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌆 TWILIGHT MARKET', 640, cy + 62);
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('SPOT THE DIFFERENCE', 640, cy + 98);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('Two pictures, side by side — almost the same. Find what changed.', 640, cy + 132);
    ctx.fillText('Click a difference on either picture. Wrong clicks cost points and time.', 640, cy + 158);
    // Level cards with a live thumbnail of each scene.
    if (!this.thumbs) {
      this.thumbs = LEVELS.map((l) => makePanelCanvases(SCENES[l.scene]));
    }
    this.menuCards = [];
    LEVELS.forEach((l, i) => {
      const x = cx + 40 + i * 286, y = cy + 190, w = 266, h = 210;
      this.menuCards.push({ level: l.id, x, y, w, h });
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
      ctx.drawImage(this.thumbs[i].left, x, y, w, (w / PANEL_W) * PANEL_H);
      ctx.restore();
      ctx.strokeStyle = COLORS.panelBorder; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke();
      ctx.fillStyle = 'rgba(12, 8, 24, 0.55)';
      ctx.fillRect(x, y + h - 64, w, 64);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText(`${l.id}. ${l.name}`, x + w / 2, y + h - 38);
      ctx.fillStyle = COLORS.muted;
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`${l.diffs} differences  •  ${Math.floor(l.seconds / 60)}:${String(l.seconds % 60).padStart(2, '0')}`, x + w / 2, y + h - 14);
    });
    ctx.fillStyle = COLORS.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Click a scene, or press 1 / 2 / 3  •  H hint  •  P pause  •  M sound', 640, cy + 438);
    ctx.fillText(`Best score: ${this.best}`, 640, cy + 466);
    ctx.textAlign = 'left';
    drawFooter(ctx, this);
  }

  renderPaused(ctx) {
    dimScreen(ctx);
    card(ctx, 440, 300, 400, 200);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 380);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press P or click anywhere to carry on.', 640, 424);
    ctx.fillText('Esc returns to the menu.', 640, 452);
    ctx.textAlign = 'left';
  }

  renderLevelComplete(ctx) {
    dimScreen(ctx);
    card(ctx, 340, 190, 600, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.good;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('SCENE COMPLETE!', 640, 248);
    ctx.font = '40px system-ui, sans-serif';
    ctx.fillText('★'.repeat(this.stars) + '☆'.repeat(3 - this.stars), 640, 306);
    ctx.fillStyle = COLORS.text;
    ctx.font = '17px system-ui, sans-serif';
    this.breakdown.forEach((line, i) => ctx.fillText(line, 640, 344 + i * 28));
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`TOTAL SCORE  ${this.score}`, 640, 344 + this.breakdown.length * 28 + 12);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Press N or click NEXT LEVEL to carry on.', 640, 344 + this.breakdown.length * 28 + 48);
    ctx.textAlign = 'left';
  }

  renderGameComplete(ctx) {
    dimScreen(ctx);
    card(ctx, 340, 190, 600, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('YOU FOUND THEM ALL!', 640, 248);
    ctx.font = '40px system-ui, sans-serif';
    ctx.fillText('🏆', 640, 306);
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Every difference in all three scenes —', 640, 344);
    ctx.fillText('Lantern Market, Harbor at Dusk, Midnight Garden.', 640, 372);
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`FINAL SCORE  ${this.score}`, 640, 420);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Best score: ${this.best}  •  Press R or PLAY AGAIN for another round.`, 640, 462);
    ctx.textAlign = 'left';
  }

  renderGameOver(ctx) {
    dimScreen(ctx);
    card(ctx, 340, 190, 600, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.bad;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText("TIME'S UP!", 640, 248);
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`${this.diffs.remaining} difference${this.diffs.remaining === 1 ? ' was' : 's were'} still hiding in ${this.level.name}.`, 640, 300);
    ctx.fillText(`You found ${this.diffs.foundCount} of ${this.diffs.total} — so close!`, 640, 330);
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${this.score}`, 640, 384);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Press R or PLAY AGAIN to try the scene once more.', 640, 430);
    ctx.textAlign = 'left';
  }
}

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const game = new Game(canvas, statusEl);
// Exposed for play-testing from the console / automation: window.__game.
window.__game = game;
game.start();
