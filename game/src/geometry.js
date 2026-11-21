// Small 2D geometry helpers: distances, line-of-sight against rectangles, the
// raycast that clips a vision cone at walls, and circle-versus-rectangle
// collision so bodies slide along cover instead of passing through it.

export function distanceBetween(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function angleDifference(a, b) {
  let diff = (a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** Distance along a ray from (ox, oy) in direction (dx, dy) to a rectangle, or Infinity. */
export function rayHitRect(ox, oy, dx, dy, rect) {
  let tMin = 0;
  let tMax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < rect.x || ox > rect.x + rect.w) return Infinity;
  } else {
    let t1 = (rect.x - ox) / dx;
    let t2 = (rect.x + rect.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < rect.y || oy > rect.y + rect.h) return Infinity;
  } else {
    let t1 = (rect.y - oy) / dy;
    let t2 = (rect.y + rect.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  return tMin;
}

/** True when the straight line between two points is not blocked by any solid rectangle. */
export function hasLineOfSight(ax, ay, bx, by, solids) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return true;
  const ux = dx / length;
  const uy = dy / length;
  for (const rect of solids) {
    const hit = rayHitRect(ax, ay, ux, uy, rect);
    if (hit < length - 2) return false;
  }
  return true;
}

/**
 * Cast a vision cone: sweep rays across the facing direction and stop each one
 * at the first wall or cover it meets, so the returned polygon is exactly the
 * area the watcher can see — the shadow behind cover stays visibly safe.
 */
export function castVisionCone(x, y, facing, halfAngle, range, rayCount, solids) {
  const points = [{ x, y }];
  for (let i = 0; i <= rayCount; i += 1) {
    const angle = facing - halfAngle + (2 * halfAngle * i) / rayCount;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = range;
    for (const rect of solids) {
      const hit = rayHitRect(x, y, dx, dy, rect);
      if (hit < reach) reach = hit;
    }
    points.push({ x: x + dx * reach, y: y + dy * reach });
  }
  return points;
}

/** Push a circle out of every solid rectangle it overlaps; returns the corrected position. */
export function collideCircle(x, y, radius, solids) {
  let px = x;
  let py = y;
  for (const rect of solids) {
    const nearestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
    const dx = px - nearestX;
    const dy = py - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius) continue;
    if (distSq > 1e-9) {
      const dist = Math.sqrt(distSq);
      px = nearestX + (dx / dist) * radius;
      py = nearestY + (dy / dist) * radius;
    } else {
      // Centre inside the rectangle: leave by the shallowest side.
      const left = px - rect.x;
      const right = rect.x + rect.w - px;
      const top = py - rect.y;
      const bottom = rect.y + rect.h - py;
      const shallowest = Math.min(left, right, top, bottom);
      if (shallowest === left) px = rect.x - radius;
      else if (shallowest === right) px = rect.x + rect.w + radius;
      else if (shallowest === top) py = rect.y - radius;
      else py = rect.y + rect.h + radius;
    }
  }
  return { x: px, y: py };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function pointInAnyLight(x, y, lights) {
  for (const light of lights) {
    if (distanceBetween(x, y, light.x, light.y) <= light.r) return true;
  }
  return false;
}
