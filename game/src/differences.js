// differences.js — the difference model: what a difference is, where it
// lives, and whether a click lands on one. Hit-testing is O(n) over the
// level's handful of differences, using squared distance so no sqrt runs
// per click. A click counts on EITHER panel: the left panel's x mirrors
// onto the right panel's scene coordinates.
import { LEFT_X, RIGHT_X, PANEL_W, PANEL_H, PANEL_Y } from './config.js';

export class DifferenceSet {
  constructor(defs) {
    // defs: [{ id, x, y, r, label }] in scene coordinates (560x420).
    this.defs = defs.map((d) => ({ ...d, found: false, foundAt: 0 }));
    this.byId = new Map(this.defs.map((d) => [d.id, d]));
  }

  get total() { return this.defs.length; }
  get foundCount() { return this.defs.filter((d) => d.found).length; }
  get remaining() { return this.total - this.foundCount; }
  get done() { return this.remaining === 0; }
  get unfound() { return this.defs.filter((d) => !d.found); }
  get found() { return this.defs.filter((d) => d.found); }

  // Which panel (if any) a stage point falls in, plus scene coordinates.
  static locate(stageX, stageY) {
    if (stageY < PANEL_Y || stageY > PANEL_Y + PANEL_H) return null;
    if (stageX >= LEFT_X && stageX <= LEFT_X + PANEL_W) {
      return { panel: 'left', x: stageX - LEFT_X, y: stageY - PANEL_Y };
    }
    if (stageX >= RIGHT_X && stageX <= RIGHT_X + PANEL_W) {
      return { panel: 'right', x: stageX - RIGHT_X, y: stageY - PANEL_Y };
    }
    return null;
  }

  // Returns the unfound difference hit, or null. Clicking an already
  // found difference is a gentle no-op (not a miss): the player already
  // earned it, and punishing a re-click would feel broken.
  hitAt(sceneX, sceneY) {
    let best = null;
    let bestD2 = Infinity;
    for (const d of this.defs) {
      if (d.found) continue;
      const dx = sceneX - d.x;
      const dy = sceneY - d.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= d.r * d.r && d2 < bestD2) { best = d; bestD2 = d2; }
    }
    return best;
  }

  alreadyFoundAt(sceneX, sceneY) {
    for (const d of this.defs) {
      if (!d.found) continue;
      const dx = sceneX - d.x;
      const dy = sceneY - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) return d;
    }
    return null;
  }

  markFound(def, nowMs) {
    def.found = true;
    def.foundAt = nowMs;
    return def;
  }

  // A fair hint: a random difference the player has not found yet.
  // The caller owns the hint budget; this only picks the target.
  randomUnfound(rand = Math.random) {
    const list = this.unfound;
    if (list.length === 0) return null;
    return list[Math.floor(rand() * list.length)];
  }
}
