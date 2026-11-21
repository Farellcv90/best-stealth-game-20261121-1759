// Everything the player sees: the dark museum floor with its pools of
// lamplight, cover that reads as safe shadow, guards in red with vision cones
// clipped by the walls, the glowing Moon Pearl and exit, the HUD with its
// eye-meter, and the title / pause / caught / complete screens.

import { CAMERA_TUNING, GUARD_TUNING, PALETTE, VIEW } from './config.js';
import { castVisionCone } from './geometry.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_DONE = 'level-complete';
export const SCREEN_GAME_DONE = 'game-complete';

const FONT = 'system-ui, sans-serif';

function coneColour(guard) {
  if (guard.state === GUARD_CHASE || guard.meter >= 100) return PALETTE.coneChase;
  if (guard.state === GUARD_SUSPICIOUS || guard.meter >= 35) return PALETTE.coneSuspicious;
  return PALETTE.coneCalm;
}

function drawCone(ctx, points, colour) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.floorTile;
  for (let x = 0; x < VIEW.width; x += 64) {
    for (let y = 64; y < VIEW.height; y += 64) {
      if (((x / 64) + (y / 64)) % 2 === 0) ctx.fillRect(x, y, 64, 64);
    }
  }
}

function drawLights(ctx, lights) {
  for (const light of lights) {
    const glow = ctx.createRadialGradient(light.x, light.y, 8, light.x, light.y, light.r);
    glow.addColorStop(0, PALETTE.litCore);
    glow.addColorStop(1, PALETTE.litEdge);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(light.x, light.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCover(ctx, cover) {
  for (const rect of cover) {
    const hedge = rect.kind === 'hedge';
    ctx.fillStyle = hedge ? PALETTE.hedge : PALETTE.cover;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = hedge ? PALETTE.hedgeEdge : PALETTE.coverEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    if (rect.kind === 'statue') {
      ctx.fillStyle = PALETTE.coverEdge;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2 - 4, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(rect.x + rect.w / 2 - 13, rect.y + rect.h / 2 + 8, 26, 7);
    } else if (rect.kind === 'vitrine') {
      ctx.fillStyle = 'rgba(160, 200, 235, 0.35)';
      ctx.fillRect(rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12);
    } else if (rect.kind === 'crate') {
      ctx.strokeStyle = PALETTE.coverEdge;
      ctx.beginPath();
      ctx.moveTo(rect.x + 5, rect.y + 5);
      ctx.lineTo(rect.x + rect.w - 5, rect.y + rect.h - 5);
      ctx.moveTo(rect.x + rect.w - 5, rect.y + 5);
      ctx.lineTo(rect.x + 5, rect.y + rect.h - 5);
      ctx.stroke();
    }
  }
}

function drawWalls(ctx, walls) {
  ctx.fillStyle = PALETTE.wall;
  for (const rect of walls) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = PALETTE.wallEdge;
  ctx.lineWidth = 1.5;
  for (const rect of walls) ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
}

function drawExit(ctx, state) {
  const exit = state.level.exit;
  ctx.fillStyle = state.hasPearl ? PALETTE.exit : PALETTE.exitDim;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  if (state.hasPearl) {
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  }
  ctx.fillStyle = '#ecfdf5';
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 7);
}

function drawPearl(ctx, state, now) {
  if (state.hasPearl) return;
  const pearl = state.level.pearl;
  const pulse = 16 + Math.sin(now * 2.4) * 3;
  const glow = ctx.createRadialGradient(pearl.x, pearl.y, 2, pearl.x, pearl.y, pulse + 16);
  glow.addColorStop(0, PALETTE.pearlGlow);
  glow.addColorStop(1, 'rgba(150, 200, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(pearl.x, pearl.y, pulse + 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.pearl;
  ctx.beginPath();
  ctx.arc(pearl.x, pearl.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fb2e8';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('MOON PEARL', pearl.x, pearl.y + 34);
}

function drawGuard(ctx, guard) {
  ctx.fillStyle = PALETTE.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD_TUNING.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
  ctx.fill();
  // A short nose wedge so the facing direction reads at a glance.
  ctx.fillStyle = '#ffd9d2';
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.facing) * 17, guard.y + Math.sin(guard.facing) * 17);
  ctx.lineTo(guard.x + Math.cos(guard.facing + 2.5) * 8, guard.y + Math.sin(guard.facing + 2.5) * 8);
  ctx.lineTo(guard.x + Math.cos(guard.facing - 2.5) * 8, guard.y + Math.sin(guard.facing - 2.5) * 8);
  ctx.closePath();
  ctx.fill();
  if (guard.state === GUARD_CHASE || guard.meter >= 100) {
    ctx.fillStyle = '#ff5040';
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 22);
  } else if (guard.meter >= 35) {
    ctx.fillStyle = '#ffb020';
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 22);
  }
}

function drawCamera(ctx, camera) {
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, player) {
  const radius = player.sneaking ? 10 : 13;
  ctx.fillStyle = PALETTE.playerCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerBody;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fill();
  // The thief's little lantern, held ahead.
  const lx = player.x + Math.cos(player.facing) * (radius + 7);
  const ly = player.y + Math.sin(player.facing) * (radius + 7);
  ctx.fillStyle = PALETTE.lantern;
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#083f3a';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('YOU', player.x, player.y - radius - 8);
}

