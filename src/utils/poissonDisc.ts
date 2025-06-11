import * as Phaser from 'phaser';

export function poissonDisc(width: number, height: number, minDist: number, maxTries = 30, rnd = Phaser.Math.RND) {
  const k = maxTries;
  const cellSize = minDist / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight).fill(null);
  const active: Phaser.Math.Vector2[] = [];
  const points: Phaser.Math.Vector2[] = [];

  function insertPoint(x: number, y: number) {
    const p = new Phaser.Math.Vector2(x, y);
    points.push(p);
    active.push(p);
    const gx = Math.floor(p.x / cellSize);
    const gy = Math.floor(p.y / cellSize);
    grid[gy * gridWidth + gx] = p;
  }

  function inNeighborhood(px: number, py: number) {
    const gx = Math.floor(px / cellSize);
    const gy = Math.floor(py / cellSize);

    for (let x = Math.max(0, gx - 2); x <= Math.min(gx + 2, gridWidth - 1); x++) {
      for (let y = Math.max(0, gy - 2); y <= Math.min(gy + 2, gridHeight - 1); y++) {
        const neighbor = grid[y * gridWidth + x];
        if (!neighbor) continue;
        const dx = neighbor.x - px;
        const dy = neighbor.y - py;
        if (dx * dx + dy * dy < minDist * minDist) return true;
      }
    }
    return false;
  }

  insertPoint(rnd.frac() * width, rnd.frac() * height);

  while (active.length > 0) {
    const idx = Math.floor(rnd.frac() * active.length);
    const origin = active[idx];
    let found = false;
    for (let i = 0; i < k; i++) {
      const a = rnd.frac() * 2 * Math.PI;
      const r = minDist * (1 + rnd.frac());
      const x = origin.x + r * Math.cos(a);
      const y = origin.y + r * Math.sin(a);
      if (x >= 0 && x < width && y >= 0 && y < height && !inNeighborhood(x, y)) {
        insertPoint(x, y);
        found = true;
        break;
      }
    }
    if (!found) active.splice(idx, 1);
  }

  return points;
}
