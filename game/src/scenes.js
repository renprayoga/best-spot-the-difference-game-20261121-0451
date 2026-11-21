// scenes.js — the three original scenes, painted procedurally on canvas.
// No images, no copied art: every stall, wave and firefly is drawn here
// from coordinates, so both panels come from one painter and the right
// panel differs only where a difference says so. A difference is a
// branch inside the painter: `changed.has('cat')` means "draw the right
// panel's version". Scene coordinates are 560x420 per panel.
//
// Each scene exports: { name, diffs: [{id,x,y,r,label}], paint(ctx, changed) }

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
}
function poly(ctx, pts, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fill();
}
function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function star(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
function sky(ctx, top, mid, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 560, 420);
}
function ground(ctx, y, fill) { rect(ctx, 0, y, 560, 420 - y, fill); }
function fixedStars(ctx, pts) { for (const [x, y, r] of pts) star(ctx, x, y, r, '#fff6c9'); }
function lantern(ctx, x, y, lit) {
  line(ctx, x, y - 26, x, y - 8, '#3a2a1c', 2);
  ellipse(ctx, x, y, 13, 17, lit ? '#ff9d2e' : '#8a6f4d');
  ellipse(ctx, x, y, 7, 11, lit ? '#ffd97a' : '#6b5636');
  rect(ctx, x - 6, y - 21, 12, 5, '#c98f2e');
  rect(ctx, x - 6, y + 15, 12, 5, '#c98f2e');
  if (lit) { ctx.globalAlpha = 0.25; circle(ctx, x, y, 26, '#ffcf5e'); ctx.globalAlpha = 1; }
}
function cat(ctx, x, y) {
  ellipse(ctx, x, y, 26, 15, '#2e2a33'); // body
  circle(ctx, x + 20, y - 12, 11, '#2e2a33'); // head
  poly(ctx, [[x + 12, y - 18], [x + 15, y - 30], [x + 21, y - 19]], '#2e2a33'); // ears
  poly(ctx, [[x + 24, y - 19], [x + 28, y - 30], [x + 31, y - 18]], '#2e2a33');
  line(ctx, x - 24, y - 4, x - 40, y - 18, '#2e2a33', 5); // tail
  circle(ctx, x + 24, y - 14, 1.6, '#ffd97a'); // eye
}

// ---------------------------------------------------------------- market
const MARKET_DIFFS = [
  { id: 'moon', x: 470, y: 58, r: 28, label: 'the moon turned full' },
  { id: 'cat', x: 118, y: 322, r: 32, label: 'the black cat vanished' },
  { id: 'balloon', x: 505, y: 182, r: 26, label: 'the balloon changed colour' },
  { id: 'lantern', x: 300, y: 96, r: 22, label: 'a hanging lantern is gone' },
  { id: 'awning', x: 148, y: 152, r: 28, label: 'an awning stripe changed colour' },
  { id: 'crate', x: 432, y: 342, r: 30, label: 'an extra crate appeared' },
  { id: 'flower', x: 88, y: 186, r: 22, label: 'the potted flower changed colour' },
];