function drawPebbles(ctx, pebbles) {
  for (const pebble of pebbles) {
    if (pebble.landed) {
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pebble.x, pebble.y, 8 + pebble.t * 40, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const k = pebble.t / pebble.flight;
      const x = pebble.fromX + (pebble.x - pebble.fromX) * k;
      const y = pebble.fromY + (pebble.y - pebble.fromY) * k;
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHud(ctx, state, muted) {
  ctx.fillStyle = PALETTE.hudBar;
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(`Level ${state.levelIndex + 1}: ${state.level.name}`, 18, 28);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `14px ${FONT}`;
  ctx.fillText(state.hasPearl ? 'Pearl stolen — reach the EXIT' : state.level.objective, 18, 50);

  // The eye: the highest detection meter anywhere on the floor.
  const eyeX = 560;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText('EYE', eyeX, 26);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(eyeX, 32, 200, 14);
  const eye = state.eye;
  ctx.fillStyle = eye >= 100 ? '#ef4444' : eye >= 35 ? '#f59e0b' : '#facc15';
  ctx.fillRect(eyeX, 32, (eye / 100) * 200, 14);
  ctx.strokeStyle = PALETTE.textDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(eyeX + 0.5, 32.5, 199, 13);

  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`Pebbles: ${state.pebblesLeft}`, 800, 28);
  ctx.fillText(`Pearl: ${state.hasPearl ? 'YES' : '—'}`, 800, 50);
  const minutes = Math.floor(state.time / 60);
  const seconds = Math.floor(state.time % 60);
  ctx.fillText(`Time ${minutes}:${String(seconds).padStart(2, '0')}`, 960, 28);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Alarms ${state.detections}   ${muted ? 'Muted (M)' : 'M mute · P pause · R restart'}`, 960, 50);
}

function overlay(ctx, title, lines, footer) {
  ctx.fillStyle = 'rgba(6, 10, 18, 0.72)';
  ctx.fillRect(0, 64, VIEW.width, VIEW.height - 64);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 54px ${FONT}`;
  ctx.fillText(title, VIEW.width / 2, 250);
  ctx.font = `20px ${FONT}`;
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? PALETTE.lantern : PALETTE.text;
    ctx.fillText(line, VIEW.width / 2, 300 + i * 32);
  });
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = `16px ${FONT}`;
  ctx.fillText(footer, VIEW.width / 2, 300 + lines.length * 32 + 30);
}

export function createRenderer(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');

  function drawWorld(state, now) {
    drawFloor(ctx);
    drawLights(ctx, state.level.lights);
    ctx.fillStyle = PALETTE.sign;
    ctx.font = `italic 16px ${FONT}`;
    ctx.textAlign = 'left';
    for (const sign of state.level.signs) ctx.fillText(sign.text, sign.x, sign.y);
    drawExit(ctx, state);
    drawPearl(ctx, state, now);

    for (const camera of state.cameras) {
      const cone = castVisionCone(camera.x, camera.y, camera.facing, CAMERA_TUNING.visionHalfAngle, CAMERA_TUNING.visionRange, CAMERA_TUNING.coneRays, state.solids);
      drawCone(ctx, cone, camera.meter >= 100 ? PALETTE.coneChase : PALETTE.coneCamera);
    }
    for (const guard of state.guards) {
      const cone = castVisionCone(guard.x, guard.y, guard.facing, GUARD_TUNING.visionHalfAngle, GUARD_TUNING.visionRange, GUARD_TUNING.coneRays, state.solids);
      drawCone(ctx, cone, coneColour(guard));
    }

    drawCover(ctx, state.level.cover);
    drawWalls(ctx, state.level.walls);
    for (const camera of state.cameras) drawCamera(ctx, camera);
    for (const guard of state.guards) drawGuard(ctx, guard);
    drawPlayer(ctx, state.player);
    drawPebbles(ctx, state.pebbles);
  }

  return {
    draw(state, screen, muted, now) {
      drawWorld(state, now);
      drawHud(ctx, state, muted);
      if (screen === SCREEN_TITLE) {
        overlay(ctx, 'LANTERN THIEF', [
          'The Moon Pearl Heist',
          'Sneak past the guards. Steal the pearl. Vanish.',
          'WASD / arrows move · Shift sneak · Click throws a pebble',
        ], 'Press Enter or click to begin');
      } else if (screen === SCREEN_PAUSED) {
        overlay(ctx, 'Paused', ['The museum holds its breath.'], 'P or Esc to resume · R to restart the level');
      } else if (screen === SCREEN_CAUGHT) {
        overlay(ctx, 'Caught!', ['A guard grabbed your cloak.', 'Watch the cones — shadow and cover are your friends.'], 'Press R or Enter to try the level again');
      } else if (screen === SCREEN_LEVEL_DONE) {
        const stats = state.stats;
        overlay(ctx, `${stats.rankLabel} — Rank ${stats.rank}`, [
          `${state.level.name} cleared`,
          `Time ${stats.timeText} · Alarms ${stats.detections} · Pebbles used ${stats.pebblesUsed}`,
        ], 'Press Enter for the next floor');
      } else if (screen === SCREEN_GAME_DONE) {
        const stats = state.stats;
        overlay(ctx, 'Clean Getaway!', [
          `Overall — Rank ${stats.rank}`,
          `Total time ${stats.timeText} · Total alarms ${stats.detections} · Pebbles used ${stats.pebblesUsed}`,
          'The Moon Pearl is yours, Lantern Thief.',
        ], 'Press Enter to play again');
      }
    },
  };
}
