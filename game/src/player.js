// The thief: eight-way movement, a slower silent sneak, and pebbles thrown
// toward the mouse to turn a guard's head.

import { PLAYER_TUNING } from './config.js';
import { collideCircle, distanceBetween } from './geometry.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    stepTimer: 0,
    noiseRadius: 0,
  };
}

/** Advance the thief one step; returns true when a footstep sound is due. */
export function updatePlayer(player, move, sneaking, solids, dt) {
  player.sneaking = sneaking;
  player.moving = move.x !== 0 || move.y !== 0;
  player.noiseRadius = player.moving && !sneaking ? PLAYER_TUNING.walkNoiseRadius : 0;
  if (!player.moving) return false;
  const speed = sneaking ? PLAYER_TUNING.sneakSpeed : PLAYER_TUNING.walkSpeed;
  player.facing = Math.atan2(move.y, move.x);
  const next = collideCircle(
    player.x + move.x * speed * dt,
    player.y + move.y * speed * dt,
    PLAYER_TUNING.radius,
    solids,
  );
  player.x = next.x;
  player.y = next.y;
  if (sneaking) return false;
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    player.stepTimer = 0.34;
    return true;
  }
  return false;
}

/**
 * Throw a pebble toward (tx, ty), capped at the thief's throwing range.
 * Returns the flying pebble, or null when the pouch is empty.
 */
export function throwPebble(state, tx, ty) {
  if (state.pebblesLeft <= 0) return null;
  const player = state.player;
  const dist = distanceBetween(player.x, player.y, tx, ty);
  const scale = dist > PLAYER_TUNING.pebbleRange ? PLAYER_TUNING.pebbleRange / dist : 1;
  const landX = player.x + (tx - player.x) * scale;
  const landY = player.y + (ty - player.y) * scale;
  state.pebblesLeft -= 1;
  state.pebblesUsed += 1;
  return { fromX: player.x, fromY: player.y, x: landX, y: landY, t: 0, flight: 0.32, landed: false };
}