function paintMarket(ctx, changed) {
  sky(ctx, '#2b1e4f', '#7a3b63', '#e8734a');
  fixedStars(ctx, [[40, 40, 2.5], [120, 26, 2], [210, 48, 2.5], [330, 30, 2], [520, 110, 2], [60, 90, 1.8], [270, 60, 1.8]]);
  // Moon: crescent on the left, full on the right.
  circle(ctx, 470, 58, 26, '#ffeec2');
  if (!changed.has('moon')) { circle(ctx, 480, 52, 22, '#7a3b63'); }
  // Rooftops in the distance.
  poly(ctx, [[0, 210], [70, 150], [140, 210]], '#3a2a55');
  poly(ctx, [[120, 210], [200, 140], [280, 210]], '#33244e');
  poly(ctx, [[420, 210], [500, 155], [560, 210]], '#3a2a55');
  ground(ctx, 210, '#4a3226');
  // Cobblestones.
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      ellipse(ctx, 40 + col * 70 + (row % 2) * 30, 240 + row * 44, 30, 12, row % 2 ? '#5a4030' : '#52402f');
    }
  }
  // String lights across the top.
  ctx.strokeStyle = '#241a10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(280, 78, 560, 20); ctx.stroke();
  const bulbColors = ['#ffd97a', '#ff8a7a', '#8affc1', '#7ac8ff'];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, x = t * 560;
    // The wire is a quadratic from (0,20) to (560,20) via (280,78):
    // its height at t is 20 + 116*t*(1-t); bulbs hang just below it.
    const y = 28 + 116 * t * (1 - t);
    circle(ctx, x, y, 5, bulbColors[i % 4]);
  }
  // Left stall with a striped awning.
  rect(ctx, 60, 210, 180, 12, '#6b4226');
  const stripes = ['#e85d3d', changed.has('awning') ? '#3da35d' : '#f5c86b', '#e85d3d', '#f5c86b', '#e85d3d'];
  stripes.forEach((c, i) => rect(ctx, 60 + i * 36, 168, 36, 42, c));
  poly(ctx, [[60, 168], [240, 168], [228, 150], [72, 150]], '#8a5a34');
  rect(ctx, 70, 222, 160, 66, '#7a4a2e');
  rect(ctx, 70, 222, 160, 8, '#9c6a42');
  circle(ctx, 100, 246, 12, '#d94f3d'); circle(ctx, 140, 246, 12, '#e8a13d');
  circle(ctx, 180, 246, 12, '#7a9e3d'); circle(ctx, 210, 246, 12, '#c94f7a');
  rect(ctx, 96, 262, 8, 22, '#c98f2e'); rect(ctx, 176, 262, 8, 22, '#c98f2e');
  // Flower pot beside the stall.
  poly(ctx, [[70, 196], [106, 196], [100, 214], [76, 214]], '#b5542e');
  circle(ctx, 88, 186, 9, changed.has('flower') ? '#a55eea' : '#ff7ab8');
  circle(ctx, 80, 192, 6, changed.has('flower') ? '#a55eea' : '#ff7ab8');
  circle(ctx, 96, 192, 6, changed.has('flower') ? '#a55eea' : '#ff7ab8');
  // Hanging lantern (missing on the right).
  if (!changed.has('lantern')) lantern(ctx, 300, 96, true);
  // Right stall: crates and jars.
  rect(ctx, 380, 250, 130, 90, '#6b4226');
  rect(ctx, 380, 250, 130, 10, '#8a5a34');
  rect(ctx, 396, 286, 44, 44, '#a8763e'); rect(ctx, 448, 286, 44, 44, '#96683a');
  line(ctx, 396, 286, 440, 330, '#7a5230', 2); line(ctx, 440, 286, 396, 330, '#7a5230', 2);
  // Extra crate appears on the right.
  if (changed.has('crate')) {
    rect(ctx, 408, 300, 44, 44, '#b5854a');
    line(ctx, 408, 300, 452, 344, '#7a5230', 2); line(ctx, 452, 300, 408, 344, '#7a5230', 2);
  }
  circle(ctx, 470, 268, 10, '#7ac8ff'); circle(ctx, 492, 268, 10, '#ffd97a');
  // Balloon drifting over the right stall.
  ellipse(ctx, 505, 182, 16, 20, changed.has('balloon') ? '#2ec4b6' : '#e63946');
  poly(ctx, [[499, 200], [511, 200], [505, 208]], changed.has('balloon') ? '#2ec4b6' : '#e63946');
  line(ctx, 505, 208, 505, 250, '#f7f1e3', 1.5);
  // The black cat on a crate (gone on the right).
  rect(ctx, 84, 330, 70, 34, '#96683a');
  if (!changed.has('cat')) cat(ctx, 118, 322);
  // Paper lanterns strung low on the right.
  lantern(ctx, 540, 250, true);
}

// ---------------------------------------------------------------- harbor
const HARBOR_DIFFS = [
  { id: 'light', x: 280, y: 92, r: 26, label: 'the lighthouse light turned red' },
  { id: 'boat', x: 420, y: 302, r: 32, label: 'the little sailboat is gone' },
  { id: 'gull', x: 150, y: 74, r: 20, label: 'an extra seagull appeared' },
  { id: 'buoy', x: 350, y: 334, r: 22, label: 'the buoy changed colour' },
  { id: 'fish', x: 200, y: 318, r: 24, label: 'the jumping fish is gone' },
  { id: 'window', x: 280, y: 172, r: 18, label: 'the lighthouse window went dark' },
  { id: 'cloud', x: 92, y: 54, r: 28, label: 'an extra cloud appeared' },
  { id: 'rope', x: 480, y: 286, r: 22, label: 'the pier rope is missing' },
  { id: 'flag', x: 452, y: 218, r: 20, label: 'the boat flag changed colour' },
  { id: 'star', x: 520, y: 42, r: 16, label: 'a star appeared' },
];

