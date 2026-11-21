// Every tuning number and colour for Lantern Thief lives here, so the rest of
// the game reads like a story instead of a pile of magic numbers.

export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'lantern-thief-best-rank';

export const PLAYER_TUNING = {
  radius: 13,
  walkSpeed: 172,
  sneakSpeed: 96,
  walkNoiseRadius: 72,
  pebbleRange: 262,
  pebbleHearRadius: 185,
};

export const GUARD_TUNING = {
  radius: 14,
  patrolSpeed: 74,
  investigateSpeed: 104,
  chaseSpeed: 158,
  visionRange: 232,
  visionHalfAngle: 0.61, // radians, about 35 degrees each way
  coneRays: 30,
  meterDecay: 18,
  suspiciousAt: 35,
  chaseAt: 100,
  catchDistance: 25,
  closeAlarmDistance: 82,
  closeAlarmSeconds: 0.5,
};

export const CAMERA_TUNING = {
  visionRange: 246,
  visionHalfAngle: 0.42,
  coneRays: 22,
  sweepSpeed: 0.55,
  meterRateScale: 0.5,
};

export const DETECTION = {
  baseFill: 58,
  litFactor: 1.5,
  shadowFactor: 0.6,
  sneakFactor: 0.55,
};

export const PALETTE = {
  floor: '#232c3d',
  floorTile: '#273248',
  wall: '#10151f',
  wallEdge: '#3d4c68',
  cover: '#2e3a52',
  coverEdge: '#8fa3c4',
  hedge: '#1d3a2a',
  hedgeEdge: '#4d8a63',
  litCore: 'rgba(255, 196, 110, 0.34)',
  litEdge: 'rgba(255, 196, 110, 0)',
  guardBody: '#e04a3a',
  guardCap: '#7e1f16',
  coneCalm: 'rgba(255, 214, 64, 0.30)',
  coneSuspicious: 'rgba(255, 140, 40, 0.38)',
  coneChase: 'rgba(255, 60, 48, 0.42)',
  coneCamera: 'rgba(80, 170, 255, 0.30)',
  playerBody: '#2dd4bf',
  playerCloak: '#0f766e',
  lantern: '#ffd166',
  pearl: '#e8f4ff',
  pearlGlow: 'rgba(150, 200, 255, 0.55)',
  exit: '#22c55e',
  exitDim: '#14532d',
  text: '#e7edf7',
  textDim: '#9fb0c9',
  hudBar: 'rgba(10, 14, 22, 0.82)',
  sign: 'rgba(231, 237, 247, 0.55)',
};
