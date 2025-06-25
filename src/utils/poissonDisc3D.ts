import * as Phaser from 'phaser';

export function poissonDisc3D(width: number, height: number, depth: number, minDist: number, maxTries = 30, rnd = Phaser.Math.RND) {
  const k = maxTries;
  const cellSize = minDist / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const gridDepth = Math.ceil(depth / cellSize);
  const grid = new Array(gridWidth * gridHeight * gridDepth).fill(null);
  const active: Phaser.Math.Vector3[] = [];
  const points: Phaser.Math.Vector3[] = [];

  function insertPoint(x: number, y: number, z: number) {
    const p = new Phaser.Math.Vector3(x, y, z);
    points.push(p);
    active.push(p);
    const gx = Math.floor(p.x / cellSize);
    const gy = Math.floor(p.y / cellSize);
    const gz = Math.floor(p.z / cellSize);
    grid[gy * gridWidth + gx + gz * gridWidth * gridHeight] = p;
  }

  function inNeighborhood(px: number, py: number, pz: number) {
    const gx = Math.floor(px / cellSize);
    const gy = Math.floor(py / cellSize);
    const gz = Math.floor(pz / cellSize);

    for (let x = Math.max(0, gx - 2); x <= Math.min(gx + 2, gridWidth - 1); x++) {
      for (let y = Math.max(0, gy - 2); y <= Math.min(gy + 2, gridHeight - 1); y++) {
        for (let z = Math.max(0, gz - 2); z <= Math.min(gz + 2, gridDepth - 1); z++) {
          const neighbor = grid[z * gridWidth * gridHeight + y * gridWidth + x];
          if (!neighbor) continue;
          const dx = neighbor.x - px;
          const dy = neighbor.y - py;
          const dz = neighbor.z - pz;
          if (dx * dx + dy * dy + dz * dz < minDist * minDist) return true;
        }
      }
    }
    return false;
  }

  insertPoint(
    Math.round(rnd.frac() * width),
    Math.round(rnd.frac() * height),
    Math.round(rnd.frac() * depth)
  );

  while (active.length > 0) {
    const idx = Math.floor(rnd.frac() * active.length);
    const origin = active[idx];
    let found = false;
    for (let i = 0; i < k; i++) {
      const theta = rnd.frac() * 2 * Math.PI;
      const phi = Math.acos(2 * rnd.frac() - 1);
      const r = Math.round(minDist * (1 + rnd.frac()));
      const x = Math.round(origin.x + r * Math.sin(phi) * Math.cos(theta));
      const y = Math.round(origin.y + r * Math.sin(phi) * Math.sin(theta));
      const z = Math.round(origin.z + r * Math.cos(phi));
      if (
        x >= 0 && x < width &&
        y >= 0 && y < height &&
        z >= 0 && z < depth &&
        !inNeighborhood(x, y, z)
      ) {
        insertPoint(x, y, z);
        found = true;
        break;
      }
    }
    if (!found) active.splice(idx, 1);
  }

  return points;
}