function gull(ctx, x, y, s) {
  ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 10 * s, y); ctx.stroke();
}

function paintHarbor(ctx, changed) {
  sky(ctx, '#1c2a52', '#e8734a', '#f5a65b');
  if (changed.has('star')) star(ctx, 520, 42, 5, '#fff6c9');
  star(ctx, 60, 36, 3, '#fff6c9'); star(ctx, 200, 30, 2.4, '#fff6c9');
  // Sun low over the sea.
  circle(ctx, 430, 190, 34, '#ffd97a');
  ctx.globalAlpha = 0.35; circle(ctx, 430, 190, 52, '#ffcf5e'); ctx.globalAlpha = 1;
  // Clouds; one extra on the right.
  ellipse(ctx, 200, 60, 52, 14, '#f7d9c4'); ellipse(ctx, 230, 52, 36, 12, '#f7d9c4');
  if (changed.has('cloud')) { ellipse(ctx, 92, 54, 40, 12, '#f7d9c4'); ellipse(ctx, 112, 48, 26, 10, '#f7d9c4'); }
  ellipse(ctx, 470, 90, 44, 11, '#f2c9b8');
  // Seagulls; one extra on the right.
  gull(ctx, 90, 110, 1); gull(ctx, 190, 90, 0.9); gull(ctx, 340, 70, 1.1);
  if (changed.has('gull')) gull(ctx, 150, 74, 1);
  // Sea.
  rect(ctx, 0, 220, 560, 200, '#2b5d7a');
  const wave = (y, c) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= 560; x += 14) { const yy = y + Math.sin(x / 34 + y) * 4; x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); };
  wave(250, '#7ac8e8'); wave(300, '#5aa8cc'); wave(350, '#7ac8e8'); wave(395, '#4a90b8');
  // Sun glitter on the water.
  for (let i = 0; i < 7; i++) rect(ctx, 400 + ((i * 37) % 60) - 30, 232 + i * 22, 46 - i * 3, 4, 'rgba(255,217,122,0.55)');
  // Lighthouse on a rock, left side.
  poly(ctx, [[240, 220], [320, 220], [306, 250], [254, 250]], '#4a4a58');
  poly(ctx, [[258, 92], [302, 92], [296, 220], [264, 220]], '#f7f1e3');
  rect(ctx, 258, 120, 44, 16, '#e63946'); rect(ctx, 260, 168, 40, 16, '#e63946');
  rect(ctx, 268, 62, 24, 30, '#2b2b3a');
  // Lamp room: yellow beam left, red on the right.
  circle(ctx, 280, 92, 12, changed.has('light') ? '#ff4d4d' : '#ffe066');
  ctx.globalAlpha = 0.3;
  poly(ctx, [[292, 86], [470, 60], [470, 118]], changed.has('light') ? '#ff4d4d' : '#ffe066');
  ctx.globalAlpha = 1;
  // Window: lit left, dark right.
  rect(ctx, 272, 164, 16, 16, changed.has('window') ? '#2b2b3a' : '#ffe066');
  // Pier on the right.
  rect(ctx, 440, 250, 120, 14, '#7a5230');
  rect(ctx, 452, 264, 10, 60, '#5a3a20'); rect(ctx, 540, 264, 10, 60, '#5a3a20');
  if (!changed.has('rope')) {
    ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(452, 252); ctx.quadraticCurveTo(496, 292, 540, 252); ctx.stroke();
  }
  // Buoy bobbing in the water.
  ellipse(ctx, 350, 334, 16, 12, changed.has('buoy') ? '#2ec4b6' : '#ff7a2e');
  rect(ctx, 344, 314, 12, 12, changed.has('buoy') ? '#2ec4b6' : '#ff7a2e');
  circle(ctx, 350, 310, 4, '#ffe066');
  // Jumping fish (gone on the right).
  if (!changed.has('fish')) {
    ellipse(ctx, 200, 318, 16, 8, '#9ad1ff');
    poly(ctx, [[214, 318], [226, 310], [226, 326]], '#9ad1ff');
    circle(ctx, 188, 316, 2, '#1c2a52');
    ctx.strokeStyle = '#cfeaff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(200, 330, 12, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  // Little sailboat (gone on the right); a second boat keeps its flag.
  poly(ctx, [[400, 316], [440, 316], [430, 300], [410, 300]], '#8a5a34');
  if (!changed.has('boat')) {
    poly(ctx, [[406, 296], [406, 258], [436, 296]], '#f7f1e3');
    line(ctx, 406, 296, 406, 258, '#5a3a20', 2);
  }
  poly(ctx, [[470, 250], [470, 208], [500, 250]], '#ffe066');
  line(ctx, 470, 250, 470, 208, '#5a3a20', 2);
  poly(ctx, [[470, 208], [496, 214], [470, 222]], changed.has('flag') ? '#2ec4b6' : '#e63946');
}

