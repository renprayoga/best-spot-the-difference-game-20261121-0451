# Twilight Market — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/renprayoga/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/renprayoga/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Twilight Market** is an original spot-the-difference game that runs
offline in a desktop browser from static files — no network requests,
no libraries, no build step. Two near-identical pictures stand side by
side; click every difference on either picture before the clock runs out.

Three hand-painted scenes (all drawn procedurally on canvas, nothing
copied): **Lantern Market** (7 differences, 2:00), **Harbor at Dusk**
(10 differences, 2:30), and **Midnight Garden** (12 differences, 3:00).
Each find earns a glowing numbered ring on both pictures; a big counter
shows how many are left. Hints (3 per scene), a combo bonus for
consecutive finds, a time bonus and a perfect-round bonus, stars per
scene, and synthesized WebAudio sounds (no audio files). Playable with
mouse **and** keyboard: arrow keys move a crosshair, Enter clicks,
H hints, P pauses, M mutes, R restarts.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` directly from any static file server. The
hand-in program is `main.ts` (Node 22): it copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json`.

## Screenshots

`1-play.jpg` — mid-game on Harbor at Dusk: 4 found, 6 left.
`2-start.jpg` — the menu with all three scenes.
`3-hint.jpg` — a hint ring pulsing on an unfound firefly.
`4-complete.jpg` — Lantern Market finished: 3 stars, score breakdown.

## Layout

- `game/src/config.js` — sizes, timings, scoring, colours
- `game/src/scenes.js` — the three scenes and their difference tables
- `game/src/differences.js` — difference model and hit-testing
- `game/src/render.js` — panels, markers, hint ring, overlays
- `game/src/hud.js` — header, counter, footer, buttons
- `game/src/input.js` — mouse + keyboard (crosshair)
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `game/src/main.js` — state machine, loop, scoring, screens

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash prizes.</sub>
