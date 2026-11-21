// The three museum floors, written as plain data: walls and cover that block
// sight and footsteps, warm pools of lamplight, patrol routes a patient thief
// can learn, and where the Moon Pearl sleeps. Coordinates are in the 1280x720
// logical view; the top strip is reserved for the HUD.

const BORDER = [
  { x: 0, y: 64, w: 1280, h: 24 },
  { x: 0, y: 696, w: 1280, h: 24 },
  { x: 0, y: 64, w: 24, h: 656 },
  { x: 1256, y: 64, w: 24, h: 656 },
];

function statue(x, y) {
  return { x, y, w: 58, h: 58, kind: 'statue' };
}
function vitrine(x, y, w = 96, h = 40) {
  return { x, y, w, h, kind: 'vitrine' };
}
function crate(x, y) {
  return { x, y, w: 52, h: 52, kind: 'crate' };
}
function hedge(x, y, w, h) {
  return { x, y, w, h, kind: 'hedge' };
}

export const LEVELS = [
  {
    name: 'Gallery of Statues',
    objective: 'Steal the Moon Pearl, then slip out the green exit.',
    parSeconds: 75,
    pebbles: 3,
    start: { x: 96, y: 616 },
    pearl: { x: 640, y: 330 },
    exit: { x: 1148, y: 586, w: 88, h: 84 },
    walls: [...BORDER, { x: 480, y: 150, w: 26, h: 150 }, { x: 760, y: 430, w: 26, h: 150 }],
    cover: [
      statue(296, 238), statue(820, 296), statue(408, 478), statue(958, 462),
      vitrine(560, 196), vitrine(190, 404), crate(1050, 168), crate(150, 150),
    ],
    lights: [
      { x: 410, y: 300, r: 175 }, { x: 890, y: 250, r: 175 }, { x: 640, y: 530, r: 155 },
    ],
    guards: [
      { waypoints: [{ x: 260, y: 196, pause: 1.4 }, { x: 1010, y: 196 }, { x: 1010, y: 416, pause: 1.4 }, { x: 260, y: 416 }] },
      { waypoints: [{ x: 1120, y: 636 }, { x: 620, y: 636, pause: 1.2 }, { x: 620, y: 150 }] },
    ],
    cameras: [],
    signs: [
      { x: 120, y: 560, text: 'Stay out of the light' },
      { x: 120, y: 586, text: 'Hold Shift to sneak' },
      { x: 300, y: 640, text: 'Click: throw a pebble' },
    ],
  },
  {
    name: 'Vault Corridor',
    objective: 'Four guards, one pearl. The shadowed gaps are slower — and safer.',
    parSeconds: 110,
    pebbles: 4,
    start: { x: 84, y: 388 },
    pearl: { x: 640, y: 362 },
    exit: { x: 1158, y: 318, w: 82, h: 96 },
    walls: [
      ...BORDER,
      { x: 270, y: 252, w: 500, h: 26 },
      { x: 520, y: 462, w: 500, h: 26 },
      { x: 270, y: 252, w: 26, h: 150 },
      { x: 994, y: 336, w: 26, h: 152 },
    ],
    cover: [
      vitrine(430, 340), vitrine(770, 340), vitrine(600, 556), vitrine(340, 150),
      statue(880, 150), statue(180, 540), crate(1080, 520), crate(140, 150),
    ],
    lights: [
      { x: 300, y: 170, r: 150 }, { x: 640, y: 362, r: 165 }, { x: 980, y: 170, r: 150 },
      { x: 420, y: 580, r: 150 }, { x: 1060, y: 580, r: 150 },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 170 }, { x: 1080, y: 170, pause: 1.2 }] },
      { waypoints: [{ x: 1080, y: 580 }, { x: 200, y: 580, pause: 1.2 }] },
      { waypoints: [{ x: 380, y: 320 }, { x: 900, y: 320 }, { x: 900, y: 420, pause: 1.0 }, { x: 380, y: 420 }] },
      { waypoints: [{ x: 640, y: 130 }, { x: 640, y: 620, pause: 1.4 }] },
    ],
    cameras: [],
    signs: [{ x: 84, y: 470, text: 'Pebbles turn heads' }],
  },
  {
    name: 'Rooftop Garden',
    objective: 'Hedges hide you from guards — cameras cannot be distracted.',
    parSeconds: 120,
    pebbles: 4,
    start: { x: 96, y: 636 },
    pearl: { x: 640, y: 156 },
    exit: { x: 1136, y: 592, w: 96, h: 82 },
    walls: [...BORDER],
    cover: [
      hedge(250, 200, 220, 34), hedge(560, 300, 34, 220), hedge(700, 200, 260, 34),
      hedge(300, 440, 34, 200), hedge(640, 470, 300, 34), hedge(980, 330, 34, 200),
      hedge(120, 300, 34, 140), hedge(820, 120, 34, 120),
    ],
    lights: [
      { x: 640, y: 156, r: 150 }, { x: 350, y: 560, r: 150 }, { x: 1050, y: 260, r: 150 },
    ],
    guards: [
      { waypoints: [{ x: 180, y: 150 }, { x: 1120, y: 150, pause: 1.2 }] },
      { waypoints: [{ x: 480, y: 640 }, { x: 480, y: 380 }, { x: 880, y: 380, pause: 1.0 }, { x: 880, y: 640 }] },
      { waypoints: [{ x: 1120, y: 640 }, { x: 1120, y: 440 }, { x: 760, y: 440 }] },
    ],
    cameras: [
      { x: 430, y: 116, baseAngle: Math.PI / 2, sweep: 0.85 },
      { x: 900, y: 432, baseAngle: -Math.PI / 2, sweep: 0.85 },
    ],
    signs: [{ x: 96, y: 560, text: 'Blue cones sweep — time them' }],
  },
];

export function levelSolids(level) {
  return [...level.walls, ...level.cover];
}
