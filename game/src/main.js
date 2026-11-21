// Boot and the one loop: input is read every frame, the heist advances in
// fixed 1/60 s steps, and the renderer paints the museum. Screens: title,
// play, paused, caught, level-complete, game-complete.
//
// ?shot=cover|gallery|rooftop|getaway (with &seed=1) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady.

import { createAudio } from './audio.js';
import { BEST_KEY, GUARD_TUNING, PLAYER_TUNING, STEP, VIEW } from './config.js';
import { distanceBetween, pointInRect } from './geometry.js';
import { guardHearsPebble, makeCamera, makeGuard, updateCamera, updateGuard, GUARD_CHASE } from './guards.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { LEVELS, levelSolids } from './levels.js';
import { makePlayer, throwPebble, updatePlayer } from './player.js';
import {
  createRenderer, SCREEN_CAUGHT, SCREEN_GAME_DONE, SCREEN_LEVEL_DONE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();

const game = {
  state: null,
  totals: { time: 0, detections: 0, pebblesUsed: 0 },
  loadLevel(index) {
    const level = LEVELS[index];
    game.state = {
      levelIndex: index,
      level,
      solids: levelSolids(level),
      player: makePlayer(level.start),
      guards: level.guards.map(makeGuard),
      cameras: level.cameras.map(makeCamera),
      pebbles: [],
      pebblesLeft: level.pebbles,
      pebblesUsed: 0,
      hasPearl: false,
      time: 0,
      detections: 0,
      eye: 0,
      alarmCloseTimer: 0,
      stats: null,
    };
  },
};
game.loadLevel(0);

function announce(message) {
  status.textContent = message;
}

function rankFor(time, detections, parSeconds) {
  if (detections === 0 && time <= parSeconds) return { rank: 'S', rankLabel: 'Ghost' };
  if (detections === 0) return { rank: 'A', rankLabel: 'Shadow' };
  if (detections <= 1) return { rank: 'B', rankLabel: 'Sneak' };
  return { rank: 'C', rankLabel: 'Loud' };
}

function timeText(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function saveBest(rank) {
  try {
    const order = { S: 4, A: 3, B: 2, C: 1 };
    const previous = window.localStorage.getItem(BEST_KEY);
    if (!previous || order[rank] > (order[previous] ?? 0)) window.localStorage.setItem(BEST_KEY, rank);
  } catch {
    // Storage can be off; the rank then lasts this visit only.
  }
}

function runShot(name) {
  const screen = stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game.state, screen, false, 1);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, VIEW.width, VIEW.height);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();

  function startLevel(index) {
    game.loadLevel(index);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.setAlarm(false);
    announce(`Level ${index + 1}: ${LEVELS[index].name}. Steal the Moon Pearl.`);
  }

  function finishLevel() {
    const state = game.state;
    game.totals.time += state.time;
    game.totals.detections += state.detections;
    game.totals.pebblesUsed += state.pebblesUsed;
    audio.setAlarm(false);
    audio.playWinJingle();
    if (state.levelIndex === LEVELS.length - 1) {
      const overall = rankFor(game.totals.time, game.totals.detections, LEVELS.reduce((sum, l) => sum + l.parSeconds, 0));
      state.stats = { ...overall, detections: game.totals.detections, pebblesUsed: game.totals.pebblesUsed, timeText: timeText(game.totals.time) };
      saveBest(overall.rank);
      screen = SCREEN_GAME_DONE;
      announce(`Clean getaway. Rank ${overall.rank}.`);
    } else {
      const earned = rankFor(state.time, state.detections, state.level.parSeconds);
      state.stats = { ...earned, detections: state.detections, pebblesUsed: state.pebblesUsed, timeText: timeText(state.time) };
      screen = SCREEN_LEVEL_DONE;
      announce(`Level cleared. Rank ${earned.rank}.`);
    }
  }

  function caught() {
    screen = SCREEN_CAUGHT;
    audio.setAlarm(false);
    audio.playCaughtThud();
    announce('Caught. Press R to try again.');
  }

  function step() {
    const state = game.state;
    state.time += STEP;

    const thrown = input.takeThrow();
    if (thrown) {
      const pebble = throwPebble(state, thrown.x, thrown.y);
      if (pebble) state.pebbles.push(pebble);
    }

    if (updatePlayer(state.player, input.moveVector(), input.sneaking(), state.solids, STEP)) {
      audio.playPlayerFootstep();
    }

    for (const pebble of state.pebbles) {
      pebble.t += STEP;
      if (!pebble.landed && pebble.t >= pebble.flight) {
        pebble.landed = true;
        pebble.t = 0;
        audio.playPebbleClink();
        for (const guard of state.guards) guardHearsPebble(guard, pebble.x, pebble.y, PLAYER_TUNING.pebbleHearRadius);
      }
    }
    state.pebbles = state.pebbles.filter((pebble) => !pebble.landed || pebble.t < 0.7);

    let eye = 0;
    let anyChase = false;
    let closeAlarm = false;
    for (const guard of state.guards) {
      const events = updateGuard(guard, state, state.solids, STEP);
      eye = Math.max(eye, guard.meter);
      if (guard.state === GUARD_CHASE) anyChase = true;
      if (events.footstep) {
        const dist = distanceBetween(guard.x, guard.y, state.player.x, state.player.y);
        const pan = (guard.x - state.player.x) / 400;
        audio.playGuardFootstep(dist, pan);
      }
      if (events.sting) audio.playSuspicionSting();
      if (events.alarm) state.detections += 1;
      if (events.caught) {
        caught();
        return;
      }
      if (guard.meter >= 100 && distanceBetween(guard.x, guard.y, state.player.x, state.player.y) <= GUARD_TUNING.closeAlarmDistance) {
        closeAlarm = true;
      }
    }
    for (const camera of state.cameras) {
      const full = updateCamera(camera, state, state.solids, STEP);
      eye = Math.max(eye, camera.meter);
      if (full && !camera.counted) {
        camera.counted = true;
        state.detections += 1;
        let nearest = null;
        let nearestDist = Infinity;
        for (const guard of state.guards) {
          const dist = distanceBetween(guard.x, guard.y, state.player.x, state.player.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = guard;
          }
        }
        if (nearest) {
          nearest.meter = 100;
          nearest.lastSeen = { x: state.player.x, y: state.player.y };
        }
      } else if (camera.meter < 50) {
        camera.counted = false;
      }
    }
    state.eye = eye;
    audio.setAlarm(anyChase);

    state.alarmCloseTimer = closeAlarm ? state.alarmCloseTimer + STEP : 0;
    if (state.alarmCloseTimer > GUARD_TUNING.closeAlarmSeconds) {
      caught();
      return;
    }

    if (!state.hasPearl && distanceBetween(state.player.x, state.player.y, state.level.pearl.x, state.level.pearl.y) < 28) {
      state.hasPearl = true;
      audio.playPearlChime();
      announce('Moon Pearl stolen. Reach the exit.');
    }
    if (state.hasPearl && pointInRect(state.player.x, state.player.y, state.level.exit)) {
      finishLevel();
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.unlock();
      announce(audio.toggleMute() ? 'Muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE && (actions & ACTION_CONFIRM)) {
      audio.unlock();
      input.clearThrow();
      game.totals = { time: 0, detections: 0, pebblesUsed: 0 };
      startLevel(0);
    } else if (screen === SCREEN_PLAY && (actions & ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      audio.setAlarm(false);
      announce('Paused.');
    } else if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (screen === SCREEN_PAUSED && (actions & ACTION_RESTART)) {
      startLevel(game.state.levelIndex);
    } else if (screen === SCREEN_PLAY && (actions & ACTION_RESTART)) {
      startLevel(game.state.levelIndex);
    } else if (screen === SCREEN_CAUGHT && (actions & (ACTION_RESTART | ACTION_CONFIRM))) {
      input.clearThrow();
      startLevel(game.state.levelIndex);
    } else if (screen === SCREEN_LEVEL_DONE && (actions & ACTION_CONFIRM)) {
      input.clearThrow();
      startLevel(game.state.levelIndex + 1);
    } else if (screen === SCREEN_GAME_DONE && (actions & ACTION_CONFIRM)) {
      input.clearThrow();
      game.totals = { time: 0, detections: 0, pebblesUsed: 0 };
      startLevel(0);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_TITLE) {
      // Guards patrol behind the title so the museum feels alive.
      const state = game.state;
      for (const guard of state.guards) updateGuard(guard, state, state.solids, STEP);
      accumulator = 0;
    } else {
      accumulator = 0;
    }
    renderer.draw(game.state, screen, audio.isMuted(), now / 1000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.setAlarm(false);
      announce('Paused.');
    }
  });

  announce('Lantern Thief. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shotName) runShot(shotName);
else runGame();
