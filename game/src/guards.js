// Museum guards and rooftop cameras. A guard walks a patrol of waypoints,
// pauses to scan, grows suspicious when the detection meter climbs, investigates
// noises, and chases at a full meter. Cameras only sweep and watch — pebbles
// do not fool them.

import { CAMERA_TUNING, DETECTION, GUARD_TUNING } from './config.js';
import {
  angleDifference,
  collideCircle,
  distanceBetween,
  hasLineOfSight,
  pointInAnyLight,
} from './geometry.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';
export const GUARD_RETURN = 'return';

export function makeGuard(definition) {
  const first = definition.waypoints[0];
  const second = definition.waypoints[1] ?? first;
  return {
    x: first.x,
    y: first.y,
    facing: Math.atan2(second.y - first.y, second.x - first.x),
    waypoints: definition.waypoints,
    waypointIndex: 1 % definition.waypoints.length,
    state: GUARD_PATROL,
    meter: 0,
    pauseTimer: 0,
    scanBase: 0,
    scanTime: 0,
    stimulus: null,
    lookTimer: 0,
    lastSeen: null,
    stepTimer: 0,
    alarmed: false,
    heardFootstep: false,
  };
}

export function makeCamera(definition) {
  return {
    x: definition.x,
    y: definition.y,
    baseAngle: definition.baseAngle,
    sweep: definition.sweep,
    facing: definition.baseAngle,
    phase: 0,
    meter: 0,
  };
}

/** Can this watcher see the player right now? Cone angle, range and clear sight. */
export function watcherSeesPlayer(x, y, facing, halfAngle, range, player, solids) {
  const dist = distanceBetween(x, y, player.x, player.y);
  if (dist > range) return 0;
  const toPlayer = Math.atan2(player.y - y, player.x - x);
  if (Math.abs(angleDifference(toPlayer, facing)) > halfAngle) return 0;
  if (!hasLineOfSight(x, y, player.x, player.y, solids)) return 0;
  return dist;
}

/**
 * Fill or drain one detection meter. Being close, standing in lamplight and
 * walking upright all fill it faster; sneaking through shadow is slow.
 */
export function updateDetectionMeter(meter, seenDistance, range, player, lights, dt, rateScale = 1) {
  if (seenDistance > 0) {
    const closeness = 1.7 - seenDistance / range;
    const lightFactor = pointInAnyLight(player.x, player.y, lights) ? DETECTION.litFactor : DETECTION.shadowFactor;
    const sneakFactor = player.sneaking ? DETECTION.sneakFactor : 1;
    return Math.min(100, meter + DETECTION.baseFill * closeness * lightFactor * sneakFactor * rateScale * dt);
  }
  return Math.max(0, meter - GUARD_TUNING.meterDecay * dt);
}

function turnToward(guard, targetAngle, dt, rate = 3.2) {
  const diff = angleDifference(targetAngle, guard.facing);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.facing += step;
  return Math.abs(diff) < 0.05;
}

function walkToward(guard, tx, ty, speed, solids, dt) {
  const dist = distanceBetween(guard.x, guard.y, tx, ty);
  if (dist < 4) return true;
  const angle = Math.atan2(ty - guard.y, tx - guard.x);
  turnToward(guard, angle, dt, 4.5);
  const next = collideCircle(
    guard.x + Math.cos(angle) * speed * dt,
    guard.y + Math.sin(angle) * speed * dt,
    GUARD_TUNING.radius,
    solids,
  );
  guard.x = next.x;
  guard.y = next.y;
  guard.stepTimer -= dt;
  if (guard.stepTimer <= 0) {
    guard.stepTimer = 0.4;
    guard.heardFootstep = true;
  }
  return distanceBetween(guard.x, guard.y, tx, ty) < 6;
}

/** A pebble clinked at (x, y): nearby guards turn and go to look. */
export function guardHearsPebble(guard, x, y, hearRadius) {
  if (guard.state === GUARD_CHASE) return;
  if (distanceBetween(guard.x, guard.y, x, y) > hearRadius) return;
  guard.stimulus = { x, y };
  guard.meter = Math.max(guard.meter, 45);
  guard.state = GUARD_INVESTIGATE;
  guard.lookTimer = 0;
}

/**
 * One guard step. `events` collects what the caller must react to: a footstep
 * to play, a fresh full alarm, or the thief caught.
 */
