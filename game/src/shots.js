// Screenshot scenes for ?shot=cover|gallery|rooftop|getaway. Each one loads a
// real level and arranges the thief, guards and meters into the moment worth
// photographing, so the picture is the game itself — never a mock-up.

import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';
import { SCREEN_LEVEL_DONE, SCREEN_PLAY } from './render.js';

function placeGuard(guard, x, y, facing, state = null, meter = 0) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.meter = meter;
  if (state) guard.state = state;
  guard.pauseTimer = 0;
}

function placePlayer(state, x, y, facing, sneaking) {
  state.player.x = x;
  state.player.y = y;
  state.player.facing = facing;
  state.player.sneaking = sneaking;
}

/** Level 2 mid-heist: three calm cones, one suspicious orange, thief in shadow. */
function stageCover(game) {
  game.loadLevel(1);
  const state = game.state;
  placePlayer(state, 478, 398, -0.5, true);
  placeGuard(state.guards[0], 300, 170, 0);
  placeGuard(state.guards[1], 980, 580, Math.PI);
  placeGuard(state.guards[2], 700, 322, 2.81, GUARD_SUSPICIOUS, 60);
  placeGuard(state.guards[3], 640, 180, Math.PI / 2);
  state.time = 42;
  state.eye = 60;
  return SCREEN_PLAY;
}

/** Level 1 whole: two patrols, statues for cover, tutorial signs on the floor. */
function stageGallery(game) {
  game.loadLevel(0);
  const state = game.state;
  placePlayer(state, 210, 500, -0.8, true);
  placeGuard(state.guards[0], 640, 166, 0.25);
  placeGuard(state.guards[1], 880, 636, Math.PI);
  state.time = 12;
  state.eye = 0;
  return SCREEN_PLAY;
}

/** Level 3: hedges, two blue camera sweeps, a red chase cone far away. */
function stageRooftop(game) {
  game.loadLevel(2);
  const state = game.state;
  placePlayer(state, 470, 560, -1.2, true);
  placeGuard(state.guards[0], 1120, 150, Math.PI, GUARD_CHASE, 100);
  placeGuard(state.guards[1], 480, 470, -Math.PI / 2);
  placeGuard(state.guards[2], 1120, 540, -Math.PI / 2);
  state.cameras[0].facing = Math.PI / 2 + 0.5;
  state.cameras[1].facing = -Math.PI / 2 - 0.4;
  state.time = 65;
  state.eye = 100;
  return SCREEN_PLAY;
}

/** The level-complete card over a dimmed Level 2: a ghost run, Rank S. */
function stageGetaway(game) {
  game.loadLevel(1);
  const state = game.state;
  placePlayer(state, 1180, 360, 0, false);
  placeGuard(state.guards[0], 300, 170, 0);
  placeGuard(state.guards[2], 700, 322, Math.PI);
  state.hasPearl = true;
  state.stats = { rank: 'S', rankLabel: 'Ghost', detections: 0, pebblesUsed: 1, timeText: '1:12' };
  state.time = 72;
  state.eye = 0;
  return SCREEN_LEVEL_DONE;
}

export function stageShot(name, game) {
  if (name === 'gallery') return stageGallery(game);
  if (name === 'rooftop') return stageRooftop(game);
  if (name === 'getaway') return stageGetaway(game);
  return stageCover(game);
}
