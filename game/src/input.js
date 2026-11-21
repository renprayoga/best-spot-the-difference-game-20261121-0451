// input.js — mouse and keyboard, both first-class. The mouse clicks a
// difference; the keyboard drives a crosshair (arrow keys move it,
// Enter/Space clicks where it stands) so the whole game is playable
// without a mouse at all. Buttons are real canvas hit-zones, so mouse
// and keyboard share one code path through the game.
import { STAGE_W, STAGE_H, CROSSHAIR_SPEED, LEFT_X, RIGHT_X, PANEL_W, PANEL_Y, PANEL_H } from './config.js';

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    // Crosshair starts in the middle of the right panel, where the
    // differences live, so keyboard play needs no setup.
    this.cross = { x: RIGHT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2, visible: false };
    this.mouse = { x: -1, y: -1, inside: false };
    this._bind();
  }

  _stagePoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (STAGE_W / rect.width),
      y: (event.clientY - rect.top) * (STAGE_H / rect.height),
    };
  }

  _bind() {
    this.canvas.addEventListener('mousemove', (e) => {
      const p = this._stagePoint(e);
      this.mouse = { ...p, inside: true };
      this.game.onHover(p.x, p.y);
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
      this.game.onHover(-1, -1);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const p = this._stagePoint(e);
      this.game.onPress(p.x, p.y, 'mouse');
    });
    window.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        this.cross.visible = true;
        const d = CROSSHAIR_SPEED * (e.shiftKey ? 3 : 1);
        if (k === 'ArrowLeft') this.cross.x = Math.max(0, this.cross.x - d);
        if (k === 'ArrowRight') this.cross.x = Math.min(STAGE_W, this.cross.x + d);
        if (k === 'ArrowUp') this.cross.y = Math.max(0, this.cross.y - d);
        if (k === 'ArrowDown') this.cross.y = Math.min(STAGE_H, this.cross.y + d);
        this.game.onCrosshair(this.cross.x, this.cross.y);
        return;
      }
      if (k === 'Enter' || k === ' ') {
        // Space scrolls the page by default; the game owns the key.
        e.preventDefault();
        this.cross.visible = true;
        this.game.onPress(this.cross.x, this.cross.y, 'keyboard');
        return;
      }
      this.game.onKey(k);
    });
  }

  // When a level starts, park the crosshair on the right panel again.
  resetCrosshair() {
    this.cross = { x: RIGHT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2, visible: false };
  }
}