export function updateGuard(guard, state, solids, dt) {
  const player = state.player;
  const events = { footstep: false, alarm: false, caught: false, sting: false };
  guard.heardFootstep = false;

  const seen = watcherSeesPlayer(
    guard.x, guard.y, guard.facing, GUARD_TUNING.visionHalfAngle, GUARD_TUNING.visionRange, player, solids,
  );
  const wasSuspicious = guard.meter >= GUARD_TUNING.suspiciousAt;
  guard.meter = updateDetectionMeter(guard.meter, seen, GUARD_TUNING.visionRange, player, state.level.lights, dt);
  if (seen > 0) guard.lastSeen = { x: player.x, y: player.y };
  if (!wasSuspicious && guard.meter >= GUARD_TUNING.suspiciousAt && guard.state !== GUARD_CHASE) events.sting = true;

  // Walking noise: a careless thief is heard through the dark.
  if (player.noiseRadius > 0 && guard.state !== GUARD_CHASE
      && distanceBetween(guard.x, guard.y, player.x, player.y) <= player.noiseRadius) {
    guard.stimulus = { x: player.x, y: player.y };
    guard.meter = Math.max(guard.meter, 40);
    if (guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
  }

  if (guard.meter >= GUARD_TUNING.chaseAt) {
    if (guard.state !== GUARD_CHASE) {
      guard.state = GUARD_CHASE;
      if (!guard.alarmed) {
        guard.alarmed = true;
        events.alarm = true;
      }
    }
  } else if (guard.state === GUARD_CHASE && guard.meter <= 0) {
    guard.state = guard.lastSeen ? GUARD_INVESTIGATE : GUARD_RETURN;
    guard.stimulus = guard.lastSeen;
    guard.lookTimer = 0;
  }

  if (guard.state === GUARD_CHASE) {
    const target = seen > 0 ? player : (guard.lastSeen ?? player);
    walkToward(guard, target.x, target.y, GUARD_TUNING.chaseSpeed, solids, dt);
    if (distanceBetween(guard.x, guard.y, player.x, player.y) <= GUARD_TUNING.catchDistance) {
      events.caught = true;
    }
  } else if (guard.state === GUARD_INVESTIGATE && guard.stimulus) {
    if (walkToward(guard, guard.stimulus.x, guard.stimulus.y, GUARD_TUNING.investigateSpeed, solids, dt)) {
      guard.lookTimer += dt;
      guard.facing += Math.sin(guard.lookTimer * 2.4) * 1.6 * dt;
      if (guard.lookTimer > 1.6) {
        guard.state = GUARD_RETURN;
        guard.stimulus = null;
      }
    }
  } else if (guard.state === GUARD_SUSPICIOUS || guard.meter >= GUARD_TUNING.suspiciousAt) {
    guard.state = GUARD_SUSPICIOUS;
    const focus = guard.stimulus ?? guard.lastSeen ?? player;
    turnToward(guard, Math.atan2(focus.y - guard.y, focus.x - guard.x), dt);
    if (guard.meter < 8) {
      guard.state = GUARD_RETURN;
      guard.stimulus = null;
    }
  } else if (guard.state === GUARD_RETURN) {
    const home = guard.waypoints[guard.waypointIndex];
    if (walkToward(guard, home.x, home.y, GUARD_TUNING.patrolSpeed, solids, dt)) {
      guard.state = GUARD_PATROL;
    }
  } else {
    // Patrol: walk the loop, pausing at marked waypoints to scan the room.
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      guard.scanTime += dt;
      guard.facing = guard.scanBase + Math.sin(guard.scanTime * 1.1) * 0.7;
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, target.x, target.y, GUARD_TUNING.patrolSpeed, solids, dt)) {
        if (target.pause) {
          guard.pauseTimer = target.pause;
          guard.scanBase = guard.facing;
          guard.scanTime = 0;
        }
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      }
    }
  }

  events.footstep = guard.heardFootstep;
  return events;
}

export function updateCamera(camera, state, solids, dt) {
  camera.phase += dt * CAMERA_TUNING.sweepSpeed;
  camera.facing = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
  const seen = watcherSeesPlayer(
    camera.x, camera.y, camera.facing, CAMERA_TUNING.visionHalfAngle, CAMERA_TUNING.visionRange, state.player, solids,
  );
  camera.meter = updateDetectionMeter(
    camera.meter, seen, CAMERA_TUNING.visionRange, state.player, state.level.lights, dt, CAMERA_TUNING.meterRateScale,
  );
  return camera.meter >= 100;
}