// ---------------------------------------------------------------- garden
const GARDEN_DIFFS = [
  { id: 'frog', x: 180, y: 330, r: 26, label: 'the frog hopped away' },
  { id: 'mushroom', x: 420, y: 302, r: 22, label: 'the mushroom changed colour' },
  { id: 'firefly', x: 300, y: 118, r: 16, label: 'an extra firefly appeared' },
  { id: 'butterfly', x: 250, y: 180, r: 22, label: 'the butterfly flew away' },
  { id: 'snail', x: 92, y: 350, r: 20, label: 'a snail appeared' },
  { id: 'flower', x: 480, y: 200, r: 22, label: 'the tall flower changed colour' },
  { id: 'birdhouse', x: 350, y: 96, r: 24, label: 'the birdhouse door changed colour' },
  { id: 'ripple', x: 200, y: 286, r: 26, label: 'an extra ripple appeared on the pond' },
  { id: 'stone', x: 500, y: 350, r: 20, label: 'a stepping stone is gone' },
  { id: 'star', x: 60, y: 60, r: 16, label: 'a star went out' },
  { id: 'branch', x: 452, y: 142, r: 24, label: 'an extra branch grew' },
  { id: 'fencelight', x: 140, y: 146, r: 20, label: 'the fence lantern went dark' },
];

function firefly(ctx, x, y) {
  ctx.globalAlpha = 0.3; circle(ctx, x, y, 10, '#d8ff7a'); ctx.globalAlpha = 1;
  circle(ctx, x, y, 3.5, '#eaff8a');
}
function flower(ctx, x, y, petal, stemH = 26) {
  line(ctx, x, y, x, y + stemH, '#3da35d', 3);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    circle(ctx, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, petal);
  }
  circle(ctx, x, y, 5, '#ffe066');
}

