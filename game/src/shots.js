// shots.js — deterministic screenshot states, driven by the URL query:
//   ?shot=start    menu, with the first scene's panels on show
//   ?shot=play     mid-play: 4 of 10 found, markers on, 6 left, timer 1:36
//   ?shot=hint     a hint ring pulsing on an unfound difference
//   ?shot=complete level-complete screen with stars and score breakdown
//   &level=N picks the scene (default 2 for play, 3 for hint, 1 for complete).
// The timer is frozen in every shot so the render is identical each run.
// Screenshots are real renders of the game's own code — this only sets
// the game state, it never draws anything itself.
export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  const level = Math.min(3, Math.max(1, Number(q.get('level') || (shot === 'play' ? 2 : shot === 'hint' ? 3 : 1))));
  return { shot, level };
}

export function applyShot(game, { shot, level }) {
  game.sounds.muted = true; // screenshots need no audio
  if (shot === 'start') {
    game.toMenu(level);
    return;
  }
  if (shot === 'play') {
    game.startLevel(level, { freezeTimer: true });
    // Find the first four differences, in scene order, as if played.
    const defs = game.diffs.defs.slice(0, 4);
    defs.forEach((d, i) => game.diffs.markFound(d, 1000 + i * 100));
    game.score = 480;
    game.streak = 2;
    game.timeLeft = 96;
    game.message = 'Nice! Found the lighthouse light — 6 more to go.';
    game.messageTone = 'good';
    return;
  }
  if (shot === 'hint') {
    game.startLevel(level, { freezeTimer: true });
    const defs = game.diffs.defs.slice(0, 2);
    defs.forEach((d, i) => game.diffs.markFound(d, 1000 + i * 100));
    game.score = 210;
    game.timeLeft = 121;
    game.hintsLeft = 2;
    // First unfound difference is the firefly: a clear spot of dark sky,
    // so the pulsing hint ring reads at a glance.
    game.hintTarget = game.diffs.randomUnfound(() => 0.05);
    game.message = 'Hint: look near the pond…';
    game.messageTone = '';
    return;
  }
  if (shot === 'complete') {
    game.startLevel(level, { freezeTimer: true });
    game.diffs.defs.forEach((d, i) => game.diffs.markFound(d, 1000 + i * 100));
    // The shot marks finds directly, so set the level tallies by hand to
    // match: 7 finds at 100 pts, no combo extras, so the breakdown adds up.
    game.levelFinds = game.diffs.total;
    game.levelPoints = game.diffs.total * 100;
    game.score = game.levelPoints;
    game.timeLeft = 63;
    game.finishLevel({ silent: true });
    return;
  }
}
