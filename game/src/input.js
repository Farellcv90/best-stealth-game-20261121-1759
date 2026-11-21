// Keyboard and mouse, flattened into a movement vector plus a small queue of
// one-shot actions (confirm, pause, restart, mute) and pebble throws.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas, viewWidth, viewHeight) {
  const held = new Set();
  let queuedActions = 0;
  let queuedThrow = null;
  const mouse = { x: viewWidth / 2, y: viewHeight / 2 };

  function toViewCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewWidth,
      y: ((event.clientY - rect.top) / rect.height) * viewHeight,
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    held.add(key);
    if (event.repeat) return;
    if (key === 'enter' || key === ' ') queuedActions |= ACTION_CONFIRM;
    if (key === 'p' || key === 'escape') queuedActions |= ACTION_PAUSE;
    if (key === 'r') queuedActions |= ACTION_RESTART;
    if (key === 'm') queuedActions |= ACTION_MUTE;
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key.toLowerCase());
  });

  canvas.addEventListener('mousemove', (event) => {
    const pos = toViewCoords(event);
    mouse.x = pos.x;
    mouse.y = pos.y;
  });

  canvas.addEventListener('mousedown', (event) => {
    const pos = toViewCoords(event);
    mouse.x = pos.x;
    mouse.y = pos.y;
    queuedActions |= ACTION_CONFIRM;
    queuedThrow = { x: pos.x, y: pos.y };
  });

  return {
    /** Normalised movement wish from WASD / arrows. */
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('a') || held.has('arrowleft')) x -= 1;
      if (held.has('d') || held.has('arrowright')) x += 1;
      if (held.has('w') || held.has('arrowup')) y -= 1;
      if (held.has('s') || held.has('arrowdown')) y += 1;
      const length = Math.hypot(x, y);
      if (length === 0) return { x: 0, y: 0 };
      return { x: x / length, y: y / length };
    },
    sneaking() {
      return held.has('shift');
    },
    mousePosition() {
      return mouse;
    },
    takeActions() {
      const actions = queuedActions;
      queuedActions = 0;
      return actions;
    },
    takeThrow() {
      const thrown = queuedThrow;
      queuedThrow = null;
      return thrown;
    },
    clearThrow() {
      queuedThrow = null;
    },
  };
}