function paintGarden(ctx, changed) {
  sky(ctx, '#0e1a3a', '#1c3a5e', '#2a5a4a');
  if (!changed.has('star')) star(ctx, 60, 60, 4, '#fff6c9');
  fixedStars(ctx, [[130, 40, 2.4], [250, 32, 2], [380, 48, 2.4], [500, 70, 2], [320, 70, 1.8], [460, 30, 2.2]]);
  circle(ctx, 480, 60, 24, '#ffeec2');
  circle(ctx, 472, 54, 6, '#e8d9a8'); circle(ctx, 490, 68, 4, '#e8d9a8');
  // Big tree on the right.
  rect(ctx, 470, 150, 26, 190, '#5a3a20');
  circle(ctx, 482, 130, 62, '#2a5a34'); circle(ctx, 440, 160, 44, '#356b40'); circle(ctx, 520, 165, 40, '#2a5a34');
  circle(ctx, 460, 100, 34, '#3d7a48');
  line(ctx, 482, 150, 440, 120, '#5a3a20', 8);
  if (changed.has('branch')) line(ctx, 486, 160, 452, 142, '#5a3a20', 7);
  // Fence across the middle.
  rect(ctx, 0, 210, 560, 8, '#7a5230');
  for (let x = 20; x < 560; x += 52) rect(ctx, x, 188, 10, 52, '#8a6238');
  // Fence lantern: lit left, dark right.
  lantern(ctx, 140, 146, !changed.has('fencelight'));
  // Birdhouse on a post.
  rect(ctx, 344, 130, 8, 80, '#6b4226');
  poly(ctx, [[322, 130], [378, 130], [350, 100]], '#b5542e');
  rect(ctx, 330, 130, 40, 34, '#c98f2e');
  circle(ctx, 350, 148, 9, changed.has('birdhouse') ? '#2ec4b6' : '#5a3a20');
  // Pond.
  ellipse(ctx, 200, 300, 120, 46, '#2b6a8a');
  ellipse(ctx, 200, 296, 104, 36, '#3588ad');
  ctx.strokeStyle = 'rgba(207,234,255,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(170, 296, 34, 8, 0, 0, Math.PI * 2); ctx.stroke();
  if (changed.has('ripple')) {
    ctx.beginPath(); ctx.ellipse(240, 306, 26, 6, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Mushrooms by the pond.
  rect(ctx, 414, 306, 8, 18, '#f7f1e3');
  ellipse(ctx, 418, 304, 18, 10, changed.has('mushroom') ? '#2e6fd8' : '#e63946');
  circle(ctx, 412, 300, 2, '#fff'); circle(ctx, 424, 302, 2, '#fff');
  rect(ctx, 440, 314, 6, 12, '#f7f1e3');
  ellipse(ctx, 443, 312, 12, 7, changed.has('mushroom') ? '#2e6fd8' : '#e63946');
  // Flower bed.
  ground(ctx, 340, '#2a4a2e');
  flower(ctx, 60, 368, '#ff7ab8'); flower(ctx, 120, 374, '#ffd97a'); flower(ctx, 300, 370, '#8affc1');
  flower(ctx, 360, 376, '#ff8a7a');
  // Tall flower: yellow left, pink right.
  line(ctx, 480, 200, 480, 240, '#3da35d', 3);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    circle(ctx, 480 + Math.cos(a) * 9, 200 + Math.sin(a) * 9, 7, changed.has('flower') ? '#ff7ab8' : '#ffd97a');
  }
  circle(ctx, 480, 200, 6, '#ffe066');
  // Frog on a lily pad (gone on the right).
  ellipse(ctx, 180, 336, 34, 10, '#3da35d');
  if (!changed.has('frog')) {
    circle(ctx, 168, 322, 11, '#57b368'); circle(ctx, 192, 322, 11, '#57b368');
    circle(ctx, 168, 320, 3, '#1c2a1c'); circle(ctx, 192, 320, 3, '#1c2a1c');
    ellipse(ctx, 180, 332, 16, 9, '#57b368');
  }
  // Butterfly (gone on the right).
  if (!changed.has('butterfly')) {
    ellipse(ctx, 242, 176, 10, 13, '#b388ff'); ellipse(ctx, 258, 176, 10, 13, '#b388ff');
    ellipse(ctx, 242, 190, 8, 10, '#8a5cf6'); ellipse(ctx, 258, 190, 8, 10, '#8a5cf6');
    line(ctx, 250, 172, 250, 194, '#2b2b3a', 2);
  }
  // Snail appears on the right.
  if (changed.has('snail')) {
    ellipse(ctx, 92, 352, 16, 8, '#d9a066');
    circle(ctx, 96, 342, 11, '#b5542e');
    ctx.strokeStyle = '#f7f1e3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(96, 342, 5, 0.5, Math.PI * 1.6); ctx.stroke();
  }
  // Stepping stones.
  ellipse(ctx, 500, 350, 22, 9, '#8a8a9a');
  if (!changed.has('stone')) ellipse(ctx, 540, 366, 18, 8, '#8a8a9a');
  ellipse(ctx, 440, 372, 20, 8, '#7a7a8a');
  // Fireflies; one extra on the right.
  firefly(ctx, 120, 250); firefly(ctx, 330, 220); firefly(ctx, 420, 180);
  if (changed.has('firefly')) firefly(ctx, 300, 118);
}

// ---------------------------------------------------------------- registry
export const SCENES = {
  market: { name: 'Lantern Market', diffs: MARKET_DIFFS, paint: paintMarket },
  harbor: { name: 'Harbor at Dusk', diffs: HARBOR_DIFFS, paint: paintHarbor },
  garden: { name: 'Midnight Garden', diffs: GARDEN_DIFFS, paint: paintGarden },
};
